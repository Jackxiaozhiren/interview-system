from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from pydantic import ValidationError
import json
import os
from typing import List, Dict
from datetime import datetime
import uuid
from sqlalchemy.orm import Session

# Import our core modules
from core.llm import KimiThinkingClient
from app.db import get_db
from app.models.schemas import (
    ResumeAnalysisResponse,
    InterviewQuestion,
    QuestionGenerationRequest,
    ResumeAnalysisRequest,
    StoredResume,
    ResumeListItem,
    ResumeAdviceRequest,
    ResumeAdviceResponse,
    MatchReport,
    MatchReportRequest,
    InterviewSession,
    InterviewSessionCreateRequest,
    InterviewAnswerCreateRequest,
    InterviewAnswer,
    InterviewCoachRequest,
    ScoreDimension,
    SuggestedTask,
    InterviewEvaluation,
    InterviewMedia,
    MediaTranscript,
    MediaTranscript,
    MediaEvaluation,
    TimelineEvent,
)
from app.services.resume_parser import extract_text_from_upload
from app.services.asr_service import transcribe_media_file
from app.services.agents import (
    analyze_resume_agent,
    generate_questions_agent,
    resume_advice_agent,
    interview_report_agent,
    coach_agent,
    media_report_agent,
)
from app.services.multimodal_analysis import analyze_audio
from app.models.entities import InterviewSessionORM, InterviewAnswerORM, InterviewMediaORM
from app.services.metrics_logger import log_session_report_metrics, log_media_report_metrics

router = APIRouter(
    prefix="/interview",
    tags=["interview"]
)

RESUME_STORE: Dict[str, StoredResume] = {}
SESSION_STORE: Dict[str, InterviewSession] = {}
SESSION_ANSWERS: Dict[str, List[InterviewAnswer]] = {}

MEDIA_ROOT = os.getenv("INTERVIEW_MEDIA_ROOT", "media")

# Initialize Kimi Client
try:
    kimi_client = KimiThinkingClient()
except Exception as e:
    print(f"Warning: Kimi Client failed to initialize: {e}")
    kimi_client = None

