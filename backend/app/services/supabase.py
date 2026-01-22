from functools import lru_cache

from supabase import create_client

from ..config import get_settings


@lru_cache(maxsize=1)
def get_supabase_client():
    settings = get_settings()
    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )
