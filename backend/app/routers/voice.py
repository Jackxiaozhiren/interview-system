from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import io

from app.db import get_db
from app.routers.auth import get_current_active_user
from app.models.entities import UserORM
from app.services.tts_service import generate_speech, RECOMMENDED_VOICES
from app.services.conversation_engine import generate_follow_up_question
from app.services.kimi_client import KimiThinkingClient
from app.models.interviewer_personality import list_personalities, get_voice_for_personality


router = APIRouter(
    prefix="/voice",
    tags=["voice"]
)


# Request/Response Models
class SpeakRequest(BaseModel):
    text: str
    voice: Optional[str] = "zh-CN-XiaoxiaoNeural"


class FollowUpRequest(BaseModel):
    original_question: str
    candidate_answer: str
    personality: str = "professional"


class FollowUpResponse(BaseModel):
    follow_up_question: str
    rationale: str


@router.post("/speak")
async def text_to_speech(
    request: SpeakRequest,
    current_user: UserORM = Depends(get_current_active_user)
):
    """
    Convert text to speech and return audio file.
    
    Returns audio/mpeg stream.
    """
    try:
        audio_data = generate_speech(request.text, request.voice)
        
        return StreamingResponse(
            io.BytesIO(audio_data),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=speech.mp3"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")


@router.post("/follow-up", response_model=FollowUpResponse)
async def generate_follow_up(
    request: FollowUpRequest,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user)
):
    """
    Generate a dynamic follow-up question based on the candidate's answer.
    """
    try:
        kimi_client = KimiThinkingClient()
        result = generate_follow_up_question(
            original_question=request.original_question,
            candidate_answer=request.candidate_answer,
            personality_id=request.personality,
            kimi_client=kimi_client
        )
        
        return FollowUpResponse(
            follow_up_question=result["follow_up_question"],
            rationale=result["rationale"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate follow-up: {str(e)}")


@router.get("/personalities")
async def get_personalities():
    """Get list of available interviewer personalities."""
    return list_personalities()


@router.get("/voices")
async def get_voices():
    """Get list of recommended voices for quick reference."""
    return {
        "recommended": RECOMMENDED_VOICES,
        "personalities": {
            "friendly": get_voice_for_personality("friendly", "zh"),
            "professional": get_voice_for_personality("professional", "zh"),
            "challenging": get_voice_for_personality("challenging", "zh")
        }
    }
