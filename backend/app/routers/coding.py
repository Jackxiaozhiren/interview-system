from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

from app.db import get_db
from app.routers.auth import get_current_active_user
from app.models.entities import UserORM
from app.models.coding_problem import CodingProblemORM, CodeSubmissionORM
from app.services.code_judge import evaluate_code, generate_hints
from app.services.cache_manager import get_cache, set_cache, problem_key, TTL_PROBLEM


router = APIRouter(
    prefix="/coding",
    tags=["coding"]
)


# Request/Response Models
class ProblemResponse(BaseModel):
    id: str
    title: str
    description: str
    difficulty: str
    test_cases: list
    constraints: Optional[dict] = None
    language_support: list
    category: Optional[str] = None
    tags: Optional[list] = None


class CodeSubmitRequest(BaseModel):
    problem_id: str
    code: str
    language: str


class SubmissionResponse(BaseModel):
    id: str
    status: str
    pass_rate: float
    feedback: str
    time_complexity: str
    space_complexity: str
    test_results: list


class HintsRequest(BaseModel):
    problem_id: str
    code: str
    language: str


@router.get("/problems", response_model=List[ProblemResponse])
async def list_problems(
    difficulty: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user)
):
    """List all coding problems with optional filters."""
    query = db.query(CodingProblemORM)
    
    if difficulty:
        query = query.filter(CodingProblemORM.difficulty == difficulty)
    if category:
        query = query.filter(CodingProblemORM.category == category)
    
    problems = query.all()
    
    return [
        ProblemResponse(
            id=p.id,
            title=p.title,
            description=p.description,
            difficulty=p.difficulty,
            test_cases=p.test_cases,
            constraints=p.constraints,
            language_support=p.language_support,
            category=p.category,
            tags=p.tags
        )
        for p in problems
    ]


@router.get("/problems/{problem_id}", response_model=ProblemResponse)
async def get_problem(
    problem_id: str,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user)
):
    """Get a specific coding problem."""
    # Try cache first
    cache_key = problem_key(problem_id)
    cached = get_cache(cache_key)
    if cached:
        return ProblemResponse(**cached)
    
    # Fetch from DB
    problem = db.query(CodingProblemORM).filter(CodingProblemORM.id == problem_id).first()
    
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    problem_data = {
        "id": problem.id,
        "title": problem.title,
        "description": problem.description,
        "difficulty": problem.difficulty,
        "test_cases": problem.test_cases,
        "constraints": problem.constraints,
        "language_support": problem.language_support,
        "category": problem.category,
        "tags": problem.tags
    }
    
    # Cache it
    set_cache(cache_key, problem_data, TTL_PROBLEM)
    
    return ProblemResponse(**problem_data)


@router.post("/submit", response_model=SubmissionResponse)
async def submit_code(
    request: CodeSubmitRequest,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user)
):
    """Submit code for evaluation."""
    # Get problem
    problem = db.query(CodingProblemORM).filter(CodingProblemORM.id == request.problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Prepare problem dict for judge
    problem_dict = {
        "title": problem.title,
        "description": problem.description,
        "test_cases": problem.test_cases
    }
    
    # Evaluate code
    result = evaluate_code(problem_dict, request.code, request.language)
    
    # Create submission record
    submission = CodeSubmissionORM(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        problem_id=request.problem_id,
        code=request.code,
        language=request.language,
        status=result["status"],
        pass_rate=result["pass_rate"],
        feedback=result["feedback"],
        time_complexity=result["time_complexity"],
        space_complexity=result["space_complexity"],
        evaluated_at=datetime.utcnow()
    )
    
    db.add(submission)
    db.commit()
    
    return SubmissionResponse(
        id=submission.id,
        status=result["status"],
        pass_rate=result["pass_rate"],
        feedback=result["feedback"],
        time_complexity=result["time_complexity"],
        space_complexity=result["space_complexity"],
        test_results=result.get("test_results", [])
    )


@router.get("/submissions")
async def get_my_submissions(
    problem_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user)
):
    """Get user's submission history."""
    query = db.query(CodeSubmissionORM).filter(CodeSubmissionORM.user_id == current_user.id)
    
    if problem_id:
        query = query.filter(CodeSubmissionORM.problem_id == problem_id)
    
    submissions = query.order_by(CodeSubmissionORM.created_at.desc()).limit(50).all()
    
    return [
        {
            "id": s.id,
            "problem_id": s.problem_id,
            "language": s.language,
            "status": s.status,
            "pass_rate": s.pass_rate,
            "created_at": s.created_at.isoformat()
        }
        for s in submissions
    ]


@router.post("/hints")
async def get_hints(
    request: HintsRequest,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user)
):
    """Get AI-generated hints for a problem."""
    problem = db.query(CodingProblemORM).filter(CodingProblemORM.id == request.problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    problem_dict = {
        "title": problem.title,
        "description": problem.description
    }
    
    hints = generate_hints(problem_dict, request.code, request.language)
    
    return {"hints": hints}
