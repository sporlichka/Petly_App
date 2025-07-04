from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, pets, ai, activity_records

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