import logging
import random
import string
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from supabase import create_client

from ..config import get_settings
from ..embeddings import (
    get_embedding,
    find_max_similarity,
    find_min_similarity,
    compute_top_1000,
    get_secret_word_candidates,
    load_word_pools,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


class CreateRoomRequest(BaseModel):
    playerName: str = Field(..., max_length=32)
    mode: Literal["coop", "jcj"] = "coop"


class CreateRoomResponse(BaseModel):
    roomId: str
    roomCode: str
    createdAt: str


def generate_room_code(length: int = 6) -> str:
    """Generate a random alphanumeric room code."""
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


def choose_difficulty(weights: dict[str, float]) -> str:
    roll = random.random()
    cumulative = 0.0
    for difficulty, weight in weights.items():
        cumulative += weight
        if roll <= cumulative:
            return difficulty
    return "medium"


def get_random_secret_word() -> tuple[str, str]:
    """Pick a secret word from precomputed pools (auto difficulty)."""
    pools = load_word_pools()
    if pools:
        weights = {"easy": 0.5, "medium": 0.35, "hard": 0.15}
        difficulty = choose_difficulty(weights)
        candidates = pools.get(difficulty, [])
        if candidates:
            return random.choice(candidates), difficulty

    candidates = get_secret_word_candidates()
    if candidates:
        return random.choice(candidates), "auto"

    raise HTTPException(status_code=500, detail="No secret word candidates available")


@router.post("", response_model=CreateRoomResponse)
async def create_room(request: CreateRoomRequest):
    """Create a new game room with a secret word."""
    settings = get_settings()
    
    supabase = create_client(
        settings.supabase_url,
        settings.supabase_service_role_key
    )
    
    # Generate room code and secret word
    room_code = generate_room_code()
    secret_word, difficulty = get_random_secret_word()
    mode = request.mode
    
    # Compute embedding for secret word
    try:
        secret_embedding = get_embedding(secret_word)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute embedding: {str(e)}")
    
    # Find max and min similarity for score normalization
    try:
        max_similarity = find_max_similarity(secret_word)
        min_similarity = find_min_similarity(secret_word)
        top_1000 = compute_top_1000(secret_word)
        logger.info(
            f"Room created with secret '{secret_word}', difficulty: {difficulty}, "
            f"max_similarity: {max_similarity:.4f}, min_similarity: {min_similarity:.4f}, "
            f"top_1000: {len(top_1000)} words"
        )
    except Exception as e:
        logger.warning(f"Failed to compute similarities, using defaults: {e}")
        max_similarity = 0.7
        min_similarity = 0.1
        top_1000 = []
    
    # Create room in database
    try:
        # Insert room
        room_result = supabase.table("rooms").insert({
            "code": room_code,
            "status": "active",
            "mode": mode,
            "difficulty": difficulty,
        }).execute()
        
        if not room_result.data:
            raise HTTPException(status_code=500, detail="Failed to create room")
        
        room_data = room_result.data[0]
        room_id = room_data["id"]
        
        # Insert room secret with similarities and top 1000
        supabase.table("room_secrets").insert({
            "room_id": room_id,
            "secret_word": secret_word,
            "secret_embedding": secret_embedding,
            "max_similarity": max_similarity,
            "min_similarity": min_similarity,
            "top_1000_words": top_1000
        }).execute()
        
        return CreateRoomResponse(
            roomId=room_id,
            roomCode=room_code,
            createdAt=room_data["created_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
