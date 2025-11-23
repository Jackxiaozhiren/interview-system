from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import sys
import os
import logging
import time

# Add backend directory to python path to ensure module resolution works
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import Base, engine
from app.models import entities
from app.routers import interview, auth, payment, websocket, analytics, gamification, voice, tier, referral, coding, copilot

app = FastAPI(
    title="AI Mock Interview Agent API",
    description="Backend API for Multimodal AI Interview System powered by Kimi K2",
    version="0.1.0"
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-interview-backend")

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize badge definitions (run once)
from app.services.gamification import initialize_badge_definitions
try:
    from app.db import SessionLocal
    db = SessionLocal()
    initialize_badge_definitions(db)
    db.close()
except Exception as e:
    logger.warning(f"Could not initialize badges: {e}")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex='https?://.*',
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time_ms = (time.time() - start_time) * 1000
    logger.info(
        "%s %s -> %s (%.1f ms)",
        request.method,
        request.url.path,
        response.status_code,
        process_time_ms,
    )
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error for %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Internal server error. Please try again later.",
            },
        },
    )


# Include Routers
app.include_router(auth.router)
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import sys
import os
import logging
import time

# Add backend directory to python path to ensure module resolution works
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import Base, engine
from app.models import entities
from app.routers import interview, auth, payment, websocket, analytics, gamification, voice, tier, referral, coding, copilot

app = FastAPI(
    title="AI Mock Interview Agent API",
    description="Backend API for Multimodal AI Interview System powered by Kimi K2",
    version="0.1.0"
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-interview-backend")

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize badge definitions (run once)
from app.services.gamification import initialize_badge_definitions
try:
    from app.db import SessionLocal
    db = SessionLocal()
    initialize_badge_definitions(db)
    db.close()
except Exception as e:
    logger.warning(f"Could not initialize badges: {e}")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex='https?://.*',
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time_ms = (time.time() - start_time) * 1000
    logger.info(
        "%s %s -> %s (%.1f ms)",
        request.method,
        request.url.path,
        response.status_code,
        process_time_ms,
    )
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error for %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Internal server error. Please try again later.",
            },
        },
    )


# Include Routers
app.include_router(auth.router)
app.include_router(interview.router)
app.include_router(payment.router)
app.include_router(websocket.router)
app.include_router(analytics.router)
app.include_router(gamification.router)
app.include_router(voice.router)
app.include_router(tier.router, prefix="/api")
app.include_router(referral.router, prefix="/api")
app.include_router(coding.router, prefix="/api")
app.include_router(copilot.router, prefix="/api")

@app.get("/")
async def root():
    return {"status": "ok", "message": "AI Interview Agent API is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
