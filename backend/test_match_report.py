import requests
import json
import os

BASE_URL = "http://localhost:8000"

def create_dummy_pdf(filename):
    content = (
        b"%PDF-1.4\n"
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>endobj\n"
        b"4 0 obj<</Length 44>>stream\n"
        b"BT /F1 12 Tf 100 700 Td (Python Developer Resume Content) Tj ET\n"
        b"endstream\n"
        b"endobj\n"
        b"xref\n"
        b"0 5\n"
        b"0000000000 65535 f \n"
        b"0000000010 00000 n \n"
        b"0000000060 00000 n \n"
        b"0000000117 00000 n \n"
        b"0000000214 00000 n \n"
        b"trailer<</Size 5/Root 1 0 R>>\n"
        b"startxref\n"
        b"309\n"
        b"%%EOF\n"
    )
    with open(filename, "wb") as f:
        f.write(content)

def test_match_report():
    pdf_path = "test_resume.pdf"
    create_dummy_pdf(pdf_path)
    
    # 1. Upload a dummy resume to get an ID
    files = {'file': (pdf_path, open(pdf_path, 'rb'), 'application/pdf')}
    try:
        res = requests.post(f"{BASE_URL}/interview/upload-resume", files=files)
        if res.status_code != 200:
            print(f"Upload failed: {res.text}")
            return
        resume_id = res.json()['id']
        print(f"Resume uploaded. ID: {resume_id}")

        # 2. Call match-report endpoint
        jd = "We are looking for a Senior Python Developer with experience in FastAPI, React, and Kubernetes."
        payload = {"resume_text": "", "job_description": jd} 
        
        print("Requesting Match Report...")
        res = requests.post(f"{BASE_URL}/interview/resumes/{resume_id}/match-report", json=payload)
        
        if res.status_code == 200:
            report = res.json()
            print("\nMatch Report Received:")
            print(json.dumps(report, indent=2, ensure_ascii=False))
        else:
            print(f"Match Report failed: {res.status_code} - {res.text}")

    except Exception as e:
        print(f"Test failed: {e}")
    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)

if __name__ == "__main__":
    test_match_report()
