from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserLogin, UserRead, AuthResponse, RefreshTokenRequest, RefreshTokenResponse
from app.services import user_service
from app.services import refresh_token_service
from app.auth.jwt import create_access_token
from app.auth.deps import get_db, get_current_user
from app.models.user import User
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserRead, summary="Register", description="Register a new user.")
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = user_service.get_user_by_username(db, user_in.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    user = user_service.create_user(db, user_in)
    return user

@router.post("/login", response_model=AuthResponse, summary="Login", description="Login and get access/refresh tokens.")
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = user_service.authenticate_user(db, user_in.email, user_in.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    access_token = create_access_token({"sub": user.username})
    
    # Create refresh token
    refresh_token = refresh_token_service.create_user_refresh_token(
        db, user.id, device_id=None  # You can add device_id from request if needed
    )
    
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserRead(
            id=user.id,
            username=user.username,
            email=user.email,
            created_at=user.created_at
        )
    )

@router.post(
    "/refresh",
    response_model=RefreshTokenResponse,
    summary="Refresh JWT token",
    description="Exchange a valid refresh token for a new access token and refresh token."
)
def refresh_token(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Exchange refresh token for new access token"""
    # Validate refresh token
    token_record = refresh_token_service.validate_refresh_token(db, request.refresh_token)
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    # Get user
    user = user_service.get_user_by_id(db, token_record.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Create new access token
    new_access_token = create_access_token({"sub": user.username})
    
    # Enable refresh token rotation for better security
    # Revoke the old refresh token and create a new one
    refresh_token_service.revoke_refresh_token(db, request.refresh_token)
    new_refresh_token = refresh_token_service.create_user_refresh_token(
        db, user.id, device_id=token_record.device_id
    )
    
    return RefreshTokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token
    )

@router.post("/logout", summary="Logout", description="Logout and revoke refresh token.")
def logout(
    request: RefreshTokenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout and revoke refresh token"""
    refresh_token_service.revoke_refresh_token(db, request.refresh_token)
    return {"message": "Logged out successfully"}

@router.post("/logout-all", summary="Logout all", description="Logout from all devices - revoke all refresh tokens.")
def logout_all(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout from all devices - revoke all refresh tokens"""
    count = refresh_token_service.revoke_user_refresh_tokens(db, current_user.id)
    return {"message": f"Logged out from {count} devices"}

@router.get("/me", response_model=UserRead, summary="Get Current User Info", description="Get info about the current user.")
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/login/oauth2", summary="Login OAuth2", description="Login using OAuth2.")
def login_oauth2(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Try to find user by email or username
    user = user_service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        # Try email if username fails
        user = user_service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/cleanup-tokens", summary="Cleanup expired tokens", description="Clean up expired refresh tokens (admin endpoint)")
def cleanup_expired_tokens(db: Session = Depends(get_db)):
    """Clean up expired refresh tokens (admin endpoint)"""
    deleted_count = refresh_token_service.cleanup_expired_tokens(db)
    return {"message": f"Cleaned up {deleted_count} expired tokens"}

@router.delete("/delete-profile", summary="Delete profile", description="Delete user profile and all associated data (pets, activity records)")
def delete_profile(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Delete user profile and all associated data (pets, activity records)
    This action is irreversible and will permanently delete all user data.
    """
    try:
        # Revoke all refresh tokens before deleting profile
        refresh_token_service.revoke_user_refresh_tokens(db, current_user.id)
        
        success = user_service.delete_user_profile(db, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="User profile not found"
            )
        
        return {
            "message": "Profile deleted successfully",
            "deleted_user_id": current_user.id,
            "deleted_at": "now"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete profile: {str(e)}"
        ) 