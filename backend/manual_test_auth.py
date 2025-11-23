import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from app.db import Base, engine

client = TestClient(app)

def test_register():
    print("Testing register...")
    try:
        response = client.post(
            "/auth/register",
            json={"email": "test_manual@example.com", "password": "password123", "full_name": "Test User"},
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error during request: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")
    test_register()
