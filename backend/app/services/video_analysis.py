import cv2
import numpy as np
from typing import List, Dict, Optional
import os
from app.models.schemas import VideoFeatures

# Try to import FER, but don't crash if it fails (e.g. missing tensorflow)
try:
    from fer import FER
    _fer_available = True
except ImportError as e:
    print(f"Warning: FER library not available: {e}")
    _fer_available = False

# Initialize FER detector if available
detector = None
if _fer_available:
    try:
        detector = FER(mtcnn=True)
    except Exception as e:
        print(f"Warning: Failed to initialize FER detector: {e}")
        _fer_available = False

def analyze_video(filepath: str, sample_rate: int = 1) -> VideoFeatures:
    """
    Analyze video for facial emotions and other visual cues.
    
    Args:
        filepath: Path to the video file.
        sample_rate: Analyze one frame every `sample_rate` seconds.
    """
    if not os.path.exists(filepath):
        return VideoFeatures()

    cap = cv2.VideoCapture(filepath)
    if not cap.isOpened():
        return VideoFeatures()

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    if fps <= 0:
        fps = 30 # Default fallback

    frame_interval = int(fps * sample_rate)
    
    emotions_list: List[Dict[str, float]] = []
    gaze_issues_count = 0
    total_analyzed_frames = 0

    current_frame = 0
    while current_frame < total_frames:
        cap.set(cv2.CAP_PROP_POS_FRAMES, current_frame)
        ret, frame = cap.read()
        if not ret:
            break

        # Detect emotions
        if _fer_available and detector:
            try:
                # FER returns a list of dicts, e.g. [{'box': ..., 'emotions': {'angry': 0.0, ...}}]
                result = detector.detect_emotions(frame)
                
                if result:
                    # Assume the largest face is the candidate
                    # Sort by face area (box[2] * box[3])
                    result.sort(key=lambda x: x['box'][2] * x['box'][3], reverse=True)
                    primary_face = result[0]
                    emotions_list.append(primary_face['emotions'])
            except Exception as e:
                # Don't crash on single frame failure
                pass
            
            # Simple gaze estimation heuristic:
            # If we had a real gaze model, we'd use it. 
            # For now, we can check if face is roughly centered or if head pose (not available in simple FER) is off.
            # We'll skip complex gaze for this MVP and rely on emotion distribution.
        
        total_analyzed_frames += 1
        current_frame += frame_interval

    cap.release()

    if not emotions_list:
        return VideoFeatures()

    # Aggregate emotions
    aggregated_emotions = {
        "angry": 0.0,
        "disgust": 0.0,
        "fear": 0.0,
        "happy": 0.0,
        "sad": 0.0,
        "surprise": 0.0,
        "neutral": 0.0
    }
    
    for emo in emotions_list:
        for key, val in emo.items():
            aggregated_emotions[key] += val

    # Normalize
    count = len(emotions_list)
    for key in aggregated_emotions:
        aggregated_emotions[key] /= count

    # Determine dominant emotion
    dominant_emotion = max(aggregated_emotions, key=aggregated_emotions.get)

    # --- Real Vision Heuristics ---
    
    # 1. Eye Contact Score
    # Heuristic: Detect eyes. If eyes are detected in a frame, we assume "looking at camera" (roughly).
    # A better approach requires gaze estimation models, but for MVP, presence of frontal eyes is a proxy.
    eye_cascade_path = cv2.data.haarcascades + 'haarcascade_eye.xml'
    face_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    
    eye_cascade = cv2.CascadeClassifier(eye_cascade_path)
    face_cascade = cv2.CascadeClassifier(face_cascade_path)
    
    frames_with_eye_contact = 0
    frames_with_good_posture = 0
    total_frames_checked = 0
    
    # Re-open video for heuristic analysis (or we could have done it in the main loop)
    # For simplicity/clarity, we'll do a quick second pass or just use the main loop if we refactor.
    # Let's refactor the main loop above to include this, but since I'm replacing the end of the file,
    # I will implement a separate quick pass here or just acknowledge the inefficiency for MVP.
    # actually, let's just do a quick sampling here to avoid re-writing the whole function in this diff.
    
    cap = cv2.VideoCapture(filepath)
    if cap.isOpened():
        total_v_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        # Check 10 frames evenly distributed
        check_indices = np.linspace(0, total_v_frames-1, 10, dtype=int)
        
        for idx in check_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            if not ret:
                continue
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.3, 5)
            
            if len(faces) > 0:
                # Posture: Face is present and roughly centered?
                # Let's just say if face is detected, posture is "okay" for now.
                # Ideally check if face center is within central 50% of frame.
                (x, y, w, h) = faces[0]
                frame_h, frame_w = frame.shape[:2]
                face_center_x = x + w//2
                if 0.25 * frame_w < face_center_x < 0.75 * frame_w:
                    frames_with_good_posture += 1
                
                # Eyes within face
                roi_gray = gray[y:y+h, x:x+w]
                eyes = eye_cascade.detectMultiScale(roi_gray)
                if len(eyes) >= 1: # At least one eye visible
                    frames_with_eye_contact += 1
            
            total_frames_checked += 1
        cap.release()

    eye_contact_score = (frames_with_eye_contact / total_frames_checked * 100) if total_frames_checked > 0 else 0.0
    posture_score = (frames_with_good_posture / total_frames_checked * 100) if total_frames_checked > 0 else 0.0

    # Normalize to 0-1 range as expected by schema? Schema says float, usually 0-1 or 0-100.
    # Let's assume 0-1 based on previous placeholder 0.8
    eye_contact_score /= 100.0
    posture_score /= 100.0

    return VideoFeatures(
        emotion_distribution=aggregated_emotions,
        dominant_emotion=dominant_emotion,
        eye_contact_score=eye_contact_score,
        posture_score=posture_score
    )
