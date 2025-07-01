from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user_in: UserCreate):
    hashed_password = pwd_context.hash(user_in.password)
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, identifier: str, password: str):
    # Try email first
    user = get_user_by_email(db, identifier)
    if not user:
        # Try username if not found by email
        user = get_user_by_username(db, identifier)
    if not user or not pwd_context.verify(password, user.hashed_password):
        return None
    return user

def delete_user_profile(db: Session, user_id: int):
    """
    Delete user profile and all associated data (pets, activity records)
    Returns True if successful, False if user not found
    """
    try:
        # Get the user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        # Delete the user (cascade will handle pets and activity records)
        db.delete(user)
        db.commit()
        return True
        
    except Exception as e:
        db.rollback()
        raise e

def get_user_by_id(db: Session, user_id: int):
    """Get user by ID"""
    return db.query(User).filter(User.id == user_id).first() 