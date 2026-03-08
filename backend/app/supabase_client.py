import os
from supabase import create_client, Client

_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    global _supabase_client

    if _supabase_client is None:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url:
            raise RuntimeError("SUPABASE_URL environment variable is not set")
        if not supabase_service_role_key:
            raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY environment variable is not set")

        _supabase_client = create_client(
            supabase_url,
            supabase_service_role_key,
        )

    return _supabase_client
