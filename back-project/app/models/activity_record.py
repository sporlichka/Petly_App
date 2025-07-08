from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum, Boolean, Float
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum

class ActivityCategory(enum.Enum):
    FEEDING = "FEEDING"
    CARE = "CARE"
    ACTIVITY = "ACTIVITY"

class ActivityRecord(Base):
    __tablename__ = "activity_records"

    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id", ondelete="CASCADE"), nullable=False)
    category = Column(Enum(ActivityCategory), nullable=False)
    
    # Универсальные поля
    title = Column(String, nullable=False)
    date = Column(DateTime, nullable=False)
    time = Column(DateTime, nullable=False)
    repeat = Column(String, nullable=True)  # например: "daily", "weekly", "monthly"
    notify = Column(Boolean, default=True, nullable=False)  # отдельное поле для уведомлений
    notes = Column(Text, nullable=True)
    
    # Специфичные поля для feeding
    food_type = Column(String, nullable=True)
    quantity = Column(String, nullable=True)  # Changed from Float to String for "2 cups", "200g", etc.
    
    # Специфичные поля для activity
    duration = Column(String, nullable=True)  # e.g., "30 minutes", "1 hour"
    
    # Связь с питомцем
    pet = relationship("Pet", back_populates="activity_records") 