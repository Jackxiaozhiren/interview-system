# Phase 9: Technical Coding Arena Implementation Plan

## Goal
Implement a fully functional coding interview environment ("The Arena") where users can solve technical problems with a real-time code editor, test execution, and AI-powered hints.

## Proposed Changes

### Frontend (`frontend/src`)

#### [NEW] `app/interview/coding/page.tsx`
- Main layout for the coding interview.
- Split pane design: Left (Problem Description), Right (Code Editor + Output).
- Fetches list of problems on load (or a specific problem if ID provided).

#### [NEW] `components/coding/CodeEditor.tsx`
- Wrapper around `@monaco-editor/react`.
- Handles theme (vs-dark), language switching, and value updates.

#### [NEW] `components/coding/ProblemPanel.tsx`
- Displays problem title, difficulty badge, description (Markdown), and examples.

#### [NEW] `components/coding/OutputPanel.tsx`
- Displays execution status (Running, Success, Error).
- Shows test case results (Pass/Fail) and console output.

#### [NEW] `components/coding/ControlBar.tsx`
- Actions: "Run Code", "Submit", "Get Hint".
- Language selector dropdown.

### Backend (`backend/app`)
- *No major changes required.* The `coding.py` router is already implemented.
- Ensure `seed_coding_problems.py` can be run to populate the database.

## Verification Plan

### Automated Tests
- **Backend**: Create `test_coding_flow.py` to verify `list_problems`, `get_problem`, and `submit_code` endpoints.

### Manual Verification
1.  **Navigation**: Go to `/interview/coding`.
2.  **Problem Load**: Verify the problem list loads and clicking one opens the editor.
3.  **Editor**: Type a simple Python solution (e.g., `print("Hello")` or `return a + b`).
4.  **Execution**: Click "Run Code". Verify the backend evaluates it and returns results.
5.  **Submission**: Click "Submit". Verify it records the submission.
6.  **Hints**: Click "Get Hint" and verify AI response.
