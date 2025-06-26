#!/usr/bin/env python3
"""
Тестовый скрипт для проверки API записей активности с JWT авторизацией
"""

import requests
import json
from datetime import datetime, timedelta

# Базовый URL API (измените на ваш)
BASE_URL = "http://localhost:8000"

def get_auth_token():
    """Получить JWT токен для авторизации"""
    login_data = {
        "email": "test@example.com",  # Измените на существующего пользователя
        "password": "testpassword"    # Измените на правильный пароль
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
        if response.status_code == 200:
            return response.json().get("access_token")
        else:
            print(f"❌ Ошибка авторизации: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
        return None

def test_activity_records_api():
    """Тестирование API записей активности с авторизацией"""
    
    print("=== Тестирование API записей активности с JWT авторизацией ===\n")
    
    # Получаем токен авторизации
    print("1. Получение JWT токена...")
    token = get_auth_token()
    if not token:
        print("❌ Не удалось получить токен авторизации. Проверьте данные пользователя.")
        return
    
    print("✅ Токен получен успешно")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Тестовые данные
    test_pet_id = 1  # Предполагаем, что у нас есть питомец с ID 1
    
    # 2. Создание записи кормления
    print("\n2. Создание записи кормления...")
    feeding_record = {
        "pet_id": test_pet_id,
        "category": "FEEDING",
        "title": "Утреннее кормление",
        "date": datetime.now().isoformat(),
        "time": datetime.now().isoformat(),
        "repeat": "daily",
        "notes": "Сухой корм для взрослых кошек",
        "food_type": "Сухой корм",
        "quantity": 50.0
    }
    
    try:
        response = requests.post(f"{BASE_URL}/records/", json=feeding_record, headers=headers)
        if response.status_code == 200:
            print("✅ Запись кормления создана успешно")
            feeding_id = response.json()["id"]
        else:
            print(f"❌ Ошибка создания записи кормления: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
        return
    
    # 3. Создание записи здоровья
    print("\n3. Создание записи здоровья...")
    health_record = {
        "pet_id": test_pet_id,
        "category": "HEALTH",
        "title": "Прививка от бешенства",
        "date": (datetime.now() + timedelta(days=30)).isoformat(),
        "time": datetime.now().isoformat(),
        "repeat": "yearly",
        "notes": "Следующая прививка через 1 год"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/records/", json=health_record, headers=headers)
        if response.status_code == 200:
            print("✅ Запись здоровья создана успешно")
            health_id = response.json()["id"]
        else:
            print(f"❌ Ошибка создания записи здоровья: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
    
    # 4. Создание записи активности
    print("\n4. Создание записи активности...")
    activity_record = {
        "pet_id": test_pet_id,
        "category": "ACTIVITY",
        "title": "Прогулка в парке",
        "date": datetime.now().isoformat(),
        "time": datetime.now().isoformat(),
        "repeat": "daily",
        "notes": "30 минут активной игры"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/records/", json=activity_record, headers=headers)
        if response.status_code == 200:
            print("✅ Запись активности создана успешно")
            activity_id = response.json()["id"]
        else:
            print(f"❌ Ошибка создания записи активности: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
    
    # 5. Получение всех записей для питомца
    print("\n5. Получение всех записей для питомца...")
    try:
        response = requests.get(f"{BASE_URL}/records/?pet_id={test_pet_id}", headers=headers)
        if response.status_code == 200:
            records = response.json()
            print(f"✅ Получено {len(records)} записей:")
            for record in records:
                print(f"  - {record['category']}: {record['title']}")
        else:
            print(f"❌ Ошибка получения записей: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
    
    # 6. Получение записей только кормления
    print("\n6. Получение записей только кормления...")
    try:
        response = requests.get(f"{BASE_URL}/records/?pet_id={test_pet_id}&category=FEEDING", headers=headers)
        if response.status_code == 200:
            records = response.json()
            print(f"✅ Получено {len(records)} записей кормления:")
            for record in records:
                print(f"  - {record['title']} ({record['food_type']}, {record['quantity']}г)")
        else:
            print(f"❌ Ошибка получения записей кормления: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
    
    # 7. Получение конкретной записи
    print(f"\n7. Получение записи кормления (ID: {feeding_id})...")
    try:
        response = requests.get(f"{BASE_URL}/records/{feeding_id}", headers=headers)
        if response.status_code == 200:
            record = response.json()
            print(f"✅ Запись получена: {record['title']}")
        else:
            print(f"❌ Ошибка получения записи: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
    
    # 8. Тест доступа к чужой записи (должен вернуть 403)
    print(f"\n8. Тест доступа к чужой записи (ожидается 403)...")
    try:
        response = requests.get(f"{BASE_URL}/records/999", headers=headers)  # Несуществующий ID
        if response.status_code == 403:
            print("✅ Правильно: доступ к чужой записи запрещен (403)")
        else:
            print(f"⚠️ Неожиданный статус: {response.status_code}")
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
    
    print("\n=== Тестирование завершено ===")

if __name__ == "__main__":
    test_activity_records_api() 