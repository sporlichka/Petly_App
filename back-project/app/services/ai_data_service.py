from typing import List
from pydantic import BaseModel
from app.models.pet import Pet, PetGender
from sqlalchemy.orm import Session
from datetime import date

class PetInfo(BaseModel):
    id: int
    name: str
    species: str
    breed: str
    gender: str
    age: int  # in years
    weight: float  # in kg
    notes: str


def calculate_age(birthdate: date) -> int:
    today = date.today()
    return today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))


def get_user_pets(db: Session, user_id: int) -> List[PetInfo]:
    pets = db.query(Pet).filter(Pet.user_id == user_id).all()
    return [
        PetInfo(
            id=pet.id,
            name=pet.name,
            species=pet.species,
            breed=pet.breed or "",
            gender=pet.gender.value if pet.gender else "Unknown",
            age=calculate_age(pet.birthdate),
            weight=pet.weight,
            notes=pet.notes or ""
        )
        for pet in pets
    ] 