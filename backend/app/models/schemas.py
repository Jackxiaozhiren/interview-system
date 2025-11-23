from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class Skill(BaseModel):
    name: str
    category: Optional[str] = None  # e.g., "Language", "Framework", "Tool"

class ProjectExperience(BaseModel):
    name: str
    role: str
    tech_stack: List[str]
    description: Optional[str] = None

class Education(BaseModel):
    degree: str
    major: str
    school: str
    year: Optional[str] = None

class ResumeAnalysis(BaseModel):
    skills: List[Skill]
    projects: List[ProjectExperience]
    education: List[Education]
    summary: str

class InterviewFocusArea(BaseModel):
    area: str
    reason: str
    difficulty_level: str  # "Junior", "Mid", "Senior"

class StoredResume(BaseModel):
    id: str
    filename: str
    text: str
    analysis: ResumeAnalysis
    created_at: datetime

class ResumeListItem(BaseModel):
    id: str
    filename: str
    created_at: datetime
    summary: str
    top_skills: List[str]

class ResumeAnalysisRequest(BaseModel):
    resume_text: str

class ResumeAnalysisResponse(BaseModel):
    analysis: ResumeAnalysis
    focus_areas: List[InterviewFocusArea]

class ResumeAdviceRequest(BaseModel):
    job_description: Optional[str] = None

class ResumeAdviceResponse(BaseModel):
    improvement_suggestions: List[str]
    competitiveness_level: str  # "Strong", "Medium", "Weak"
    competitiveness_reason: str

class MatchReportRequest(BaseModel):
    resume_text: str
    job_description: str

class MatchReport(BaseModel):
    score: float
    matching_keywords: List[str]
    missing_keywords: List[str]
    strengths: List[str]
    gaps: List[str]
    summary: str

class QuestionGenerationRequest(BaseModel):
    resume_text: str
    job_description: Optional[str] = None
    focus_area: Optional[str] = None

class InterviewQuestion(BaseModel):
    id: str
    content: str
    type: str  # "Technical", "Behavioral", "SystemDesign"
    difficulty: str
    expected_keywords: List[str]


class InterviewSessionBase(BaseModel):
    job_title: Optional[str] = None
    job_description: Optional[str] = None
    interviewer_type: Optional[str] = "HR"
    interviewer_persona: Optional[str] = "professional"
    duration_minutes: Optional[int] = 30


class InterviewSessionCreateRequest(InterviewSessionBase):
    user_id: Optional[str] = None


class InterviewSession(BaseModel):
    id: str
    status: str  # "created", "ongoing", "finished"
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    job_title: Optional[str] = None
    job_description: Optional[str] = None
    interviewer_type: Optional[str] = None
    interviewer_persona: Optional[str] = None
    duration_minutes: Optional[int] = None


class InterviewAnswerCreateRequest(BaseModel):
    question_id: Optional[str] = None
    answer_text: str


class InterviewAnswer(BaseModel):
    id: str
    session_id: str
    question_id: Optional[str] = None
    answer_text: str
    created_at: datetime


class InterviewCoachRequest(BaseModel):
    question: str


class ScoreDimension(BaseModel):
    name: str
    score: float
    comment: Optional[str] = None


class SuggestedTask(BaseModel):
    type: str
    focus: str
    suggested_duration_min: int


class TimelineEvent(BaseModel):
    timestamp: float
    type: str  # "strength", "gap", "neutral"
    message: str

class InterviewEvaluation(BaseModel):
    session_id: str
    feedback: str
    overall_score: Optional[float] = None
    score: Optional[float] = None
    dimensions: Optional[List[ScoreDimension]] = None
    strength_tags: Optional[List[str]] = None
    risk_tags: Optional[List[str]] = None
    suggested_next_tasks: Optional[List[SuggestedTask]] = None
    timeline_events: Optional[List[TimelineEvent]] = None


class InterviewMedia(BaseModel):
    id: str
    session_id: str
    media_type: str  # "audio" or "video"
    filename: str
    created_at: datetime


class MediaTranscript(BaseModel):
    media_id: str
    transcript: str


class AudioFeatures(BaseModel):
    speech_rate: Optional[float] = None
    pause_ratio: Optional[float] = None
    filler_word_ratio: Optional[float] = None
    pitch_variance: Optional[float] = None
    emotion: Optional[str] = None

class VideoFeatures(BaseModel):
    eye_contact_score: Optional[float] = None
    smile_ratio: Optional[float] = None
    posture_score: Optional[float] = None
    head_movement_score: Optional[float] = None
    dominant_emotion: Optional[str] = None
    emotion_distribution: Optional[Dict[str, float]] = None

class MediaEvaluation(BaseModel):
    media_id: str
    feedback: str
    audio_features: Optional[AudioFeatures] = None
    video_features: Optional[VideoFeatures] = None


class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    is_active: Optional[bool] = True
    is_verified: Optional[bool] = False


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class PaymentPackageBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: int
    currency: str = "CNY"
    features: Optional[str] = None


class PaymentPackage(PaymentPackageBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    package_id: str


class OrderCreate(OrderBase):
    pass


class Order(OrderBase):
    id: str
    user_id: str
    amount: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
    class Config:
        from_attributes = True


class Badge(BaseModel):
    id: str
    badge_code: str
    name: str
    description: str
    icon: str
    earned_at: datetime

    class Config:
        from_attributes = True


class DailyChallenge(BaseModel):
    id: str
    type: str
    description: str
    xp_reward: int
    is_completed: bool

    class Config:
        from_attributes = True


class GamificationProfile(BaseModel):
    level: int
    current_xp: int
    next_level_xp: int
    current_streak: int
    badges: List[Badge]
    daily_challenges: List[DailyChallenge]
