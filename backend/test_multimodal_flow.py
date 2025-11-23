import os
import sys
import numpy as np
import cv2
import soundfile as sf

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.services.video_analysis import analyze_video
from app.services.multimodal_analysis import analyze_audio

def create_dummy_media():
    os.makedirs("temp_test", exist_ok=True)
    
    # 1. Create dummy audio (sine wave)
    sr = 16000
    t = np.linspace(0, 3, sr * 3)
    y = 0.5 * np.sin(2 * np.pi * 440 * t)
    audio_path = "temp_test/test_audio.wav"
    sf.write(audio_path, y, sr)
    
    # 2. Create dummy video (black frames)
    video_path = "temp_test/test_video.mp4"
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(video_path, fourcc, 20.0, (640, 480))
    for _ in range(60): # 3 seconds
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        # Draw a "face" (white rectangle) to trigger detection if possible, 
        # though FER might need a real face. 
        # Let's just test the pipeline runs, even if no face detected.
        cv2.rectangle(frame, (200, 150), (440, 350), (255, 255, 255), -1)
        out.write(frame)
    out.release()
    
    return audio_path, video_path

def test_analysis():
    print("Creating dummy media...")
    audio_path, video_path = create_dummy_media()
    
    print(f"Testing Audio Analysis on {audio_path}...")
    audio_feats = analyze_audio(audio_path, "This is a test transcript with some filler words like um and uh.")
    print("Audio Features:", audio_feats)
    assert audio_feats.speech_rate is not None
    assert audio_feats.filler_word_ratio > 0
    
    print(f"Testing Video Analysis on {video_path}...")
    # Note: FER might print warnings if no face found, which is expected for dummy video
    video_feats = analyze_video(video_path, sample_rate=1)
    print("Video Features:", video_feats)
    # We expect empty or default features if no face detected, but function should not crash
    
    print("Test Complete!")

if __name__ == "__main__":
    test_analysis()
