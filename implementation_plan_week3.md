# Implementation Plan - Week 3: Technical Interview Mode & Performance Optimization

## Goal Description
Expand the interview system to support technical interviews with code challenges, while optimizing system performance through Redis caching. This enables the platform to serve software engineers preparing for coding interviews.

## User Review Required

> [!IMPORTANT]
> **Redis Dependency**: Redis will be added to the Docker stack for caching. Ensure your system has enough memory (recommend 512MB for Redis).

> [!NOTE]
> **Code Execution Security**: The code judge system will initially use AI-based evaluation (no actual code execution) for safety. Sandbox execution can be added later if needed.

## Proposed Changes

### Performance Optimization

#### [MODIFY] [docker-compose.yml](file:///g:/windsurf_interview%20system/docker-compose.yml)
- Already includes Redis service ✅
- No changes needed

#### [NEW] [backend/app/services/cache_manager.py](file:///g:/windsurf_interview%20system/backend/app/services/cache_manager.py)
- **Redis Integration**:
    - `get_cache(key: str)` - Retrieve cached data
    - `set_cache(key: str, value: any, ttl: int)` - Store with expiration
    - `invalidate_cache(pattern: str)` - Clear cache by pattern
- **Cache Strategies**:
    - User profile data (TTL: 15min)
    - Tier status (TTL: 5min)
    - Question bank (TTL: 1hour)
    - Match reports (TTL: 30min)

---

### Technical Interview Mode

#### [NEW] [backend/app/models/coding_problem.py](file:///g:/windsurf_interview%20system/backend/app/models/coding_problem.py)
- **ORM Models**:
    - `CodingProblemORM`: Problem definition
        - id, title, description, difficulty
        - test_cases (JSON), constraints
        - language_support, time_limit, memory_limit
    - `CodeSubmissionORM`: User submissions
        - user_id, problem_id, code, language
        - result, execution_time, created_at

#### [NEW] [backend/app/services/code_judge.py](file:///g:/windsurf_interview%20system/backend/app/services/code_judge.py)
- **AI-Based Code Evaluation**:
    - `evaluate_code(problem, code, language)` - Use Kimi AI to evaluate
    - Returns: correctness, time_complexity, space_complexity, feedback
- **Test Case Checking**:
    - Parse test cases from problem
    - Use AI to verify if code satisfies test cases
    - Generate detailed feedback

#### [NEW] [backend/app/routers/coding.py](file:///g:/windsurf_interview%20system/backend/app/routers/coding.py)
- **API Endpoints**:
    - `GET /coding/problems` - List all coding problems (filtered by difficulty)
    - `GET /coding/problems/{id}` - Get problem details
    - `POST /coding/submit` - Submit code for evaluation
    - `GET /coding/submissions` - User's submission history

---

### Frontend

#### [NEW] [frontend/src/components/CodeEditor.tsx](file:///g:/windsurf_interview%20system/frontend/src/components/CodeEditor.tsx)
- **Monaco Editor Integration**:
    - Support languages: Python, JavaScript, Java, C++
    - Syntax highlighting & IntelliSense
    - Theme: VS Code Dark
    - Font size controls
    - Line numbers

#### [NEW] [frontend/src/app/coding-interview/[problemId]/page.tsx](file:///g:/windsurf_interview%20system/frontend/src/app/coding-interview/[problemId]/page.tsx)
- **Code Interview Interface**:
    - Left panel: Problem description, test cases, constraints
    - Right panel: Code editor
    - Bottom panel: Test results, feedback
    - Submit button with loading state
    - Language selector

#### [MODIFY] [frontend/package.json](file:///g:/windsurf_interview%20system/frontend/package.json)
- Add dependency: `@monaco-editor/react`

---

## Verification Plan

### Performance Testing
- **Before Redis**:
    - Measure API response times
    - Note database query counts
- **After Redis**:
    - Verify cache hits
    - Measure improved response times
    - Target: 50%+ reduction in DB queries

### Coding Interview Testing
1. **Create Test Problem**:
    - Add a simple problem (e.g., "Two Sum")
    - Define test cases
2. **Test Coding Flow**:
    - Navigate to coding interview
    - Write solution in editor
    - Submit for evaluation
    - Verify AI feedback is relevant
3. **Test Multiple Languages**:
    - Submit Python solution
    - Submit JavaScript solution
    - Verify language-specific evaluation

### Success Criteria
- [ ] Redis cache working (verified via redis-cli)
- [ ] API response times improved by 30%+
- [ ] Code editor renders correctly
- [ ] Code submission returns AI evaluation
- [ ] Feedback is specific and actionable

---

## Implementation Timeline

### Day 1: Performance (Redis)
- Integrate Redis caching
- Cache key endpoints
- Verify performance improvements

### Day 2-3: Backend Coding System
- Create database models
- Build AI code judge
- Implement coding API

### Day 4-5: Frontend Code Editor
- Integrate Monaco
- Build interview interface
- Connect to backend

**Total**: 5 days for MVP

---

## Technical Decisions

1. **Why AI Judge vs Sandbox Execution?**
   - Security: No need to worry about malicious code
   - Speed: Instant feedback via LLM
   - Cost: No dedicated execution servers needed
   - Limitation: Cannot verify exact runtime/memory

2. **Redis Cache Strategy**:
   - Cache read-heavy data only
   - Short TTLs to avoid stale data
   - Invalidate on writes

3. **Monaco Over CodeMirror**:
   - Better TypeScript support
   - VS Code compatibility
   - Rich language features
