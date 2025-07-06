from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.auth.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.activity_record import (
    ActivityRecordCreate, 
    ActivityRecordRead, 
    ActivityRecordUpdate,
    ActivityCategory
)
from app.services.activity_record_service import ActivityRecordService

router = APIRouter(prefix="/records", tags=["activity_records"])

@router.get("/all-user-pets", response_model=List[ActivityRecordRead])
def get_all_user_activity_records(
    category: Optional[ActivityCategory] = Query(None, description="Категория записи"),
    skip: int = Query(0, ge=0, description="Количество записей для пропуска"),
    limit: int = Query(1000, ge=1, le=1000, description="Максимальное количество записей"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить все записи активности для всех питомцев пользователя"""
    records = ActivityRecordService.get_all_user_records(
        db=db,
        current_user=current_user,
        category=category,
        skip=skip,
        limit=limit
    )
    return records

@router.get("/by-date", response_model=List[ActivityRecordRead])
def get_activity_records_by_date(
    date: date = Query(..., description="Дата в формате YYYY-MM-DD"),
    category: Optional[ActivityCategory] = Query(None, description="Категория записи"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить записи активности на конкретную дату для всех питомцев пользователя"""
    records = ActivityRecordService.get_records_by_date(
        db=db,
        target_date=date,
        current_user=current_user,
        category=category
    )
    return records

@router.get("/by-date-range", response_model=List[ActivityRecordRead])
def get_activity_records_by_date_range(
    start_date: date = Query(..., description="Начальная дата в формате YYYY-MM-DD"),
    end_date: date = Query(..., description="Конечная дата в формате YYYY-MM-DD"),
    category: Optional[ActivityCategory] = Query(None, description="Категория записи"),
    skip: int = Query(0, ge=0, description="Количество записей для пропуска"),
    limit: int = Query(1000, ge=1, le=1000, description="Максимальное количество записей"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить записи активности в диапазоне дат для всех питомцев пользователя"""
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be before or equal to end date"
        )
    
    records = ActivityRecordService.get_records_by_date_range(
        db=db,
        start_date=start_date,
        end_date=end_date,
        current_user=current_user,
        category=category,
        skip=skip,
        limit=limit
    )
    return records

@router.post("/", response_model=ActivityRecordRead)
def create_activity_record(
    record: ActivityRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новую запись активности"""
    try:
        return ActivityRecordService.create_record(db=db, record=record, current_user=current_user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )

@router.get("/", response_model=List[ActivityRecordRead])
def get_activity_records(
    pet_id: int = Query(..., description="ID питомца"),
    category: Optional[ActivityCategory] = Query(None, description="Категория записи"),
    skip: int = Query(0, ge=0, description="Количество записей для пропуска"),
    limit: int = Query(100, ge=1, le=1000, description="Максимальное количество записей"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить записи активности по питомцу с возможностью фильтрации по категории"""
    records = ActivityRecordService.get_records_by_pet(
        db=db, 
        pet_id=pet_id, 
        current_user=current_user,
        category=category,
        skip=skip, 
        limit=limit
    )
    return records

@router.get("/{record_id}", response_model=ActivityRecordRead)
def get_activity_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить конкретную запись активности по ID"""
    record = ActivityRecordService.get_record_by_id(db=db, record_id=record_id, current_user=current_user)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied or record not found"
        )
    return record

@router.patch("/{record_id}", response_model=ActivityRecordRead)
def update_activity_record(
    record_id: int,
    record_update: ActivityRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Частично обновить запись активности"""
    try:
        record = ActivityRecordService.update_record(
            db=db, 
            record_id=record_id, 
            record_update=record_update,
            current_user=current_user
        )
        if not record:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied or record not found"
            )
        
        return record
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in update_activity_record: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.delete("/{record_id}")
def delete_activity_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить запись активности"""
    success = ActivityRecordService.delete_record(db=db, record_id=record_id, current_user=current_user)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied or record not found"
        )
    return {"message": "Запись успешно удалена"}

@router.patch("/disable-all-notifications")
def disable_all_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отключить уведомления для всех активностей пользователя"""
    success = ActivityRecordService.disable_all_notifications(db, current_user)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disable notifications"
        )
    return {"message": "All notifications disabled successfully"} 