from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.services.audio_processor import AudioProcessor
import logging
import json

router = APIRouter()
logger = logging.getLogger(__name__)

@router.websocket("/ws/analysis/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    processor = AudioProcessor()
    
    try:
        while True:
            # Receive audio chunk (bytes)
            data = await websocket.receive_bytes()
            
            # Process audio
            result = processor.process_chunk(data)
            
            # If there's a nudge or significant data, send back
            if result.get("nudge"):
                await websocket.send_json({
                    "type": "nudge",
                    "message": result["nudge"],
                    "data": result
                })
            elif result.get("reaction"):
                await websocket.send_json({
                    "type": "reaction",
                    "reaction": result["reaction"],
                    "data": result
                })
            elif result.get("is_speaking"):
                 # Optional: Send volume updates for visualization if needed
                 # To save bandwidth, maybe only send every N frames or if change is significant
                 await websocket.send_json({
                    "type": "metrics",
                    "data": result
                })
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except:
            pass
