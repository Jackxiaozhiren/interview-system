# System Verification Checklist

## Pre-Flight Checks
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] Database initialized

## Server Startup
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] No startup errors in logs

## Phase 1: Green Room (Setup)
- [ ] Navigate to `/interview/setup`
- [ ] Step 1: Context Ingestion
  - [ ] Job title selector works
  - [ ] Job description textarea accepts input
  - [ ] Resume upload works (if implemented)
- [ ] Step 2: Tech Check
  - [ ] Camera preview displays
  - [ ] Microphone preview works
  - [ ] Status indicators show green/red correctly
- [ ] Step 3: Anxiety Reduction
  - [ ] Breathing exercise animation displays
  - [ ] Timer counts down
- [ ] "Begin Interview" button redirects to `/av-interview?sessionId=...`

## Phase 2: Immersive Interview (Live Mode)
- [ ] Auto-enters Live Mode with session ID
- [ ] UI Layout
  - [ ] Top half: AI Avatar placeholder visible
  - [ ] Bottom half: User camera feed displays (mirrored)
  - [ ] Sidebar: Interview context shows job title/description
- [ ] WebSocket Connection
  - [ ] Console shows "WebSocket connected for real-time analysis"
  - [ ] No connection errors in Network tab
- [ ] Real-time Nudges
  - [ ] Speak loudly → "Speaking loudly!" nudge appears
  - [ ] Speak quietly → "Speak up a bit?" nudge appears
  - [ ] Volume level updates in real-time (HUD)
  - [ ] Nudges auto-clear after 3 seconds
- [ ] Adaptive Questioning
  - [ ] "Next Question" button fetches AI-generated question
  - [ ] Question appears as overlay on avatar
  - [ ] TTS speaks the question aloud
- [ ] Recording
  - [ ] "Start Answer" button starts recording
  - [ ] Recording indicator visible during recording
  - [ ] "Stop & Submit" stops recording
  - [ ] Video auto-uploads to backend
  - [ ] Session history updates with new media file
- [ ] End Interview
  - [ ] "End & Review" button visible in header
  - [ ] Clicking redirects to `/interview/review/[sessionId]`

## Phase 3: Game Tape Review
- [ ] Review page loads with session ID
- [ ] Timeline Player
  - [ ] Video loads and plays
  - [ ] Playback controls work (play/pause/seek)
  - [ ] Transcript displays (if available)
  - [ ] Feedback markers visible on timeline (placeholder OK)
- [ ] Multimodal Report Card
  - [ ] Radar chart renders
  - [ ] Line chart (emotional journey) renders
  - [ ] Key metrics display (speech rate, eye contact, etc.)
- [ ] Actionable Drills
  - [ ] Drill cards display
  - [ ] Badges show drill type
  - [ ] "Start Drill" buttons present

## Phase 4: WebSocket Architecture
- [ ] WebSocket endpoint accessible (`ws://localhost:8000/ws/analysis/...`)
- [ ] Audio chunks sent from frontend (check Network tab)
- [ ] Backend processes audio (check logs for processing messages)
- [ ] Nudges received from backend (not just client-side)
- [ ] No memory leaks during extended sessions

## Edge Cases & Error Handling
- [ ] No session ID → Redirects appropriately
- [ ] Camera/mic permission denied → Shows error message
- [ ] WebSocket connection fails → Graceful degradation
- [ ] Backend offline → Frontend shows error
- [ ] Large video files → Upload progress visible

## Performance
- [ ] WebSocket latency < 500ms for nudges
- [ ] Video upload completes without timeout
- [ ] Page load times < 3s
- [ ] No console errors during normal operation

## Cross-browser Testing (Optional)
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

## Notes
- Mark items as complete ✅ as you verify them
- Document any issues found in a separate section below
- Take screenshots of critical UI states for documentation
