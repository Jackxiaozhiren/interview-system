import unittest
import numpy as np
import time
from app.services.audio_processor import AudioProcessor

class TestAdvancedAudioProcessor(unittest.TestCase):
    def setUp(self):
        self.processor = AudioProcessor()

    def test_sustained_high_wpm_nudge(self):
        # Simulate high volume (speech)
        chunk = np.random.normal(0, 0.5, 4096).astype(np.float32).tobytes()
        
        # Force high WPM state by manually adding peaks
        current_time = time.time()
        for i in range(10):
            self.processor.syllable_peaks.append(current_time - (i * 0.2)) # 5 peaks/sec = 300 peaks/min ~ 200 WPM
        
        # Process chunks for > 2 seconds to trigger sustained logic
        nudge_triggered = False
        for _ in range(25): # 2.5 seconds (assuming 0.1s per chunk)
            result = self.processor.process_chunk(chunk)
            if result.get("nudge") == "Slow down (Fast WPM)":
                nudge_triggered = True
                break
            time.sleep(0.1)
            
        self.assertTrue(nudge_triggered, "Should trigger 'Slow down' nudge after sustained high WPM")

    def test_silence_detection(self):
        # Simulate silence
        chunk = np.zeros(4096, dtype=np.float32).tobytes()
        
        # Reset silence timer
        self.processor.silence_start_time = time.time() - 9.0 # 9 seconds ago
        
        # Process one chunk
        result = self.processor.process_chunk(chunk)
        
        # Note: In current implementation, we decided to pass on silence nudge for now
        # So we expect NO nudge, but we want to ensure no crash
        self.assertIsNone(result.get("nudge"))

if __name__ == '__main__':
    unittest.main()
