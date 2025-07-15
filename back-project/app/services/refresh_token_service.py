from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models.refresh_token import RefreshToken
from app.auth.jwt import create_refresh_token, hash_refresh_token, get_refresh_token_expiry, verify_refresh_token_hash

def create_user_refresh_token(db: Session, user_id: int, device_id: Optional[str] = None) -> str:
    """Create a new refresh token for a user."""
    # Generate new refresh token
    token = create_refresh_token()
    token_hash = hash_refresh_token(token)
    
    # Don't revoke existing tokens - allow multiple sessions
    # This allows refresh tokens to work properly across app restarts and multiple devices
    # If you need single-device login, enable token rotation in auth.py instead
    
    # Create new refresh token record
    db_refresh_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=get_refresh_token_expiry(),
        device_id=device_id
    )
    
    db.add(db_refresh_token)
    db.commit()
    db.refresh(db_refresh_token)
    
    return token

def validate_refresh_token(db: Session, token: str) -> Optional[RefreshToken]:
    """Validate a refresh token and return the token record if valid."""
    token_hash = hash_refresh_token(token)
    print(f"🔍 Looking for token hash: {token_hash[:10]}...")
    
    # Find the token in database
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.is_valid == True,
        RefreshToken.expires_at > datetime.utcnow()
    ).first()
    
    if not db_token:
        print(f"❌ Token not found in database or expired")
        return None
    
    # Verify token hash (double-check)
    if not verify_refresh_token_hash(token, db_token.token_hash):
        print(f"❌ Token hash verification failed")
        return None
    
    print(f"✅ Token validated successfully for user {db_token.user_id}")
    return db_token

def revoke_refresh_token(db: Session, token: str) -> bool:
    """Revoke a specific refresh token."""
    token_hash = hash_refresh_token(token)
    
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash
    ).first()
    
    if db_token:
        db_token.is_valid = False
        db.commit()
        return True
    
    return False

def revoke_user_refresh_tokens(db: Session, user_id: int) -> int:
    """Revoke all refresh tokens for a user."""
    updated_count = db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.is_valid == True
    ).update({"is_valid": False})
    
    db.commit()
    return updated_count

def cleanup_expired_tokens(db: Session) -> int:
    """Remove expired refresh tokens from database."""
    deleted_count = db.query(RefreshToken).filter(
        RefreshToken.expires_at < datetime.utcnow()
    ).delete()
    
    db.commit()
    return deleted_count

def get_user_active_tokens_count(db: Session, user_id: int) -> int:
    """Get count of active refresh tokens for a user."""
    return db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.is_valid == True,
        RefreshToken.expires_at > datetime.utcnow()
    ).count() 