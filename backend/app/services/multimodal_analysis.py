from typing import List, Optional
import librosa
import numpy as np
import os
from app.models.schemas import AudioFeatures

_FILLER_WORDS: List[str] = [
    "um",
    "uh",
    "like",
    "you know",
    "就是",
    "那个",
    "然后",
    "嗯",
    "呃",
]

def analyze_audio(filepath: str, transcript: str) -> AudioFeatures:
    """
    Extract audio features using Librosa and transcript analysis.
    """
    # 1. Text-based analysis (Filler words)
    text = (transcript or "").strip()
    filler_ratio = 0.0
    if text:
        words = text.split()
        num_words = len(words)
        
        filler_count = 0
        lower_text = text.lower()
        for fw in _FILLER_WORDS:
            if " " in fw:
                filler_count += lower_text.count(fw.lower())
            else:
                filler_count += sum(1 for w in words if w.lower() == fw.lower())
        
        if num_words > 0:
            filler_ratio = filler_count / num_words

    # 2. Audio signal analysis
    speech_rate = None
    pause_ratio = None
    volume_variance = None
    pitch_variance = None

    if filepath and os.path.exists(filepath):
        try:
            # Load audio (resample to 16k for speed)
            y, sr = librosa.load(filepath, sr=16000)
            duration = librosa.get_duration(y=y, sr=sr)
            
            # Speech Rate (words per minute)
            if duration > 0 and text:
                # Estimate word count (simple split)
                word_count = len(text.split())
                speech_rate = (word_count / duration) * 60
            
            # Pause Ratio (using silence detection)
            # top_db=20 means anything 20dB below max is considered silence
            non_silent_intervals = librosa.effects.split(y, top_db=20)
            non_silent_duration = sum(
                (end - start) / sr for start, end in non_silent_intervals
            )
            if duration > 0:
                pause_ratio = 1.0 - (non_silent_duration / duration)

            # Volume Variance (RMS energy)
            rms = librosa.feature.rms(y=y)[0]
            if len(rms) > 0:
                volume_variance = float(np.std(rms))

            # Pitch Variance (F0)
            # piptrack returns pitch and magnitude
            pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
            # Select pitches with high magnitude
            threshold = np.median(magnitudes)
            pitch_values = pitches[magnitudes > threshold]
            # Filter out 0s
            pitch_values = pitch_values[pitch_values > 0]
            
            if len(pitch_values) > 0:
                pitch_variance = float(np.std(pitch_values))

        except Exception as e:
            print(f"Error analyzing audio file {filepath}: {e}")

    return AudioFeatures(
        speech_rate=speech_rate,
        pause_ratio=pause_ratio,
        filler_word_ratio=filler_ratio,
        volume_variance=volume_variance,
        pitch_variance=pitch_variance,
        emotion=None, # Emotion from audio is complex, leaving for future or specialized model
    )

def analyze_audio_transcript(transcript: str) -> AudioFeatures:
    """Legacy wrapper for text-only analysis."""
    return analyze_audio(filepath="", transcript=transcript)
