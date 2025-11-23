# 🎬 AI Mock Interview System - Demo Script

## 🎯 Demo Objective
Showcase the complete user journey from registration to technical interview, highlighting the unique "Multimodal Analysis" and "AI Coaching" features.

## ⏱️ Duration: 5-7 Minutes

---

## 1️⃣ Opening & Context (30s)
**Speaker**: "Welcome to the AI Mock Interview System. Today I'll show you how we use multimodal AI to help candidates master both behavioral and technical interviews."

**Screen**: Landing Page / Login Screen

---

## 2️⃣ The "Green Room" Setup (1 min)
**Action**: Log in and go to `/interview/setup`.
**Key Talking Points**:
- "First, we set the context. I'm uploading my resume and pasting a JD for a Senior Frontend role."
- "The system analyzes the match instantly." (Click 'Generate Report')
- "Here's the Match Report - it tells me my strengths and gaps *before* I even start."
- "We also check tech and reduce anxiety with this breathing exercise."

---

## 3️⃣ Behavioral Interview (Live Mode) (2 min)
**Action**: Start Interview.
**Key Talking Points**:
- "This is the immersive interview interface."
- "Meet our AI Interviewer. She speaks naturally using Edge TTS." (Let it ask a question)
- **Demo Feature**: "Watch the HUD in the corner. If I speak too fast or use filler words like 'um', it tracks them in real-time."
- **Demo Feature**: "I'll answer this question..." (Speak a short answer)
- "The AI listens and generates a relevant follow-up question, just like a real human."

---

## 4️⃣ The "Game Tape" Review (1.5 min)
**Action**: End Interview -> Go to Review Page.
**Key Talking Points**:
- "This is where the magic happens. We call it the 'Game Tape'."
- "See this timeline? It marks exactly where I hesitated or smiled."
- "I can click 'Fix My Answer' to have the AI rewrite my response using the STAR method." (Click button)
- "It's not just a score; it's actionable coaching."

---

## 5️⃣ Technical Interview (1 min)
**Action**: Go to `/coding-interview`.
**Key Talking Points**:
- "For engineers, we have a dedicated coding mode."
- "I can choose a problem like 'Two Sum'."
- "This is a full Monaco editor - supports Python, JS, Java, C++."
- "I'll submit a solution..." (Submit code)
- "The AI Judge evaluates correctness, time complexity, and gives detailed feedback instantly."

---

## 6️⃣ Growth & Gamification (30s)
**Action**: Go to `/gamification`.
**Key Talking Points**:
- "To keep users motivated, we have a full XP and Badge system."
- "I just leveled up and earned the 'Ice Breaker' badge."
- "We also have a Freemium model - free users get 3 interviews/month."

---

## 7️⃣ Closing (30s)
**Speaker**: "That's the AI Mock Interview System. A complete platform for interview mastery. Ready for questions?"

---

## 💡 Demo Tips
- **Pre-load Data**: Have a user account with some history populated so the charts look good.
- **Audio**: Ensure system audio is shared for the TTS demo.
- **Backup**: Keep the `seed_coding_problems.py` script handy if you need to reset coding data.
