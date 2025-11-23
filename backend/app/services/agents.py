import json
from typing import List, Optional

from pydantic import ValidationError

from core.llm import KimiThinkingClient
from app.models.schemas import (
    ResumeAnalysisResponse,
    ResumeAnalysis,
    Skill,
    ProjectExperience,
    Education,
    InterviewFocusArea,
    QuestionGenerationRequest,
    InterviewQuestion,
    ResumeAdviceResponse,
    AudioFeatures,
    VideoFeatures,
)


def _strip_json_wrappers(raw: str) -> str:
    """Remove common Markdown code fences from LLM JSON output."""
    text = raw.strip()
    if "```json" in text:
        text = text.split("```json", 1)[1]
        text = text.split("```", 1)[0]
        return text.strip()
    if text.startswith("```") and text.endswith("```"):
        return text.strip("`\n ")
    return text


def analyze_resume_agent(
    client: KimiThinkingClient,
    resume_text: str,
) -> ResumeAnalysisResponse:
    """Use Kimi to analyze a resume and return structured analysis + focus areas.

    This centralizes the prompt and JSON parsing so that API routes only need to
    handle HTTP concerns and error translation.
    """
    # 为避免上下文过长导致 LLM 调用过慢，这里对简历内容做适度截断
    resume_snippet = resume_text[:4000]

    prompt_content = f"""
        Please analyze the following resume text and return a JSON object EXACTLY matching this structure:
        {{
            "analysis": {{
                "skills": [{{"name": "Skill Name", "category": "Category"}}],
                "projects": [{{"name": "Project Name", "role": "Role", "tech_stack": ["Tech1", "Tech2"], "description": "Brief desc"}}],
                "education": [{{"degree": "Degree", "major": "Major", "school": "School", "year": "Year"}}],
                "summary": "Professional summary"
            }},
            "focus_areas": [
                {{"area": "Focus Area Name", "reason": "Why this is important", "difficulty_level": "Mid"}}
            ]
        }}

        Resume Text:
        {resume_snippet}
        """

    messages = [
        {
            "role": "system",
            "content": "You are a JSON-speaking API. Output ONLY valid JSON. No markdown, no commentary.",
        },
        {"role": "user", "content": prompt_content},
    ]

    raw = client.chat(messages, temperature=0.2)

    # 如果底层 Kimi 调用失败，client.chat 会返回包含错误信息的字符串。
    # 为了保证整体流程可用，这里回退到一个基于规则的本地简易分析。
    if raw.startswith("Error calling Kimi API:"):
        return _fallback_resume_analysis(resume_snippet, raw)

    cleaned = _strip_json_wrappers(raw)
    data = json.loads(cleaned)
    return ResumeAnalysisResponse(**data)


def _fallback_resume_analysis(resume_text: str, error_message: str) -> ResumeAnalysisResponse:
    """当 Kimi 不可用时的本地占位分析。

    目标：
    - 结构上兼容 ResumeAnalysisResponse，保证前端可以正常展示。
    - 不依赖外部 API，仅用简单规则从文本中提取一些关键信息。
    """

    lower = resume_text.lower()
    keyword_map = {
        "python": "Python",
        "sql": "SQL",
        "excel": "Excel",
        "pandas": "Pandas",
        "java ": "Java",
        "c++": "C++",
        "javascript": "JavaScript",
        "vue": "Vue",
        "react": "React",
        "fastapi": "FastAPI",
        "django": "Django",
    }

    detected_skills: List[Skill] = []
    for needle, label in keyword_map.items():
        if needle in lower:
            detected_skills.append(Skill(name=label, category="Keyword"))

    # 简单地用前几行作为概要
    lines = [ln.strip() for ln in resume_text.splitlines() if ln.strip()]
    summary_source = "\n".join(lines[:6]) if lines else ""
    summary = summary_source[:400] if summary_source else "本地占位分析：AI 服务暂时不可用，根据文本内容给出一个大致概要。"

    analysis = ResumeAnalysis(
        skills=detected_skills,
        projects=[],
        education=[],
        summary=summary,
    )

    focus_areas = [
        InterviewFocusArea(
            area="通用技术与表达能力",
            reason="Kimi AI 服务当前不可用，已根据简历中的关键词为你推荐一个通用练习方向。原始错误信息："
            + error_message,
            difficulty_level="Mid",
        )
    ]

    return ResumeAnalysisResponse(analysis=analysis, focus_areas=focus_areas)


