from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.activity_record import ActivityCategory, RepeatType

class ActivityRecordBase(BaseModel):
    category: ActivityCategory
    title: str
    date: datetime
    time: datetime
    notify: bool = True
    notes: Optional[str] = None
    food_type: Optional[str] = None
    quantity: Optional[str] = None
    duration: Optional[str] = None
    # Новые поля для повторов
    repeat_type: RepeatType = RepeatType.NONE
    repeat_interval: int = 1
    repeat_end_date: Optional[datetime] = None
    repeat_count: Optional[int] = None

class ActivityRecordCreate(ActivityRecordBase):
    pet_id: int

class ActivityRecordUpdate(BaseModel):
    category: Optional[ActivityCategory] = None
    title: Optional[str] = None
    date: Optional[datetime] = None
    time: Optional[datetime] = None
    notify: Optional[bool] = None
    notes: Optional[str] = None
    food_type: Optional[str] = None
    quantity: Optional[str] = None
    duration: Optional[str] = None
    repeat_type: Optional[RepeatType] = None
    repeat_interval: Optional[int] = None
    repeat_end_date: Optional[datetime] = None
    repeat_count: Optional[int] = None

class ActivityRecordRead(ActivityRecordBase):
    id: int
    pet_id: int

    class Config:
        from_attributes = True 