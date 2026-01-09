from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from supabase import create_client
from typing import Optional

from ..config import get_settings
from ..embeddings import get_embedding, compute_normalized_score

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
    
    # Normalize word
    word = request.word.lower().strip()
    
    # Find room by code
    room_result = supabase.table("rooms").select("*").eq("code", request.roomCode).single().execute()
    
    if not room_result.data:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room = room_result.data
    room_id = room["id"]
    
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
    max_similarity = secret.get("max_similarity", 0.7)  # Default fallback
    
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
    else:
        # Compute embedding and normalized score
        try:
            guess_embedding = get_embedding(word)
            score = compute_normalized_score(guess_embedding, secret_embedding, max_similarity)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to compute score: {str(e)}")
    
    # Insert guess
    try:
        guess_result = supabase.table("guesses").insert({
            "room_id": room_id,
            "player_id": request.playerId,
            "player_name": request.playerName,
            "word": word,
            "score": score
        }).execute()
        
        if not guess_result.data:
            raise HTTPException(status_code=500, detail="Failed to save guess")
        
        guess_data = guess_result.data[0]
        
        # If score is 100, reveal the word
        revealed_word = None
        if score == 100:
            supabase.table("rooms").update({
                "revealed_word": secret_word,
                "status": "finished"
            }).eq("id", room_id).execute()
            revealed_word = secret_word
        
        return SubmitGuessResponse(
            guessId=guess_data["id"],
            roomId=room_id,
            word=word,
            score=score,
            createdAt=guess_data["created_at"],
            revealedWord=revealed_word
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
