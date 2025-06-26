# API записей активности питомцев (с JWT авторизацией)

## Обзор

Универсальная система записей для управления активностью питомцев с JWT авторизацией. Все эндпоинты защищены и требуют валидный Bearer токен.

## Аутентификация

Все запросы к API должны содержать заголовок авторизации:

```
Authorization: Bearer <your_jwt_token>
```

### Получение токена

**POST** `/auth/login/`

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Ответ:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

## Модель данных

### ActivityRecord

```python
class ActivityRecord:
    id: int                    # Уникальный идентификатор
    pet_id: int               # ID питомца (внешний ключ)
    category: ActivityCategory # Категория записи
    title: str                # Заголовок записи
    date: datetime            # Дата
    time: datetime            # Время
    repeat: str               # Повторение (опционально)
    notes: str                # Заметки (опционально)
    food_type: str            # Тип корма (только для feeding)
    quantity: float           # Количество (только для feeding)
```

### Категории записей

- `feeding` - Кормление
- `health` - Здоровье
- `activity` - Активность

## API Endpoints

### 1. Создание записи

**POST** `/records/`

**Заголовки:** `Authorization: Bearer <token>`

```json
{
  "pet_id": 1,
  "category": "feeding",
  "title": "Утреннее кормление",
  "date": "2025-01-27T10:00:00",
  "time": "2025-01-27T10:00:00",
  "repeat": "daily",
  "notes": "Сухой корм для взрослых кошек",
  "food_type": "Сухой корм",
  "quantity": 50.0
}
```

**Ограничения:**
- Пользователь может создавать записи только для своих питомцев
- При попытке создать запись для чужого питомца возвращается 403

### 2. Получение записей

**GET** `/records/?pet_id=1&category=feeding`

**Заголовки:** `Authorization: Bearer <token>`

Параметры:
- `pet_id` (обязательный) - ID питомца
- `category` (опциональный) - Фильтр по категории
- `skip` (опциональный) - Количество записей для пропуска
- `limit` (опциональный) - Максимальное количество записей

**Ограничения:**
- Пользователь может получать записи только для своих питомцев
- Если питомец не принадлежит пользователю, возвращается пустой список

### 3. Получение конкретной записи

**GET** `/records/{record_id}`

**Заголовки:** `Authorization: Bearer <token>`

**Ограничения:**
- Пользователь может получить только записи своих питомцев
- При попытке доступа к чужой записи возвращается 403

### 4. Обновление записи

**PUT** `/records/{record_id}`

**Заголовки:** `Authorization: Bearer <token>`

```json
{
  "title": "Обновленный заголовок",
  "notes": "Обновленные заметки"
}
```

**Ограничения:**
- Пользователь может обновлять только записи своих питомцев
- При попытке обновить чужую запись возвращается 403

### 5. Удаление записи

**DELETE** `/records/{record_id}`

**Заголовки:** `Authorization: Bearer <token>`

**Ограничения:**
- Пользователь может удалять только записи своих питомцев
- При попытке удалить чужую запись возвращается 403

## Коды ответов

- `200` - Успешная операция
- `401` - Неавторизованный доступ (неверный или отсутствующий токен)
- `403` - Доступ запрещен (попытка доступа к чужим данным)
- `404` - Ресурс не найден
- `422` - Ошибка валидации данных

## Примеры использования

### Создание записи кормления

```python
import requests

# Получение токена
login_response = requests.post("http://localhost:8000/auth/login/", json={
    "email": "user@example.com",
    "password": "password"
})
token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Создание записи
feeding_record = {
    "pet_id": 1,
    "category": "feeding",
    "title": "Утреннее кормление",
    "date": "2025-01-27T10:00:00",
    "time": "2025-01-27T10:00:00",
    "repeat": "daily",
    "notes": "Сухой корм для взрослых кошек",
    "food_type": "Сухой корм",
    "quantity": 50.0
}

response = requests.post("http://localhost:8000/records/", json=feeding_record, headers=headers)
```

### Создание записи здоровья

```python
health_record = {
    "pet_id": 1,
    "category": "health",
    "title": "Прививка от бешенства",
    "date": "2025-02-27T14:00:00",
    "time": "2025-02-27T14:00:00",
    "repeat": "yearly",
    "notes": "Следующая прививка через 1 год"
}

response = requests.post("http://localhost:8000/records/", json=health_record, headers=headers)
```

### Создание записи активности

```python
activity_record = {
    "pet_id": 1,
    "category": "activity",
    "title": "Прогулка в парке",
    "date": "2025-01-27T16:00:00",
    "time": "2025-01-27T16:00:00",
    "repeat": "daily",
    "notes": "30 минут активной игры"
}

response = requests.post("http://localhost:8000/records/", json=activity_record, headers=headers)
```

### Получение всех записей кормления для питомца

```python
response = requests.get("http://localhost:8000/records/?pet_id=1&category=feeding", headers=headers)
records = response.json()
```

## Безопасность

### Проверки авторизации

1. **Создание записей:** Проверяется, что питомец принадлежит текущему пользователю
2. **Получение записей:** Фильтрация по владельцу питомца
3. **Обновление/удаление:** Проверка прав доступа к конкретной записи
4. **Все операции:** Валидация JWT токена

### Принципы безопасности

- Пользователи могут работать только со своими данными
- Все запросы требуют валидный JWT токен
- Автоматическая фильтрация по владельцу питомца
- Защита от несанкционированного доступа к чужим записям

## Миграция базы данных

Для применения изменений в базе данных выполните:

```bash
cd back-project
docker-compose run --rm backend alembic upgrade head
```

## Тестирование

Запустите тестовый скрипт:

```bash
cd back-project
python test_activity_records.py
```

**Примечание:** Перед запуском тестов убедитесь, что:
1. У вас есть тестовый пользователь в базе данных
2. У пользователя есть питомец с ID 1
3. Обновите данные пользователя в скрипте (`email` и `password`)

## Структура проекта

```
back-project/
├── app/
│   ├── models/
│   │   └── activity_record.py      # Модель ActivityRecord
│   ├── schemas/
│   │   └── activity_record.py      # Pydantic схемы
│   ├── services/
│   │   └── activity_record_service.py  # Бизнес-логика с проверками авторизации
│   ├── auth/
│   │   ├── deps.py                 # JWT зависимости
│   │   └── jwt.py                  # JWT утилиты
│   └── routers/
│       └── activity_records.py     # API маршруты с авторизацией
├── app/db/migrations/versions/
│   └── add_activity_records_table.py  # Миграция
└── test_activity_records.py        # Тестовый скрипт с JWT
``` 