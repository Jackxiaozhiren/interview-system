import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./interview.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    # Needed for SQLite + multithreaded FastAPI
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that provides a SQLAlchemy Session per request."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
