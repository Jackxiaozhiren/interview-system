from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import uuid
import json
from datetime import datetime

from app.db import get_db
from app.routers.auth import get_current_active_user
from app.models.entities import UserORM, CopilotConversationORM, SavedAnswerORM, InterviewSessionORM
from app.services.copilot_service import (
    generate_chat_response,
    analyze_user_history,
    generate_answer_template,
    generate_practice_questions
)
from app.services.kimi_client import KimiThinkingClient

router = APIRouter(
    prefix="/copilot",
    tags=["copilot"]
)

# Initialize Kimi Client
try:
    kimi_client = KimiThinkingClient()
except Exception as e:
    print(f"Warning: Kimi Client failed to initialize: {e}")
    kimi_client = None


# Request/Response Models
class ChatMessage(BaseModel):
    role: str  # user or assistant
    content: str
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    conversation_id: str
    response: str
    suggestions: Optional[List[str]] = None


class SuggestionResponse(BaseModel):
    weak_areas: List[str]
    strong_areas: List[str]
    recommendations: List[str]


class AnswerDraftRequest(BaseModel):
    question: str
    context: Optional[str] = ""


class AnswerDraftResponse(BaseModel):
    template: str


class QuestionGenerateRequest(BaseModel):
    role: str
    company: Optional[str] = ""
    difficulty: Optional[str] = "medium"
    count: Optional[int] = 5


class SaveAnswerRequest(BaseModel):
    question: str
    answer: str
    category: Optional[str] = "behavioral"


class SavedAnswer(BaseModel):
    id: str
    question: str
    answer: str
    category: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/chat", response_model=ChatResponse)
async def chat_with_copilot(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user)
):
    """
    Chat with the AI interview copilot.
    """
    if not kimi_client:
        raise HTTPException(status_code=503, detail="AI Service unavailable")
    
    # Get or create conversation
    conversation_id = request.conversation_id
    if conversation_id:
        conversation = db.get(CopilotConversationORM, conversation_id)
        if not conversation or conversation.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Conversation not found")
        messages = json.loads(conversation.messages)
    else:
        conversation_id = str(uuid.uuid4())
        messages = []
    
    # Get user context (past sessions for personalization)
    user_sessions = db.query(InterviewSessionORM).filter(
        InterviewSessionORM.user_id == current_user.id,
        InterviewSessionORM.status == "finished"
    ).limit(5).all()
    
    # Simplified context (in production, fetch full evaluation data)
    user_context = {}
    if user_sessions:
        user_context = {"has_history": True}
    
    # Add user message to history
    messages.append({
        "role": "user",
        "content": request.message,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Generate AI response
    ai_response = generate_chat_response(
        user_message=request.message,
        conversation_history=messages[:-1],  # Exclude the just-added message
        user_context=user_context,
        kimi_client=kimi_client
    )
    
    # Add AI response to history
    messages.append({
        "role": "assistant",
        "content": ai_response,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Save conversation
    if request.conversation_id:
        conversation.messages = json.dumps(messages)
        db.add(conversation)
    else:
        conversation = CopilotConversationORM(
            id=conversation_id,
            user_id=current_user.id,
            messages=json.dumps(messages)
        )
        db.add(conversation)
    db.commit()
    
    return ChatResponse(
        conversation_id=conversation_id,
        response=ai_response
    )


@router.get("/suggestions", response_model=SuggestionResponse)
async def get_personalized_suggestions(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user)
):
    """
    Get personalized improvement suggestions based on past sessions.
    """
    # Fetch user's recent sessions
    sessions = db.query(InterviewSessionORM).filter(
        InterviewSessionORM.user_id == current_user.id,
        InterviewSessionORM.status == "finished"
    ).order_by(InterviewSessionORM.ended_at.desc()).limit(10).all()
    
    # In production, fetch full evaluation data for each session
    # For MVP, we'll use placeholder logic
    session_data = []
    for s in sessions:
        session_data.append({
            "id": s.id,
            "dimensions": []  # Would fetch from evaluation table
        })
    
    analysis = analyze_user_history(session_data)
    
    return SuggestionResponse(**analysis)


@router.post("/draft-answer", response_model=AnswerDraftResponse)
async def draft_answer(
    request: AnswerDraftRequest,
    current_user: UserORM = Depends(get_current_active_user)
):
    """
    Generate a STAR-method answer template for a question.
    """
    if not kimi_client:
        raise HTTPException(status_code=503, detail="AI Service unavailable")
    
    template = generate_answer_template(
        question=request.question,
        context=request.context,
        kimi_client=kimi_client
    )
    
    return AnswerDraftResponse(template=template)


@router.post("/generate-questions")
async def generate_questions(
    request: QuestionGenerateRequest,
    current_user: UserORM = Depends(get_current_active_user)
):
    """
    Generate custom practice questions.
    """
    questions = generate_practice_questions(
        role=request.role,
        company=request.company,
        difficulty=request.difficulty,
        count=request.count
    )
    
    return {"questions": questions}


@router.post("/answers", response_model=SavedAnswer)
async def save_answer(
    request: SaveAnswerRequest,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user)
):
    """
    Save an answer to the user's library.
    """
    answer_id = str(uuid.uuid4())
    saved_answer = SavedAnswerORM(
        id=answer_id,
        user_id=current_user.id,
        question=request.question,
        answer=request.answer,
        category=request.category
    )
    
    db.add(saved_answer)
    db.commit()
    db.refresh(saved_answer)
    
    return SavedAnswer(
        id=saved_answer.id,
        question=saved_answer.question,
        answer=saved_answer.answer,
        category=saved_answer.category or "behavioral",
        created_at=saved_answer.created_at
    )


@router.get("/answers", response_model=List[SavedAnswer])
async def get_saved_answers(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user)
):
    """
    Get user's saved answers.
    """
    query = db.query(SavedAnswerORM).filter(SavedAnswerORM.user_id == current_user.id)
    
    if category:
        query = query.filter(SavedAnswerORM.category == category)
    
    answers = query.order_by(SavedAnswerORM.created_at.desc()).all()
    
    return [
        SavedAnswer(
            id=a.id,
            question=a.question,
            answer=a.answer,
            category=a.category or "behavioral",
            created_at=a.created_at
        )
        for a in answers
    ]
