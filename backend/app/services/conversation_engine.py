"""
Conversation engine for dynamic follow-up question generation.
"""
from app.services.kimi_client import KimiThinkingClient
from app.models.interviewer_personality import get_personality
import logging
import json

logger = logging.getLogger(__name__)


def generate_follow_up_question(
    original_question: str,
    candidate_answer: str,
    personality_id: str = "professional",
    kimi_client: KimiThinkingClient = None
) -> dict:
    """
    Generate a contextual follow-up question based on the candidate's answer.
    
    Args:
        original_question: The original interview question
        candidate_answer: The candidate's answer to the original question
        personality_id: Interviewer personality (friendly, professional, challenging)
        kimi_client: KimiThinkingClient instance
    
    Returns:
        dict with:
            - follow_up_question: The generated follow-up question
            - rationale: Why this follow-up was chosen
    """
    if not kimi_client:
        kimi_client = KimiThinkingClient()
    
    personality = get_personality(personality_id)
    
    # Build prompt for Kimi
    prompt = f"""You are an experienced interviewer with the following style: {personality['tone']}.

The candidate was asked: "{original_question}"

The candidate answered: "{candidate_answer}"

Your task: Generate ONE specific, contextual follow-up question to dig deeper.

Guidelines:
- {personality['follow_up_style']}
- Focus on a specific part of their answer that needs more detail
- Keep the question concise and clear
- Ask for concrete examples or clarification
- Do NOT ask multiple questions at once

Return your response as JSON with this structure:
{{
    "follow_up_question": "Your follow-up question here",
    "rationale": "Brief explanation of why you're asking this"
}}"""

    try:
        response = kimi_client.chat(prompt)
        
        # Try to parse JSON from response
        try:
            # Find JSON in the response
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = response[start_idx:end_idx]
                result = json.loads(json_str)
                return {
                    "follow_up_question": result.get("follow_up_question", "").strip(),
                    "rationale": result.get("rationale", "").strip()
                }
        except json.JSONDecodeError:
            logger.warning("Failed to parse JSON from Kimi response, using fallback")
        
        # Fallback: use the response as-is
        return {
            "follow_up_question": response.strip(),
            "rationale": "Generated follow-up based on candidate's response"
        }
    
    except Exception as e:
        logger.error(f"Failed to generate follow-up question: {e}")
        # Fallback question
        return {
            "follow_up_question": "能详细说说这个经历中你具体做了什么吗？",
            "rationale": "Fallback question due to generation error"
        }


def should_ask_follow_up(answer_length: int, question_count: int) -> bool:
    """
    Decide if a follow-up question should be asked.
    
    Args:
        answer_length: Length of candidate's answer in characters
        question_count: Number of questions already asked in this session
    
    Returns:
        bool: True if follow-up should be asked
    """
    # Don't ask too many follow-ups (max 2 per main question)
    if question_count > 5:  # Assuming we start with ~3 main questions, limit total to ~6
        return False
    
    # If answer is very short, ask follow-up
    if answer_length < 50:
        return True
    
    # For medium answers, 50% chance
    if answer_length < 200:
        import random
        return random.random() > 0.5
    
    # Long answers don't need follow-up
    return False
