from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum, Boolean, Float
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum

class ActivityCategory(str, enum.Enum):
    FEEDING = "FEEDING"
    CARE = "CARE"
    ACTIVITY = "ACTIVITY"

class RepeatType(str, enum.Enum):
    NONE = "none"
    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    YEAR = "year"

class ActivityRecord(Base):
    __tablename__ = "activity_records"

    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id", ondelete="CASCADE"), nullable=False)
    category = Column(Enum(ActivityCategory, name="activity_category_enum"), nullable=False)
    
    # Универсальные поля
    title = Column(String, nullable=False)
    date = Column(DateTime, nullable=False)
    time = Column(DateTime, nullable=False)
    notify = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)
    
    # Специфичные поля для feeding
    food_type = Column(String, nullable=True)
    quantity = Column(String, nullable=True)  # Changed from Float to String for "2 cups", "200g", etc.
    
    # Специфичные поля для activity
    duration = Column(String, nullable=True)  # e.g., "30 minutes", "1 hour"

    # Новые поля для повторов
    repeat_type = Column(Enum(RepeatType, name="repeat_type_enum"), default=RepeatType.NONE, nullable=False)
    repeat_interval = Column(Integer, default=1, nullable=False)  # раз в X дней/недель/месяцев/лет
    repeat_end_date = Column(DateTime, nullable=True)
    repeat_count = Column(Integer, nullable=True)

    # Связь с питомцем
    pet = relationship("Pet", back_populates="activity_records") 