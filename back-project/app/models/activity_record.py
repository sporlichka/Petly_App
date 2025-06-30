from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum

class ActivityCategory(enum.Enum):
    FEEDING = "FEEDING"
    HEALTH = "HEALTH"
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
    notes = Column(Text, nullable=True)
    
    # Специфичные поля для feeding
    food_type = Column(String, nullable=True)
    quantity = Column(Float, nullable=True)
    
    # Связь с питомцем
    pet = relationship("Pet", back_populates="activity_records") 