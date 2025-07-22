from sqlalchemy.orm import Session
from app.models.pet import Pet
from app.schemas.pet import PetCreate, PetUpdate
from typing import List

class PetService:
    @staticmethod
    def get_pets_for_user(db: Session, user_id: int) -> List[Pet]:
        return db.query(Pet).filter(Pet.user_id == user_id).all()

    @staticmethod
    def create_pet(db: Session, pet_in: PetCreate, user_id: int) -> Pet:
        pet = Pet(**pet_in.dict(), user_id=user_id)
        db.add(pet)
        db.commit()
        db.refresh(pet)
        return pet

    @staticmethod
    def update_pet(db: Session, pet_id: int, pet_in: PetUpdate, user_id: int) -> Pet:
        pet = db.query(Pet).filter(Pet.id == pet_id, Pet.user_id == user_id).first()
        if not pet:
            return None
        for field, value in pet_in.dict(exclude_unset=True).items():
            setattr(pet, field, value)
        db.commit()
        db.refresh(pet)
        return pet

    @staticmethod
    def delete_pet(db: Session, pet_id: int, user_id: int):
        pet = db.query(Pet).filter(Pet.id == pet_id, Pet.user_id == user_id).first()
        if pet:
            db.delete(pet)
            db.commit()

    @staticmethod
    def delete_all_user_pets(db: Session, user_id: int) -> bool:
        """Удаление всех питомцев пользователя"""
        try:
            db.query(Pet).filter(Pet.user_id == user_id).delete()
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            print(f"Error deleting user pets: {e}")
            return False 