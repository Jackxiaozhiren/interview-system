"""
Text-to-Speech service using Microsoft Edge TTS (free).
"""
import asyncio
import edge_tts
import io
import logging
from typing import Optional

logger = logging.getLogger(__name__)


async def generate_speech_async(text: str, voice: str = "zh-CN-XiaoxiaoNeural") -> bytes:
    """
    Generate speech audio from text using Edge TTS.
    
    Args:
        text: Text to convert to speech
        voice: Voice ID (e.g., "zh-CN-XiaoxiaoNeural")
    
    Returns:
        Audio data in MP3 format as bytes
    """
    try:
        communicate = edge_tts.Communicate(text, voice)
        audio_data = io.BytesIO()
        
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data.write(chunk["data"])
        
        return audio_data.getvalue()
    
    except Exception as e:
        logger.error(f"TTS generation failed: {e}")
        raise


def generate_speech(text: str, voice: str = "zh-CN-XiaoxiaoNeural") -> bytes:
    """
    Synchronous wrapper for generate_speech_async.
    
    Args:
        text: Text to convert to speech
        voice: Voice ID
    
    Returns:
        Audio data in MP3 format as bytes
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(generate_speech_async(text, voice))
    finally:
        loop.close()


async def list_voices_async() -> list:
    """List all available voices from Edge TTS."""
    try:
        voices = await edge_tts.list_voices()
        return [
            {
                "name": v["Name"],
                "short_name": v["ShortName"],
                "gender": v["Gender"],
                "locale": v["Locale"]
            }
            for v in voices
        ]
    except Exception as e:
        logger.error(f"Failed to list voices: {e}")
        return []


# Commonly used voices for quick reference
RECOMMENDED_VOICES = {
    "zh_female_gentle": "zh-CN-XiaoxiaoNeural",      # 温柔女声
    "zh_male_professional": "zh-CN-YunxiNeural",     # 专业男声
    "zh_male_steady": "zh-CN-YunyangNeural",         # 沉稳男声
    "en_female_friendly": "en-US-JennyNeural",       # 友好英语女声
    "en_male_professional": "en-US-GuyNeural",       # 专业英语男声
    "en_male_serious": "en-US-ChristopherNeural",    # 严肃英语男声
}
