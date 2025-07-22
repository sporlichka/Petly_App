from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.auth.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.pet import PetCreate, PetRead, PetUpdate
from app.services.pet_service import PetService

router = APIRouter(prefix="/pets", tags=["pets"])

@router.get("/", response_model=List[PetRead])
def list_pets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return PetService.get_pets_for_user(db, current_user.id)

@router.post("/", response_model=PetRead)
def add_pet(pet_in: PetCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return PetService.create_pet(db, pet_in, current_user.id)

@router.put("/{pet_id}", response_model=PetRead)
def update_pet(pet_id: int, pet_in: PetUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pet = PetService.update_pet(db, pet_id, pet_in, current_user.id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return pet

@router.delete("/{pet_id}")
def delete_pet(pet_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    PetService.delete_pet(db, pet_id, current_user.id)
    return {"ok": True} 