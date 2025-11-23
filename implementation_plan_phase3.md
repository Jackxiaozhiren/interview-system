# Implementation Plan - Phase 3: The "Game Tape" (Review & Growth)

## Goal Description
Transform the post-interview review into an interactive "Game Tape" session. Users should be able to watch their interview recording, see feedback mapped to specific timestamps (e.g., "Good eye contact here", "Missed keyword here"), and retry specific questions.

## User Review Required
> [!NOTE]
> For the MVP, we will simulate timestamped events since our current backend analysis is session-based, not frame-perfect. We will generate mock timestamps for the feedback items.

## Proposed Changes

### Backend

#### [MODIFY] [backend/app/routers/interview.py](file:///g:/windsurf_interview%20system/backend/app/routers/interview.py)
- **Update `get_interview_report`**:
    -   Include `timeline_events` in the response.
    -   Structure: `[{ timestamp: 120, type: "strength", message: "Good STAR method" }, ...]`
    -   *Mock Logic*: Randomly assign timestamps to the generated feedback points for demonstration.

### Frontend

#### [NEW] [frontend/src/app/interview/review/[sessionId]/page.tsx](file:///g:/windsurf_interview%20system/frontend/src/app/interview/review/[sessionId]/page.tsx)
- **Layout**:
    -   **Left**: Video Player (using standard `<video>` tag).
    -   **Bottom**: Timeline bar with colored markers (Green=Strength, Red=Gap).
    -   **Right**: Feedback List (clickable to seek video).
-   **Interactivity**:
    -   Clicking a feedback item jumps the video to that timestamp.
    -   "Retry Question" button (placeholder for now, or simple redirect to setup with that question).

#### [NEW] [frontend/src/components/interview/TimelinePlayer.tsx](file:///g:/windsurf_interview%20system/frontend/src/components/interview/TimelinePlayer.tsx)
- **Component**: Custom video player controls with event markers on the progress bar.

## Verification Plan

### Manual Verification
1.  **Complete an Interview**: Use the Phase 2 flow to record a short session.
2.  **Go to Review**: Click "End & Review".
3.  **Check Player**: Verify video plays.
4.  **Check Timeline**: Verify markers appear on the progress bar.
5.  **Test Seek**: Click a feedback item and verify video jumps to the correct time.
