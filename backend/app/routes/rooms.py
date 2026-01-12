from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal
from supabase import create_client
import random
import string
from datetime import datetime
from pathlib import Path
import logging

from ..config import get_settings
from ..embeddings import get_embedding, find_max_similarity, find_min_similarity, compute_top_1000

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


def get_random_secret_word() -> str:
    """Get a random word from the word list."""
    # Try to load from words.txt file
    words_file = Path(__file__).parent.parent.parent / "words.txt"
    
    if words_file.exists():
        with open(words_file, "r", encoding="utf-8") as f:
            words = [line.strip().lower() for line in f if line.strip()]
        if words:
            return random.choice(words)
           # return "Ambition"

    raise HTTPException(status_code=500, detail="words.txt is missing or empty")


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
    secret_word = get_random_secret_word()
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
        logger.info(f"Room created with secret '{secret_word}', max_similarity: {max_similarity:.4f}, min_similarity: {min_similarity:.4f}, top_1000: {len(top_1000)} words")
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
