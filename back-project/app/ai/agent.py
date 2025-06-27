from google.adk.agents import Agent
from google.adk.sessions import DatabaseSessionService
from google.adk.runners import Runner
from google.genai import types
from google.generativeai import configure
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Google AI
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is not set")

configure(api_key=GOOGLE_API_KEY)

# Database configuration for session service
DATABASE_URL = (
    f"postgresql://{os.getenv('POSTGRES_USER', 'postgres')}:"
    f"{os.getenv('POSTGRES_PASSWORD', 'postgres')}@"
    f"{os.getenv('POSTGRES_HOST', 'localhost')}:{os.getenv('POSTGRES_PORT', '5432')}/"
    f"{os.getenv('POSTGRES_DB', 'petcare')}"
)

# --- Agent Configuration ---
petcare_agent = Agent(
    name="PetCareAdvisor",
    model="gemini-2.0-flash",
    description="Vet assistant for pet symptoms",
    instruction="""
You are a veterinary assistant AI. Provide care advice based on owner's message.

Steps:
1. Identify pet type/breed if mentioned.
2. List all reported symptoms.
3. Research breed-specific risks (if breed given).
4. Generate prioritized advice:
   - Urgent actions first
   - Home care suggestions
   - When to see a vet

Output Rules:
- 3–5 bullet points
- Mark urgent items with "!!!" in the end of the paragraph
- No variables or placeholders
"""
)

APP_NAME = "petcare_assistant_app"
session_service = DatabaseSessionService(db_url=DATABASE_URL)
runner = Runner(
    agent=petcare_agent,
    app_name=APP_NAME,
    session_service=session_service,
)

# Example Usage:
"""
response = pet_care_agent.run("My Persian cat hasn't drunk water in 24 hours")
print(response)
"""