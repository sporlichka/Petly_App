import os
import firebase_admin
import requests
from firebase_admin import credentials, auth
from typing import Optional, Dict, Any
from fastapi import HTTPException, status

# Инициализация Firebase Admin SDK
def initialize_firebase():
    """Инициализация Firebase Admin SDK"""
    try:
        # Проверяем, не инициализирован ли уже Firebase
        if not firebase_admin._apps:
            # Получаем путь к сервисному аккаунту из переменных окружения
            service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
            
            if service_account_path and os.path.exists(service_account_path):
                # Используем файл сервисного аккаунта
                cred = credentials.Certificate(service_account_path)
            else:
                # Используем переменные окружения для конфигурации
                firebase_config = {
                    "type": os.getenv("FIREBASE_TYPE"),
                    "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                    "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
                    "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
                    "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                    "client_id": os.getenv("FIREBASE_CLIENT_ID"),
                    "auth_uri": os.getenv("FIREBASE_AUTH_URI"),
                    "token_uri": os.getenv("FIREBASE_TOKEN_URI"),
                    "auth_provider_x509_cert_url": os.getenv("FIREBASE_AUTH_PROVIDER_X509_CERT_URL"),
                    "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_X509_CERT_URL")
                }
                cred = credentials.Certificate(firebase_config)
            
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully")
    except Exception as e:
        print(f"Error initializing Firebase Admin SDK: {e}")
        raise

def create_firebase_user(email: str, password: str, display_name: str = None) -> Dict[str, Any]:
    """
    Создание пользователя в Firebase
    
    Args:
        email: Email пользователя
        password: Пароль пользователя
        display_name: Отображаемое имя (опционально)
        
    Returns:
        Dict с данными созданного пользователя Firebase
    """
    try:
        user_record = auth.create_user(
            email=email,
            password=password,
            display_name=display_name,
            email_verified=False
        )
        return {
            "uid": user_record.uid,
            "email": user_record.email,
            "email_verified": user_record.email_verified,
            "display_name": user_record.display_name
        }
    except auth.EmailAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists in Firebase"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create Firebase user: {str(e)}"
        )

def register_user_and_send_verification(email: str, password: str, display_name: str = None) -> Dict[str, Any]:
    """
    Создание пользователя в Firebase и отправка верификационного письма
    
    Args:
        email: Email пользователя
        password: Пароль пользователя
        display_name: Отображаемое имя (опционально)
        
    Returns:
        Dict с данными созданного пользователя Firebase
    """
    try:
        # 1. Создаем пользователя в Firebase
        user = create_firebase_user(email, password, display_name)
        
        # 2. Отправляем верификационное письмо
        send_email_verification_with_token(email, password)
        
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register user and send verification: {str(e)}"
        )

def send_email_verification_with_token(email: str, password: str) -> bool:
    """
    Отправка email верификации через Firebase Auth REST API с получением ID токена
    
    Args:
        email: Email пользователя
        password: Пароль пользователя
        
    Returns:
        True если email отправлен успешно
    """
    try:
        # Получаем API Key из переменных окружения
        api_key = os.getenv("FIREBASE_API_KEY")
        
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Firebase API Key not configured"
            )
        
        # 1. Сначала получаем ID токен пользователя
        signin_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
        signin_payload = {
            "email": email,
            "password": password,
            "returnSecureToken": True
        }
        
        signin_response = requests.post(signin_url, json=signin_payload)
        
        if signin_response.status_code != 200:
            error_data = signin_response.json()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get ID token: {error_data.get('error', {}).get('message', 'Unknown error')}"
            )
        
        signin_data = signin_response.json()
        id_token = signin_data.get('idToken')
        
        if not id_token:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get ID token from Firebase"
            )
        
        # 2. Теперь отправляем email верификации с ID токеном
        verify_url = f"https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={api_key}"
        verify_payload = {
            "requestType": "VERIFY_EMAIL",
            "idToken": id_token
        }
        
        verify_response = requests.post(verify_url, json=verify_payload)
        
        if verify_response.status_code == 200:
            return True
        else:
            error_data = verify_response.json()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send verification email: {error_data.get('error', {}).get('message', 'Unknown error')}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send verification email: {str(e)}"
        )

def send_email_verification(email: str) -> bool:
    """
    Отправка email верификации через Firebase Auth REST API (старая версия для совместимости)
    
    Args:
        email: Email пользователя
        
    Returns:
        True если email отправлен успешно
    """
    try:
        # Получаем API Key из переменных окружения
        api_key = os.getenv("FIREBASE_API_KEY")
        
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Firebase API Key not configured"
            )
        
        # Используем Firebase Auth REST API для отправки email верификации
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={api_key}"
        
        payload = {
            "requestType": "VERIFY_EMAIL",
            "email": email
        }
        
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            return True
        else:
            error_data = response.json()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send verification email: {error_data.get('error', {}).get('message', 'Unknown error')}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send verification email: {str(e)}"
        )

