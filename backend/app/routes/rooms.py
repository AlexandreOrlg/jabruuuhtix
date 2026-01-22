import logging
import random
import string
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..services.supabase import get_supabase_client
from ..embeddings import (
    get_embedding,
    find_min_similarity,
    compute_top_1000,
    load_word_pools,
    is_word_in_vocabulary,
    is_lemma_form,
    normalize_guess_word,
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


def get_random_secret_word(max_attempts: int = 25) -> tuple[str, str]:
    """Pick a secret word from precomputed pools and normalize it."""
    pools = load_word_pools()
    if pools:
        weights = {"easy": 0.5, "medium": 0.35, "hard": 0.15}
        difficulty = choose_difficulty(weights)
        candidates = pools.get(difficulty, [])
        if candidates:
            attempt_count = min(max_attempts, len(candidates))
            for _ in range(attempt_count):
                raw_word = random.choice(candidates)
                normalized = normalize_guess_word(raw_word)
                if is_word_in_vocabulary(normalized) and is_lemma_form(normalized):
                    return normalized, difficulty

            for raw_word in candidates:
                normalized = normalize_guess_word(raw_word)
                if is_word_in_vocabulary(normalized) and is_lemma_form(normalized):
                    return normalized, difficulty

    raise HTTPException(status_code=500, detail="No secret word candidates available")


@router.post("", response_model=CreateRoomResponse)
async def create_room(request: CreateRoomRequest):
    """Create a new game room with a secret word."""
    supabase = get_supabase_client()
    
    # Generate room code and secret word
    room_code = generate_room_code()
    min_max_similarity = 0.6
    max_attempts = 25
    secret_word = ""
    difficulty = "medium"
    secret_embedding: list[float] = []
    max_similarity = 0.0
    min_similarity = 0.1
    top_1000: list[dict] = []

    for _ in range(max_attempts):
        candidate, candidate_difficulty = get_random_secret_word()
        try:
            candidate_embedding = get_embedding(candidate)
        except Exception as e:
            logger.warning(f"Failed to compute embedding for '{candidate}': {e}")
            continue

        try:
            candidate_top_1000 = compute_top_1000(candidate)
            if not candidate_top_1000:
                logger.warning(f"No top-1000 words for '{candidate}', retrying")
                continue
            candidate_max_similarity = float(candidate_top_1000[0]["similarity"])
            if candidate_max_similarity < min_max_similarity:
                logger.info(
                    f"Secret '{candidate}' below similarity threshold "
                    f"({candidate_max_similarity:.4f} < {min_max_similarity:.2f}); retrying"
                )
                continue
            candidate_min_similarity = find_min_similarity(candidate)
        except Exception as e:
            logger.warning(f"Failed to compute similarities for '{candidate}': {e}")
            continue

        secret_word = candidate
        difficulty = candidate_difficulty
        secret_embedding = candidate_embedding
        max_similarity = candidate_max_similarity
        min_similarity = candidate_min_similarity
        top_1000 = candidate_top_1000
        break

    if not secret_word:
        raise HTTPException(status_code=500, detail="No suitable secret word found")
    mode = request.mode

    logger.info(
        f"Room created with secret '{secret_word}', difficulty: {difficulty}, "
        f"max_similarity: {max_similarity:.4f}, min_similarity: {min_similarity:.4f}, "
        f"top_1000: {len(top_1000)} words"
    )
    
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
        room_secret_result = supabase.table("room_secrets").insert({
            "room_id": room_id,
            "secret_word": secret_word,
            "secret_embedding": secret_embedding,
            "max_similarity": max_similarity,
            "min_similarity": min_similarity,
            "top_1000_words": top_1000
        }).execute()
        
        if not room_secret_result.data:
            raise HTTPException(status_code=500, detail="Failed to create room secret")
        
        return CreateRoomResponse(
            roomId=room_id,
            roomCode=room_code,
            createdAt=room_data["created_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
