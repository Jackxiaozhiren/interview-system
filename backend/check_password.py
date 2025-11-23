import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import Base, engine
from app.models.entities import UserORM
from app.core.security import verify_password

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def check_password(email, password):
    print(f"Checking password for: {email}")
    user = db.query(UserORM).filter(UserORM.email == email).first()
    if user:
        print(f"User found. Hash: {user.hashed_password}")
        is_valid = verify_password(password, user.hashed_password)
        print(f"Password '{password}' is valid: {is_valid}")
    else:
        print("User not found")

if __name__ == "__main__":
    check_password("browser_retry_2@example.com", "password123")