def check_email_verification(email: str) -> bool:
    """
    Проверка верификации email
    
    Args:
        email: Email пользователя
        
    Returns:
        True если email верифицирован, False в противном случае
    """
    try:
        user_record = auth.get_user_by_email(email)
        return user_record.email_verified
    except auth.UserNotFoundError:
        return False
    except Exception as e:
        print(f"Error checking email verification: {e}")
        return False

def verify_firebase_token(id_token: str) -> Optional[Dict[str, Any]]:
    """
    Валидация Firebase ID token
    
    Args:
        id_token: Firebase ID token от клиента
        
    Returns:
        Dict с данными пользователя Firebase или None если токен недействителен
    """
    try:
        # Валидируем токен через Firebase Admin SDK
        decoded_token = auth.verify_id_token(id_token)
        
        # Возвращаем данные пользователя
        return {
            "uid": decoded_token.get("uid"),
            "email": decoded_token.get("email"),
            "email_verified": decoded_token.get("email_verified", False),
            "name": decoded_token.get("name"),
            "picture": decoded_token.get("picture"),
            "phone_number": decoded_token.get("phone_number")
        }
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase ID token"
        )
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Expired Firebase ID token"
        )
    except auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Revoked Firebase ID token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Firebase token verification failed: {str(e)}"
        )

def get_firebase_user_by_uid(uid: str) -> Optional[Dict[str, Any]]:
    """
    Получение информации о пользователе Firebase по UID
    
    Args:
        uid: Firebase UID пользователя
        
    Returns:
        Dict с данными пользователя или None если пользователь не найден
    """
    try:
        user_record = auth.get_user(uid)
        return {
            "uid": user_record.uid,
            "email": user_record.email,
            "email_verified": user_record.email_verified,
            "display_name": user_record.display_name,
            "photo_url": user_record.photo_url,
            "phone_number": user_record.phone_number,
            "disabled": user_record.disabled
        }
    except auth.UserNotFoundError:
        return None
    except Exception as e:
        print(f"Error getting Firebase user: {e}")
        return None

def change_firebase_password(uid: str, new_password: str) -> bool:
    """
    Смена пароля пользователя в Firebase
    
    Args:
        uid: Firebase UID пользователя
        new_password: Новый пароль
        
    Returns:
        True если пароль изменен успешно
    """
    try:
        auth.update_user(uid, password=new_password)
        return True
    except auth.UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Firebase user not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to change password: {str(e)}"
        )

def change_password_with_token(email: str, current_password: str, new_password: str) -> bool:
    """
    Смена пароля через Firebase Auth REST API с проверкой текущего пароля
    
    Args:
        email: Email пользователя
        current_password: Текущий пароль
        new_password: Новый пароль
        
    Returns:
        True если пароль изменен успешно
    """
    try:
        # Получаем API Key из переменных окружения
        api_key = os.getenv("FIREBASE_API_KEY")
        
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Firebase API Key not configured"
            )
        
        # 1. Сначала получаем ID токен пользователя с текущим паролем
        signin_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
        signin_payload = {
            "email": email,
            "password": current_password,
            "returnSecureToken": True
        }
        
        signin_response = requests.post(signin_url, json=signin_payload)
        
        if signin_response.status_code != 200:
            error_data = signin_response.json()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect"
            )
        
        signin_data = signin_response.json()
        id_token = signin_data.get('idToken')
        
        if not id_token:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get ID token from Firebase"
            )
        
        # 2. Теперь меняем пароль с ID токеном
        change_password_url = f"https://identitytoolkit.googleapis.com/v1/accounts:update?key={api_key}"
        change_password_payload = {
            "idToken": id_token,
            "password": new_password,
            "returnSecureToken": True
        }
        
        change_password_response = requests.post(change_password_url, json=change_password_payload)
        
        if change_password_response.status_code == 200:
            return True
        else:
            error_data = change_password_response.json()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to change password: {error_data.get('error', {}).get('message', 'Unknown error')}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to change password: {str(e)}"
        )

def delete_firebase_user(uid: str) -> bool:
    """
    Удаление пользователя из Firebase
    
    Args:
        uid: Firebase UID пользователя
        
    Returns:
        True если пользователь удален успешно
    """
    try:
        auth.delete_user(uid)
        return True
    except auth.UserNotFoundError:
        # Пользователь уже удален или не существует
        return True
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete Firebase user: {str(e)}"
        )

def delete_firebase_user_by_email(email: str) -> bool:
    """
    Удаление пользователя из Firebase по email
    
    Args:
        email: Email пользователя
        
    Returns:
        True если пользователь удален успешно
    """
    try:
        user_record = auth.get_user_by_email(email)
        return delete_firebase_user(user_record.uid)
    except auth.UserNotFoundError:
        # Пользователь уже удален или не существует
        return True
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete Firebase user: {str(e)}"
        )

# Инициализируем Firebase при импорте модуля
initialize_firebase() 