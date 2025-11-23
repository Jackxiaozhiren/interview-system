import numpy as np
import logging
from collections import deque
import time

logger = logging.getLogger(__name__)

class AudioProcessor:
    def __init__(self):
        self.prev_volume = 0
        self.speech_threshold = 0.01
        
        # WPM Calculation
        self.syllable_peaks = deque(maxlen=50) # Store timestamps of peaks
        self.last_peak_time = 0
        self.peak_threshold = 0.05
        
        # Reaction Logic
        self.last_nod_time = 0
        self.speaking_start_time = 0
        self.is_speaking_sustained = False
        
        # Filler / Nudge State
        self.sustained_sound_duration = 0
        self.filler_threshold_seconds = 0.5
        
        # Advanced Coaching State
        self.silence_start_time = time.time()
        self.high_wpm_start_time = 0
        self.last_nudge_time = 0
        self.nudge_cooldown = 5.0 # Seconds between nudges

    def process_chunk(self, chunk: bytes) -> dict:
        """
        Process a raw audio chunk (assuming Float32).
        Returns a dictionary of features and potential nudges.
        """
        try:
            audio_data = np.frombuffer(chunk, dtype=np.float32)
            
            if len(audio_data) == 0:
                return {}

            # Calculate RMS (Volume)
            rms = np.sqrt(np.mean(audio_data**2))
            current_time = time.time()
            
            # --- WPM Estimation (Heuristic: Amplitude Peaks) ---
            # If volume rises significantly above threshold and wasn't high recently
            if rms > self.peak_threshold and (rms - self.prev_volume) > 0.01:
                if (current_time - self.last_peak_time) > 0.15: # Min 150ms between syllables
                    self.syllable_peaks.append(current_time)
                    self.last_peak_time = current_time
            
            # Calculate WPM based on peaks in last 5 seconds
            recent_peaks = [t for t in self.syllable_peaks if (current_time - t) < 5.0]
            # Approx 1.5 syllables per word
            estimated_wpm = (len(recent_peaks) / 1.5) * (60 / 5) if len(recent_peaks) > 2 else 0
            
            # --- Filler Word Detection (Heuristic: Sustained Low-Mid Volume) ---
            # "Umm" usually has steady volume, not too loud, not silent
            if 0.02 < rms < 0.2 and abs(rms - self.prev_volume) < 0.005:
                self.sustained_sound_duration += 0.1 # Approx chunk duration (assuming ~100ms chunks)
            else:
                self.sustained_sound_duration = 0
                
            is_filler = False
            if self.sustained_sound_duration > self.filler_threshold_seconds:
                is_filler = True
                self.sustained_sound_duration = 0 # Reset to avoid spam
            
            self.prev_volume = rms
            
            # --- Speaking State & Silence Detection ---
            is_speaking_now = rms > self.speech_threshold
            
            if is_speaking_now:
                self.silence_start_time = current_time # Reset silence timer
                if not self.is_speaking_sustained:
                    self.speaking_start_time = current_time
                    self.is_speaking_sustained = True
            else:
                self.is_speaking_sustained = False

            # --- Nudge Logic ---
            nudge = None
            
            # Only nudge if cooldown passed
            if (current_time - self.last_nudge_time) > self.nudge_cooldown:
                
                # 1. Volume Nudges
                if rms > 0.8: 
                    nudge = "Speaking loudly!"
                elif rms > 0.001 and rms < 0.02 and is_speaking_now: # Only if trying to speak
                    nudge = "Speak up a bit?"
                
                # 2. Pacing Nudge (Sustained High WPM)
                elif estimated_wpm > 160:
                    if self.high_wpm_start_time == 0:
                        self.high_wpm_start_time = current_time
                    elif (current_time - self.high_wpm_start_time) > 2.0: # Sustained for 2s
                        nudge = "Slow down (Fast WPM)"
                        self.high_wpm_start_time = 0 # Reset
                else:
                    self.high_wpm_start_time = 0
                
                # 3. Silence Breaker (Long Silence)
                # Only trigger if we have been silent for > 8s (allow thinking time)
                if not is_speaking_now and (current_time - self.silence_start_time) > 8.0:
                     # Don't nudge immediately, maybe just once
                     # For now, let's not spam "Silence"
                     pass 

                # 4. Filler Nudge
                if is_filler and not nudge:
                    nudge = "Avoid filler words (Umm...)"

                if nudge:
                    self.last_nudge_time = current_time

            # --- Reaction Logic (Active Listening) ---
            reaction = None

            if is_speaking_now:
                # Nod occasionally while user is speaking (every 5-8s)
                if (current_time - self.last_nod_time) > 6.0 and (current_time - self.speaking_start_time) > 2.0:
                    # Only nod if speaking steadily
                    reaction = "nod"
                    self.last_nod_time = current_time
            
            # Take notes if filler detected (simulating noting a mistake) or randomly after long speech
            if is_filler:
                reaction = "take_notes"

            return {
                "volume": float(rms),
                "is_speaking": is_speaking_now,
                "wpm": int(estimated_wpm),
                "filler_detected": is_filler,
                "nudge": nudge,
                "reaction": reaction
            }
            
        except Exception as e:
            logger.error(f"Error processing audio chunk: {e}")
            return {}
