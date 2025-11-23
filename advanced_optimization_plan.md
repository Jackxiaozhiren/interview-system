# Advanced Optimization Plan: "The League"

Following the successful implementation of the Immersive Arena and Game Tape, we will now elevate the system to a "League" standard. This phase focuses on long-term user engagement (Gamification) and active, intelligent coaching.

## Phase 5: "The Locker Room" (Dashboard & Progression)
Transform the landing page into a high-energy "Career Command Center".

### Goals
- **Gamification**: Visualize progress with a "Skill Tree" and "Streak Counter".
- **Daily Engagement**: Introduce "Daily Drills" (e.g., "Pitch Yourself in 30s").
- **Aesthetics**: Dark, premium "Sports Analytics" vibe.

### Implementation
1.  **`DashboardLayout`**: A new layout for the home page with a sidebar for navigation (Home, Drills, History, Settings).
2.  **`SkillTreeWidget`**: A visual graph showing growth in "Confidence", "Clarity", "Structure".
3.  **`DailyDrillCard`**: A prominent CTA for a quick, low-friction practice session.
4.  **`RecentMatches`**: A list of recent interview sessions with mini-sparkline scores.

## Phase 6: "Active Coaching" (Real-time Intervention)
The AI shouldn't just listen; it should *coach* in real-time.

### Goals
- **Intervention**: If the user stumbles, the Avatar should offer encouragement.
- **Pacing Control**: If the user speaks too fast (>160 WPM) for 10s, the system triggers a "Slow Down" visual cue.
- **Silence Breaker**: If the user is silent for >5s during an answer, the Avatar asks a prompting question.

### Implementation
1.  **Backend WebSocket (`/ws/analysis`)**:
    - Add state tracking for "Silence Duration" and "Sustained High WPM".
    - Send `type: "intervention"` messages.
2.  **Frontend (`InterviewPage`)**:
    - Handle `intervention` messages:
        - **Visual**: Flash a gentle toast/overlay.
        - **Avatar**: Trigger a "Encouraging Nod" or "Hand Raise" animation.

## Phase 7: "Scout Report" (Deep Analytics)
Enhance the post-interview report with deeper insights.

### Goals
- **Tone Analysis**: Use audio features to detect "Monotone" vs "Dynamic" speech.
- **Eye Contact Heatmap**: (Simulated for now) Show where the user looked.

---

## Immediate Next Steps (Task List)
1.  [ ] Redesign `frontend/src/app/page.tsx` as "The Locker Room".
2.  [ ] Create `DailyDrill` component.
3.  [ ] Update WebSocket logic for "Silence Breaker".
