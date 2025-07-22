# Activity Records API Documentation

## Overview
This document describes the API endpoints for managing activity records in the Vetly application.

## Base URL
```
http://localhost:8000
```

## Authentication
All endpoints require authentication using Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Endpoints

### Get All User Activity Records
```
GET /records/all-user-pets
```

Get all activity records for all pets belonging to the authenticated user.

**Query Parameters:**
- `category` (optional): Filter by activity category
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records to return (default: 1000, max: 1000)

**Response:**
```json
[
  {
    "id": 1,
    "pet_id": 1,
    "category": "feeding",
    "title": "Morning feeding",
    "date": "2024-01-15",
    "time": "08:00:00",
    "notify": true,
    "notes": "Regular feeding",
    "food_type": "dry_food",
    "quantity": 100,
    "duration": null,
    "repeat_type": "none",
    "repeat_interval": null,
    "repeat_end_date": null,
    "repeat_count": null,
    "created_at": "2024-01-15T08:00:00Z",
    "updated_at": "2024-01-15T08:00:00Z"
  }
]
```

### Get Activity Records by Date
```
GET /records/by-date?date=2024-01-15
```

Get activity records for a specific date for all pets belonging to the authenticated user.

**Query Parameters:**
- `date` (required): Date in YYYY-MM-DD format
- `category` (optional): Filter by activity category

**Response:** Same as above

### Get Activity Records by Date Range
```
GET /records/by-date-range?start_date=2024-01-01&end_date=2024-01-31
```

Get activity records within a date range for all pets belonging to the authenticated user.

**Query Parameters:**
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (required): End date in YYYY-MM-DD format
- `category` (optional): Filter by activity category
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records to return (default: 1000, max: 1000)

**Response:** Same as above

### Create Activity Record
```
POST /records/
```

Create a new activity record.

**Request Body:**
```json
{
  "pet_id": 1,
  "category": "feeding",
  "title": "Morning feeding",
  "date": "2024-01-15",
  "time": "08:00:00",
  "notify": true,
  "notes": "Regular feeding",
  "food_type": "dry_food",
  "quantity": 100,
  "duration": null,
  "repeat_type": "none",
  "repeat_interval": null,
  "repeat_end_date": null,
  "repeat_count": null
}
```

**Response:** Created activity record

### Get Activity Records by Pet
```
GET /records/?pet_id=1
```

Get activity records for a specific pet.

**Query Parameters:**
- `pet_id` (required): ID of the pet
- `category` (optional): Filter by activity category
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records to return (default: 100, max: 1000)

**Response:** Same as above

### Disable All Notifications
```
PATCH /records/disable-all-notifications
```

Disable notifications for all activities belonging to the authenticated user.

**Response:**
```json
{
  "message": "All notifications disabled successfully"
}
```

### Get Activity Record by ID
```
GET /records/{record_id}
```

Get a specific activity record by ID.

**Path Parameters:**
- `record_id` (required): ID of the activity record

**Response:** Single activity record

### Update Activity Record
```
PATCH /records/{record_id}
```

Partially update an activity record.

**Path Parameters:**
- `record_id` (required): ID of the activity record

**Request Body:** Partial update with any fields from the create request

**Response:** Updated activity record

### Delete Activity Record
```
DELETE /records/{record_id}
```

Delete an activity record.

**Path Parameters:**
- `record_id` (required): ID of the activity record

**Response:**
```json
{
  "message": "Запись успешно удалена"
}
```

## Activity Categories
- `feeding`: Feeding activities
- `walking`: Walking activities
- `grooming`: Grooming activities
- `medical`: Medical activities
- `training`: Training activities
- `care`: General care activities

## Food Types
- `dry_food`: Dry food
- `wet_food`: Wet food
- `treats`: Treats
- `supplements`: Supplements
- `water`: Water
- `other`: Other food types

## Repeat Types
- `none`: No repetition
- `daily`: Daily repetition
- `weekly`: Weekly repetition
- `monthly`: Monthly repetition
- `custom`: Custom repetition

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Start date must be before or equal to end date"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Access denied or record not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

# Authentication API Documentation

## Overview
This document describes the authentication API endpoints for the Vetly application.

## Base URL
```
http://localhost:8000
```

## Endpoints

### Firebase Status Check
```
GET /auth/firebase/status
```

Check the status of Firebase initialization.

**Response:**
```json
{
  "status": "success",
  "message": "Firebase initialized successfully",
  "project_id": "your-project-id"
}
```

### Check Email Verification Status
```
GET /auth/verify-email-status/{email}
```

Check if a user's email is verified.

**Path Parameters:**
- `email` (required): Email address to check

**Response:**
```json
{
  "email": "user@example.com",
  "firebase_user": true,
  "email_verified": true,
  "message": "Email verified"
}
```

### Register User
```
POST /auth/register
```

Register a new user with Firebase integration and email verification.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "refresh_token_here",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "is_active": true,
    "firebase_uid": "firebase_uid_here"
  }
}
```

### Login User
```
POST /auth/login
```

Login with username/email and password.

**Request Body (form data):**
```
username: johndoe
password: securepassword
```

**Response:** Same as register response

### Refresh Token
```
POST /auth/refresh
```

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "refresh_token_here"
}
```

**Response:**
```json
{
  "access_token": "new_access_token_here",
  "token_type": "bearer"
}
```

### Resend Verification Email
```
POST /auth/resend-verification/{email}
```

Resend email verification for a user.

**Path Parameters:**
- `email` (required): Email address

**Request Body:**
```json
{
  "password": "user_password"
}
```

**Response:**
```json
{
  "message": "Verification email sent successfully",
  "email": "user@example.com"
}
```

### Change Password
```
POST /auth/change-password
```

Change user password (requires authentication).

**Request Body:**
```json
{
  "current_password": "old_password",
  "new_password": "new_secure_password"
}
```

**Response:**
```json
{
  "message": "Password changed successfully. Please log in again with your new password.",
  "user_id": 1
}
```

### Delete Account
```
DELETE /auth/delete-account
```

Permanently delete user account and all associated data (requires authentication).

**Request Body:**
```json
{
  "password": "user_password",
  "confirm_deletion": true
}
```

**Response:**
```json
{
  "message": "Account and all associated data deleted successfully",
  "user_id": 1,
  "email": "user@example.com"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "New password must be different from current password"
}
```

### 401 Unauthorized
```json
{
  "detail": "Incorrect password"
}
```

### 404 Not Found
```json
{
  "detail": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Failed to change password"
}
```

## Security Notes

1. **Password Requirements:**
   - Minimum 6 characters
   - Must be different from current password

2. **Account Deletion:**
   - Requires password confirmation
   - Requires explicit confirmation flag
   - Permanently deletes all user data including:
     - User profile
     - All pets
     - All activity records
     - All refresh tokens
     - Firebase user account

3. **Token Management:**
   - Access tokens expire and need refresh
   - Refresh tokens are invalidated on password change
   - All refresh tokens are deleted on account deletion

4. **Firebase Integration:**
   - New users are created in both local DB and Firebase
   - Email verification is handled through Firebase
   - Password changes are synchronized with Firebase
   - Account deletion removes data from both systems 