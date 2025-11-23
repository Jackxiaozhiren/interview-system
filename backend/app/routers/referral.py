from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db import get_db
from app.routers.auth import get_current_active_user
from app.models.entities import UserORM
from app.services.referral_system import (
    get_or_create_referral_code,
    get_referral_stats,
    track_referral,
    REFERRAL_REWARDS
)


router = APIRouter(
    prefix="/referral",
    tags=["referral"]
)


class ReferralStats(BaseModel):
    referral_code: str
    total_referrals: int
    successful_conversions: int
    rewards_earned: dict
    referral_url: str


class TrackReferralRequest(BaseModel):
    referral_code: str


@router.get("/my-code")
async def get_my_referral_code(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user)
):
    """Get or create user's referral code."""
    code = get_or_create_referral_code(current_user, db)
    return {
        "referral_code": code,
        "referral_url": f"https://interview.ai/register?ref={code}"
    }


@router.get("/stats", response_model=ReferralStats)
async def get_my_referral_stats(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user)
):
    """Get user's referral statistics and rewards."""
    stats = get_referral_stats(current_user, db)
    return ReferralStats(**stats)


@router.get("/rewards")
async def get_referral_rewards_config():
    """Get referral rewards configuration."""
    return {
        "rewards": REFERRAL_REWARDS,
        "description": {
            "inviter_signup": f"每邀请1人注册 → +{REFERRAL_REWARDS['inviter']['per_signup']}次免费面试",
            "inviter_purchase": "被邀请人购买会员 → 邀请人获得1个月专业版",
            "invitee_bonus": f"使用邀请码注册 → +{REFERRAL_REWARDS['invitee']['signup_bonus']}次免费面试"
        }
    }


@router.post("/track")
async def track_user_referral(
    request: TrackReferralRequest,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user)
):
    """
    Track a referral (call this when user registers with a referral code).
    """
    result = track_referral(current_user, request.referral_code, db)
    return result
