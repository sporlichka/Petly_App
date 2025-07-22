from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.auth.jwt import hash_refresh_token
from app.models.refresh_token import RefreshToken
from typing import Optional, Dict, Any
import secrets

class UserService:
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_user_by_firebase_uid(db: Session, firebase_uid: str) -> Optional[User]:
        """Получение пользователя по Firebase UID"""
        return db.query(User).filter(User.firebase_uid == firebase_uid).first()

    @staticmethod
    def create_user(db: Session, user: UserCreate) -> User:
        hashed_password = UserService.hash_password(user.password)
        db_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password,
            full_name=user.full_name
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def create_user_with_firebase(db: Session, user: UserCreate, firebase_uid: str) -> User:
        """Создание пользователя с Firebase UID (для новых регистраций)"""
        hashed_password = UserService.hash_password(user.password)
        db_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password,
            firebase_uid=firebase_uid,
            full_name=user.full_name
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def create_firebase_user(db: Session, firebase_user: Dict[str, Any], username: Optional[str] = None, full_name: Optional[str] = None) -> User:
        """Создание пользователя из Firebase данных"""
        # Генерируем username если не предоставлен
        if not username:
            username = firebase_user["email"].split('@')[0]  # Используем часть email до @
            # Проверяем уникальность и добавляем суффикс если нужно
            base_username = username
            counter = 1
            while UserService.get_user_by_username(db, username):
                username = f"{base_username}{counter}"
                counter += 1

        # Используем full_name из Firebase если не предоставлен
        if not full_name and firebase_user.get("name"):
            full_name = firebase_user["name"]

        db_user = User(
            username=username,
            email=firebase_user["email"],
            firebase_uid=firebase_user["uid"],
            full_name=full_name,
            hashed_password=None  # Firebase пользователи не имеют пароля
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def update_firebase_user(db: Session, user: User, firebase_user: Dict[str, Any]) -> User:
        """Обновление данных пользователя из Firebase"""
        # Обновляем только те поля, которые могут измениться в Firebase
        if firebase_user.get("name") and firebase_user["name"] != user.full_name:
            user.full_name = firebase_user["name"]
        
        if firebase_user["email"] != user.email:
            user.email = firebase_user["email"]
        
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_or_create_firebase_user(db: Session, firebase_user: Dict[str, Any], username: Optional[str] = None, full_name: Optional[str] = None) -> User:
        """Получение существующего пользователя или создание нового из Firebase данных"""
        # Сначала ищем по Firebase UID
        user = UserService.get_user_by_firebase_uid(db, firebase_user["uid"])
        
        if user:
            # Обновляем данные пользователя из Firebase
            return UserService.update_firebase_user(db, user, firebase_user)
        else:
            # Создаем нового пользователя
            return UserService.create_firebase_user(db, firebase_user, username, full_name)

    @staticmethod
    def update_user(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
        user = UserService.get_user_by_id(db, user_id)
        if not user:
            return None
        
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        user = UserService.get_user_by_id(db, user_id)
        if not user:
            return False
        
        db.delete(user)
        db.commit()
        return True

    @staticmethod
    def hash_password(password: str) -> str:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def create_refresh_token(db: Session, user: User, device_id: Optional[str] = None) -> RefreshToken:
        """Создание refresh token для пользователя"""
        from app.auth.jwt import create_refresh_token, hash_refresh_token, get_refresh_token_expiry
        
        token = create_refresh_token()
        token_hash = hash_refresh_token(token)
        expires_at = get_refresh_token_expiry()
        
        db_token = RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            device_id=device_id
        )
        
        db.add(db_token)
        db.commit()
        db.refresh(db_token)
        
        # Возвращаем токен с хешем для дальнейшего использования
        db_token.token = token
        return db_token

    @staticmethod
    def change_password(db: Session, user: User, new_password: str) -> User:
        """Смена пароля пользователя"""
        hashed_password = UserService.hash_password(new_password)
        user.hashed_password = hashed_password
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def delete_all_refresh_tokens(db: Session, user_id: int) -> bool:
        """Удаление всех refresh токенов пользователя"""
        try:
            db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete()
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            print(f"Error deleting refresh tokens: {e}")
            return False

    @staticmethod
    def get_user_refresh_tokens(db: Session, user_id: int) -> list[RefreshToken]:
        """Получение всех refresh токенов пользователя"""
        return db.query(RefreshToken).filter(RefreshToken.user_id == user_id).all() 