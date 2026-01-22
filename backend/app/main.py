import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routes import guesses, rooms

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)


def ensure_word_pools_available() -> None:
    from .embeddings import load_word_pools

    pools = load_word_pools()
    if not pools:
        raise RuntimeError("word_pools.json missing or empty in backend/data")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - load models on startup."""
    logger.info("Starting jabruuuhtix API...")

    logger.info("Validating word pools...")
    ensure_word_pools_available()
    logger.info("Word pools validated.")

    # Preload the Word2Vec model on startup
    try:
        from .embeddings import load_model
        logger.info("Preloading Word2Vec model...")
        load_model()
        logger.info("Word2Vec model loaded successfully!")
    except Exception as e:
        logger.error(f"Failed to load Word2Vec model: {e}")
        # Don't fail startup, model will be loaded on first request
    
    yield
    
    logger.info("Shutting down jabruuuhtix API...")


# Create FastAPI app
app = FastAPI(
    title="jabruuuhtix API",
    description="Real-time word guessing game using semantic similarity",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
settings = get_settings()

# Parse CORS origins - default to ["*"] if not set or empty
if settings.cors_origins and settings.cors_origins.strip() and settings.cors_origins != "*":
    origins = [origin.strip() for origin in settings.cors_origins.split(",")]
else:
    origins = ["*"]

logger.info(f"CORS configured with origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True if origins != ["*"] else False,  # Can't use credentials with "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(rooms.router)
app.include_router(guesses.router)
