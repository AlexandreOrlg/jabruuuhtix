import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # Word2Vec model (French frWac)
    word2vec_model_url: str = "https://embeddings.net/embeddings/frWac_non_lem_no_postag_no_phrase_500_skip_cut100.bin"
    word2vec_filename: str = "frWac_non_lem_no_postag_no_phrase_500_skip_cut100.bin"
    word2vec_cache_dir: str = "./.cache/word2vec"

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