@router.post("/analyze-resume", response_model=ResumeAnalysisResponse)
async def analyze_resume_endpoint(request: ResumeAnalysisRequest):
    """
    Analyze a resume text and return structured data + focus areas.
    """
    if not kimi_client:
        raise HTTPException(status_code=503, detail="AI Service unavailable")

    try:
        return analyze_resume_agent(kimi_client, request.resume_text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except ValidationError as e:
        raise HTTPException(status_code=500, detail=f"AI response schema validation failed: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-questions", response_model=List[InterviewQuestion])
async def generate_questions(request: QuestionGenerationRequest):
    """
    Generate interview questions based on resume and focus area.
    """
    if not kimi_client:
        raise HTTPException(status_code=503, detail="AI Service unavailable")

    try:
        return generate_questions_agent(kimi_client, request)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except ValidationError as e:
        raise HTTPException(status_code=500, detail=f"AI response schema validation failed: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-resume", response_model=StoredResume)
async def upload_resume(file: UploadFile = File(...)):
    """Upload a resume file (PDF/DOCX/Image), extract text, analyze it and store the result."""
    if not kimi_client:
        raise HTTPException(status_code=503, detail="AI Service unavailable")

    try:
        text = await extract_text_from_upload(file)
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract any text from the file.")

        # Reuse existing analyze endpoint logic
        analysis_response = await analyze_resume_endpoint(
            ResumeAnalysisRequest(resume_text=text)
        )

        resume_id = str(uuid.uuid4())
        stored = StoredResume(
            id=resume_id,
            filename=file.filename or "resume",
            text=text,
            analysis=analysis_response.analysis,
            created_at=datetime.utcnow(),
        )
        RESUME_STORE[resume_id] = stored
        return stored

    except HTTPException:
        raise
    except RuntimeError as e:
        # Typically from OCR not available
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-resume-text")
async def upload_resume_text(file: UploadFile = File(...)):
    try:
        text = await extract_text_from_upload(file)
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract any text from the file.")
        return {"text": text}
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/resumes", response_model=List[ResumeListItem])
async def list_resumes():
    """List stored resumes with brief summary and top skills."""
    items: List[ResumeListItem] = []
    for resume in RESUME_STORE.values():
        top_skills = [s.name for s in resume.analysis.skills][:5] if resume.analysis.skills else []
        items.append(
            ResumeListItem(
                id=resume.id,
                filename=resume.filename,
                created_at=resume.created_at,
                summary=resume.analysis.summary,
                top_skills=top_skills,
            )
        )

    items.sort(key=lambda x: x.created_at, reverse=True)
    return items


@router.get("/resumes/{resume_id}", response_model=StoredResume)
async def get_resume(resume_id: str):
    """Get full stored resume with analysis by id."""
    stored = RESUME_STORE.get(resume_id)
    if not stored:
        raise HTTPException(status_code=404, detail="Resume not found")
    return stored


@router.post("/resumes/{resume_id}/advice", response_model=ResumeAdviceResponse)
async def resume_advice(resume_id: str, body: ResumeAdviceRequest):
    """Generate resume improvement suggestions and competitiveness assessment for a stored resume."""
    if not kimi_client:
        raise HTTPException(status_code=503, detail="AI Service unavailable")

    stored = RESUME_STORE.get(resume_id)
    if not stored:
        raise HTTPException(status_code=404, detail="Resume not found")

    jd_text = body.job_description or (
        "No specific job description provided. Evaluate the candidate for general software engineering roles."
    )

    try:
        return resume_advice_agent(kimi_client, stored.text, jd_text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response for advice")
    except ValidationError as e:
        raise HTTPException(status_code=500, detail=f"AI advice schema validation failed: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/resumes/{resume_id}/match-report", response_model=MatchReport)
async def generate_match_report(resume_id: str, body: MatchReportRequest):
    """Generate a gap analysis report between the resume and a specific job description."""
    if not kimi_client:
        raise HTTPException(status_code=503, detail="AI Service unavailable")

    stored = RESUME_STORE.get(resume_id)
    if not stored:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Use the resume text from the store, but allow the user to provide the JD
    try:
        from app.services.agents import match_report_agent
        return match_report_agent(kimi_client, stored.text, body.job_description)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response for match report")
    except ValidationError as e:
        raise HTTPException(status_code=500, detail=f"AI match report schema validation failed: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from app.routers.auth import get_current_active_user
from app.models.entities import UserORM

@router.post("/sessions", response_model=InterviewSession)
async def create_interview_session(
    body: InterviewSessionCreateRequest,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
) -> InterviewSession:
    """Create a new interview session. This is a lightweight, in-memory implementation for MVP."""
    session_id = str(uuid.uuid4())
    db_obj = InterviewSessionORM(
        id=session_id,
        user_id=current_user.id,
        status="created",
        started_at=None,
        ended_at=None,
        job_title=body.job_title,
        job_description=body.job_description,
        interviewer_type=body.interviewer_type,
        interviewer_persona=body.interviewer_persona,
        duration_minutes=body.duration_minutes,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    return InterviewSession(
        id=db_obj.id,
        status=db_obj.status,
        started_at=db_obj.started_at,
        ended_at=db_obj.ended_at,
        job_title=db_obj.job_title,
        job_description=db_obj.job_description,
        interviewer_type=db_obj.interviewer_type,
        interviewer_persona=db_obj.interviewer_persona,
        duration_minutes=db_obj.duration_minutes,
    )


@router.post("/sessions/{session_id}/start", response_model=InterviewSession)
async def start_interview_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
) -> InterviewSession:
    """Mark an existing interview session as started."""
    session_obj = db.get(InterviewSessionORM, session_id)
    if not session_obj:
        raise HTTPException(status_code=404, detail="Interview session not found")
    if session_obj.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this session")

    if session_obj.status == "finished":
        raise HTTPException(status_code=400, detail="Interview session already finished")

    if not session_obj.started_at:
        session_obj.started_at = datetime.utcnow()
    session_obj.status = "ongoing"
    db.add(session_obj)
    db.commit()
    db.refresh(session_obj)

    return InterviewSession(
        id=session_obj.id,
        status=session_obj.status,
        started_at=session_obj.started_at,
        ended_at=session_obj.ended_at,
        job_title=session_obj.job_title,
        job_description=session_obj.job_description,
        interviewer_type=session_obj.interviewer_type,
        duration_minutes=session_obj.duration_minutes,
    )


@router.post("/sessions/{session_id}/end", response_model=InterviewSession)
async def end_interview_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
) -> InterviewSession:
    """Mark an existing interview session as finished."""
    session_obj = db.get(InterviewSessionORM, session_id)
    if not session_obj:
        raise HTTPException(status_code=404, detail="Interview session not found")
    if session_obj.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this session")

    if session_obj.status == "finished":
        return InterviewSession(
            id=session_obj.id,
            status=session_obj.status,
            started_at=session_obj.started_at,
            ended_at=session_obj.ended_at,
            job_title=session_obj.job_title,
            job_description=session_obj.job_description,
            interviewer_type=session_obj.interviewer_type,
            duration_minutes=session_obj.duration_minutes,
        )

    session_obj.status = "finished"
    if not session_obj.ended_at:
        session_obj.ended_at = datetime.utcnow()
    db.add(session_obj)
    db.commit()
    db.refresh(session_obj)

    return InterviewSession(
        id=session_obj.id,
        status=session_obj.status,
        started_at=session_obj.started_at,
        ended_at=session_obj.ended_at,
        job_title=session_obj.job_title,
        job_description=session_obj.job_description,
        interviewer_type=session_obj.interviewer_type,
        duration_minutes=session_obj.duration_minutes,
    )


@router.post("/sessions/{session_id}/answers", response_model=InterviewAnswer)
async def add_interview_answer(
    session_id: str,
    body: InterviewAnswerCreateRequest,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
) -> InterviewAnswer:
    """Attach an answer to a given interview session. For now we only store plain text answers."""
    session_obj = db.get(InterviewSessionORM, session_id)
    if not session_obj:
        raise HTTPException(status_code=404, detail="Interview session not found")
    if session_obj.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this session")

    if session_obj.status not in {"ongoing", "created"}:
        raise HTTPException(status_code=400, detail="Cannot add answers to a finished session")

    answer_id = str(uuid.uuid4())
    db_obj = InterviewAnswerORM(
        id=answer_id,
        session_id=session_id,
        question_id=body.question_id,
        answer_text=body.answer_text,
        created_at=datetime.utcnow(),
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    return InterviewAnswer(
        id=db_obj.id,
        session_id=db_obj.session_id,
        question_id=db_obj.question_id,
        answer_text=db_obj.answer_text,
        created_at=db_obj.created_at,
    )


@router.post("/sessions/{session_id}/media", response_model=InterviewMedia)
async def upload_session_media(
    session_id: str,
    media_type: str = "audio",
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
) -> InterviewMedia:
    session_obj = db.get(InterviewSessionORM, session_id)
    if not session_obj:
        raise HTTPException(status_code=404, detail="Interview session not found")
    if session_obj.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this session")

    os.makedirs(MEDIA_ROOT, exist_ok=True)

    original_name = file.filename or "uploaded_media"
    _, ext = os.path.splitext(original_name)
    media_id = str(uuid.uuid4())
    safe_name = f"{session_id}_{media_id}{ext}"
    path = os.path.join(MEDIA_ROOT, safe_name)

    data = await file.read()
    try:
        with open(path, "wb") as f:
            f.write(data)
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"Failed to save media file: {e}")

    db_obj = InterviewMediaORM(
        id=media_id,
        session_id=session_id,
        media_type=media_type,
        filename=original_name,
        filepath=path,
        created_at=datetime.utcnow(),
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    return InterviewMedia(
        id=db_obj.id,
        session_id=db_obj.session_id,
        media_type=db_obj.media_type,
        filename=db_obj.filename,
        created_at=db_obj.created_at,
    )


@router.get("/sessions/{session_id}/media", response_model=List[InterviewMedia])
async def list_session_media(
    session_id: str,
    db: Session = Depends(get_db),
) -> List[InterviewMedia]:
    session_obj = db.get(InterviewSessionORM, session_id)
    if not session_obj:
        raise HTTPException(status_code=404, detail="Interview session not found")

    media_rows = (
        db.query(InterviewMediaORM)
        .filter(InterviewMediaORM.session_id == session_id)
        .order_by(InterviewMediaORM.created_at.asc())
        .all()
    )

    return [
        InterviewMedia(
            id=m.id,
            session_id=m.session_id,
            media_type=m.media_type,
            filename=m.filename,
            created_at=m.created_at,
        )
        for m in media_rows
    ]


@router.post("/media/{media_id}/transcribe", response_model=MediaTranscript)
async def transcribe_media_placeholder(
    media_id: str,
    db: Session = Depends(get_db),
) -> MediaTranscript:
    """Placeholder transcription endpoint for uploaded media.

    This does NOT run real ASR yet. It simply returns a stub transcript string
    based on the stored media metadata so that downstream pipelines and
    frontends can be wired first.
    """
    media_obj = db.get(InterviewMediaORM, media_id)
    if not media_obj:
        raise HTTPException(status_code=404, detail="Media not found")

    transcript_text = transcribe_media_file(
        filepath=media_obj.filepath,
        media_type=media_obj.media_type,
        filename=media_obj.filename,
    )

    return MediaTranscript(media_id=media_obj.id, transcript=transcript_text)


@router.post("/media/{media_id}/report", response_model=MediaEvaluation)
async def media_report_placeholder(
    media_id: str,
    db: Session = Depends(get_db),
) -> MediaEvaluation:
    media_obj = db.get(InterviewMediaORM, media_id)
    if not media_obj:
        raise HTTPException(status_code=404, detail="Media not found")

    # Use the ASR abstraction to obtain transcript text
    transcript_text = transcribe_media_file(
        filepath=media_obj.filepath,
        media_type=media_obj.media_type,
        filename=media_obj.filename,
    )

    # Derive multimodal features
    audio_features = None
    video_features = None

    if media_obj.media_type == "audio":
        audio_features = analyze_audio(media_obj.filepath, transcript_text)
    elif media_obj.media_type == "video":
        # For video, we extract both audio (from video file) and visual features
        audio_features = analyze_audio(media_obj.filepath, transcript_text)
        # Run video analysis (this might be slow, ideally should be async background task)
        # For MVP, we run it synchronously but with a low sample rate
        from app.services.video_analysis import analyze_video
        video_features = analyze_video(media_obj.filepath, sample_rate=1)

    if not kimi_client:
        feedback_text = (
            "[Stub Report] AI feedback service is unavailable. "
            "This is a placeholder report based on media metadata only."
        )
    else:
        feedback_text = media_report_agent(
            kimi_client,
            transcript_text,
            audio_features=audio_features,
            video_features=video_features,
        )

    evaluation = MediaEvaluation(
        media_id=media_obj.id,
        feedback=feedback_text,
        audio_features=audio_features,
        video_features=video_features,
    )

    # Best-effort metrics logging for offline multimodal analysis.
    try:
        session_obj = db.get(InterviewSessionORM, media_obj.session_id)
        log_media_report_metrics(
            user_id=getattr(session_obj, "user_id", None) if session_obj else None,
            session_id=media_obj.session_id,
            media_id=media_obj.id,
            media_type=media_obj.media_type,
            audio_features=audio_features.model_dump() if audio_features is not None else None,  # type: ignore[union-attr]
            video_features=video_features.model_dump() if video_features is not None else None,  # type: ignore[union-attr]
        )
    except Exception as e:  # pragma: no cover - metrics must never break core logic
        print(f"[metrics] failed to log media report: {e}")

    return evaluation


@router.get("/sessions", response_model=List[InterviewSession])
async def list_interview_sessions(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
) -> List[InterviewSession]:
    """List interview sessions (most recent first)."""
    sessions = (
        db.query(InterviewSessionORM)
        .filter(InterviewSessionORM.user_id == current_user.id)
        .order_by(InterviewSessionORM.started_at.desc().nullslast())
        .all()
    )

    return [
        InterviewSession(
            id=s.id,
            status=s.status,
            started_at=s.started_at,
            ended_at=s.ended_at,
            job_title=s.job_title,
            job_description=s.job_description,
            interviewer_type=s.interviewer_type,
            duration_minutes=s.duration_minutes,
        )
        for s in sessions
    ]


@router.get("/sessions/{session_id}", response_model=InterviewSession)
async def get_interview_session(
    session_id: str,
    db: Session = Depends(get_db),
) -> InterviewSession:
    """Fetch a single interview session by id."""
    session_obj = db.get(InterviewSessionORM, session_id)
    if not session_obj:
        raise HTTPException(status_code=404, detail="Interview session not found")

    return InterviewSession(
        id=session_obj.id,
        status=session_obj.status,
        started_at=session_obj.started_at,
        ended_at=session_obj.ended_at,
        job_title=session_obj.job_title,
        job_description=session_obj.job_description,
        interviewer_type=session_obj.interviewer_type,
        duration_minutes=session_obj.duration_minutes,
    )


@router.get("/sessions/{session_id}/report", response_model=InterviewEvaluation)
async def get_interview_report(
    session_id: str,
    db: Session = Depends(get_db),
) -> InterviewEvaluation:
    """Generate a structured interview feedback summary for a session.

    Uses the Kimi client for rich free-form feedback when available and augments it
    with lightweight heuristic scoring (overall score, dimensions, tags, tasks).
    """
    session_obj = db.get(InterviewSessionORM, session_id)
    if not session_obj:
        raise HTTPException(status_code=404, detail="Interview session not found")

    answers = (
        db.query(InterviewAnswerORM)
        .filter(InterviewAnswerORM.session_id == session_id)
        .order_by(InterviewAnswerORM.created_at.asc())
        .all()
    )
    if not answers:
        raise HTTPException(status_code=400, detail="No answers recorded for this session")

    interview_log_lines: List[str] = []
    answer_texts: List[str] = []
    for idx, ans in enumerate(answers, start=1):
        interview_log_lines.append(f"Q{idx}: (question_id={ans.question_id or 'N/A'})")
        interview_log_lines.append(f"A{idx}: {ans.answer_text}")
        answer_texts.append(ans.answer_text)

    interview_log = "\n".join(interview_log_lines)

    if not kimi_client:
        feedback_text = (
            "AI feedback service is currently unavailable. This is a placeholder "
            "summary generated without detailed evaluation."
        )
    else:
        feedback_text = interview_report_agent(kimi_client, interview_log)

    # Lightweight heuristic scoring from the text-only interview log
    full_text = " ".join(answer_texts).strip()
    full_lower = full_text.lower()
    total_words = len(full_text.split()) if full_text else 0

    dimensions: List[ScoreDimension] = []
    strength_tags: List[str] = []
    risk_tags: List[str] = []
    suggested_tasks: List[SuggestedTask] = []

    def keyword_coverage(keywords: List[str]) -> float:
        if not keywords or not full_lower:
            return 0.0
        hits = 0
        for kw in keywords:
            if kw.lower() in full_lower:
                hits += 1
        return hits / len(keywords)

    # 1) 结构化表达（近似 STAR 模型覆盖度）
    s_cov = keyword_coverage(["情境", "背景", "situation", "context"])
    t_cov = keyword_coverage(["任务", "目标", "task"])
    a_cov = keyword_coverage(["我负责", "采取", "实现", "action", "did"])
    r_cov = keyword_coverage(["结果", "最终", "impact", "result"])

    if any(v > 0 for v in (s_cov, t_cov, a_cov, r_cov)):
        star_score = float(round(((s_cov + t_cov + a_cov + r_cov) / 4.0) * 100.0, 1))
    else:
        star_score = 0.0

    if full_text:
        star_comment_parts: List[str] = []
        if r_cov < 0.4:
            star_comment_parts.append("多补充结果与影响，更像真实面试回答。")
        if a_cov < 0.4:
            star_comment_parts.append("多强调你具体做了什么，而不是团队做了什么。")
        star_comment = " ".join(star_comment_parts) or "整体结构基本清晰，可以继续用 STAR 模型优化表达。"
        dimensions.append(
            ScoreDimension(
                name="结构化表达（STAR）",
                score=star_score,
                comment=star_comment,
            )
        )

    # 2) 表达清晰度（回答长度 + 口头禅占比）
    filler_keywords = ["呃", "嗯", "就是", "那个", "然后", "um", "uh", "like", "you know"]
    filler_count = 0
    if full_text:
        for kw in filler_keywords:
            filler_count += full_text.count(kw)
    filler_ratio = (filler_count / total_words) if total_words > 0 else 0.0

    clarity_score = 100.0
    avg_answer_len = (total_words / len(answers)) if answers else 0.0
    if avg_answer_len > 220:
        clarity_score -= 15
    elif avg_answer_len > 150:
        clarity_score -= 8
    if filler_ratio > 0.05:
        clarity_score -= 15
    elif filler_ratio > 0.02:
        clarity_score -= 8
    clarity_score = float(max(0.0, min(100.0, clarity_score)))

    if full_text:
        clarity_comment_parts: List[str] = []
        if avg_answer_len > 220:
            clarity_comment_parts.append("回答略偏长，可以先给结论再展开细节。")
        if filler_ratio > 0.03:
            clarity_comment_parts.append("口头禅略多，可以先写下关键点再开口作答。")
        clarity_comment = " ".join(clarity_comment_parts) or "整体表达清晰度不错，可以保持当前节奏。"
        dimensions.append(
            ScoreDimension(
                name="表达清晰度",
                score=clarity_score,
                comment=clarity_comment,
            )
        )

    # 3) 反思与成长意识（是否提到复盘/学到什么）
    reflection_keywords = ["反思", "复盘", "总结", "我学到", "lesson", "learned"]
    reflection_cov = keyword_coverage(reflection_keywords)
    reflection_score = float(round(reflection_cov * 100.0, 1))

    if full_text:
        if reflection_score < 60.0:
            reflection_comment = "可以在回答结尾多补一句‘这次经历让我学到…’，体现反思能力。"
        else:
            reflection_comment = "有一定反思意识，可以继续保持用复盘思路讲故事。"
        dimensions.append(
            ScoreDimension(
                name="反思与成长意识",
                score=reflection_score,
                comment=reflection_comment,
            )
        )

    overall_score = None
    if dimensions:
        overall_score = float(round(sum(d.score for d in dimensions) / len(dimensions), 1))

        for dim in dimensions:
            if dim.score >= 75.0:
                strength_tags.append(dim.name)
            elif dim.score <= 50.0:
                risk_tags.append(dim.name)

        # Build 1-2 concrete follow-up practice tasks based on weakest dimensions
        sorted_dims = sorted(dimensions, key=lambda d: d.score)
        for dim in sorted_dims[:2]:
            if dim.score >= 70.0:
                continue
            focus_name = dim.name
            if "结构化" in dim.name:
                focus_name = "结构化表达（STAR）"
            elif "表达清晰度" in dim.name:
                focus_name = "口头表达与节奏"
            elif "反思" in dim.name:
                focus_name = "复盘与反思能力"
            suggested_tasks.append(
                SuggestedTask(
                    type="practice_session",
                    focus=focus_name,
                    suggested_duration_min=20,
                )
            )

    # Mock Timeline Events (for MVP demonstration)
    # In a real system, these would come from the multimodal analysis mapped to timestamps
    timeline_events: List[TimelineEvent] = []
    if full_text:
        import random
        # Generate 3-5 random events
        event_types = ["strength", "gap"]
        messages = {
            "strength": ["Good eye contact here", "Clear STAR structure", "Confident tone", "Relevant keyword used"],
            "gap": ["Too many filler words", "Spoke too fast", "Avoid looking away", "Answer too vague"]
        }
        
        # Assume a 5-minute interview (300s) for mock purposes
        for _ in range(random.randint(3, 5)):
            etype = random.choice(event_types)
            timeline_events.append(
                TimelineEvent(
                    timestamp=random.uniform(10.0, 120.0), # Random time in first 2 mins
                    type=etype,
                    message=random.choice(messages[etype])
                )
            )
        timeline_events.sort(key=lambda x: x.timestamp)

    evaluation = InterviewEvaluation(
        session_id=session_id,
        feedback=feedback_text,
        overall_score=overall_score,
        score=overall_score,
        dimensions=dimensions or None,
        strength_tags=strength_tags or None,
        risk_tags=risk_tags or None,
        suggested_next_tasks=suggested_tasks or None,
        timeline_events=timeline_events or None,
    )

    # Best-effort metrics logging for offline analysis. Any failure here must not
    # affect the main API behaviour.
    try:
        diagnostics = {
            "total_words": total_words,
            "avg_answer_len": avg_answer_len,
            "filler_ratio": filler_ratio,
            "reflection_score": reflection_score,
        }
        log_session_report_metrics(
            user_id=getattr(session_obj, "user_id", None),
            session_id=session_id,
            evaluation=evaluation.model_dump(),
            diagnostics=diagnostics,
        )
    except Exception as e:  # pragma: no cover - metrics must never break core logic
        print(f"[metrics] failed to log session report: {e}")

    return evaluation


@router.post("/answers/{answer_id}/refine")
async def refine_answer_endpoint(
    answer_id: str,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
):
    """Refine a specific answer using AI."""
    if not kimi_client:
        raise HTTPException(status_code=503, detail="AI Service unavailable")

    answer_obj = db.get(InterviewAnswerORM, answer_id)
    if not answer_obj:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    # Verify ownership via session
    session_obj = db.get(InterviewSessionORM, answer_obj.session_id)
    if not session_obj or session_obj.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get question text if available
    question_text = "Unknown Question"
    # In a real app, we'd fetch the question from a Question table or cache
    # For MVP, we'll try to infer or just use a placeholder if not stored
    # Assuming we might have stored it in a Question table, but for now let's just use the ID or a generic prompt
    
    try:
        from app.services.agents import refine_answer_agent
        return refine_answer_agent(kimi_client, question_text, answer_obj.answer_text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except ValidationError as e:
        raise HTTPException(status_code=500, detail=f"AI response schema validation failed: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/coach", response_model=InterviewEvaluation)
async def coach_on_session(
    session_id: str,
    body: InterviewCoachRequest,
    db: Session = Depends(get_db),
) -> InterviewEvaluation:
    """Provide coaching-style feedback for a session based on the interview log.

    The student can ask a follow-up question (e.g. "Why was my answer to Q3 weak?"),
    and the AI coach will respond with targeted, actionable advice.
    """
    session_obj = db.get(InterviewSessionORM, session_id)
    if not session_obj:
        raise HTTPException(status_code=404, detail="Interview session not found")

    answers = (
        db.query(InterviewAnswerORM)
        .filter(InterviewAnswerORM.session_id == session_id)
        .order_by(InterviewAnswerORM.created_at.asc())
        .all()
    )
    if not answers:
        raise HTTPException(status_code=400, detail="No answers recorded for this session")

    interview_log_lines: List[str] = []
    for idx, ans in enumerate(answers, start=1):
        interview_log_lines.append(f"Q{idx}: (question_id={ans.question_id or 'N/A'})")
        interview_log_lines.append(f"A{idx}: {ans.answer_text}")

    interview_log = "\n".join(interview_log_lines)

    if not kimi_client:
        feedback_text = (
            "AI coaching service is currently unavailable. "
            "This is a placeholder response generated without detailed evaluation."
        )
    else:
        feedback_text = coach_agent(kimi_client, interview_log, body.question)

    return InterviewEvaluation(session_id=session_id, feedback=feedback_text)


@router.post("/sessions/{session_id}/next-question", response_model=InterviewQuestion)
async def get_next_question(
    session_id: str,
    db: Session = Depends(get_db),
):
    """
    Generate the next question based on the session context and previous answers.
    This enables adaptive questioning.
    """
    if not kimi_client:
        raise HTTPException(status_code=503, detail="AI Service unavailable")

    session_obj = db.get(InterviewSessionORM, session_id)
    if not session_obj:
        raise HTTPException(status_code=404, detail="Interview session not found")

    # Get previous answers
    answers = (
        db.query(InterviewAnswerORM)
        .filter(InterviewAnswerORM.session_id == session_id)
        .order_by(InterviewAnswerORM.created_at.asc())
        .all()
    )

    # Construct context
    context = f"Job Title: {session_obj.job_title}\nJob Description: {session_obj.job_description}\n"
    if answers:
        context += "\nPrevious Q&A:\n"
        for ans in answers:
            context += f"Q: (ID: {ans.question_id})\nA: {ans.answer_text}\n"

    # Call Agent (using a simplified prompt here for brevity, ideally move to agents.py)
    try:
        prompt = f"""
        You are an expert technical interviewer. Based on the following context, generate the NEXT single interview question.
        If the candidate's previous answer was vague, ask a follow-up.
        If the previous answer was good, move to a new topic relevant to the JD.

        Context:
        {context}

        Return ONLY a JSON object with keys: "id" (random string), "content" (the question text), "type" (e.g. "technical", "behavioral").
        """
        response = kimi_client.chat([{"role": "user", "content": prompt}])
        # Simple parsing (assuming the model obeys JSON format, robust parsing should be added)
        import json
        import re

        # Extract JSON from code block if present
        content = response
        match = re.search(r"```json\s*(.*?)\s*```", content, re.DOTALL)
        if match:
            content = match.group(1)

        data = json.loads(content)
        return InterviewQuestion(
            id=data.get("id", str(uuid.uuid4())),
            content=data.get("content", "Could you elaborate on your experience?"),
            type=data.get("type", "general")
        )
    except Exception as e:
        print(f"Error generating next question: {e}")
        # Fallback
        return InterviewQuestion(
            id=str(uuid.uuid4()),
            content="Could you describe a challenging technical problem you solved recently?",
            type="behavioral"
        )
