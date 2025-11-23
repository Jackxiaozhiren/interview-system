# Implementation Plan - Phase 2: Real-time Nudges (The HUD)

## Goal Description
Implement a "Heads-Up Display" (HUD) that provides subtle, real-time feedback to the user during the interview. This includes metrics like speech rate (WPM), filler word count, and eye contact alerts. This feature is designed to be a "Training Mode" aid.

## User Review Required
> [!IMPORTANT]
> This feature requires real-time audio analysis. We will simulate this for the MVP using the existing `AudioAnalysis` logic but streaming it via WebSockets or polling.

## Proposed Changes

### Backend

#### [MODIFY] [backend/app/routers/interview.py](file:///g:/windsurf_interview%20system/backend/app/routers/interview.py)
- **New WebSocket Endpoint**: `/ws/interview/{session_id}/hud`
    - Accepts audio chunks (or metadata if processing is client-side for now).
    - Returns real-time metrics: `{ "wpm": 150, "filler_count": 2, "eye_contact": true }`.
- **Mock Logic (MVP)**:
    - Since full real-time audio processing is complex, we will implement a mock generator first to validate the UI, then connect it to the actual analysis logic.

### Frontend

#### [NEW] [frontend/src/components/interview/HUDOverlay.tsx](file:///g:/windsurf_interview%20system/frontend/src/components/interview/HUDOverlay.tsx)
- **Component**: A transparent overlay sitting on top of the user's video feed.
- **Features**:
    - **Speedometer**: Visual indicator of speech rate (Green=Good, Red=Too Fast/Slow).
    - **Filler Counter**: Small counter for "Umm/Ahh".
    - **Alerts**: Toast-like notifications for "Look at camera".

#### [MODIFY] [frontend/src/app/interview/[sessionId]/page.tsx](file:///g:/windsurf_interview%20system/frontend/src/app/interview/[sessionId]/page.tsx)
- Integrate `HUDOverlay` into the main interview view.
- Connect to the WebSocket (or polling mechanism) to feed data to the HUD.

## Verification Plan

### Automated Tests
- **Backend**: Test the WebSocket connection and message format.

### Manual Verification
1.  **Start Interview**: Go to `/interview/setup` and start a session.
2.  **Check UI**: Verify the HUD overlay appears on the video.
3.  **Simulate Speech**: Speak into the microphone (or mock the data).
4.  **Verify Nudges**: Check if the WPM indicator moves and filler word count increases.
