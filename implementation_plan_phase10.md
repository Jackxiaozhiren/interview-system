# Phase 10: System Design Architecture Board Implementation Plan

## Goal
Create a "System Design" interview mode where users can drag-and-drop components (Servers, Databases, Queues) to design architectures and receive AI feedback on scalability and reliability.

## Proposed Changes

### Frontend (`frontend/src`)

#### [NEW] `app/interview/design/page.tsx`
- Main layout for the system design interview.
- Layout: Toolbox (Left), Canvas (Center), Properties/Feedback (Right).

#### [NEW] `components/design/DesignCanvas.tsx`
- Interactive SVG/Canvas area.
- Handles mouse events for dragging nodes and drawing connections (lines) between them.
- State management for `nodes` (id, type, x, y, label) and `edges` (from, to).

#### [NEW] `components/design/Toolbox.tsx`
- Draggable items for standard system components:
    - Client (Mobile/Web)
    - Load Balancer
    - API Gateway
    - Service (Compute)
    - Database (SQL/NoSQL)
    - Cache (Redis)
    - Queue (Kafka/RabbitMQ)

#### [NEW] `components/design/ArchitectureFeedback.tsx`
- Displays AI analysis of the current design (e.g., "Single Point of Failure detected at Load Balancer").

### Backend (`backend/app`)

#### [NEW] `routers/design.py`
- `POST /design/analyze`: Accepts the graph data (nodes/edges), converts it to a textual description, and prompts the LLM to critique the architecture.

#### [MODIFY] `main.py`
- Register `design.router`.

## Verification Plan

### Automated Tests
- **Backend**: Create `test_design_flow.py` to verify the analysis endpoint accepts graph JSON and returns structured feedback.

### Manual Verification
1.  **Navigation**: Go to `/interview/design`.
2.  **Interaction**: Drag a "Client", "Load Balancer", and "Server" onto the canvas.
3.  **Connection**: Draw a line from Client -> LB -> Server.
4.  **Analysis**: Click "Analyze Architecture". Verify the AI recognizes the flow and offers feedback (e.g., "Good basic 3-tier setup").
