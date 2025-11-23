import sys
import os
# Add project root to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.llm import KimiThinkingClient

def test_kimi_connection():
    print("Testing Kimi K2 Thinking connection...")
    try:
        client = KimiThinkingClient()
        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello! Please simply reply with 'Connection Successful' if you can see this."}
        ]
        response = client.chat(messages)
        print(f"\nResponse from Kimi:\n{response}")

        if "Connection Successful" in response:
            print("\n[OK] Kimi API is working correctly!")
        else:
            print("\n[WARN] Received response, but content was unexpected.")

    except Exception as e:
        print(f"\n[ERROR] Error connecting to Kimi API: {e}")

if __name__ == "__main__":
    test_kimi_connection()
