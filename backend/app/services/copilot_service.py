"""
AI Copilot service for personalized interview coaching.
"""
from typing import List, Dict, Optional
from app.services.kimi_client import KimiThinkingClient
import json


def analyze_user_history(user_sessions: List[Dict]) -> Dict[str, any]:
    """
    Analyze user's past interview sessions to identify patterns and weak points.
    
    Args:
        user_sessions: List of session dictionaries with feedback and scores
        
    Returns:
        Dictionary with:
        - weak_areas: List of skills to improve
        - strong_areas: List of skills user excels at
        - recommendations: Specific actionable tips
    """
    if not user_sessions:
        return {
            "weak_areas": [],
            "strong_areas": [],
            "recommendations": ["Complete your first interview to get personalized feedback!"]
        }
    
    # Simple heuristic analysis
    weak_areas = []
    strong_areas = []
    
    # Aggregate scores across sessions
    avg_scores = {}
    for session in user_sessions:
        if "dimensions" in session:
            for dim in session["dimensions"]:
                name = dim["name"]
                score = dim["score"]
                if name not in avg_scores:
                    avg_scores[name] = []
                avg_scores[name].append(score)
    
    # Calculate averages
    for skill, scores in avg_scores.items():
        avg = sum(scores) / len(scores)
        if avg < 60:
            weak_areas.append(skill)
        elif avg >= 80:
            strong_areas.append(skill)
    
    # Generate recommendations
    recommendations = []
    if "结构化表达" in weak_areas or "Structured Expression" in weak_areas:
        recommendations.append("Practice using the STAR method (Situation, Task, Action, Result) in your answers")
    if "表达清晰度" in weak_areas or "Clarity" in weak_areas:
        recommendations.append("Record yourself and listen for filler words like 'um', 'uh', '那个'")
    if not weak_areas:
        recommendations.append("Great job! Focus on consistency and tackling harder questions")
    
    return {
        "weak_areas": weak_areas,
        "strong_areas": strong_areas,
        "recommendations": recommendations
    }


def generate_chat_response(
    user_message: str,
    conversation_history: List[Dict],
    user_context: Optional[Dict] = None,
    kimi_client: KimiThinkingClient = None
) -> str:
    """
    Generate AI response to user's chat message.
    
    Args:
        user_message: User's input message
        conversation_history: Previous messages [{role, content}]
        user_context: Optional context about user (weak areas, etc.)
        kimi_client: KimiThinkingClient instance
        
    Returns:
        AI response string
    """
    if not kimi_client:
        kimi_client = KimiThinkingClient()
    
    # Build context-aware system prompt
    system_prompt = """You are an expert interview coach helping job seekers prepare for interviews.
Your role is to:
1. Provide specific, actionable advice
2. Use the STAR method for behavioral questions
3. Be encouraging but honest
4. Reference the user's past performance when relevant
"""
    
    if user_context and user_context.get("weak_areas"):
        system_prompt += f"\n\nUser's areas for improvement: {', '.join(user_context['weak_areas'])}"
    
    # Build conversation context
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(conversation_history[-5:])  # Last 5 messages for context
    messages.append({"role": "user", "content": user_message})
    
    # Generate response
    try:
        # Format for Kimi (which only accepts a single prompt)
        full_prompt = f"{system_prompt}\n\nConversation:\n"
        for msg in messages[1:]:  # Skip system
            full_prompt += f"{msg['role']}: {msg['content']}\n"
        
        response = kimi_client.chat(full_prompt)
        return response.strip()
    except Exception as e:
        return f"I apologize, but I encountered an error: {str(e)}. Please try rephrasing your question."


def generate_answer_template(question: str, context: str = "", kimi_client: KimiThinkingClient = None) -> str:
    """
    Generate a STAR-method answer template for a given question.
    
    Args:
        question: The interview question
        context: Optional context about user's background
        kimi_client: KimiThinkingClient instance
        
    Returns:
        Structured answer template
    """
    if not kimi_client:
        kimi_client = KimiThinkingClient()
    
    prompt = f"""Generate a STAR-method answer template for this interview question:
Question: "{question}"

{f"Candidate context: {context}" if context else ""}

Provide a structured template with placeholders for:
- Situation: [Brief context]
- Task: [Your responsibility]
- Action: [What you did, step by step]
- Result: [Quantifiable outcome]

Make it specific and actionable."""
    
    try:
        response = kimi_client.chat(prompt)
        return response.strip()
    except Exception as e:
        # Fallback template
        return f"""STAR Template for: "{question}"

**Situation**: [Describe the context - when and where did this happen?]

**Task**: [What was your specific responsibility or challenge?]

**Action**: [What steps did you take? Be specific]
- Step 1: [Detail]
- Step 2: [Detail]
- Step 3: [Detail]

**Result**: [What was the outcome? Include numbers if possible]
- Measurable impact: [X% improvement, $Y saved, etc.]
- What you learned: [Key takeaway]
"""


def generate_practice_questions(role: str, company: str = "", difficulty: str = "medium", count: int = 5) -> List[str]:
    """
    Generate custom practice questions based on target role and company.
    
    Args:
        role: Target job role (e.g., "Software Engineer")
        company: Optional company name
        difficulty: easy, medium, hard
        count: Number of questions to generate
        
    Returns:
        List of interview questions
    """
    # This could use LLM in production, but for MVP use curated templates
    questions_bank = {
        "behavioral": [
            "Tell me about a time when you had to work under pressure",
            "Describe a situation where you had conflict with a team member",
            "Give me an example of a goal you set and achieved",
            "Tell me about a time you failed and what you learned",
            "Describe your most challenging project"
        ],
        "technical": [
            "Explain how you would design a scalable system for X",
            "What's your approach to debugging a complex issue?",
            "How do you stay updated with new technologies?",
            "Describe your code review process",
            "What's the most interesting technical problem you've solved?"
        ]
    }
    
    # Simple selection based on difficulty
    all_questions = questions_bank["behavioral"] + questions_bank["technical"]
    
    # In production, this would call LLM with:
    # f"Generate {count} {difficulty} interview questions for {role} at {company}"
    
    return all_questions[:count]