def generate_questions_agent(
    client: KimiThinkingClient,
    req: QuestionGenerationRequest,
) -> List[InterviewQuestion]:
    """Generate interview questions based on resume, focus area and job description."""
    prompt_content = f"""
    Generate 3 interview questions for a candidate based on the following context:

    Resume Summary: {req.resume_text[:500]}... (truncated)
    Focus Area: {req.focus_area or "General Competence"}
    Job Description: {req.job_description or "Generic Software Engineer"}

    Return a JSON array of objects with this structure:
    [
        {{
            "id": "unique_id_1",
            "content": "Question text",
            "type": "Technical",
            "difficulty": "Mid",
            "expected_keywords": ["keyword1", "keyword2"]
        }}
    ]
    """

    messages = [
        {
            "role": "system",
            "content": "You are a technical interviewer. Output ONLY valid JSON array.",
        },
        {"role": "user", "content": prompt_content},
    ]

    raw = client.chat(messages, temperature=0.7)

    # 如果底层 Kimi 调用失败，client.chat 会返回包含错误信息的字符串。
    # 这里同样增加一个本地兜底逻辑，避免接口返回 500。
    if raw.startswith("Error calling Kimi API:"):
        return _fallback_questions(req, raw)

    try:
        cleaned = _strip_json_wrappers(raw)
        data = json.loads(cleaned)
        return [InterviewQuestion(**q) for q in data]
    except Exception as exc:  # JSON 解析失败等情况
        error_message = f"Error parsing Kimi questions JSON: {exc}"
        return _fallback_questions(req, error_message)


def _fallback_questions(req: QuestionGenerationRequest, error_message: str) -> List[InterviewQuestion]:
    """当 Kimi 生成问题失败时的本地占位问题列表。

    目标：
    - 始终返回 2-3 个合理的练习问题，而不是让前端看到 500。
    - 利用简历文本 / 关注方向 / 职位描述拼出尽量有用的问题提示。
    """

    focus = req.focus_area or "通用技术与表达能力"
    jd = req.job_description or "目标岗位"

    q1 = InterviewQuestion(
        id="local-1",
        content=f"请结合你的简历，详细介绍一个你最重要的项目，你在其中承担了什么角色？这个经历与 {jd} 有什么关联？",
        type="Behavioral",
        difficulty="Mid",
        expected_keywords=["项目背景", "个人贡献", "成果"],
    )

    q2 = InterviewQuestion(
        id="local-2",
        content=f"针对你简历中提到的核心技术或工具，请选择一项深入讲讲：在实际项目中你是如何使用它解决问题的？（可以围绕 {focus} 展开）",
        type="Technical",
        difficulty="Mid",
        expected_keywords=["技术细节", "问题分析", "解决方案"],
    )

    q3 = InterviewQuestion(
        id="local-3",
        content="回顾最近一次失败或遇到困难的经历，你是如何调整自己的学习和工作方式的？从中学到了什么？",
        type="Behavioral",
        difficulty="Mid",
        expected_keywords=["反思", "改进", "学习计划"],
    )

    # 把错误信息挂在日志里更合适，这里仅通过内容提示一下是本地占位题
    _ = error_message  # 占位，避免未使用变量告警

    return [q1, q2, q3]


def resume_advice_agent(
    client: KimiThinkingClient,
    resume_text: str,
    job_description: str,
) -> ResumeAdviceResponse:
    """Generate resume improvement suggestions and competitiveness assessment."""
    prompt_content = f"""
You are a senior career coach and technical interviewer.

Given the following resume and job description, provide:
1. A list of concrete resume improvement suggestions.
2. An overall competitiveness level for this candidate with respect to the job ("Strong", "Medium", or "Weak").
3. A short paragraph explaining the competitiveness assessment.

Return ONLY valid JSON with this structure:
{{
  "improvement_suggestions": ["...", "..."],
  "competitiveness_level": "Strong",
  "competitiveness_reason": "..."
}}

Resume:
{resume_text}

Job Description:
{job_description}
"""

    messages = [
        {
            "role": "system",
            "content": "You are a JSON-only API. Output ONLY valid JSON, no markdown, no commentary.",
        },
        {"role": "user", "content": prompt_content},
    ]

    raw = client.chat(messages, temperature=0.4)
    cleaned = _strip_json_wrappers(raw)
    data = json.loads(cleaned)
    return ResumeAdviceResponse(**data)


