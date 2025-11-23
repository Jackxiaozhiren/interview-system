import json
import time

import requests


BASE_URL = "http://127.0.0.1:8000"


sample_resume = """
John Doe
Software Engineer
Summary: Experienced Python developer with 3 years of experience in building REST APIs and data pipelines.
Skills: Python, FastAPI, React, Docker, SQL
Experience:
- Backend Developer at Tech Corp (2021-Present): Built microservices using FastAPI. Optimized database queries reducing latency by 30%.
- Junior Dev at StartUp Inc (2020-2021): Developed internal tools using Flask.
Education:
- B.S. Computer Science, University of Technology (2016-2020)
"""


def pretty_print(title, data):
    print(f"\n=== {title} ===")
    if isinstance(data, (dict, list)):
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print(data)


def main():
    print("1) Health check...")
    try:
        res = requests.get(f"{BASE_URL}/")
        pretty_print("Health", {"status_code": res.status_code, "body": res.json()})
    except Exception as e:
        print(f"Health check failed: {e}")
        return

    print("\n2) Create interview session...")
    payload_session = {
        "user_id": "demo-user-1",
        "job_title": "Python Backend Engineer Intern",
        "job_description": "Responsible for building REST APIs and basic database operations",
        "interviewer_type": "Tech",
        "duration_minutes": 30,
    }
    res = requests.post(f"{BASE_URL}/interview/sessions", json=payload_session)
    pretty_print("Create Session - raw", {"status_code": res.status_code, "body": res.text})
    res.raise_for_status()
    session = res.json()
    session_id = session["id"]
    print(f"Created session_id: {session_id}")

    print("\n3) Start session...")
    res = requests.post(f"{BASE_URL}/interview/sessions/{session_id}/start")
    pretty_print("Start Session", {"status_code": res.status_code, "body": res.json()})

    print("\n4) Generate questions based on resume...")
    payload_questions = {
        "resume_text": sample_resume,
        "job_description": "Python Backend Engineer Intern",
        "focus_area": "Backend fundamentals",
    }
    res = requests.post(f"{BASE_URL}/interview/generate-questions", json=payload_questions)
    pretty_print("Generate Questions - raw", {"status_code": res.status_code, "body": res.text})
    res.raise_for_status()
    questions = res.json()

    print("\n5) Submit answers for first 3 questions (if available)...")
    for idx, q in enumerate(questions[:3], start=1):
        answer_payload = {
            "question_id": q.get("id"),
            "answer_text": f"This is a demo answer #{idx} for question: {q.get('content', '')[:80]}...",
        }
        res = requests.post(
            f"{BASE_URL}/interview/sessions/{session_id}/answers",
            json=answer_payload,
        )
        pretty_print(f"Answer {idx}", {"status_code": res.status_code, "body": res.json()})

    print("\n6) End session...")
    res = requests.post(f"{BASE_URL}/interview/sessions/{session_id}/end")
    pretty_print("End Session", {"status_code": res.status_code, "body": res.json()})

    print("\n7) Get interview report...")
    # Not strictly necessary to sleep, but keeps the flow readable
    time.sleep(1)
    res = requests.get(f"{BASE_URL}/interview/sessions/{session_id}/report")
    pretty_print("Interview Report", {"status_code": res.status_code, "body": res.json()})


if __name__ == "__main__":
    main()
