# Phase 11: AI Interview Copilot Implementation Plan

## Goal
Create a 24/7 conversational AI coach that helps users improve their interview skills through personalized tips, answer drafting, and custom question generation.

## Proposed Changes

### Backend (`backend/app`)

#### [NEW] `routers/copilot.py`
- `POST /copilot/chat`: Main chat endpoint
  - Accepts user message + conversation history
  - Returns AI response with personalized tips
  - Uses session history for context
  
- `GET /copilot/suggestions`: Get personalized improvement tips
  - Analyzes user's past interview sessions
  - Returns top 3 specific areas to improve
  
- `POST /copilot/generate-questions`: Generate custom questions
  - Input: Target company, role, difficulty
  - Returns 5-10 tailored interview questions

#### [NEW] `services/copilot_service.py`
- `analyze_user_history()`: Extract patterns from past sessions
- `generate_answer_template()`: Create STAR-method answer structure
- `personalize_feedback()`: Tailor advice to user's weak points

#### [MODIFY] `main.py`
- Register `copilot.router`

### Frontend (`frontend/src`)

#### [NEW] `app/coach/page.tsx`
- Main chat interface with message history
- Sidebar showing quick actions:
  - "Analyze my weak points"
  - "Generate practice questions"
  - "Help me draft an answer"

#### [NEW] `components/copilot/ChatInterface.tsx`
- Message bubbles (user vs AI)
- Typing indicator
- Quick reply buttons

#### [NEW] `components/copilot/SuggestionCard.tsx`
- Display personalized improvement tips
- Link to relevant drills or past sessions

#### [NEW] `components/copilot/AnswerDrafter.tsx`
- Form to input: Question, Context, Key points
- AI generates structured STAR answer
- User can edit and save to library

### Database Changes

#### [NEW] `CopilotConversationORM`
```
- id: String (PK)
- user_id: String (FK)
- messages: JSON [{role, content, timestamp}]
- created_at: DateTime
```

#### [NEW] `SavedAnswerORM`
```
- id: String (PK)
- user_id: String (FK)
- question: String
- answer: Text
- category: String (behavioral, technical, etc.)
- created_at: DateTime
```

## Verification Plan

### Backend Tests
- `test_copilot_chat.py`: Verify chat endpoint returns contextual responses
- `test_copilot_suggestions.py`: Verify suggestions are based on real user data

### Frontend Manual Testing
1. Navigate to `/coach`
2. Type: "How do I answer 'Tell me about yourself'?"
3. Verify AI provides STAR-method template
4. Click "Analyze my weak points"
5. Verify it references actual past sessions
6. Generate custom questions for "Google SWE"
7. Save a drafted answer to library

## Success Metrics
- 60% of users interact with coach within first week
- Average 3+ messages per conversation
- 40% of users save at least one answer to library
