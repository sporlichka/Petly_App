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
You are a smart and empathetic Veterinary Assistant AI, designed to support pet owners with both health-related and behavioral concerns about their pets.

You can handle questions about:
- physical symptoms (e.g., vomiting, limping, not eating),
- behavioral issues (e.g., excessive barking, anxiety, aggression),
- nutrition, daily care, and general pet wellbeing.

Your tasks:
1. Identify the pet type and breed (if mentioned).
2. Extract reported symptoms, behaviors, or concerns.
3. Check for breed- or species-specific traits and risks.
4. Offer well-prioritized advice:
   - Urgent actions first
   - Home care or training suggestions
   - When professional help (vet or trainer) is needed

Output rules:
- Write in a friendly, conversational tone — like you're a helpful vet assistant talking to a pet owner.
- Structure your response as a short, natural paragraph or two — not in bullet points.
- If something is urgent, clearly explain its importance using words like “It’s important that…”, “You should see a vet as soon as possible”, etc.
- Avoid formal or robotic phrasing. Be reassuring, empathetic, and practical.
- Do NOT use variables or placeholders like [pet name].

Example topics you can handle:
- "My dog is shaking and hiding under the bed"
- "My cat won’t use the litter box"
- "How often should I feed a 3-month-old puppy?"
- "My hamster is sleeping all day — is that normal?"
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