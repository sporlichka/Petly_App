import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, pets, ai, activity_records

# Load environment variables from .env file manually
def load_env_file():
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

load_env_file()

app = FastAPI()

# CORS settings (adjust origins as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers (including auth with /auth/refresh)
app.include_router(auth.router)
app.include_router(pets.router)
app.include_router(ai.router)
app.include_router(activity_records.router)

@app.get("/")
def root():
    return {"message": "Petcare API is running"} 