from sqlalchemy import Column, Integer, String, Float, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class Pet(Base):
    __tablename__ = "pets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    species = Column(String, nullable=False)
    breed = Column(String, nullable=True)
    birthdate = Column(Date, nullable=False)
    weight = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)

    owner = relationship("User", back_populates="pets")
    activity_records = relationship("ActivityRecord", back_populates="pet") 