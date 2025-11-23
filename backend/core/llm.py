import os
from openai import OpenAI
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional

# Load environment variables
load_dotenv()

class KimiThinkingClient:
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Kimi K2 Thinking client.

        Args:
            api_key: Moonshot AI API key. If not provided, reads from MOONSHOT_API_KEY env var.
        """
        self.api_key = api_key or os.getenv("MOONSHOT_API_KEY")
        if not self.api_key:
            raise ValueError("MOONSHOT_API_KEY not found. Please set it in .env or pass it to constructor.")

        self.client = OpenAI(
            api_key=self.api_key,
            base_url="https://api.moonshot.cn/v1",
        )
        self.model_name = "kimi-k2-thinking"  # Or specific version like 'kimi-k2-thinking-preview'

    def chat(self, messages: List[Dict[str, str]], temperature: float = 0.6) -> str:
        """
        Standard chat completion.
        """
        try:
            completion = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=temperature,
                timeout=30.0,
            )
            return completion.choices[0].message.content
        except Exception as e:
            return f"Error calling Kimi API: {str(e)}"

    def analyze_resume(self, resume_text: str) -> Dict[str, Any]:
        """
        Use Kimi K2 to analyze resume text and extract structured data.
        """
        system_prompt = """
        You are an expert technical recruiter. Analyze the following resume text.
        Extract:
        1. Key Skills (List)
        2. Project Experience (List of dicts with name, role, tech stack)
        3. Education (Degree, Major, School)

        Then, suggest 3 interview focus areas based on the resume's strengths and weaknesses.
        Return ONLY valid JSON.
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": resume_text}
        ]

        # In a real app, we might use 'response_format={"type": "json_object"}' if supported,
        # or rely on prompt engineering for JSON.
        return self.chat(messages, temperature=0.3)

    def generate_feedback(self, interview_log: str) -> str:
        """
        Generate a detailed interview feedback report.
        """
        system_prompt = """
        You are a senior interviewer. Based on the following interview transcript, provide a detailed evaluation.
        Include:
        - Technical Depth Score (0-100)
        - Communication Clarity Score (0-100)
        - Key Strengths
        - Areas for Improvement
        - Suggested Learning Path
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": interview_log}
        ]

        return self.chat(messages, temperature=0.7)

    def coach_on_interview(self, interview_log: str, student_question: str) -> str:
        """Answer a student's follow-up question as an interview coach.

        The model sees the interview transcript and a concrete question from the
        candidate (e.g. "Why was my answer to Q3 weak?" or "How can I improve my
        self-introduction?"). It should respond with practical, structured
        coaching advice.
        """
        system_prompt = """
        You are an experienced interview coach helping a student improve.

        You will receive:
        1) An interview transcript (questions and answers).
        2) A follow-up question from the student about how to improve.

        Please answer in a concise, actionable way. When possible:
        - Point out specific moments in the transcript that relate to the question.
        - Give concrete rewrite or example answers.
        - Suggest 2-3 short, clear improvement tips.
        """

        user_content = f"""Interview Transcript:\n{interview_log}\n\nStudent Question: {student_question}"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ]

        return self.chat(messages, temperature=0.6)

# Singleton instance for easy import
# kimi_client = KimiThinkingClient()
