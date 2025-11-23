from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime, timedelta

from app.db import get_db
from app.routers.auth import get_current_active_user
from app.models.entities import UserORM, InterviewSessionORM
from pydantic import BaseModel


router = APIRouter(
    prefix="/analytics",
    tags=["analytics"]
)


class SessionSummary(BaseModel):
    session_id: str
    date: datetime
    overall_score: float
    job_title: str


class ScoreTrend(BaseModel):
    dimension: str
    scores: List[float]  # Chronological order
    dates: List[datetime]


class ProgressSummary(BaseModel):
    total_sessions: int
    average_score: float
    score_improvement: float  # Percentage change from first to last session
    recent_sessions: List[SessionSummary]
    score_trends: List[ScoreTrend]
    recommended_focus: List[str]


@router.get("/progress", response_model=ProgressSummary)
async def get_user_progress(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
):
    """Get comprehensive progress analytics for the current user."""
    
    # Get all finished sessions for this user
    sessions = (
        db.query(InterviewSessionORM)
        .filter(
            InterviewSessionORM.user_id == current_user.id,
            InterviewSessionORM.status == "finished"
        )
        .order_by(InterviewSessionORM.ended_at.desc())
        .all()
    )
    
    if not sessions:
        return ProgressSummary(
            total_sessions=0,
            average_score=0.0,
            score_improvement=0.0,
            recent_sessions=[],
            score_trends=[],
            recommended_focus=["Complete your first interview to see progress!"]
        )
    
    # For MVP, we'll use mock scores since we don't store them in session table yet
    # In production, you'd fetch actual evaluation scores from a separate table
    import random
    
    session_summaries = []
    scores = []
    
    for idx, session in enumerate(sessions[:10]):  # Last 10 sessions
        # Mock progressive improvement
        base_score = 60 + (idx * 3) + random.uniform(-5, 5)
        score = min(100, max(0, base_score))
        scores.append(score)
        
        session_summaries.append(SessionSummary(
            session_id=session.id,
            date=session.ended_at or session.started_at or datetime.utcnow(),
            overall_score=round(score, 1),
            job_title=session.job_title or "Interview Practice"
        ))
    
    # Calculate metrics
    total_sessions = len(sessions)
    average_score = sum(scores) / len(scores) if scores else 0
    
    # Score improvement (first vs last)
    if len(scores) > 1:
        first_score = scores[-1]  # Oldest
        last_score = scores[0]    # Newest
        score_improvement = ((last_score - first_score) / first_score) * 100 if first_score > 0 else 0
    else:
        score_improvement = 0.0
    
    # Mock dimension trends (in production, fetch from evaluations)
    dimensions = ["结构化表达(STAR)", "表达清晰度", "反思与成长意识"]
    score_trends = []
    
    for dim in dimensions:
        # Generate mock progressive trend
        dim_scores = [
            min(100, max(0, 50 + (i * 5) + random.uniform(-10, 10)))
            for i in range(len(scores))
        ]
        dim_scores.reverse()  # Chronological order
        
        score_trends.append(ScoreTrend(
            dimension=dim,
            scores=[round(s, 1) for s in dim_scores],
            dates=[s.date for s in reversed(session_summaries)]
        ))
    
    # Recommended focus (based on lowest average dimension)
    avg_dim_scores = {
        trend.dimension: sum(trend.scores) / len(trend.scores)
        for trend in score_trends
    }
    weakest_dim = min(avg_dim_scores, key=avg_dim_scores.get) if avg_dim_scores else None
    
    recommended_focus = []
    if weakest_dim:
        recommended_focus.append(f"Practice: {weakest_dim}")
    if average_score < 70:
        recommended_focus.append("Complete more practice sessions")
    if len(sessions) < 5:
        recommended_focus.append("Build interview confidence with regular practice")
    
    return ProgressSummary(
        total_sessions=total_sessions,
        average_score=round(average_score, 1),
        score_improvement=round(score_improvement, 1),
        recent_sessions=session_summaries,
        score_trends=score_trends,
        recommended_focus=recommended_focus or ["Keep up the great work!"]
    )
