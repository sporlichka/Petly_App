from pydantic import BaseModel
from typing import Optional
from datetime import date
from app.models.pet import PetGender

class PetBase(BaseModel):
    name: str
    species: str
    breed: Optional[str] = None
    gender: PetGender
    birthdate: date
    weight: float
    notes: Optional[str] = None

class PetCreate(PetBase):
    pass

class PetUpdate(PetBase):
    pass

class PetRead(PetBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True 