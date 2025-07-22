#!/usr/bin/env python3
"""
Тестовый скрипт для проверки новых функций аутентификации:
- Смена пароля
- Удаление аккаунта
"""

import requests
import json
import time
from typing import Optional

# Конфигурация
BASE_URL = "http://localhost:8000"
TEST_EMAIL = "test_user@example.com"
TEST_PASSWORD = "testpassword123"
NEW_PASSWORD = "newpassword123"

class AuthTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.user_id: Optional[int] = None
        
    def print_separator(self, title: str):
        print(f"\n{'='*50}")
        print(f" {title}")
        print(f"{'='*50}")
    
    def make_request(self, method: str, endpoint: str, data: dict = None, headers: dict = None) -> dict:
        """Выполнить HTTP запрос"""
        url = f"{self.base_url}{endpoint}"
        
        if headers is None:
            headers = {}
        
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = requests.delete(url, json=data, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            print(f"{method} {endpoint} - Status: {response.status_code}")
            
            if response.status_code >= 400:
                print(f"Error: {response.text}")
                return {"error": response.text, "status_code": response.status_code}
            
            return response.json() if response.content else {}
            
        except Exception as e:
            print(f"Request failed: {e}")
            return {"error": str(e)}
    
    def test_firebase_status(self):
        """Тест статуса Firebase"""
        self.print_separator("Firebase Status Test")
        result = self.make_request("GET", "/auth/firebase/status")
        print(f"Firebase Status: {json.dumps(result, indent=2)}")
        return result
    
    def test_register(self):
        """Тест регистрации пользователя"""
        self.print_separator("User Registration Test")
        
        register_data = {
            "username": "test_user",
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "full_name": "Test User"
        }
        
        result = self.make_request("POST", "/auth/register", register_data)
        print(f"Registration Result: {json.dumps(result, indent=2)}")
        
        if "access_token" in result:
            self.access_token = result["access_token"]
            self.refresh_token = result["refresh_token"]
            self.user_id = result["user"]["id"]
            print(f"✅ Registration successful. User ID: {self.user_id}")
            return True
        else:
            print("❌ Registration failed")
            return False
    
    def test_login(self):
        """Тест входа пользователя"""
        self.print_separator("User Login Test")
        
        login_data = {
            "username": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        # Используем form data для login
        url = f"{self.base_url}/auth/login"
        response = requests.post(url, data=login_data)
        
        print(f"POST /auth/login - Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            self.access_token = result["access_token"]
            self.refresh_token = result["refresh_token"]
            self.user_id = result["user"]["id"]
            print(f"✅ Login successful. User ID: {self.user_id}")
            return True
        else:
            print(f"❌ Login failed: {response.text}")
            return False
    
    def test_email_verification_status(self):
        """Тест проверки статуса верификации email"""
        self.print_separator("Email Verification Status Test")
        result = self.make_request("GET", f"/auth/verify-email-status/{TEST_EMAIL}")
        print(f"Email Verification Status: {json.dumps(result, indent=2)}")
        return result
    
    def test_change_password(self):
        """Тест смены пароля"""
        self.print_separator("Change Password Test")
        
        if not self.access_token:
            print("❌ No access token available. Please login first.")
            return False
        
        change_password_data = {
            "current_password": TEST_PASSWORD,
            "new_password": NEW_PASSWORD
        }
        
        result = self.make_request("POST", "/auth/change-password", change_password_data)
        print(f"Change Password Result: {json.dumps(result, indent=2)}")
        
        if "message" in result and "successfully" in result["message"]:
            print("✅ Password changed successfully")
            # Обновляем пароль для последующих тестов
            global TEST_PASSWORD
            TEST_PASSWORD = NEW_PASSWORD
            return True
        else:
            print("❌ Password change failed")
            return False
    
    def test_login_with_new_password(self):
        """Тест входа с новым паролем"""
        self.print_separator("Login with New Password Test")
        
        login_data = {
            "username": TEST_EMAIL,
            "password": NEW_PASSWORD
        }
        
        url = f"{self.base_url}/auth/login"
        response = requests.post(url, data=login_data)
        
        print(f"POST /auth/login - Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            self.access_token = result["access_token"]
            self.refresh_token = result["refresh_token"]
            print("✅ Login with new password successful")
            return True
        else:
            print(f"❌ Login with new password failed: {response.text}")
            return False
    
    def test_refresh_token(self):
        """Тест обновления токена"""
        self.print_separator("Refresh Token Test")
        
        if not self.refresh_token:
            print("❌ No refresh token available")
            return False
        
        refresh_data = {
            "refresh_token": self.refresh_token
        }
        
        result = self.make_request("POST", "/auth/refresh", refresh_data)
        print(f"Refresh Token Result: {json.dumps(result, indent=2)}")
        
        if "access_token" in result:
            self.access_token = result["access_token"]
            print("✅ Token refreshed successfully")
            return True
        else:
            print("❌ Token refresh failed")
            return False
    
    def test_resend_verification(self):
        """Тест повторной отправки верификации"""
        self.print_separator("Resend Verification Test")
        
        resend_data = {
            "password": NEW_PASSWORD
        }
        
        result = self.make_request("POST", f"/auth/resend-verification/{TEST_EMAIL}", resend_data)
        print(f"Resend Verification Result: {json.dumps(result, indent=2)}")
        return result
    
    def test_delete_account(self, confirm: bool = False):
        """Тест удаления аккаунта"""
        self.print_separator("Delete Account Test")
        
        if not self.access_token:
            print("❌ No access token available. Please login first.")
            return False
        
        delete_data = {
            "password": NEW_PASSWORD,
            "confirm_deletion": confirm
        }
        
        result = self.make_request("DELETE", "/auth/delete-account", delete_data)
        print(f"Delete Account Result: {json.dumps(result, indent=2)}")
        
        if "message" in result and "deleted successfully" in result["message"]:
            print("✅ Account deleted successfully")
            # Очищаем токены
            self.access_token = None
            self.refresh_token = None
            self.user_id = None
            return True
        else:
            print("❌ Account deletion failed or not confirmed")
            return False
    
    def run_all_tests(self):
        """Запуск всех тестов"""
        print("🚀 Starting Authentication Features Tests")
        
        # 1. Проверяем статус Firebase
        self.test_firebase_status()
        
        # 2. Регистрируем пользователя
        if not self.test_register():
            print("⚠️  Registration failed, trying login...")
            if not self.test_login():
                print("❌ Both registration and login failed. Exiting.")
                return
        
        # 3. Проверяем статус верификации email
        self.test_email_verification_status()
        
        # 4. Меняем пароль
        if self.test_change_password():
            # 5. Входим с новым паролем
            self.test_login_with_new_password()
            
            # 6. Обновляем токен
            self.test_refresh_token()
            
            # 7. Тестируем повторную отправку верификации
            self.test_resend_verification()
            
            # 8. Тестируем удаление аккаунта (без подтверждения)
            self.test_delete_account(confirm=False)
            
            # 9. Тестируем удаление аккаунта (с подтверждением)
            self.test_delete_account(confirm=True)
        
        print("\n🎉 All tests completed!")

def main():
    """Основная функция"""
    print("Vetly Authentication Features Test Suite")
    print("=" * 50)
    
    tester = AuthTester(BASE_URL)
    tester.run_all_tests()

if __name__ == "__main__":
    main() 