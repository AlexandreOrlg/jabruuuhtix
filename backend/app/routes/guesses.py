from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from supabase import create_client

from ..config import get_settings
from ..embeddings import (
    get_embedding,
    is_word_in_vocabulary,
    compute_score_and_temperature,
    get_rank,
    is_allowed_guess,
    normalize_guess_word,
)

router = APIRouter(prefix="/api/guesses", tags=["guesses"])


class SubmitGuessRequest(BaseModel):
    roomCode: str
    playerId: str
    playerName: str = Field(..., max_length=32)
    word: str


class SubmitGuessResponse(BaseModel):
    guessId: str
    roomId: str
    word: str
    score: int
    rank: Optional[int] = None  # 1-1000 (1000 = closest) or null if not in top 1000
    temperature: float = 0.0  # Temperature in °C
    createdAt: str
    revealedWord: Optional[str] = None


@router.post("", response_model=SubmitGuessResponse)
async def submit_guess(request: SubmitGuessRequest):
    """Submit a word guess and get similarity score."""
    settings = get_settings()
    
    supabase = create_client(
        settings.supabase_url,
        settings.supabase_service_role_key
    )
    
    # Normalize word (lemmatize conjugated verbs when possible)
    word = normalize_guess_word(request.word)

    if not is_allowed_guess(word):
        raise HTTPException(
            status_code=400,
            detail=f"Le mot '{word}' n'est pas autorisé",
        )
    
    # Find room by code
    room_result = supabase.table("rooms").select("*").eq("code", request.roomCode).single().execute()
    
    if not room_result.data:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room = room_result.data
    room_id = room["id"]
    room_mode = room.get("mode", "coop")
    
    # Check if room already has revealed word
    if room.get("revealed_word"):
        raise HTTPException(status_code=400, detail="Game already finished")
    
    # Get secret word embedding
    secret_result = supabase.table("room_secrets").select("*").eq("room_id", room_id).single().execute()
    
    if not secret_result.data:
        raise HTTPException(status_code=500, detail="Room secret not found")
    
    secret = secret_result.data
    secret_word = secret["secret_word"]
    secret_embedding_raw = secret["secret_embedding"]
    max_similarity = secret.get("max_similarity", 0.7)
    min_similarity = secret.get("min_similarity", 0.1)
    top_1000 = secret.get("top_1000_words", [])
    
    # Parse pgvector string to list of floats
    # pgvector returns format like "[0.1,0.2,...]" or "(0.1,0.2,...)"
    if isinstance(secret_embedding_raw, str):
        # Remove brackets and parse as floats
        cleaned = secret_embedding_raw.strip("[]() ")
        secret_embedding = [float(x) for x in cleaned.split(",")]
    else:
        secret_embedding = secret_embedding_raw
    
    # Check if exact match
    if word == secret_word.lower():
        score = 100
        rank = 1000  # Exact match = highest rank
        temperature = 100.0
    else:
        # Check if word is in vocabulary
        if not is_word_in_vocabulary(word):
            raise HTTPException(
                status_code=400, 
                detail=f"Le mot '{word}' n'existe pas dans le dictionnaire"
            )
        
        # Compute embedding and normalized score
        try:
            guess_embedding = get_embedding(word)
            rank = get_rank(word, top_1000)
            score, temperature = compute_score_and_temperature(
                guess_embedding,
                secret_embedding,
                max_similarity,
                min_similarity,
                rank,
            )
        except KeyError:
            raise HTTPException(
                status_code=400, 
                detail=f"Le mot '{word}' n'existe pas dans le dictionnaire"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to compute score: {str(e)}")
    
    # Insert guess
    try:
        guess_result = supabase.table("guesses").insert({
            "room_id": room_id,
            "player_id": request.playerId,
            "player_name": request.playerName,
            "word": word,
            "score": score,
            "rank": rank,
            "temperature": temperature
        }).execute()
        
        if not guess_result.data:
            raise HTTPException(status_code=500, detail="Failed to save guess")
        
        guess_data = guess_result.data[0]
        
        # If score is 100, reveal the word
        revealed_word = None
        if score == 100:
            revealed_word = secret_word
            if room_mode == "coop":
                supabase.table("rooms").update({
                    "revealed_word": secret_word,
                    "status": "finished"
                }).eq("id", room_id).execute()
        
        return SubmitGuessResponse(
            guessId=guess_data["id"],
            roomId=room_id,
            word=word,
            score=score,
            rank=rank,
            temperature=temperature,
            createdAt=guess_data["created_at"],
            revealedWord=revealed_word
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
