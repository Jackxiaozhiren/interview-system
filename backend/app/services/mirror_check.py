import cv2
import numpy as np
from typing import Dict, List
from pydantic import BaseModel


class MirrorCheckFeedback(BaseModel):
    overall_score: float  # 0-100
    lighting_score: float
    framing_score: float
    background_score: float
    suggestions: List[str]
    status: str  # "excellent", "good", "needs_improvement"


def analyze_frame(image_data: np.ndarray) -> MirrorCheckFeedback:
    """
    Analyze a video frame for interview setup quality.
    
    Args:
        image_data: numpy array of the image (BGR format from CV2)
    
    Returns:
        MirrorCheckFeedback with scores and suggestions
    """
    suggestions = []
    
    # 1. Lighting Analysis (Brightness & Contrast)
    gray = cv2.cvtColor(image_data, cv2.COLOR_BGR2GRAY)
    mean_brightness = np.mean(gray)
    std_brightness = np.std(gray)
    
    # Ideal brightness: 100-160, Ideal std: 40-80
    if mean_brightness < 80:
        lighting_score = 40.0
        suggestions.append("增加光线：您的画面偏暗，建议打开更多灯光或面向窗户。")
    elif mean_brightness > 180:
        lighting_score = 50.0
        suggestions.append("减少过曝：画面过亮，尝试调整角度避免直射光源。")
    elif 100 <= mean_brightness <= 160:
        lighting_score = 95.0
    else:
        lighting_score = 75.0
    
    if std_brightness < 30:
        lighting_score *= 0.9
        suggestions.append("提高对比度：光线过于平淡，增加一些背光可以提升立体感。")
    elif std_brightness > 100:
        lighting_score *= 0.85
        suggestions.append("光线不均：避免强烈的明暗对比，使用柔和的扩散光源。")
    
    # 2. Face Detection & Framing
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    
    if len(faces) == 0:
        framing_score = 30.0
        suggestions.append("未检测到人脸：请确保您的脸部清晰可见且在画面中。")
    elif len(faces) > 1:
        framing_score = 60.0
        suggestions.append("检测到多张人脸：请确保背景中没有其他人。")
    else:
        (x, y, w, h) = faces[0]
        frame_height, frame_width = image_data.shape[:2]
        
        # Ideal: Face in upper-center third, taking up 15-30% of frame
        face_center_y = (y + h/2) / frame_height
        face_area_ratio = (w * h) / (frame_width * frame_height)
        
        framing_score = 100.0
        
        # Check vertical position (ideal: 0.3-0.5 from top)
        if face_center_y < 0.25:
            framing_score -= 15
            suggestions.append("头部位置过高：稍微调低摄像头或向下移动。")
        elif face_center_y > 0.55:
            framing_score -= 15
            suggestions.append("头部位置过低：稍微抬高摄像头或向上移动。")
        
        # Check size (ideal: 0.10-0.25)
        if face_area_ratio < 0.08:
            framing_score -= 20
            suggestions.append("距离过远：请靠近摄像头，让脸部更清晰。")
        elif face_area_ratio > 0.35:
            framing_score -= 15
            suggestions.append("距离过近：稍微后退一些，保持舒适的对话距离。")
    
    # 3. Background Analysis (Simplicity & Clutter)
    # Use edge detection to measure background "business"
    edges = cv2.Canny(gray, 50, 150)
    edge_density = np.sum(edges > 0) / edges.size
    
    if edge_density < 0.05:
        background_score = 95.0
    elif edge_density < 0.10:
        background_score = 85.0
    elif edge_density < 0.15:
        background_score = 65.0
        suggestions.append("背景稍显杂乱：尝试使用纯色墙面或虚化背景。")
    else:
        background_score = 45.0
        suggestions.append("背景过于复杂：建议使用简洁的背景，避免分散注意力。")
    
    # Overall Score (weighted average)
    overall_score = (
        lighting_score * 0.4 +
        framing_score * 0.4 +
        background_score * 0.2
    )
    
    # Status determination
    if overall_score >= 85:
        status = "excellent"
        if not suggestions:
            suggestions.append("画面设置完美！您已经准备好开始面试了。✨")
    elif overall_score >= 70:
        status = "good"
    else:
        status = "needs_improvement"
    
    return MirrorCheckFeedback(
        overall_score=round(overall_score, 1),
        lighting_score=round(lighting_score, 1),
        framing_score=round(framing_score, 1),
        background_score=round(background_score, 1),
        suggestions=suggestions,
        status=status
    )
