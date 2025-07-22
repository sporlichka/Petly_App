from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
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
            notify=record.notify if record.notify is not None else True,
            notes=record.notes,
            food_type=record.food_type,
            quantity=record.quantity,
            duration=record.duration,
            repeat_type=record.repeat_type,
            repeat_interval=record.repeat_interval,
            repeat_end_date=record.repeat_end_date,
            repeat_count=record.repeat_count,
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
    def get_all_user_records(
        db: Session,
        current_user: User,
        category: Optional[ActivityCategory] = None,
        skip: int = 0,
        limit: int = 1000
    ) -> List[ActivityRecord]:
        """Получить все записи активности для всех питомцев пользователя"""
        # Получаем все записи через JOIN с таблицей pets для проверки владельца
        query = db.query(ActivityRecord).join(Pet).filter(Pet.user_id == current_user.id)
        
        if category:
            query = query.filter(ActivityRecord.category == category)
        
        # Сортируем по дате и времени (новые сначала)
        query = query.order_by(ActivityRecord.date.desc(), ActivityRecord.time.desc())
        
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_records_by_date(
        db: Session,
        target_date: date,
        current_user: User,
        category: Optional[ActivityCategory] = None
    ) -> List[ActivityRecord]:
        """Получить все записи активности на конкретную дату для всех питомцев пользователя"""
        # Получаем записи через JOIN с таблицей pets для проверки владельца
        # Create datetime range for the target date
        start_datetime = datetime.combine(target_date, datetime.min.time())
        end_datetime = datetime.combine(target_date, datetime.max.time())
        
        query = db.query(ActivityRecord).join(Pet).filter(
            Pet.user_id == current_user.id,
            ActivityRecord.date >= start_datetime,
            ActivityRecord.date <= end_datetime
        )
        
        if category:
            query = query.filter(ActivityRecord.category == category)
        
        # Сортируем по времени
        query = query.order_by(ActivityRecord.time.asc())
        
        return query.all()

    @staticmethod
    def get_records_by_date_range(
        db: Session,
        start_date: date,
        end_date: date,
        current_user: User,
        category: Optional[ActivityCategory] = None,
        skip: int = 0,
        limit: int = 1000
    ) -> List[ActivityRecord]:
        """Получить записи активности в диапазоне дат для всех питомцев пользователя"""
        # Получаем записи через JOIN с таблицей pets для проверки владельца
        # Create datetime range for the date range
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        query = db.query(ActivityRecord).join(Pet).filter(
            Pet.user_id == current_user.id,
            ActivityRecord.date >= start_datetime,
            ActivityRecord.date <= end_datetime
        )
        
        if category:
            query = query.filter(ActivityRecord.category == category)
        
        # Сортируем по дате и времени
        query = query.order_by(ActivityRecord.date.desc(), ActivityRecord.time.desc())
        
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
        
        # Use exclude_unset=True for PATCH - only update provided fields
        update_data = record_update.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            if hasattr(db_record, field):
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

    @staticmethod
    def disable_all_notifications(db: Session, current_user: User) -> bool:
        """Отключить уведомления для всех активностей пользователя"""
        try:
            # Получаем все активности пользователя через его питомцев
            user_pets = db.query(Pet).filter(Pet.user_id == current_user.id).all()
            pet_ids = [pet.id for pet in user_pets]
            
            if not pet_ids:
                # У пользователя нет питомцев, считаем операцию успешной
                return True
            
            # Обновляем все активности пользователя
            updated_count = db.query(ActivityRecord).filter(
                ActivityRecord.pet_id.in_(pet_ids)
            ).update({"notify": False})
            
            db.commit()
            print(f"Disabled notifications for {updated_count} activities for user {current_user.id}")
            return True
        except Exception as e:
            db.rollback()
            print(f"Error disabling notifications for user {current_user.id}: {e}")
            return False

    @staticmethod
    def delete_all_user_activities(db: Session, user_id: int) -> bool:
        """Удаление всех записей активности пользователя"""
        try:
            # Получаем все питомцы пользователя
            user_pets = db.query(Pet).filter(Pet.user_id == user_id).all()
            pet_ids = [pet.id for pet in user_pets]
            
            if not pet_ids:
                # У пользователя нет питомцев, считаем операцию успешной
                return True
            
            # Удаляем все записи активности для питомцев пользователя
            deleted_count = db.query(ActivityRecord).filter(
                ActivityRecord.pet_id.in_(pet_ids)
            ).delete()
            
            db.commit()
            print(f"Deleted {deleted_count} activities for user {user_id}")
            return True
        except Exception as e:
            db.rollback()
            print(f"Error deleting user activities: {e}")
            return False 