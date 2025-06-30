from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class ActivityCategory(str, Enum):
    FEEDING = "FEEDING"
    HEALTH = "HEALTH"
    ACTIVITY = "ACTIVITY"

class ActivityRecordBase(BaseModel):
    category: ActivityCategory
    title: str
    date: datetime
    time: datetime
    repeat: Optional[str] = None
    notify: bool = True
    notes: Optional[str] = None
    food_type: Optional[str] = None
    quantity: Optional[str] = None
    duration: Optional[str] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None

class ActivityRecordCreate(ActivityRecordBase):
    pet_id: int

class ActivityRecordUpdate(BaseModel):
    category: Optional[ActivityCategory] = None
    title: Optional[str] = None
    date: Optional[datetime] = None
    time: Optional[datetime] = None
    repeat: Optional[str] = None
    notify: Optional[bool] = None
    notes: Optional[str] = None
    food_type: Optional[str] = None
    quantity: Optional[str] = None
    duration: Optional[str] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None

class ActivityRecordRead(ActivityRecordBase):
    id: int
    pet_id: int

    class Config:
        from_attributes = True 