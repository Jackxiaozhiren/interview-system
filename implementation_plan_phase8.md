# Phase 8: Adaptive Personas & Advanced Vision Implementation Plan

## Goal
Enhance the interview experience by allowing users to select an AI interviewer persona (Friendly, Professional, Challenging) and implementing real computer vision heuristics for eye contact and posture analysis.

## User Review Required
> [!IMPORTANT]
> This phase requires database schema changes to store the selected persona for each session.

## Proposed Changes

### Backend (`backend/app`)

#### [MODIFY] `models/entities.py`
- Update `InterviewSessionORM` to add `interviewer_persona` column (String, default="professional").

#### [MODIFY] `models/schemas.py`
- Update `InterviewSessionCreateRequest` and `InterviewSession` to include `interviewer_persona`.

#### [MODIFY] `routers/interview.py`
- Update `create_session` to accept `interviewer_persona`.
- Update `submit_answer` (or wherever follow-up is generated) to retrieve the session's persona and pass it to `conversation_engine`.

#### [MODIFY] `services/video_analysis.py`
- Replace placeholders for `eye_contact_score` and `posture_score` with `opencv` heuristics:
    - **Eye Contact**: Use Haar Cascade `haarcascade_eye.xml` to detect eyes within the face region.
    - **Posture**: Calculate the deviation of the face center from the frame center.

### Frontend (`frontend/src`)

#### [MODIFY] `app/interview/setup/page.tsx`
- Add a step for "Select Interviewer Persona".
- Display cards for "Friendly Mentor", "Professional HR", "Challenging Tech Lead" with descriptions.
- Pass the selected persona to the `create_session` API call.

#### [MODIFY] `app/interview/[sessionId]/page.tsx`
- (Optional) Update the Avatar's initial greeting or voice based on the persona (if TTS supports it).

## Verification Plan

### Automated Tests
- **Backend**: Update `test_interview_flow.py` to create a session with a specific persona and verify it's stored.
- **Vision**: Create `test_video_analysis_real.py` with a sample video (or synthetic frames) to verify the new heuristics return non-placeholder values.

### Manual Verification
1.  **Setup**: Go to `/interview/setup`, select "Challenging" persona.
2.  **Interview**: Start the interview. Verify the AI's follow-up questions are tougher/more probing (tone check).
3.  **Vision**: During the interview, move your head around and look away. Check the final report (or logs) to see if `posture_score` and `eye_contact_score` reflect this.
