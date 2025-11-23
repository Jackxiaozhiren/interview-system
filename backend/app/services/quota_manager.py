"""
Quota management system for freemium model.
"""
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import logging

from app.models.entities import UserORM
from app.db import get_db

logger = logging.getLogger(__name__)


# Tier definitions
TIER_DEFINITIONS = {
    "free": {
        "name": "免费版",
        "interviews_per_month": 3,
        "features": {
            "voice_tts": False,
            "answer_doctor": False,
            "video_download": False,
            "all_personalities": False,
            "advanced_analytics": False,
            "xp_multiplier": 1,
        },
        "personalities": ["professional"],  # Only professional interviewer
    },
    "pro": {
        "name": "专业版",
        "interviews_per_month": -1,  # Unlimited
        "features": {
            "voice_tts": True,
            "answer_doctor": True,
            "video_download": True,
            "all_personalities": True,
            "advanced_analytics": True,
            "xp_multiplier": 2,  # 2x XP
        },
        "personalities": ["friendly", "professional", "challenging"],
        "price_monthly": 99,  # CNY
        "price_yearly": 990,  # CNY (2 months free)
    },
}


def get_user_tier(user: UserORM) -> str:
    """
    Get user's subscription tier.
    
    For now, checks if user has an active subscription.
    In production, this would query a subscriptions table.
    """
    # TODO: Implement actual subscription checking
    # For MVP, default all to free
    return getattr(user, "subscription_tier", "free")


def get_tier_config(tier: str) -> dict:
    """Get tier configuration."""
    return TIER_DEFINITIONS.get(tier, TIER_DEFINITIONS["free"])


def check_quota(user: UserORM, db: Session) -> dict:
    """
    Check if user has remaining quota for interviews.
    
    Returns:
        dict with:
            - has_quota: bool
            - remaining: int
            - tier: str
            - message: str
    """
    tier = get_user_tier(user)
    tier_config = get_tier_config(tier)
    
    # Pro users have unlimited
    if tier == "pro":
        return {
            "has_quota": True,
            "remaining": -1,  # Unlimited
            "tier": "pro",
            "message": "无限次面试"
        }
    
    # Free users: count this month's interviews
    from app.models.entities import InterviewSessionORM
    
    # Get current month start
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    
    # Count sessions this month
    sessions_count = (
        db.query(InterviewSessionORM)
        .filter(
            InterviewSessionORM.user_id == user.id,
            InterviewSessionORM.created_at >= month_start
        )
        .count()
    )
    
    max_interviews = tier_config["interviews_per_month"]
    remaining = max(0, max_interviews - sessions_count)
    has_quota = remaining > 0
    
    return {
        "has_quota": has_quota,
        "remaining": remaining,
        "used": sessions_count,
        "max": max_interviews,
        "tier": "free",
        "message": f"本月剩余 {remaining}/{max_interviews} 次" if has_quota else "本月配额已用完"
    }


def check_feature_access(user: UserORM, feature: str) -> bool:
    """
    Check if user has access to a specific feature.
    
    Args:
        user: UserORM instance
        feature: Feature name (e.g., "voice_tts", "answer_doctor")
    
    Returns:
        bool: True if user has access
    """
    tier = get_user_tier(user)
    tier_config = get_tier_config(tier)
    return tier_config["features"].get(feature, False)


def check_personality_access(user: UserORM, personality_id: str) -> bool:
    """
    Check if user can use a specific interviewer personality.
    
    Args:
        user: UserORM instance
        personality_id: Personality ID (friendly, professional, challenging)
    
    Returns:
        bool: True if user has access
    """
    tier = get_user_tier(user)
    tier_config = get_tier_config(tier)
    return personality_id in tier_config["personalities"]


def get_xp_multiplier(user: UserORM) -> float:
    """Get user's XP multiplier based on tier."""
    tier = get_user_tier(user)
    tier_config = get_tier_config(tier)
    return tier_config["features"].get("xp_multiplier", 1.0)


def consume_quota(user: UserORM, db: Session) -> bool:
    """
    Consume one interview quota.
    
    For free tier, this is tracked by creating the interview session.
    For pro tier, always returns True.
    
    Returns:
        bool: True if quota consumed successfully
    """
    quota_status = check_quota(user, db)
    return quota_status["has_quota"]
