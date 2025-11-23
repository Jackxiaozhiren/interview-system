"""
Referral system for tracking invitations and rewards.
"""
from sqlalchemy.orm import Session
from datetime import datetime
import secrets
import string

from app.models.entities import UserORM


def generate_referral_code() -> str:
    """Generate a unique 8-character referral code."""
    alphabet = string.ascii_uppercase + string.digits
    # Exclude confusing characters: 0, O, I, L
    alphabet = alphabet.replace('O', '').replace('I', '').replace('L', '').replace('0', '')
    return ''.join(secrets.choice(alphabet) for _ in range(8))


def get_or_create_referral_code(user: UserORM, db: Session) -> str:
    """
    Get user's referral code, or create one if doesn't exist.
    
    Args:
        user: UserORM instance
        db: Database session
    
    Returns:
        str: User's referral code
    """
    if user.referral_code:
        return user.referral_code
    
    # Generate unique code
    while True:
        code = generate_referral_code()
        # Check if code already exists
        existing = db.query(UserORM).filter(UserORM.referral_code == code).first()
        if not existing:
            user.referral_code = code
            db.commit()
            return code


def track_referral(referred_user: UserORM, referral_code: str, db: Session) -> dict:
    """
    Track a referral when a new user signs up with a referral code.
    
    Args:
        referred_user: The new user who was referred
        referral_code: The referral code used
        db: Database session
    
    Returns:
        dict with referrer info and rewards
    """
    # Find referrer by code
    referrer = db.query(UserORM).filter(UserORM.referral_code == referral_code).first()
    
    if not referrer:
        return {
            "success": False,
            "message": "Invalid referral code"
        }
    
    # Don't allow self-referral
    if referrer.id == referred_user.id:
        return {
            "success": False,
            "message": "Cannot refer yourself"
        }
    
    # TODO: Store referral relationship in a ReferralsORM table
    # For MVP, we'll just return success
    
    return {
        "success": True,
        "referrer_id": referrer.id,
        "referrer_name": referrer.full_name or referrer.email,
        "message": "Referral tracked successfully"
    }


def get_referral_stats(user: UserORM, db: Session) -> dict:
    """
    Get referral statistics for a user.
    
    Args:
        user: UserORM instance
        db: Database session
    
    Returns:
        dict with:
            - referral_code: User's code
            - total_referrals: Number of users referred
            - successful_conversions: Number who became paying customers
            - rewards_earned: Total rewards earned
    """
    if not user.referral_code:
        user.referral_code = get_or_create_referral_code(user, db)
    
    # TODO: Query actual referrals from ReferralsORM table
    # For MVP, return mock data
    
    return {
        "referral_code": user.referral_code,
        "total_referrals": 0,
        "successful_conversions": 0,
        "rewards_earned": {
            "bonus_interviews": 0,
            "pro_months": 0
        },
        "referral_url": f"https://interview.ai/register?ref={user.referral_code}"
    }


# Reward configuration
REFERRAL_REWARDS = {
    "inviter": {
        "per_signup": 2,  # +2 free interviews per signup
        "per_purchase": "1_month_pro"  # 1 month pro when invitee purchases
    },
    "invitee": {
        "signup_bonus": 1  # +1 free interview for using referral code
    }
}
