import fasttext
import numpy as np
from huggingface_hub import hf_hub_download
from pathlib import Path
from typing import Optional
import logging

from .config import get_settings

logger = logging.getLogger(__name__)

# Global model instance
_model: Optional[fasttext.FastText._FastText] = None


def load_model() -> fasttext.FastText._FastText:
    """Load the fastText model from Hugging Face Hub."""
    global _model
    
    if _model is not None:
        return _model
    
    settings = get_settings()
    
    # Create cache directory if it doesn't exist
    cache_dir = Path(settings.fasttext_cache_dir)
    cache_dir.mkdir(parents=True, exist_ok=True)
    
    model_path = cache_dir / settings.fasttext_filename
    
    if not model_path.exists():
        logger.info(f"Downloading fastText model from {settings.fasttext_repo_id}...")
        downloaded_path = hf_hub_download(
            repo_id=settings.fasttext_repo_id,
            filename=settings.fasttext_filename,
            cache_dir=str(cache_dir),
            token=settings.hf_token if settings.hf_token else None,
            local_dir=str(cache_dir),
        )
        logger.info(f"Model downloaded to {downloaded_path}")
    else:
        logger.info(f"Using cached model at {model_path}")
    
    logger.info("Loading fastText model...")
    _model = fasttext.load_model(str(model_path))
    logger.info("fastText model loaded successfully!")
    
    return _model


def get_embedding(word: str) -> list[float]:
    """Get the embedding vector for a word."""
    model = load_model()
    # Normalize to lowercase
    word = word.lower().strip()
    # Get 300-dimensional embedding
    embedding = model.get_word_vector(word)
    return embedding.tolist()


def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    return float(dot_product / (norm1 * norm2))


def is_valid_word(word: str, min_length: int = 2) -> bool:
    """
    Check if a word is a valid French word (not garbage from Common Crawl).
    
    Filters out:
    - Words with punctuation (dots, numbers, special chars)
    - Words that are too short
    - Words that look like typos (containing the secret word)
    """
    import re
    
    # Must be at least min_length characters
    if len(word) < min_length:
        return False
    
    # Must only contain letters (and possibly accented French characters)
    # Allow: a-z, à, â, ä, é, è, ê, ë, î, ï, ô, ö, ù, û, ü, ÿ, ç, œ, æ
    if not re.match(r"^[a-zàâäéèêëîïôöùûüÿçœæ]+$", word.lower()):
        return False
    
    return True


def find_max_similarity(secret_word: str) -> float:
    """
    Find the maximum similarity to the secret word from nearest neighbors.
    Returns the similarity of the first VALID word found.
    
    Optimized: searches in batches of 5, stopping as soon as a valid word is found.
    """
    model = load_model()
    secret_word_lower = secret_word.lower().strip()
    
    batch_size = 5
    max_batches = 10  # Max 50 neighbors total
    seen_words = set()
    
    for batch_num in range(max_batches):
        k = (batch_num + 1) * batch_size
        neighbors = model.get_nearest_neighbors(secret_word_lower, k=k)
        
        # Only check new neighbors (skip already seen)
        for sim, word in neighbors:
            if word in seen_words:
                continue
            seen_words.add(word)
            
            # Skip if word contains the secret word (likely a typo/variant)
            if secret_word_lower in word.lower() or word.lower() in secret_word_lower:
                continue
            
            if is_valid_word(word):
                logger.info(f"Max similarity for '{secret_word}': {sim:.4f} (closest valid: '{word}') [batch {batch_num + 1}]")
                return sim
    
    # Fallback if no valid neighbor found
    logger.warning(f"No valid neighbor found for '{secret_word}' after {max_batches} batches, using default 0.7")
    return 0.7


def compute_raw_similarity(embedding1: list[float], embedding2: list[float]) -> float:
    """Compute raw cosine similarity between two embeddings."""
    vec1 = np.array(embedding1)
    vec2 = np.array(embedding2)
    return cosine_similarity(vec1, vec2)


def compute_normalized_score(
    guess_embedding: list[float], 
    secret_embedding: list[float], 
    max_similarity: float
) -> int:
    """
    Compute normalized score between 0-100.
    
    The score is normalized so that:
    - The closest possible word (max_similarity) maps to ~99%
    - Lower similarities are scaled proportionally
    - Exact match (similarity = 1.0) = 100%
    """
    raw_sim = compute_raw_similarity(guess_embedding, secret_embedding)
    
    # If exact or very close match
    if raw_sim >= 0.999:
        return 100
    
    # Normalize: scale so max_similarity -> 99
    # We use max_similarity as the "ceiling" for 99%
    if max_similarity > 0:
        # Scale to 0-99 range, where max_similarity = 99
        normalized = (raw_sim / max_similarity) * 99
    else:
        normalized = raw_sim * 100
    
    # Clamp to 0-99 (100 is reserved for exact match)
    score = round(min(99, max(0, normalized)))
    
    return score


def compute_score(embedding1: list[float], embedding2: list[float]) -> int:
    """
    Compute similarity score between two embeddings (legacy function).
    
    Formula: score = round(cosine_similarity * 100)
    Returns: integer score between 0 and 100
    """
    raw_sim = compute_raw_similarity(embedding1, embedding2)
    score = round(max(0, raw_sim) * 100)
    return min(100, max(0, score))

