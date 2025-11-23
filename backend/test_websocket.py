import asyncio
import websockets
import json
import numpy as np
import time

async def test_websocket():
    uri = "ws://localhost:8000/ws/analysis/test-session-id"
    async with websockets.connect(uri) as websocket:
        print("Connected to WebSocket")
        
        # 1. Send silence (should get low volume)
        silence = np.zeros(4096, dtype=np.float32).tobytes()
        await websocket.send(silence)
        
        # 2. Send "loud" noise (should trigger volume nudge)
        loud_noise = np.random.uniform(-1.0, 1.0, 4096).astype(np.float32).tobytes()
        await websocket.send(loud_noise)
        
        # 3. Send "sustained" sound for filler detection (mid volume, steady)
        # "Uhhh" simulation: steady amplitude around 0.1
        sustained_sound = (np.ones(4096) * 0.1).astype(np.float32).tobytes()
        
        print("Sending sustained sound for filler detection...")
        for _ in range(15): # Send for ~1.5 seconds (assuming ~100ms chunks)
            await websocket.send(sustained_sound)
            await asyncio.sleep(0.1)

        # Listen for responses
        try:
            while True:
                response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                data = json.loads(response)
                print(f"Received: {data['type']}")
                if data['type'] == 'nudge':
                    print(f"  Nudge: {data['message']}")
                elif data['type'] == 'metrics':
                    print(f"  Metrics: Vol={data['data']['volume']:.4f}, WPM={data['data'].get('wpm', 0)}")
        except asyncio.TimeoutError:
            print("No more messages (Timeout)")

if __name__ == "__main__":
    asyncio.run(test_websocket())
