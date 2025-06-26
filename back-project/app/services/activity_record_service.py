from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.activity_record import ActivityRecord, ActivityCategory
from app.models.pet import Pet
from app.models.user import User
from app.schemas.activity_record import ActivityRecordCreate, ActivityRecordUpdate

class ActivityRecordService:
    @staticmethod
    def create_record(db: Session, record: ActivityRecordCreate, current_user: User) -> ActivityRecord:
        # Проверяем, что питомец принадлежит текущему пользователю
        pet = db.query(Pet).filter(Pet.id == record.pet_id, Pet.user_id == current_user.id).first()
        if not pet:
            raise ValueError("Pet not found or access denied")
        
        db_record = ActivityRecord(
            pet_id=record.pet_id,
            category=record.category,
            title=record.title,
            date=record.date,
            time=record.time,
            repeat=record.repeat,
            notes=record.notes,
            food_type=record.food_type,
            quantity=record.quantity
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        return db_record

    @staticmethod
    def get_records_by_pet(
        db: Session, 
        pet_id: int, 
        current_user: User,
        category: Optional[ActivityCategory] = None,
        skip: int = 0, 
        limit: int = 100
    ) -> List[ActivityRecord]:
        # Проверяем, что питомец принадлежит текущему пользователю
        pet = db.query(Pet).filter(Pet.id == pet_id, Pet.user_id == current_user.id).first()
        if not pet:
            return []
        
        query = db.query(ActivityRecord).filter(ActivityRecord.pet_id == pet_id)
        
        if category:
            query = query.filter(ActivityRecord.category == category)
        
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_record_by_id(db: Session, record_id: int, current_user: User) -> Optional[ActivityRecord]:
        # Получаем запись с проверкой владельца
        record = db.query(ActivityRecord).join(Pet).filter(
            ActivityRecord.id == record_id,
            Pet.user_id == current_user.id
        ).first()
        return record

    @staticmethod
    def update_record(
        db: Session, 
        record_id: int, 
        record_update: ActivityRecordUpdate,
        current_user: User
    ) -> Optional[ActivityRecord]:
        # Проверяем права доступа
        db_record = ActivityRecordService.get_record_by_id(db, record_id, current_user)
        if not db_record:
            return None
        
        update_data = record_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_record, field, value)
        
        db.commit()
        db.refresh(db_record)
        return db_record

    @staticmethod
    def delete_record(db: Session, record_id: int, current_user: User) -> bool:
        # Проверяем права доступа
        db_record = ActivityRecordService.get_record_by_id(db, record_id, current_user)
        if not db_record:
            return False
        
        db.delete(db_record)
        db.commit()
        return True 