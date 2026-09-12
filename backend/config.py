# Shared backend configuration: env, OpenAI, Supabase clients, CORS origins
import os
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client, Client

load_dotenv()
print("Weather key:", os.environ.get("WEATHER_API_KEY"))
print("Length:", len(os.environ.get("WEATHER_API_KEY") or ""))

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

_supabase_url = os.environ.get("SUPABASE_URL")
_supabase_key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(_supabase_url, _supabase_key)
# Separate client for Auth Admin APIs only.
# After /login, supabase-py can overwrite Authorization on the shared client
# with the user JWT, which makes admin.create_user return "User not allowed".
supabase_admin: Client = create_client(_supabase_url, _supabase_key)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
