"""
AI-powered code judge system using Kimi AI.
"""
from app.services.kimi_client import KimiThinkingClient
import json
import logging

logger = logging.getLogger(__name__)


def evaluate_code(problem: dict, code: str, language: str) -> dict:
    """
    Evaluate code submission using AI (Kimi).
    
    Args:
        problem: Problem definition with test_cases
        code: User's code submission
        language: Programming language (python, javascript, java, cpp)
    
    Returns:
        dict with:
            - status: accepted, wrong_answer, runtime_error
            - pass_rate: 0.0 to 1.0
            - feedback: Detailed AI feedback
            - time_complexity: Estimated time complexity
            - space_complexity: Estimated space complexity
    """
    kimi = KimiThinkingClient()
    
    # Build evaluation prompt
    prompt = f"""You are an expert code reviewer for technical interviews.

**Problem**: {problem['title']}
{problem['description']}

**Test Cases**:
{json.dumps(problem['test_cases'], indent=2,ensure_ascii=False)}

**Candidate's {language.upper()} Solution**:
```{language}
{code}
```

**Your Task**:
1. Analyze if the code correctly solves the problem
2. Check if it would pass all test cases
3. Evaluate time and space complexity
4. Provide constructive feedback

**Return JSON format**:
{{
    "status": "accepted" | "wrong_answer" | "runtime_error",
    "pass_rate": 0.0-1.0,
    "feedback": "Detailed feedback explaining correctness, edge cases, and improvements",
    "time_complexity": "O(...)",
    "space_complexity": "O(...)",
    "test_results": [
        {{"case": 1, "passed": true, "explanation": "..."}}
    ]
}}

Be specific and educational in your feedback."""

    try:
        response = kimi.chat(prompt)
        
        # Parse JSON response
        start_idx = response.find('{')
        end_idx = response.rfind('}') + 1
        
        if start_idx != -1 and end_idx > start_idx:
            json_str = response[start_idx:end_idx]
            result = json.loads(json_str)
            
            return {
                "status": result.get("status", "wrong_answer"),
                "pass_rate": result.get("pass_rate", 0.0),
                "feedback": result.get("feedback", ""),
                "time_complexity": result.get("time_complexity", "Unknown"),
                "space_complexity": result.get("space_complexity", "Unknown"),
                "test_results": result.get("test_results", [])
            }
        else:
            # Fallback parsing
            return {
                "status": "wrong_answer",
                "pass_rate": 0.0,
                "feedback": response,
                "time_complexity": "Unknown",
                "space_complexity": "Unknown",
                "test_results": []
            }
    
    except Exception as e:
        logger.error(f"Code evaluation error: {e}")
        return {
            "status": "runtime_error",
            "pass_rate": 0.0,
            "feedback": f"Evaluation failed: {str(e)}",
            "time_complexity": "Unknown",
            "space_complexity": "Unknown",
            "test_results": []
        }


def generate_hints(problem: dict, code: str, language: str) -> list:
    """
    Generate hints for a coding problem based on user's attempt.
    
    Args:
        problem: Problem definition
        code: User's partial/incorrect code
        language: Programming language
    
    Returns:
        list of hints
    """
    kimi = KimiThinkingClient()
    
    prompt = f"""The candidate is stuck on this coding problem:

**Problem**: {problem['title']}
{problem['description']}

**Their current {language} code**:
```{language}
{code}
```

Generate 3 progressive hints (from gentle to more specific) to help them solve it without giving away the complete solution.

Return as JSON array:
["Hint 1: ...", "Hint 2: ...", "Hint 3: ..."]"""

    try:
        response = kimi.chat(prompt)
        # Parse JSON array
        start = response.find('[')
        end = response.rfind(']') + 1
        if start != -1:
            hints = json.loads(response[start:end])
            return hints[:3]
        return ["Consider the problem constraints", "Think about the data structure", "Break down the problem into steps"]
    except:
        return ["Try a different approach", "Review the test cases", "Consider edge cases"]
