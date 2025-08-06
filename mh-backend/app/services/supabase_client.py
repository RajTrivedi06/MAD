from supabase import create_client
from app.core.config import get_settings

# Pull your settings dict
settings = get_settings()

# Initialize using the dict keys
supabase = create_client(
    settings["SUPABASE_URL"],
    settings["SUPABASE_SERVICE_ROLE_KEY"],
)
