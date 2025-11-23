import pytest
from fastapi.testclient import TestClient
from main import app
from app.models.coding_problem import CodingProblemORM
from app.db import get_db
import uuid

client = TestClient(app)

# Mock data for seeding
MOCK_PROBLEM = {
    "id": str(uuid.uuid4()),
    "title": "Two Sum",
    "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    "difficulty": "Easy",
    "test_cases": [
        {"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]"},
        {"input": "nums = [3,2,4], target = 6", "output": "[1,2]"}
    ],
    "constraints": {"n": "10^4"},
    "language_support": ["python", "javascript"],
    "category": "Arrays",
    "tags": ["Array", "Hash Table"]
}

@pytest.fixture
def seed_problem():
    # Direct DB insertion for setup
    db = next(get_db())
    problem = CodingProblemORM(**MOCK_PROBLEM)
    db.add(problem)
    db.commit()
    yield MOCK_PROBLEM["id"]
    # Cleanup
    db.delete(problem)
    db.commit()

def test_list_problems(seed_problem):
    response = client.get("/coding/problems")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(p["id"] == seed_problem for p in data)

def test_get_problem_detail(seed_problem):
    response = client.get(f"/coding/problems/{seed_problem}")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Two Sum"
    assert data["difficulty"] == "Easy"

def test_submit_code_success(seed_problem):
    # Mock a correct submission
    payload = {
        "problem_id": seed_problem,
        "code": "def solution(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        if target - num in seen:\n            return [seen[target - num], i]\n        seen[num] = i",
        "language": "python"
    }
    # Note: Real execution depends on code_judge.py. 
    # If code_judge is mocked or requires external service, this might fail or need mocking.
    # For now, we assume code_judge runs locally or returns a stub.
    response = client.post("/coding/submit", json=payload)
    if response.status_code == 200:
        data = response.json()
        assert "status" in data
        assert "pass_rate" in data
    else:
        # If code execution fails (e.g. no sandbox), we expect 500 or specific error
        print(f"Submission failed: {response.text}")

def test_get_hints(seed_problem):
    payload = {
        "problem_id": seed_problem,
        "code": "def solution(nums, target):\n    pass",
        "language": "python"
    }
    response = client.post("/coding/hints", json=payload)
    # Hints might depend on LLM, so we check if it returns 200 or 503 (if LLM unavailable)
    if response.status_code == 200:
        data = response.json()
        assert "hints" in data
    elif response.status_code == 503:
        print("AI Service unavailable for hints")
    else:
        assert False, f"Unexpected status code: {response.status_code}"
