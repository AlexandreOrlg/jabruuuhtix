import csv
import hashlib
import json
import logging
import random
import unicodedata
from functools import lru_cache
from pathlib import Path
from typing import Optional

import numpy as np
import requests
from gensim.models import KeyedVectors

from .config import get_settings

logger = logging.getLogger(__name__)

# Global model instance
_model: Optional[KeyedVectors] = None


@lru_cache(maxsize=1)
def load_lexicon_data() -> tuple[
    set[str],
    set[str],
    dict[str, str],
    dict[str, str],
    set[str],
]:
    """Load allowed words, noun lemmas, lemma mappings, and non-verb lemmas."""
    lexicon_path = Path(__file__).parent.parent / "OpenLexicon.tsv"
    if not lexicon_path.exists():
        logger.warning("OpenLexicon.tsv not found; skipping lexicon filtering")
        return set(), set(), {}, {}, set()

    allowed: set[str] = set()
    noun_lemmas: set[str] = set()
    verb_lemma_by_form: dict[str, str] = {}
    noun_lemma_by_form: dict[str, str] = {}
    non_verb_lemmas: set[str] = set()
    with open(lexicon_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        try:
            header = next(reader)
        except StopIteration:
            return allowed, noun_lemmas, verb_lemma_by_form, noun_lemma_by_form, non_verb_lemmas

        try:
            ortho_idx = header.index("ortho")
        except ValueError:
            logger.warning("OpenLexicon.tsv missing 'ortho' column; skipping filter")
            return set(), set(), {}, {}, set()

        freq_idx = header.index("Lexique3__freqfilms2") if "Lexique3__freqfilms2" in header else None
        cgram_idx = header.index("Lexique3__cgram") if "Lexique3__cgram" in header else None
        cgramortho_idx = header.index("Lexique3__cgramortho") if "Lexique3__cgramortho" in header else None
        islem_idx = header.index("Lexique3__islem") if "Lexique3__islem" in header else None
        lemme_idx = header.index("Lexique3__lemme") if "Lexique3__lemme" in header else None

        for row in reader:
            if len(row) <= ortho_idx:
                continue

            word = row[ortho_idx].strip().lower()
            if not word:
                continue

            freq = 0.0
            if freq_idx is not None and len(row) > freq_idx:
                try:
                    freq = float(row[freq_idx])
                except ValueError:
                    freq = 0.0
            passes_freq = freq >= 0.01 if freq_idx is not None else False

            cgram_value = ""
            if cgramortho_idx is not None and len(row) > cgramortho_idx:
                cgram_value = row[cgramortho_idx]
            elif cgram_idx is not None and len(row) > cgram_idx:
                cgram_value = row[cgram_idx]

            tags = set()
            if cgram_value:
                tags = {tag.strip() for tag in cgram_value.split(",") if tag.strip()}

            is_lemma = False
            if islem_idx is not None and len(row) > islem_idx:
                is_lemma = row[islem_idx].strip() == "1"

            lemma = ""
            if lemme_idx is not None and len(row) > lemme_idx:
                lemma = row[lemme_idx].strip().lower()

            verb_only = "VER" in tags and tags.issubset({"VER", "AUX"})
            is_conjugated_verb = verb_only and not is_lemma
            if passes_freq and not is_conjugated_verb:
                allowed.add(word)

            if is_lemma and not tags.issubset({"VER", "AUX"}):
                non_verb_lemmas.add(word)

            if passes_freq and is_lemma and "NOM" in tags:
                noun_lemmas.add(word)

            if verb_only and not is_lemma and lemma and lemma != word:
                if word not in verb_lemma_by_form:
                    verb_lemma_by_form[word] = lemma
            if "NOM" in tags and not is_lemma and lemma and lemma != word:
                if word not in noun_lemma_by_form:
                    noun_lemma_by_form[word] = lemma

    return allowed, noun_lemmas, verb_lemma_by_form, noun_lemma_by_form, non_verb_lemmas


def strip_accents(word: str) -> str:
    """Remove accents from a word (NFD normalization)."""
    return "".join(
        char for char in unicodedata.normalize("NFD", word) if unicodedata.category(char) != "Mn"
    )


def normalize_word(word: str) -> str:
    """Basic word normalization: lowercase and strip whitespace."""
    return word.lower().strip()


class Lexicon:
    """Singleton for centralized lexicon data access."""

    _instance: Optional["Lexicon"] = None

    def __init__(self):
        data = load_lexicon_data()
        self.allowed = data[0]
        self.noun_lemmas = data[1]
        self.verb_lemma_by_form = data[2]
        self.noun_lemma_by_form = data[3]
        self.non_verb_lemmas = data[4]

        normalized = load_lexicon_normalized_data()
        self.allowed_by_plain = normalized[0]
        self.non_verb_lemmas_by_plain = normalized[1]
        self.verb_lemma_by_form_plain = normalized[2]
        self.noun_lemma_by_form_plain = normalized[3]

    @classmethod
    def get(cls) -> "Lexicon":
        """Get the singleton instance."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        """Reset singleton (useful for testing)."""
        cls._instance = None


def is_lemma_form(word: str) -> bool:
    """Check if a word is already in lemma form (not a conjugated/inflected form)."""
    word_lower = normalize_word(word)
    lex = Lexicon.get()
    
    # Check if it's a known conjugated form
    if word_lower in lex.verb_lemma_by_form or word_lower in lex.noun_lemma_by_form:
        return False
    
    # Also check without accents
    word_plain = strip_accents(word_lower)
    if word_plain in lex.verb_lemma_by_form_plain or word_plain in lex.noun_lemma_by_form_plain:
        return False
    
    return True


@lru_cache(maxsize=1)
def load_lexicon_normalized_data() -> tuple[
    dict[str, str],
    dict[str, str],
    dict[str, str],
    dict[str, str],
]:
    allowed, _, verb_lemma_by_form, noun_lemma_by_form, non_verb_lemmas = load_lexicon_data()

    allowed_by_plain: dict[str, str] = {}
    non_verb_lemmas_by_plain: dict[str, str] = {}
    verb_lemma_by_form_plain: dict[str, str] = {}
    noun_lemma_by_form_plain: dict[str, str] = {}

    for word in allowed:
        key = strip_accents(word)
        allowed_by_plain.setdefault(key, word)

    for lemma in non_verb_lemmas:
        key = strip_accents(lemma)
        non_verb_lemmas_by_plain.setdefault(key, lemma)

    for form, lemma in verb_lemma_by_form.items():
        key = strip_accents(form)
        verb_lemma_by_form_plain.setdefault(key, lemma)

    for form, lemma in noun_lemma_by_form.items():
        key = strip_accents(form)
        noun_lemma_by_form_plain.setdefault(key, lemma)

    return (
        allowed_by_plain,
        non_verb_lemmas_by_plain,
        verb_lemma_by_form_plain,
        noun_lemma_by_form_plain,
    )


def is_allowed_guess(word: str) -> bool:
    """Check if a word is allowed as a guess (exists in the lexicon)."""
    lex = Lexicon.get()
    if not lex.allowed:
        return True
    
    word_lower = normalize_word(word)
    if word_lower in lex.allowed:
        return True
    
    return strip_accents(word_lower) in lex.allowed_by_plain


def download_model(url: str, destination: Path) -> None:
    """Download the Word2Vec model from URL."""
    logger.info(f"Downloading Word2Vec model from {url}...")
    logger.info("This may take a few minutes (298 MB)...")
    
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    total_size = int(response.headers.get('content-length', 0))
    downloaded = 0
    
    with open(destination, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
            downloaded += len(chunk)
            if total_size > 0:
                percent = (downloaded / total_size) * 100
                if downloaded % (10 * 1024 * 1024) < 8192:  # Log every ~10MB
                    logger.info(f"Download progress: {percent:.1f}%")
    
    logger.info(f"Model downloaded to {destination}")


def load_model() -> KeyedVectors:
    """Load the Word2Vec model, downloading if necessary."""
    global _model
    
    if _model is not None:
        return _model
    
    settings = get_settings()
    
    # Create cache directory if it doesn't exist
    cache_dir = Path(settings.word2vec_cache_dir)
    cache_dir.mkdir(parents=True, exist_ok=True)
    
    model_path = cache_dir / settings.word2vec_filename
    
    if not model_path.exists():
        download_model(settings.word2vec_model_url, model_path)
    else:
        logger.info(f"Using cached model at {model_path}")
    
    logger.info("Loading Word2Vec model...")
    _model = KeyedVectors.load_word2vec_format(
        str(model_path), 
        binary=True, 
        unicode_errors="ignore"
    )
    logger.info(f"Word2Vec model loaded! Vocabulary size: {len(_model.key_to_index)}")
    
    return _model


def is_word_in_vocabulary(word: str) -> bool:
    """Check if a word exists in the Word2Vec vocabulary."""
    model = load_model()
    return normalize_word(word) in model.key_to_index


def get_embedding(word: str) -> list[float]:
    """
    Get the embedding vector for a word.
    
    Raises:
        KeyError: If the word is not in the vocabulary
    """
    model = load_model()
    word_normalized = normalize_word(word)
    
    if word_normalized not in model.key_to_index:
        raise KeyError(f"Word '{word_normalized}' not in vocabulary")
    
    embedding = model[word_normalized]
    return embedding.tolist()


def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    return float(dot_product / (norm1 * norm2))


def find_min_similarity(secret_word: str, sample_size: int = 1200) -> float:
    """
    Estimate the minimum similarity by sampling random words.

    Returns the 5th percentile of similarities to establish a baseline.
    Sampling is seeded by the secret word to make results stable.
    """
    model = load_model()
    secret_word_lower = normalize_word(secret_word)

    if secret_word_lower not in model.key_to_index:
        return 0.1

    secret_embedding = model[secret_word_lower]

    lex = Lexicon.get()
    if lex.allowed:
        eligible_words = [word for word in lex.allowed if word in model.key_to_index]
    else:
        eligible_words = list(model.key_to_index.keys())

    if not eligible_words:
        return 0.1

    seed = int.from_bytes(
        hashlib.sha256(secret_word_lower.encode("utf-8")).digest()[:4],
        "big",
    )
    rng = random.Random(seed)
    sample = rng.sample(eligible_words, min(sample_size, len(eligible_words)))

    similarities = []
    for word in sample:
        word_embedding = model[word]
        sim = cosine_similarity(secret_embedding, word_embedding)
        similarities.append(sim)

    # Use 5th percentile as the "floor"
    min_sim = float(np.percentile(similarities, 5))
    logger.info(
        f"Min similarity for '{secret_word}': {min_sim:.4f} (5th percentile of {len(sample)} samples)"
    )

    return min_sim


def compute_raw_similarity(embedding1: list[float], embedding2: list[float]) -> float:
    """Compute raw cosine similarity between two embeddings."""
    vec1 = np.array(embedding1)
    vec2 = np.array(embedding2)
    return cosine_similarity(vec1, vec2)


def apply_top_100_boost(
    base_score: int,
    rank: Optional[int],
    max_boost: int = 12,
    curve: float = 0.7,
) -> int:
    """Boost score progressively for the top-100 closest words (rank 900-999)."""
    if rank is None or rank < 900:
        return base_score

    progress = (rank - 900) / 99
    boost = round(max_boost * (progress ** curve))
    return min(99, base_score + boost)


def compute_score_and_temperature(
    guess_embedding: list[float],
    secret_embedding: list[float],
    max_similarity: float,
    min_similarity: float = 0.1,
    rank: Optional[int] = None,
) -> tuple[int, float]:
    """
    Compute score and temperature from a single normalized similarity curve.

    - Scores are 0-99 for non-exact matches (100 reserved for exact).
    - Temperature is aligned with the score.
    - Top-100 words get a progressive boost.
    """
    raw_sim = compute_raw_similarity(guess_embedding, secret_embedding)

    if max_similarity <= min_similarity:
        return 0, 0.0

    normalized = (raw_sim - min_similarity) / (max_similarity - min_similarity)
    normalized = max(0.0, min(1.0, normalized))
    base_score = round(normalized * 99)
    boosted_score = apply_top_100_boost(base_score, rank)

    return boosted_score, float(boosted_score)


def compute_top_1000(secret_word: str) -> list[dict]:
    """
    Compute the top 1000 closest words to the secret word.
    
    Returns a list of dicts with 'word' and 'similarity' keys,
    ordered by similarity (highest first).
    """
    model = load_model()
    secret_word_lower = normalize_word(secret_word)
    
    if secret_word_lower not in model.key_to_index:
        logger.warning(f"Secret word '{secret_word}' not in vocabulary")
        return []
    
    try:
        lex = Lexicon.get()
        filter_enabled = bool(lex.allowed)
        topn = 5000 if filter_enabled else 1000

        # Get most similar words (filter to allowed French words if available)
        similar_words = model.most_similar(secret_word_lower, topn=topn)
        
        result = []
        for word, similarity in similar_words:
            if filter_enabled and normalize_word(word) not in lex.allowed:
                continue
            result.append({
                "word": word,
                "similarity": float(similarity)
            })
            if len(result) >= 1000:
                break
        
        if result:
            logger.info(
                f"Computed top 1000 for '{secret_word}' (closest: '{result[0]['word']}' @ {result[0]['similarity']:.4f})"
            )
        elif filter_enabled:
            logger.info(f"Computed top 1000 for '{secret_word}' (no allowed words found)")
        return result
        
    except Exception as e:
        logger.error(f"Error computing top 1000: {e}")
        return []


WORD_POOLS_PATH = Path(__file__).parent.parent / "data" / "word_pools.json"


@lru_cache(maxsize=1)
def load_word_pools() -> Optional[dict[str, list[str]]]:
    """Load precomputed word pools (easy/medium/hard)."""
    if not WORD_POOLS_PATH.exists():
        logger.error("Word pools not found at %s", WORD_POOLS_PATH)
        return None

    try:
        with open(WORD_POOLS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as exc:
        logger.warning(f"Failed to load word pools: {exc}")
        return None

    pools: dict[str, list[str]] = {}
    for key in ("easy", "medium", "hard"):
        words = data.get(key, [])
        if not isinstance(words, list):
            continue
        cleaned: list[str] = []
        seen: set[str] = set()
        for word in words:
            word_str = str(word).strip()
            if not word_str:
                continue
            normalized = normalize_guess_word(word_str, require_vocab=False)
            if not is_word_in_vocabulary(normalized):
                continue
            if normalized in seen:
                continue
            seen.add(normalized)
            cleaned.append(normalized)
        if cleaned:
            pools[key] = cleaned

    if not pools:
        logger.error("Word pools are empty after filtering")
        return None

    return pools


def normalize_guess_word(word: str, require_vocab: bool = True) -> str:
    """Normalize conjugated verbs or plural nouns to their lemma when possible."""
    word_lower = normalize_word(word)
    lex = Lexicon.get()
    word_plain = strip_accents(word_lower)

    # Already a non-verb lemma → return as-is
    if word_lower in lex.non_verb_lemmas:
        return word_lower
    if word_plain in lex.non_verb_lemmas_by_plain:
        lemma = lex.non_verb_lemmas_by_plain[word_plain]
        if not require_vocab or is_word_in_vocabulary(lemma):
            return lemma

    # Try verb lemma lookup
    lemma = lex.verb_lemma_by_form.get(word_lower) or lex.verb_lemma_by_form_plain.get(word_plain)
    if lemma:
        if not require_vocab:
            return lemma
        if is_word_in_vocabulary(lemma):
            return lemma
        lemma_plain = strip_accents(lemma)
        if is_word_in_vocabulary(lemma_plain):
            return lemma_plain
        return word_lower

    # Try noun lemma lookup
    noun_lemma = lex.noun_lemma_by_form.get(word_lower) or lex.noun_lemma_by_form_plain.get(word_plain)
    if noun_lemma:
        if not require_vocab:
            return noun_lemma
        if is_word_in_vocabulary(noun_lemma):
            return noun_lemma
        noun_lemma_plain = strip_accents(noun_lemma)
        if is_word_in_vocabulary(noun_lemma_plain):
            return noun_lemma_plain

    return word_lower


def get_rank(word: str, top_1000: list[dict]) -> Optional[int]:
    """
    Get the rank for a word from precomputed top 1000 list.

    Returns:
        rank is 1-999 (999=closest neighbor) or None if not in top 1000
    """
    word_lower = normalize_word(word)
    for i, entry in enumerate(top_1000):
        if normalize_word(entry["word"]) == word_lower:
            rank = 999 - i
            return max(1, rank)

    return None
