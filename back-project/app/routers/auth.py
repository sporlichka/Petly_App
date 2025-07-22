from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.auth.deps import get_db, get_current_user
from app.auth.jwt import create_access_token, create_refresh_token, hash_refresh_token, get_refresh_token_expiry
from app.auth.firebase import (
    verify_firebase_token, get_firebase_user_by_uid, create_firebase_user, 
    send_email_verification_with_token, send_email_verification, check_email_verification, register_user_and_send_verification,
    change_password_with_token, delete_firebase_user_by_email
)
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.models.pet import Pet
from app.models.activity_record import ActivityRecord
from app.schemas.user import (
    UserCreate, User as UserSchema, 
    AuthResponse, RefreshTokenRequest, RefreshTokenResponse
)
from app.services.user_service import UserService
from app.services.refresh_token_service import validate_refresh_token
from app.services.pet_service import PetService
from app.services.activity_record_service import ActivityRecordService
from datetime import timedelta
from typing import Optional

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.get("/firebase/status")
def firebase_status():
    """Проверка статуса Firebase инициализации"""
    import os
    try:
        # Проверяем API ключ
        api_key = os.getenv("FIREBASE_API_KEY")
        api_key_status = "configured" if api_key else "missing"
        
        # Пытаемся получить информацию о Firebase проекте
        import firebase_admin
        from firebase_admin import auth
        
        # Проверяем, что Firebase инициализирован
        if not firebase_admin._apps:
            return {
                "status": "error", 
                "message": "Firebase not initialized",
                "api_key": api_key_status
            }
        
        # Пытаемся выполнить простую операцию
        # Это проверит, что credentials работают
        try:
            # Пытаемся получить список пользователей (ограничиваем до 1)
            users = auth.list_users(max_results=1)
            return {
                "status": "success", 
                "message": "Firebase initialized successfully",
                "project_id": firebase_admin._apps['[DEFAULT]'].project_id,
                "api_key": api_key_status
            }
        except Exception as e:
            return {
                "status": "warning", 
                "message": f"Firebase initialized but test failed: {str(e)}",
                "api_key": api_key_status
            }
            
    except Exception as e:
        return {
            "status": "error", 
            "message": f"Firebase error: {str(e)}",
            "api_key": api_key_status if 'api_key_status' in locals() else "unknown"
        }

