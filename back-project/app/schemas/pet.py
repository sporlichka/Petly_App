from pydantic import BaseModel
from typing import Optional
from datetime import date

class PetBase(BaseModel):
    name: str
    species: str
    breed: Optional[str] = None
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