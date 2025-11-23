import requests
import time
import json

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

def test_health():
    print("\n1. Testing Health Check...")
    try:
        res = requests.get(f"{BASE_URL}/")
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")
    except Exception as e:
        print(f"Failed: {e}")

def test_analyze_resume():
    print("\n2. Testing Resume Analysis (using Kimi)...")
    try:
        payload = {"resume_text": sample_resume}
        res = requests.post(f"{BASE_URL}/interview/analyze-resume", json=payload)

        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            print("Analysis Result:")
            print(json.dumps(data, indent=2, ensure_ascii=False))

            # If analysis successful, test question generation
            if "focus_areas" in data and len(data["focus_areas"]) > 0:
                run_generate_questions(data["focus_areas"][0]["area"])
        else:
            print(f"Error: {res.text}")

    except Exception as e:
        print(f"Failed: {e}")

def run_generate_questions(focus_area):
    print(f"\n3. Testing Question Generation (Focus: {focus_area})...")
    try:
        payload = {
            "resume_text": sample_resume,
            "focus_area": focus_area,
            "job_description": "Senior Python Backend Engineer"
        }
        res = requests.post(f"{BASE_URL}/interview/generate-questions", json=payload)

        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            print("Generated Questions:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
        else:
            print(f"Error: {res.text}")

    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    # Wait for server to start (user must start it manually or we run it)
    test_health()
    test_analyze_resume()
