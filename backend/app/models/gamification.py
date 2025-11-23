"""
Gamification entities for user engagement and retention.
"""
from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db import Base


class UserGamificationORM(Base):
    """User gamification profile tracking XP, level, badges, and streaks."""
    __tablename__ = "user_gamification"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    level = Column(Integer, default=1, nullable=False)
    total_xp = Column(Integer, default=0, nullable=False)
    current_streak = Column(Integer, default=0, nullable=False)
    longest_streak = Column(Integer, default=0, nullable=False)
    last_practice_date = Column(DateTime, nullable=True)
    badges_earned = Column(JSON, default=list)  # List of badge IDs
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship
    user = relationship("UserORM", back_populates="gamification")


class BadgeDefinitionORM(Base):
    """Badge definitions with unlock criteria."""
    __tablename__ = "badge_definitions"

    id = Column(String, primary_key=True)  # e.g., "first_interview"
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    icon = Column(String, nullable=False)  # Emoji or icon identifier
    rarity = Column(String, default="common")  # common, rare, epic, legendary
    criteria = Column(JSON, nullable=False)  # Unlock conditions as JSON
    xp_reward = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class DailyChallengeORM(Base):
    """Daily challenges for users."""
    __tablename__ = "daily_challenges"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    challenge_type = Column(String, nullable=False)  # e.g., "practice_weak_dimension"
    description = Column(String, nullable=False)
    xp_reward = Column(Integer, default=30, nullable=False)
    completed = Column(Boolean, default=False, nullable=False)
    challenge_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("UserORM", back_populates="daily_challenges")
