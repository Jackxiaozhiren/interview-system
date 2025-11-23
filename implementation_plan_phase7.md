# Phase 7: Gamification & Deep Analytics Implementation Plan

## Goal
Implement a comprehensive gamification system to increase user retention and engagement, as outlined in `phase7_gamification_design.md`. This includes XP, Levels, Badges, and Streak tracking.

## User Review Required
> [!IMPORTANT]
> This phase requires database schema changes. Ensure database migrations are handled or the database is reset if in development mode.

## Proposed Changes

### Backend (`backend/app`)

#### [MODIFY] `models/entities.py`
- Add `UserGamificationORM` table:
    - `user_id` (FK)
    - `level` (int)
    - `current_xp` (int)
    - `current_streak` (int)
    - `last_practice_date` (DateTime)
- Add `BadgeORM` table:
    - `id` (PK)
    - `user_id` (FK)
    - `badge_code` (String)
    - `earned_at` (DateTime)
- Add `DailyChallengeORM` table:
    - `id` (PK)
    - `user_id` (FK)
    - `type` (String)
    - `description` (String)
    - `xp_reward` (int)
    - `is_completed` (Boolean)
    - `created_at` (DateTime)

#### [MODIFY] `models/schemas.py`
- Add Pydantic models: `GamificationProfile`, `Badge`, `DailyChallenge`.

#### [NEW] `routers/gamification.py`
- `GET /gamification/profile`: Fetch user's profile, badges, and active challenges.
- `POST /gamification/claim-challenge/{id}`: Mark challenge as complete and award XP.
- `POST /gamification/sync-progress`: (Internal/Client-triggered) Update streak and check for new badges after a session.

#### [MODIFY] `main.py`
- Register `gamification.router`.

### Frontend (`frontend/src`)

#### [NEW] `components/gamification/LevelProgressBar.tsx`
- Visual progress bar with current level and XP to next level.

#### [NEW] `components/gamification/BadgeDisplay.tsx`
- Grid of earned badges with tooltips.

#### [NEW] `components/gamification/StreakWidget.tsx`
- Visual representation of current streak (fire icon).

#### [MODIFY] `app/page.tsx` (The Locker Room)
- Integrate `LevelProgressBar`, `BadgeDisplay`, and `StreakWidget` into the dashboard.
- Replace mock data in `SkillTreeWidget` with real data if available (or keep mock for now if skill tree backend isn't ready).

## Verification Plan

### Automated Tests
- Create `backend/tests/test_gamification.py`:
    - Test XP calculation and Level up logic.
    - Test Badge awarding (e.g., "First Steps" after 1 session).
    - Test Streak increment logic (consecutive days).

### Manual Verification
1.  **Dashboard**: Log in and verify the "Lobby" shows Level 1, 0 XP.
2.  **Complete Interview**: Finish a mock interview session.
3.  **Check Progress**: Return to Dashboard, verify XP increased and "First Steps" badge is awarded.
4.  **Streak**: Manually manipulate DB date to test streak increment.
