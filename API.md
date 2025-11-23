# API Specification

## Base URL
- **Development**: `http://localhost:8000`
- **Production**: `https://api.yourdomain.com`

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Obtain Token
```http
POST /auth/token
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=secretpassword
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

## Interview Sessions

### Create Session
```http
POST /interview/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "job_title": "Software Engineer",
  "job_description": "Full-stack developer position...",
  "interviewer_type": "Tech",
  "duration_minutes": 45
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "created",
  "started_at": null,
  "ended_at": null,
  "job_title": "Software Engineer",
  "job_description": "Full-stack developer position...",
  "interviewer_type": "Tech",
  "duration_minutes": 45
}
```

### Start Session
```http
POST /interview/sessions/{session_id}/start
Authorization: Bearer <token>
```

### List Sessions
```http
GET /interview/sessions
Authorization: Bearer <token>
```

### Get Session
```http
GET /interview/sessions/{session_id}
Authorization: Bearer <token>
```

---

## Media Upload

### Upload Video/Audio
```http
POST /interview/sessions/{session_id}/media?media_type=video
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary file data>
```

**Response:**
```json
{
  "id": "media-uuid",
  "session_id": "session-uuid",
  "media_type": "video",
  "filename": "interview_recording.webm",
  "created_at": "2025-11-22T12:00:00Z"
}
```

### List Media
```http
GET /interview/sessions/{session_id}/media
Authorization: Bearer <token>
```

---

## Analysis & Feedback

### Get Transcription
```http
POST /interview/media/{media_id}/transcribe
Authorization: Bearer <token>
```

**Response:**
```json
{
  "media_id": "media-uuid",
  "transcript": "This is the transcribed text from the audio/video..."
}
```

### Generate Report
```http
POST /interview/media/{media_id}/report
Authorization: Bearer <token>
```

**Response:**
```json
{
  "media_id": "media-uuid",
  "feedback": "Your answer was well-structured using the STAR method...",
  "audio_features": {
    "speech_rate": 145.2,
    "pause_ratio": 0.12,
    "filler_word_ratio": 0.03,
    "pitch_variance": 52.3,
    "emotion": "confident"
  },
  "video_features": {
    "eye_contact_score": 0.85,
    "smile_ratio": 0.42,
    "posture_score": 0.78,
    "dominant_emotion": "neutral",
    "emotion_distribution": {
      "happy": 0.45,
      "neutral": 0.40,
      "surprised": 0.10,
      "sad": 0.05
    }
  }
}
```

---

## Adaptive Questioning

### Get Next Question
```http
POST /interview/sessions/{session_id}/next-question
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "question-uuid",
  "content": "Can you tell me about a time when you had to debug a complex production issue?",
  "type": "behavioral"
}
```

---

## WebSocket - Real-time Analysis

### Connect to WebSocket
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/analysis/{session_id}');

ws.onopen = () => {
  console.log('Connected');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle nudges and metrics
};
```

### Server Messages

**Nudge Message:**
```json
{
  "type": "nudge",
  "message": "Speak up a bit?",
  "data": {
    "volume": 0.015,
    "is_speaking": true,
    "nudge": "Speak up a bit?"
  }
}
```

**Metrics Message:**
```json
{
  "type": "metrics",
  "data": {
    "volume": 0.45,
    "is_speaking": true,
    "nudge": null
  }
}
```

### Client to Server

Send Float32Array audio chunks:
```javascript
// Using ScriptProcessorNode
processor.onaudioprocess = (e) => {
  const inputData = e.inputBuffer.getChannelData(0);
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(inputData.buffer);
  }
};
```

---

## Error Responses

All error responses follow this format:
```json
{
  "detail": "Error description"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Unprocessable Entity (invalid data)
- `500` - Internal Server Error
- `503` - Service Unavailable (AI service down)

---

## Rate Limits

- **Anonymous**: 10 requests/minute
- **Authenticated**: 100 requests/minute
- **WebSocket**: 1 connection per user, max 100 concurrent connections

---

## Full API Documentation

Interactive Swagger docs available at:
- **Local**: http://localhost:8000/docs
- **Production**: https://api.yourdomain.com/docs

---

**API Version**: 1.0.0  
**Last Updated**: 2025-11-22
