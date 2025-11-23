from sqlalchemy.orm import Session
from app.models import entities
import uuid

BADGE_DEFINITIONS = [
    {"code": "first_steps", "name": "First Steps", "description": "Completed your first interview session", "icon": "🎤"},
    {"code": "on_fire", "name": "On Fire", "description": "Practiced for 3 days in a row", "icon": "🔥"},
    {"code": "sharpshooter", "name": "Sharpshooter", "description": "Scored 90+ in a session", "icon": "🎯"},
    {"code": "growth_mindset", "name": "Growth Mindset", "description": "Completed 5 practice sessions", "icon": "📈"},
]

def initialize_badge_definitions(db: Session):
    """
    Ensures all badge definitions exist in the system.
    In this simple implementation, we don't store definitions in DB, 
    but we could use this to seed initial data if we had a BadgeDefinition table.
    For now, this is a placeholder or can be used to seed the first user's badges if needed.
    """
    pass

def check_and_award_badge(user_id: str, badge_code: str, db: Session) -> bool:
    """
    Checks if user already has the badge, if not, awards it.
    Returns True if newly awarded.
    """
    existing = db.query(entities.BadgeORM).filter(
        entities.BadgeORM.user_id == user_id,
        entities.BadgeORM.badge_code == badge_code
    ).first()
    
    if not existing:
        new_badge = entities.BadgeORM(
            id=str(uuid.uuid4()),
            user_id=user_id,
            badge_code=badge_code
        )
        db.add(new_badge)
        db.commit()
        return True
    return False
