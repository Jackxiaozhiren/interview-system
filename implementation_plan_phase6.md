# Implementation Plan - Phase 6: Complete Feedback Loop

## Goal Description
Create an intelligent, adaptive coaching system that learns from each session and provides personalized guidance.

1. **Mirror Check**: Pre-interview AI feedback on technical setup (lighting, audio, framing).
2. **Adaptive Questions**: Dynamic difficulty based on performance history.
3. **Progress Dashboard**: Visual analytics showing improvement trends.

## Proposed Changes

### Backend

#### [NEW] [backend/app/services/mirror_check.py](file:///g:/windsurf_interview%20system/backend/app/services/mirror_check.py)
- **New Service**: Analyze a video frame for:
    - Lighting quality (histogram analysis).
    - Face detection and centering.
    - Background analysis (busy vs. clean).
- **Return**: Structured feedback with scores and suggestions.

#### [NEW] [backend/app/routers/interview.py](file:///g:/windsurf_interview%20system/backend/app/routers/interview.py)
- **New Endpoint**: `POST /interview/mirror-check`
    - Accepts a single video frame (base64 or multipart).
    - Returns feedback object.

#### [MODIFY] [backend/app/services/agents.py](file:///g:/windsurf_interview%20system/backend/app/services/agents.py)
- **New Function**: `adaptive_question_selector`
    - Input: User history (past scores, weak areas).
    - Logic: Select questions targeting weak areas, with appropriate difficulty.
    - Output: List of recommended questions.

#### [NEW] [backend/app/routers/analytics.py](file:///g:/windsurf_interview%20system/backend/app/routers/analytics.py)
- **New Router**: Analytics endpoints.
- **Endpoint**: `GET /analytics/progress/{user_id}`
    - Returns: Session history, score trends, dimension improvements.

### Frontend

#### [NEW] [frontend/src/app/interview/mirror-check/page.tsx](file:///g:/windsurf_interview%20system/frontend/src/app/interview/mirror-check/page.tsx)
- **New Page**: Pre-interview "Mirror Check" screen.
- **Features**:
    - Live video preview.
    - "Check My Setup" button.
    - Display AI feedback (lighting, framing, background).
    - "Looks Good, Start Interview" button.

#### [NEW] [frontend/src/app/dashboard/page.tsx](file:///g:/windsurf_interview%20system/frontend/src/app/dashboard/page.tsx)
- **New Page**: User dashboard.
- **Widgets**:
    - Score trend chart (line graph).
    - Recent sessions list.
    - Recommended focus areas (based on weak dimensions).
    - "Start Practice" quick action.

#### [MODIFY] [frontend/src/app/interview/setup/page.tsx](file:///g:/windsurf_interview%20system/frontend/src/app/interview/setup/page.tsx)
- **Update Flow**: Add "Mirror Check" as a step before starting the interview.

## Verification Plan

### Automated Tests
- **Mirror Check**: Test with sample images (good lighting vs. poor lighting).
- **Adaptive Questions**: Mock user history, verify correct difficulty selection.

### Manual Verification
1. **Mirror Check**:
    - Go to `/interview/mirror-check`.
    - Grant camera access.
    - Click "Check My Setup".
    - Verify feedback appears with actionable suggestions.
2. **Progress Dashboard**:
    - Go to `/dashboard`.
    - Verify score trends chart displays correctly.
    - Verify recommended areas match weak performance.
