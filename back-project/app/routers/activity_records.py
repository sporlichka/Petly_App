from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
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
        print(f"=== ROUTER PATCH DEBUG ===")
        print(f"Record ID: {record_id}")
        print(f"Update data received: {record_update}")
        print(f"Update data dict: {record_update.dict()}")
        print(f"Update data dict (exclude_unset=True): {record_update.dict(exclude_unset=True)}")
        
        record = ActivityRecordService.update_record(
            db=db, 
            record_id=record_id, 
            record_update=record_update,
            current_user=current_user
        )
        if not record:
            print(f"Record not found or access denied for ID: {record_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied or record not found"
            )
        
        print(f"Successfully updated record: {record}")
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