@router.get("/verify-email-status/{email}")
def check_email_verification_status(email: str, db: Session = Depends(get_db)):
    """Проверка статуса верификации email"""
    try:
        # Проверяем, существует ли пользователь в нашей БД
        user = UserService.get_user_by_email(db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Если у пользователя нет firebase_uid, значит это старый пользователь
        if not user.firebase_uid:
            return {
                "email": email,
                "firebase_user": False,
                "email_verified": True,  # Старые пользователи считаются верифицированными
                "message": "Legacy user (no Firebase UID)"
            }
        
        # Проверяем верификацию в Firebase
        is_verified = check_email_verification(email)
        
        return {
            "email": email,
            "firebase_user": True,
            "email_verified": is_verified,
            "message": "Email verified" if is_verified else "Email not verified"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check email verification: {str(e)}"
        )

@router.post("/register", response_model=AuthResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Регистрация пользователя с созданием в Firebase и отправкой email верификации"""
    print(f"🔄 Registration attempt for email: {user.email}, username: {user.username}")
    
    # Проверяем, существует ли пользователь с таким email
    if UserService.get_user_by_email(db, user.email):
        print(f"❌ Email already registered: {user.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Проверяем, существует ли пользователь с таким username
    if UserService.get_user_by_username(db, user.username):
        print(f"❌ Username already taken: {user.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    try:
        print(f"🔥 Creating Firebase user for: {user.email}")
        # 1. Создаем пользователя в Firebase и отправляем верификационное письмо
        firebase_user = register_user_and_send_verification(user.email, user.password, user.username)
        print(f"✅ Firebase user created with UID: {firebase_user['uid']}")
        
        print(f"💾 Creating user in local DB for: {user.email}")
        # 2. Создаем пользователя в вашей БД с Firebase UID
        db_user = UserService.create_user_with_firebase(db, user, firebase_user["uid"])
        print(f"✅ User created in DB with ID: {db_user.id}")
        
        print(f"🔑 Creating tokens for user: {db_user.id}")
        # 3. Создаем токены
        access_token = create_access_token(data={"sub": db_user.username})
        refresh_token_record = UserService.create_refresh_token(db, db_user)
        print(f"✅ Registration completed successfully for: {user.email}")
        
        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token_record.token,
            user=UserSchema.from_orm(db_user)
        )
        
    except HTTPException:
        # Если Firebase создание не удалось, не создаем пользователя в БД
        print(f"❌ Firebase creation failed for: {user.email}")
        raise
    except Exception as e:
        print(f"❌ Registration failed for {user.email}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

class UserLoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login", response_model=AuthResponse)
def login(credentials: UserLoginRequest, db: Session = Depends(get_db)):
    """Вход с проверкой email верификации для новых пользователей"""
    # Ищем пользователя по email или username  
    user = UserService.get_user_by_email(db, credentials.email)
    if not user:
        user = UserService.get_user_by_username(db, credentials.email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Проверяем пароль
    if not UserService.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Для пользователей с Firebase UID проверяем верификацию email
    if user.firebase_uid:
        # Проверяем статус верификации в БД (обновляется миграцией для legacy users)
        if hasattr(user, 'email_verified') and not user.email_verified:
            # Дополнительно проверяем в Firebase на случай, если статус изменился
            is_verified = check_email_verification(user.email)
            if not is_verified:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Email not verified. Please check your email and click the verification link.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
    
    # Создаем токены
    access_token = create_access_token(data={"sub": user.username})
    refresh_token_record = UserService.create_refresh_token(db, user)
    
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token_record.token,
        user=UserSchema.from_orm(user)
    )

@router.post("/refresh", response_model=RefreshTokenResponse)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Обновление access token"""
    # Валидируем refresh token
    token_record = validate_refresh_token(db, request.refresh_token)
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Получаем пользователя
    user = UserService.get_user_by_id(db, token_record.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Создаем новый access token
    access_token = create_access_token(data={"sub": user.username})
    
    return RefreshTokenResponse(
        access_token=access_token,
        token_type="bearer"
    )

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class DeleteAccountRequest(BaseModel):
    password: str
    confirm_deletion: bool = False

class VerifyEmailRequest(BaseModel):
    token: str

@router.post("/check-verification")
def check_verification(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Проверка статуса верификации email для текущего пользователя"""
    try:
        # Если у пользователя нет firebase_uid, значит это старый пользователь
        if not current_user.firebase_uid:
            return {
                "email": current_user.email,
                "email_verified": True,  # Старые пользователи считаются верифицированными
                "verification_sent": False,
                "message": "Legacy user (no Firebase UID)"
            }
        
        # Проверяем верификацию в Firebase
        is_verified = check_email_verification(current_user.email)
        
        return {
            "email": current_user.email,
            "email_verified": is_verified,
            "verification_sent": True,  # Предполагаем, что письмо было отправлено при регистрации
            "message": "Email verified" if is_verified else "Email not verified"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check email verification: {str(e)}"
        )

@router.post("/resend-verification")
def resend_verification_email(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Повторная отправка email верификации для текущего пользователя"""
    try:
        # Если у пользователя нет firebase_uid, значит это старый пользователь
        if not current_user.firebase_uid:
            return {
                "success": True,
                "message": "Legacy user - no verification needed",
                "email": current_user.email
            }
        
        # Проверяем, не верифицирован ли уже email
        is_verified = check_email_verification(current_user.email)
        if is_verified:
            return {
                "success": True,
                "message": "Email already verified",
                "email": current_user.email
            }
        
        # Отправляем email верификации
        try:
            # Для повторной отправки используем Firebase Admin SDK
            import firebase_admin
            from firebase_admin import auth
            
            # Получаем пользователя из Firebase по email
            firebase_user = auth.get_user_by_email(current_user.email)
            
            # Отправляем email верификации
            auth.generate_email_verification_link(current_user.email)
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send verification email: {str(e)}"
            )
        
        return {
            "success": True,
            "message": "Verification email sent successfully",
            "email": current_user.email
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send verification email: {str(e)}"
        )

@router.post("/verify-email")
def verify_email_with_token(request: VerifyEmailRequest, db: Session = Depends(get_db)):
    """Верификация email по токену"""
    try:
        # Используем Firebase Admin SDK для верификации токена
        import firebase_admin
        from firebase_admin import auth
        
        # Верифицируем токен
        decoded_token = auth.verify_id_token(request.token)
        
        # Получаем email из токена
        email = decoded_token.get('email')
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token: no email found"
            )
        
        # Проверяем, существует ли пользователь в нашей БД
        user = UserService.get_user_by_email(db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Обновляем статус верификации в нашей БД
        user.email_verified = True
        db.commit()
        
        return {
            "success": True,
            "message": "Email verified successfully",
            "email": email,
            "email_verified": True
        }
        
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token"
        )
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify email: {str(e)}"
        )

@router.post("/resend-verification/{email}")
def resend_verification_email_with_email(email: str, db: Session = Depends(get_db)):
    """Повторная отправка email верификации по email (без пароля)"""
    try:
        # Проверяем, существует ли пользователь в нашей БД
        user = UserService.get_user_by_email(db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Если у пользователя нет firebase_uid, значит это старый пользователь
        if not user.firebase_uid:
            return {
                "success": True,
                "message": "Legacy user - no verification needed",
                "email": email
            }
        
        # Проверяем, не верифицирован ли уже email
        is_verified = check_email_verification(email)
        if is_verified:
            return {
                "success": True,
                "message": "Email already verified",
                "email": email
            }
        
        # Отправляем email верификации
        try:
            print(f"Attempting to send verification email to: {email}")
            send_email_verification(email)
            print(f"Verification email sent successfully to: {email}")
        except Exception as e:
            print(f"Error sending verification email to {email}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send verification email: {str(e)}"
            )
        
        return {
            "success": True,
            "message": "Verification email sent successfully",
            "email": email
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send verification email: {str(e)}"
        )

@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Смена пароля пользователя"""
    try:
        # Проверяем, что новый пароль отличается от текущего
        if request.current_password == request.new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from current password"
            )
        
        # Проверяем длину нового пароля
        if len(request.new_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be at least 6 characters long"
            )
        
        # Если у пользователя есть Firebase UID, меняем пароль в Firebase
        if current_user.firebase_uid:
            try:
                change_password_with_token(current_user.email, request.current_password, request.new_password)
            except HTTPException as e:
                # Если Firebase не удалось, возвращаем ошибку
                raise e
        
        # Меняем пароль в локальной БД
        UserService.change_password(db, current_user, request.new_password)
        
        # Удаляем все refresh токены пользователя для безопасности
        UserService.delete_all_refresh_tokens(db, current_user.id)
        
        return {
            "message": "Password changed successfully. Please log in again with your new password.",
            "user_id": current_user.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to change password: {str(e)}"
        )

@router.delete("/delete-account")
def delete_account(
    request: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Каскадное удаление пользователя и всех связанных данных"""
    try:
        # Проверяем подтверждение удаления
        if not request.confirm_deletion:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account deletion must be confirmed"
            )
        
        # Проверяем пароль пользователя
        if not UserService.verify_password(request.password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password"
            )
        
        # Начинаем транзакцию для каскадного удаления
        try:
            # 1. Удаляем все записи активности пользователя
            ActivityRecordService.delete_all_user_activities(db, current_user.id)
            
            # 2. Удаляем всех питомцев пользователя
            PetService.delete_all_user_pets(db, current_user.id)
            
            # 3. Удаляем все refresh токены пользователя
            UserService.delete_all_refresh_tokens(db, current_user.id)
            
            # 4. Если у пользователя есть Firebase UID, удаляем из Firebase
            if current_user.firebase_uid:
                try:
                    delete_firebase_user_by_email(current_user.email)
                except Exception as e:
                    # Логируем ошибку, но продолжаем удаление из локальной БД
                    print(f"Warning: Failed to delete Firebase user: {e}")
            
            # 5. Удаляем пользователя из локальной БД
            UserService.delete_user(db, current_user.id)
            
            return {
                "message": "Account and all associated data deleted successfully",
                "user_id": current_user.id,
                "email": current_user.email
            }
            
        except Exception as e:
            # Откатываем транзакцию при ошибке
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete account: {str(e)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete account: {str(e)}"
        ) 