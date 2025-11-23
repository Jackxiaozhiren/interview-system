# Implementation Plan - Phase 5: Active Listening Avatar

## Goal Description
Make the AI interviewer feel "alive" by reacting to the user's speech in real-time.
1.  **Visual Cues**: The avatar will nod when the user speaks confidently and look thoughtful during pauses.
2.  **Note Taking**: The avatar will visually "take notes" when key points are made.

## Proposed Changes

### Backend

#### [MODIFY] [backend/app/services/audio_processor.py](file:///g:/windsurf_interview%20system/backend/app/services/audio_processor.py)
- **Update `process_chunk`**:
    -   Add logic to trigger `reaction` events.
    -   Logic:
        -   `nod`: Trigger randomly every 5-10s while user is speaking (simulates active listening).
        -   `take_notes`: Trigger when a filler word is detected (noting a mistake) or after a long burst of speech (noting a point).
    -   Return `reaction` string in the result dict.

#### [MODIFY] [backend/app/routers/websocket.py](file:///g:/windsurf_interview%20system/backend/app/routers/websocket.py)
- **Update WebSocket Loop**:
    -   Pass the `reaction` field from `AudioProcessor` to the frontend JSON message.

### Frontend

#### [NEW] [frontend/src/components/interview/Avatar.tsx](file:///g:/windsurf_interview%20system/frontend/src/components/interview/Avatar.tsx)
- **New Component**:
    -   Props: `state` ("idle", "listening", "nodding", "taking_notes").
    -   Visuals:
        -   Base: Gradient circle (existing style).
        -   Animations: CSS animations for bounce (nod), pulse (listen), and an overlay icon for "taking notes".

#### [MODIFY] [frontend/src/app/interview/[sessionId]/page.tsx](file:///g:/windsurf_interview%20system/frontend/src/app/interview/[sessionId]/page.tsx)
- **Integration**:
    -   Replace the static CSS avatar with `<Avatar />`.
    -   Update WebSocket handler to parse `reaction` and pass it to `<Avatar />`.

## Verification Plan

### Manual Verification
1.  **Start Interview**: Go to `/interview/[sessionId]`.
2.  **Speak**: Talk into the microphone.
3.  **Observe Avatar**:
    -   Verify it pulses when volume is detected.
    -   Verify it "nods" (bounces) occasionally while speaking.
    -   Verify it shows a "pen" icon (taking notes) occasionally.
