"""
Coding problem models for technical interviews.
"""
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db import Base


class CodingProblemORM(Base):
    __tablename__ = "coding_problems"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(String, nullable=False)  # easy, medium, hard
    
    # Test cases stored as JSON array
    test_cases = Column(JSON, nullable=False)
    # Example: [{"input": "...", "expected_output": "..."}]
    
    # Problem constraints
    constraints = Column(JSON, nullable=True)
    # Example: {"time_limit": "1s", "memory_limit": "128MB"}
    
    # Supported languages
    language_support = Column(JSON, default=["python", "javascript", "java", "cpp"])
    
    # Metadata
    category = Column(String, nullable=True)  # array, string, dp, etc.
    tags = Column(JSON, nullable=True)  # ["easy", "array", "hash-table"]
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    submissions = relationship("CodeSubmissionORM", back_populates="problem")


class CodeSubmissionORM(Base):
    __tablename__ = "code_submissions"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    problem_id = Column(String, ForeignKey("coding_problems.id"), nullable=False)
    
    # Submission details
    code = Column(Text, nullable=False)
    language = Column(String, nullable=False)
    
    # Evaluation results
    status = Column(String, nullable=False)  # pending, accepted, wrong_answer, runtime_error
    pass_rate = Column(Float, nullable=True)  # 0.0 to 1.0
    feedback = Column(Text, nullable=True)  # AI-generated feedback
    
    # Performance metrics (AI estimated)
    time_complexity = Column(String, nullable=True)  # O(n), O(n^2), etc.
    space_complexity = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    evaluated_at = Column(DateTime, nullable=True)
    
    # Relationships
    problem = relationship("CodingProblemORM", back_populates="submissions")
