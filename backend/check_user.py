import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import Base, engine
from app.models.entities import UserORM

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def check_user(email):
    print(f"Checking user: {email}")
    user = db.query(UserORM).filter(UserORM.email == email).first()
    if user:
        print(f"User found: {user.email}")
        print(f"ID: {user.id}")
        print(f"Hashed Password: {user.hashed_password}")
        print(f"Is Active: {user.is_active}")
    else:
        print("User not found")

if __name__ == "__main__":
    check_user("browser_retry_2@example.com")
