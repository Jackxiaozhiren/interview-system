from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import uuid

from app.db import get_db
from app.models import entities, schemas
from app.routers.auth import get_current_user

router = APIRouter()

# Badge Definitions (Hardcoded for now, could be in DB)
BADGES = {
    "first_steps": {"name": "First Steps", "description": "Completed your first interview session", "icon": "🎤"},
    "on_fire": {"name": "On Fire", "description": "Practiced for 3 days in a row", "icon": "🔥"},
    "sharpshooter": {"name": "Sharpshooter", "description": "Scored 90+ in a session", "icon": "🎯"},
    "growth_mindset": {"name": "Growth Mindset", "description": "Completed 5 practice sessions", "icon": "📈"},
}

LEVEL_THRESHOLDS = {
    1: 100,
    2: 300,
    3: 600,
    4: 1000,
    5: 1500
}

def get_next_level_xp(level: int) -> int:
    return LEVEL_THRESHOLDS.get(level, level * 500)

@router.get("/gamification/profile", response_model=schemas.GamificationProfile)
def get_gamification_profile(
    current_user: entities.UserORM = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure profile exists
    profile = db.query(entities.UserGamificationORM).filter(entities.UserGamificationORM.user_id == current_user.id).first()
    if not profile:
        profile = entities.UserGamificationORM(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            level=1,
            current_xp=0,
            current_streak=0
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    # Fetch Badges
    badges_orm = db.query(entities.BadgeORM).filter(entities.BadgeORM.user_id == current_user.id).all()
    badges = []
    for b in badges_orm:
        badge_def = BADGES.get(b.badge_code, {"name": "Unknown", "description": "", "icon": "❓"})
        badges.append(schemas.Badge(
            id=b.id,
            badge_code=b.badge_code,
            name=badge_def["name"],
            description=badge_def["description"],
            icon=badge_def["icon"],
            earned_at=b.earned_at
        ))

    # Fetch/Generate Daily Challenges
    today = datetime.utcnow().date()
    challenges_orm = db.query(entities.DailyChallengeORM).filter(
        entities.DailyChallengeORM.user_id == current_user.id,
        entities.DailyChallengeORM.created_at >= datetime.combine(today, datetime.min.time())
    ).all()

    if not challenges_orm:
        # Generate 3 daily challenges
        new_challenges = [
            entities.DailyChallengeORM(id=str(uuid.uuid4()), user_id=current_user.id, type="practice", description="Complete 1 Interview Session", xp_reward=50),
            entities.DailyChallengeORM(id=str(uuid.uuid4()), user_id=current_user.id, type="score", description="Score above 80 in any skill", xp_reward=30),
            entities.DailyChallengeORM(id=str(uuid.uuid4()), user_id=current_user.id, type="drill", description="Complete a Daily Drill", xp_reward=20),
        ]
        db.add_all(new_challenges)
        db.commit()
        challenges_orm = new_challenges

    challenges = [schemas.DailyChallenge(
        id=c.id,
        type=c.type,
        description=c.description,
        xp_reward=c.xp_reward,
        is_completed=bool(c.is_completed)
    ) for c in challenges_orm]

    return schemas.GamificationProfile(
        level=profile.level,
        current_xp=profile.current_xp,
        next_level_xp=get_next_level_xp(profile.level),
        current_streak=profile.current_streak,
        badges=badges,
        daily_challenges=challenges
    )

@router.post("/gamification/claim-challenge/{challenge_id}")
def claim_challenge(
    challenge_id: str,
    current_user: entities.UserORM = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    challenge = db.query(entities.DailyChallengeORM).filter(
        entities.DailyChallengeORM.id == challenge_id,
        entities.DailyChallengeORM.user_id == current_user.id
    ).first()

    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    if challenge.is_completed:
        return {"message": "Already claimed"}

    # Mark complete
    challenge.is_completed = 1
    
    # Award XP
    profile = db.query(entities.UserGamificationORM).filter(entities.UserGamificationORM.user_id == current_user.id).first()
    if profile:
        profile.current_xp += challenge.xp_reward
        # Check Level Up
        next_xp = get_next_level_xp(profile.level)
        if profile.current_xp >= next_xp:
            profile.level += 1
            # Carry over XP? Or reset? Let's keep cumulative for now but level thresholds increase
            # Actually, simpler RPG style: XP is cumulative total. Level is derived or stored.
            # Let's stick to: current_xp is total.
            pass
    
    db.commit()
    return {"message": "Challenge claimed", "xp_gained": challenge.xp_reward}

@router.post("/gamification/sync-progress")
def sync_progress(
    current_user: entities.UserORM = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Call this after an interview session to update streak and check badges.
    """
    profile = db.query(entities.UserGamificationORM).filter(entities.UserGamificationORM.user_id == current_user.id).first()
    if not profile:
        return {"message": "Profile created"} # Should be created by get_profile usually

    now = datetime.utcnow()
    today = now.date()
    
    # Streak Logic
    if profile.last_practice_date:
        last_date = profile.last_practice_date.date()
        if last_date == today - timedelta(days=1):
            profile.current_streak += 1
        elif last_date < today - timedelta(days=1):
            profile.current_streak = 1 # Reset if missed a day
        # If same day, do nothing
    else:
        profile.current_streak = 1
    
    profile.last_practice_date = now
    
    # Award XP for session
    profile.current_xp += 50 # Base XP for session
    
    # Check Badges
    new_badges = []
    
    # 1. First Steps
    has_first = db.query(entities.BadgeORM).filter(entities.BadgeORM.user_id == current_user.id, entities.BadgeORM.badge_code == "first_steps").first()
    if not has_first:
        b = entities.BadgeORM(id=str(uuid.uuid4()), user_id=current_user.id, badge_code="first_steps")
        db.add(b)
        new_badges.append("First Steps")
        
    # 2. On Fire (Streak >= 3)
    if profile.current_streak >= 3:
        has_fire = db.query(entities.BadgeORM).filter(entities.BadgeORM.user_id == current_user.id, entities.BadgeORM.badge_code == "on_fire").first()
        if not has_fire:
            b = entities.BadgeORM(id=str(uuid.uuid4()), user_id=current_user.id, badge_code="on_fire")
            db.add(b)
            new_badges.append("On Fire")

    db.commit()
    
    return {
        "streak": profile.current_streak,
        "xp_gained": 50,
        "new_badges": new_badges
    }
