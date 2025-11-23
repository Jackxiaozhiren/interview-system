from datetime import datetime

from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.db import Base


class InterviewSessionORM(Base):
    __tablename__ = "interview_sessions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # Link to User
    status = Column(String, index=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    job_title = Column(String, nullable=True)
    job_description = Column(Text, nullable=True)
    interviewer_type = Column(String, nullable=True)
    interviewer_persona = Column(String, default="professional")
    duration_minutes = Column(Integer, nullable=True)

    answers = relationship(
        "InterviewAnswerORM",
        back_populates="session",
        cascade="all, delete-orphan",
    )

    media_items = relationship(
        "InterviewMediaORM",
        back_populates="session",
        cascade="all, delete-orphan",
    )


class InterviewAnswerORM(Base):
    __tablename__ = "interview_answers"

    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("interview_sessions.id"), index=True, nullable=False)
    question_id = Column(String, nullable=True)
    answer_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("InterviewSessionORM", back_populates="answers")


class InterviewMediaORM(Base):
    __tablename__ = "interview_media"

    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("interview_sessions.id"), index=True, nullable=False)
    media_type = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    filepath = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("InterviewSessionORM", back_populates="media_items")


class UserORM(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Integer, default=1)  # 1 for active, 0 for inactive
    is_verified = Column(Integer, default=0) # 1 for verified, 0 for unverified
    verification_token = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Subscription & Tier (for freemium model)
    subscription_tier = Column(String, default="free")  # free, pro
    subscription_expires_at = Column(DateTime, nullable=True)
    referral_code = Column(String, nullable=True, unique=True)  # For referral system

    # Gamification relationships
    gamification = relationship("UserGamificationORM", back_populates="user", uselist=False)
    daily_challenges = relationship("DailyChallengeORM", back_populates="user")


class PaymentPackageORM(Base):
    __tablename__ = "payment_packages"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Integer, nullable=False)  # Price in cents or smallest unit
    currency = Column(String, default="CNY")
    features = Column(Text, nullable=True)  # JSON string or comma-separated
    created_at = Column(DateTime, default=datetime.utcnow)




class OrderORM(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    package_id = Column(String, ForeignKey("payment_packages.id"), nullable=False)
    amount = Column(Integer, nullable=False)
    status = Column(String, default="pending")  # pending, paid, failed
    payment_method = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserGamificationORM(Base):
    __tablename__ = "user_gamification"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    level = Column(Integer, default=1)
    current_xp = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    last_practice_date = Column(DateTime, nullable=True)
    
    user = relationship("UserORM", back_populates="gamification")


class BadgeORM(Base):
    __tablename__ = "badges"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    badge_code = Column(String, nullable=False) # e.g., "first_steps", "on_fire"
    earned_at = Column(DateTime, default=datetime.utcnow)


class DailyChallengeORM(Base):
    __tablename__ = "daily_challenges"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False) # e.g., "practice", "score"
    description = Column(String, nullable=False)
    xp_reward = Column(Integer, default=50)
    is_completed = Column(Integer, default=0) # 0 or 1
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("UserORM", back_populates="daily_challenges")


class CopilotConversationORM(Base):
    __tablename__ = "copilot_conversations"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    messages = Column(Text, nullable=False)  # JSON string of [{role, content, timestamp}]
    created_at = Column(DateTime, default=datetime.utcnow)


class SavedAnswerORM(Base):
    __tablename__ = "saved_answers"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    question = Column(String, nullable=False)
    answer = Column(Text, nullable=False)
    category = Column(String, nullable=True)  # behavioral, technical, etc.
    created_at = Column(DateTime, default=datetime.utcnow)

