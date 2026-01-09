import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # FastText model
    fasttext_repo_id: str = "facebook/fasttext-fr-vectors"
    fasttext_filename: str = "model.bin"
    fasttext_cache_dir: str = "./.cache/fasttext"

    # Hugging Face
    hf_token: str = ""

    # CORS
    cors_origins: str = "*"

    # Server
    host: str = "0.0.0.0"
    port: int = 8081

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
