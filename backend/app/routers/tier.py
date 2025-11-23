from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db import get_db
from app.routers.auth import get_current_active_user
from app.models.entities import UserORM
from app.services.quota_manager import check_quota, get_tier_config, TIER_DEFINITIONS


router = APIRouter(
    prefix="/tier",
    tags=["tier"]
)


class QuotaStatus(BaseModel):
    has_quota: bool
    remaining: int
    used: int | None = None
    max: int | None = None
    tier: str
    message: str


class TierInfo(BaseModel):
    current_tier: str
    tier_name: str
    features: dict
    quota_status: QuotaStatus


@router.get("/status", response_model=TierInfo)
async def get_tier_status(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user)
):
    """Get user's current tier and quota status."""
    tier = getattr(current_user, "subscription_tier", "free")
    tier_config = get_tier_config(tier)
    quota_status = check_quota(current_user, db)
    
    return TierInfo(
        current_tier=tier,
        tier_name=tier_config["name"],
        features=tier_config["features"],
        quota_status=QuotaStatus(**quota_status)
    )


@router.get("/plans")
async def get_tier_plans():
    """Get all available subscription plans."""
    return {
        "plans": [
            {
                "id": "free",
                "name": TIER_DEFINITIONS["free"]["name"],
                "price": 0,
                "features": TIER_DEFINITIONS["free"]["features"],
                "interviews_per_month": TIER_DEFINITIONS["free"]["interviews_per_month"],
            },
            {
                "id": "pro",
                "name": TIER_DEFINITIONS["pro"]["name"],
                "price_monthly": TIER_DEFINITIONS["pro"]["price_monthly"],
                "price_yearly": TIER_DEFINITIONS["pro"]["price_yearly"],
                "features": TIER_DEFINITIONS["pro"]["features"],
                "interviews_per_month": "无限",
            },
        ]
    }