def match_report_agent(
    client: KimiThinkingClient,
    resume_text: str,
    job_description: str,
) -> "MatchReport":  # Forward reference to avoid circular import issues if any
    """Analyze the gap between a resume and a job description."""
    from app.models.schemas import MatchReport  # Local import to avoid circular dependency

    prompt_content = f"""
    You are an expert hiring manager. Perform a gap analysis between the candidate's resume and the job description.

    Resume:
    {resume_text[:4000]}

    Job Description:
    {job_description[:2000]}

    Return a JSON object with this EXACT structure:
    {{
        "score": 85.5,  // A float between 0-100 representing the match percentage
        "matching_keywords": ["Python", "FastAPI"],
        "missing_keywords": ["Kubernetes", "AWS"],
        "strengths": ["Strong academic background", "Good project experience"],
        "gaps": ["Lack of cloud deployment experience", "No mention of unit testing"],
        "summary": "The candidate is a strong fit for the backend logic but lacks infrastructure experience."
    }}
    """

    messages = [
        {
            "role": "system",
            "content": "You are a JSON-only API. Output ONLY valid JSON. No markdown.",
        },
        {"role": "user", "content": prompt_content},
    ]

    raw = client.chat(messages, temperature=0.2)
    
    if raw.startswith("Error calling Kimi API:"):
        # Fallback for error case
        return MatchReport(
            score=0.0,
            matching_keywords=[],
            missing_keywords=[],
            strengths=[],
            gaps=["AI Service Unavailable"],
            summary="Could not analyze match due to AI service error."
        )

    try:
        cleaned = _strip_json_wrappers(raw)
        data = json.loads(cleaned)
        return MatchReport(**data)
    except Exception as e:
        return MatchReport(
            score=0.0,
            matching_keywords=[],
            missing_keywords=[],
            strengths=[],
            gaps=["Parse Error"],
            summary=f"Failed to parse AI response: {str(e)}"
        )


def _multimodal_context_suffix(
    audio_features: Optional[AudioFeatures] = None,
    video_features: Optional[VideoFeatures] = None,
) -> str:
    parts: list[str] = []
    if audio_features is not None:
        parts.append("Audio Analysis:")
        if audio_features.speech_rate:
            parts.append(f"- Speech Rate: {audio_features.speech_rate:.1f} words/min")
        if audio_features.pitch_variance:
            parts.append(f"- Pitch Variance: {audio_features.pitch_variance:.2f} (Higher means more expressive)")
        if audio_features.filler_word_ratio:
            parts.append(f"- Filler Word Ratio: {audio_features.filler_word_ratio:.2%}")
        if audio_features.pause_ratio:
            parts.append(f"- Pause Ratio: {audio_features.pause_ratio:.2%}")

    if video_features is not None:
        parts.append("Video Analysis:")
        if video_features.dominant_emotion:
            parts.append(f"- Dominant Emotion: {video_features.dominant_emotion}")
        if video_features.eye_contact_score:
            parts.append(f"- Eye Contact Score: {video_features.eye_contact_score:.2f}")
        if video_features.emotion_distribution:
            parts.append(f"- Emotion Distribution: {video_features.emotion_distribution}")

    if not parts:
        return ""
    return "\n\n[Multimodal Analysis Data]\n" + "\n".join(parts)


def interview_report_agent(
    client: KimiThinkingClient,
    interview_log: str,
    audio_features: Optional[AudioFeatures] = None,
    video_features: Optional[VideoFeatures] = None,
) -> str:
    """High-level wrapper for generating an interview feedback report."""
    suffix = _multimodal_context_suffix(audio_features=audio_features, video_features=video_features)
    enriched_log = interview_log + suffix
    return client.generate_feedback(enriched_log)


def coach_agent(
    client: KimiThinkingClient,
    interview_log: str,
    student_question: str,
) -> str:
    """High-level wrapper for interview coaching on a finished session."""
    return client.coach_on_interview(interview_log, student_question)


def media_report_agent(
    client: KimiThinkingClient,
    transcript_text: str,
    audio_features: Optional[AudioFeatures] = None,
    video_features: Optional[VideoFeatures] = None,
) -> str:
    """Generate feedback for a single media item's transcript."""
    suffix = _multimodal_context_suffix(audio_features=audio_features, video_features=video_features)
    enriched = transcript_text + suffix
    return client.generate_feedback(enriched)


def refine_answer_agent(
    client: KimiThinkingClient,
    question_text: str,
    answer_text: str,
) -> dict:
    """Rewrite a candidate's answer to be more impactful."""
    prompt_content = f"""
    You are an expert interview coach. Rewrite the following candidate answer to be more impactful, using the STAR method if applicable. Keep the core truth but improve the delivery.

    Question: "{question_text}"
    Candidate Answer: "{answer_text}"

    Return a JSON object with this EXACT structure:
    {{
        "refined_answer": "The rewritten answer text...",
        "explanation": "Why this version is better (e.g., 'Added specific metrics', 'Removed filler words')."
    }}
    """

    messages = [
        {
            "role": "system",
            "content": "You are a JSON-only API. Output ONLY valid JSON. No markdown.",
        },
        {"role": "user", "content": prompt_content},
    ]

    raw = client.chat(messages, temperature=0.4)

    if raw.startswith("Error calling Kimi API:"):
        return {
            "refined_answer": "AI Service Unavailable",
            "explanation": "Could not refine answer due to service error."
        }

    try:
        cleaned = _strip_json_wrappers(raw)
        return json.loads(cleaned)
    except Exception as e:
        return {
            "refined_answer": "Parse Error",
            "explanation": f"Failed to parse AI response: {str(e)}"
        }
