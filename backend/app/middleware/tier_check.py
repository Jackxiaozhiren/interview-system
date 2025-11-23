"""
Middleware for checking user tier and feature access.
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.services.quota_manager import (
    check_quota,
    check_feature_access,
    check_personality_access,
)
from app.models.entities import UserORM


def require_quota(user: UserORM, db: Session):
    """
    Middleware to check if user has remaining interview quota.
    Raises HTTPException if quota exceeded.
    """
    quota_status = check_quota(user, db)
    
    if not quota_status["has_quota"]:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": "quota_exceeded",
                "message": "本月面试次数已用完",
                "quota_status": quota_status,
                "upgrade_message": "升级到专业版享受无限次面试"
            }
        )


def require_feature(feature: str):
    """
    Decorator to check if user has access to a specific feature.
    
    Usage:
        @require_feature("voice_tts")
        def some_endpoint(...):
            ...
    """
    def decorator(user: UserORM):
        if not check_feature_access(user, feature):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "feature_not_available",
                    "message": f"此功能仅限专业版用户",
                    "feature": feature,
                    "upgrade_message": "升级到专业版解锁所有功能"
                }
            )
    return decorator


def require_personality(personality_id: str, user: UserORM):
    """
    Check if user can use a specific interviewer personality.
    """
    if not check_personality_access(user, personality_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "personality_locked",
                "message": f"此面试官风格仅限专业版用户",
                "personality": personality_id,
                "upgrade_message": "升级到专业版解锁所有面试官风格"
            }
        )
