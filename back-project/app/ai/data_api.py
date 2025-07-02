from app.services.ai_data_service import get_user_pets, PetInfo
from sqlalchemy.orm import Session
from typing import List, Optional

class AIAgentDataAPI:
    """API для предоставления данных о питомцах AI агенту"""
    
    def __init__(self, db: Session):
        self.db = db

    def get_user_pets(self, user_id: int) -> List[PetInfo]:
        """Получает список всех питомцев пользователя с полной информацией"""
        return get_user_pets(self.db, user_id)
    
    def get_pet_by_name(self, user_id: int, pet_name: str) -> Optional[PetInfo]:
        """Находит питомца по имени для конкретного пользователя"""
        pets = self.get_user_pets(user_id)
        for pet in pets:
            if pet.name.lower() == pet_name.lower():
                return pet
        return None
    
    def get_pet_context_string(self, user_id: int) -> str:
        """Возвращает строку с информацией о всех питомцах пользователя для контекста AI"""
        pets = self.get_user_pets(user_id)
        
        if not pets:
            return "User has no registered pets."
        
        context_parts = ["User's pets:"]
        for pet in pets:
            weight_str = f"{pet.weight}kg" if pet.weight else "weight unknown"
            breed_str = f" ({pet.breed})" if pet.breed else ""
            notes_str = f" Notes: {pet.notes}" if pet.notes else ""
            
            pet_info = f"- {pet.name}: {pet.age}-year-old {pet.gender.lower()} {pet.species}{breed_str}, {weight_str}{notes_str}"
            context_parts.append(pet_info)
        
        return "\n".join(context_parts)
    
    def format_pet_weight_advice(self, pet: PetInfo) -> str:
        """Форматирует информацию о весе питомца для AI рекомендаций"""
        return f"{pet.name} is a {pet.age}-year-old {pet.species} weighing {pet.weight}kg" 