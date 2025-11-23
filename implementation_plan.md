# Implementation Plan - Phase 1: Context-Aware Interview (Match Report)

## Goal Description
Transform the interview setup process from a generic "Start" button to a strategic "Match Report" session. Users will upload their Resume and provide a Job Description (JD). The system will analyze the gap between the two and provide a "Match Score", "Missing Keywords", and "Focus Areas" before the interview starts.

## User Review Required
> [!IMPORTANT]
> This change modifies the `InterviewSession` creation flow. The user will now be encouraged to provide a JD before starting.

## Proposed Changes

### Backend

#### [MODIFY] [schemas.py](file:///g:/windsurf_interview%20system/backend/app/models/schemas.py)
- Add `MatchReport` model:
    - `score`: float (0-100)
    - `matching_keywords`: List[str]
    - `missing_keywords`: List[str]
    - `strengths`: List[str]
    - `gaps`: List[str]
    - `summary`: str
- Add `MatchReportRequest` model:
    - `resume_text`: str
    - `job_description`: str

#### [MODIFY] [agents.py](file:///g:/windsurf_interview%20system/backend/app/services/agents.py)
- Implement `match_report_agent(client, resume_text, job_description) -> MatchReport`.
- Use a specialized prompt to ask the LLM (Kimi) to compare the Resume and JD.

#### [MODIFY] [interview.py](file:///g:/windsurf_interview%20system/backend/app/routers/interview.py)
- Add endpoint `POST /resumes/{resume_id}/match-report`.
- Logic: Retrieve resume from store -> Call `match_report_agent` -> Return result.

### Frontend

#### [MODIFY] [frontend/src/app/interview/setup/page.tsx](file:///g:/windsurf_interview%20system/frontend/src/app/interview/setup/page.tsx)
- **Current State**: Likely a simple form or placeholder.
- **New State**:
    - **Step 1**: Resume Selection (use existing uploaded resume or upload new).
    - **Step 2**: Job Description Input (Text area or "Use Sample JD").
    - **Step 3**: "Analyze Match" button.
    - **Step 4**: Display `MatchReport` (Score, Keywords, Gaps).
    - **Step 5**: "Start Interview" button (passes JD context to session).

## Verification Plan

### Automated Tests
- **Backend**: Create `tests/test_match_report.py` to test the new endpoint.
    - Mock the LLM response to avoid API costs/latency during test.
    - Verify schema validation.

### Manual Verification
1.  **Navigate to Dashboard**: Click "Start New Interview".
2.  **Upload Resume**: Upload a sample PDF resume.
3.  **Enter JD**: Paste a sample Job Description (e.g., "Senior Python Developer").
4.  **Click Analyze**: Verify that a "Match Report" appears with a score and keywords.
5.  **Start Interview**: Verify that the interview session starts and the AI mentions the JD context (e.g., "I see you're applying for the Python role...").
