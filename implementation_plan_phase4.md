# Implementation Plan - Phase 4: The "Answer Doctor" & Active Practice

## Goal Description
Deepen the learning value of the "Game Tape" by providing actionable improvements.
1.  **Answer Doctor**: The AI analyzes a specific answer and provides a "Better Version" (rewritten for clarity, impact, and STAR alignment).
2.  **Retry Mechanism**: Users can immediately re-record their answer to the same question to practice the improvements.

## Proposed Changes

### Backend

#### [NEW] [backend/app/routers/interview.py](file:///g:/windsurf_interview%20system/backend/app/routers/interview.py)
- **New Endpoint**: `POST /interview/answers/{answer_id}/refine`
    -   Input: `answer_id` (or text if not stored).
    -   Output: `refined_answer`, `explanation`.
    -   Logic: Calls a new `refine_answer_agent`.

#### [MODIFY] [backend/app/services/agents.py](file:///g:/windsurf_interview%20system/backend/app/services/agents.py)
- **New Agent**: `refine_answer_agent`
    -   Prompt: "You are an expert interview coach. Rewrite the following candidate answer to be more impactful, using the STAR method if applicable. Keep the core truth but improve the delivery."

### Frontend

#### [MODIFY] [frontend/src/app/interview/review/[sessionId]/page.tsx](file:///g:/windsurf_interview%20system/frontend/src/app/interview/review/[sessionId]/page.tsx)
- **UI Update**:
    -   Add "Fix My Answer" button to the Transcript/Feedback view.
    -   Display "Original" vs "Refined" comparison.
    -   Add "Retry Question" button that redirects to a single-question interview mode (or overlays a recording modal).

## Verification Plan

### Manual Verification
1.  **Go to Review Page**: Open a completed session.
2.  **Test Answer Doctor**: Click "Fix My Answer" on a weak response.
3.  **Verify Output**: Check if a rewritten version appears with an explanation.
4.  **Test Retry**: Click "Retry Question" and verify it allows re-recording (or at least logs the intent for MVP).
