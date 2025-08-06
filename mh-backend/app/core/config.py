from dotenv import load_dotenv, find_dotenv
from pathlib import Path
import os
import psycopg2
import openai

env_path = Path(__file__).parents[1] / ".env"
print(f"→ loading .env from: {env_path!s}")
load_dotenv(env_path)  # will no-op if the file doesn’t exist

# OpenAI setup
openai.api_key = os.getenv("OPENAI_API_KEY")

def get_openai():
    return openai

# Database connection
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )

# Settings function to expose Supabase and CORS config
def get_settings():
    """
    Return a settings dict with Supabase and CORS configuration pulled from environment.
    """
    return {
        "SUPABASE_URL": os.getenv("SUPABASE_URL"),
        "SUPABASE_SERVICE_ROLE_KEY": os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
        # CORS_ORIGINS: list of origins allowed for cross-origin requests
        "CORS_ORIGINS": os.getenv("CORS_ORIGINS", "*").split(",") if os.getenv("CORS_ORIGINS") else ["*"],
    }
