from app.services.ai_data_service import get_user_pets, PetInfo
from sqlalchemy.orm import Session
from typing import List

class AIAgentDataAPI:
    def __init__(self, db: Session):
        self.db = db

    def get_user_pets(self, user_id: int) -> List[PetInfo]:
        return get_user_pets(self.db, user_id) 