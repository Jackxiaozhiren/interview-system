# 🔧 Troubleshooting & FAQ

## Common Issues

### 1. WebSocket Connection Failed
**Symptom**: Real-time HUD not updating, "Connecting..." stuck on screen.
**Fix**:
- Ensure backend is running: `python -m uvicorn main:app ...`
- Check browser console for WS errors.
- Verify `NEXT_PUBLIC_WS_URL` in `.env` matches backend (e.g., `ws://localhost:8000`).

### 2. Audio/Video Not Working
**Symptom**: Camera blank or "Permission Denied".
**Fix**:
- Check browser permissions for Camera/Microphone.
- Ensure no other app (Zoom, Teams) is using the camera.
- Restart browser.

### 3. TTS Voice Not Playing
**Symptom**: Interviewer is silent.
**Fix**:
- Check backend logs for `edge-tts` errors.
- Ensure `edge-tts` is installed: `pip install edge-tts`.
- Check system volume.

### 4. Coding Judge Timeout
**Symptom**: "Evaluating..." spins forever.
**Fix**:
- Check backend logs. Kimi API might be slow or timed out.
- Retry submission.
- Ensure `KIMI_API_KEY` is set correctly in `.env`.

### 5. Redis Connection Error
**Symptom**: Backend logs show "Redis not available".
**Fix**:
- Ensure Redis container is running: `docker-compose up -d redis`.
- If running locally without Docker, install Redis or ignore (caching will be disabled).

---

## Technical FAQ

**Q: How does the AI Judge work?**
A: It sends the problem description, test cases, and user code to the Kimi LLM with a specific system prompt to evaluate correctness and complexity.

**Q: Is the video recorded?**
A: Yes, the frontend uses `MediaRecorder` API to record chunks and streams them to the backend (or uploads as a blob at the end).

**Q: How is WPM calculated?**
A: We use the Web Speech API (or a backend whisper model stream) to transcribe text, then calculate words per minute based on timestamps.

**Q: Can I add more coding languages?**
A: Yes, update `CodingProblemORM`'s `language_support` and the `CodeEditor` component's language mapping.

---

## Support Contacts
- **Tech Lead**: [Your Name]
- **Docs**: See `DEPLOYMENT_GUIDE.md`
