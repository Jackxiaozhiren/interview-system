# 高校学生多模态模拟面试评测智能体 - 项目设计与实施方案

## 1. 项目概览 (Project Overview)

### 1.1 核心愿景
打造一个**“全感官 AI 职业导师”**。它不仅是一个问答机器人，而是通过**视觉（看）、听觉（听）、认知（想）**全方位捕捉学生表现的沉浸式面试训练平台。系统旨在弥合高校理论教学与职场实战的鸿沟，通过低延迟的实时互动和基于数据的客观反馈，帮助学生提升职场竞争力。

### 1.2 核心价值主张
*   **沉浸式实战:** 告别打字聊天，采用 RTC 实时语音/视频通话，还原真实面试压迫感。
*   **多模态洞察:** 不只听内容，还看微表情和肢体语言，分析语调情感。
*   **个性化定制:** 基于简历自动生成针对性问题，而非千篇一律的题库。

---

## 2. 方案 A: 产品功能与业务流程 (Product & Business)

### 2.1 用户角色 (Personas)
*   **求职学生:** 核心用户。需求：模拟面试、简历诊断、话术优化、缓解焦虑。
*   **高校/辅导员:** 管理端用户。需求：查看学生参与度、整体能力画像、配置本校特色题库。

### 2.2 核心业务流程 (Core User Journey)

#### 阶段一：档案建立 (Onboarding)
1.  **简历上传:** 支持 PDF/Word。
    *   *技术动作:* 系统自动解析简历，提取 `技能标签(Skills)`、`项目经历(Projects)`、`教育背景(Education)`。
2.  **岗位意向锁定:** 用户输入目标岗位（如“Java 后端工程师”）或上传 JD (Job Description)。
3.  **AI 策略生成:** 系统分析“简历 vs JD”的差距，生成本次面试的**侧重点**（例如：“重点考察高并发项目经验，忽略基础语法”）。

#### 阶段二：全真模拟 (Simulation)
*   **环境检查:** 麦克风、摄像头、网络延迟检测。
*   **模式选择:**
    *   🟢 **新手模式:** AI 语速较慢，允许查看提示，面试中实时反馈。
    *   🔴 **实战/压力模式:** AI 语速正常/较快，不仅追问，还会打断，隐藏所有辅助功能。
*   **互动过程:** 15-30 分钟的实时语音视频通话。支持 AI 展示白板（代码题）或屏幕共享。

#### 阶段三：多维反馈 (Evaluation & Feedback)
*   **生成报告:** 面试结束后 1 分钟内生成《面试诊断书》。
*   **复盘功能:**
    *   **“高光时刻”回放:** 表现最好的 3 个片段。
    *   **“至暗时刻”重练:** 表现最差的片段，AI 提供“金牌话术”，让用户并在当前场景下重新录制一次。

---

## 3. 方案 B: 技术架构与技术栈 (System Architecture)

采用 **微服务 + 边缘计算** 混合架构，确保低延迟交互。

### 3.1 技术栈选型 (Tech Stack)

| 模块 | 技术组件 | 说明 |
| :--- | :--- | :--- |
| **前端 (Web/Mobile)** | **Next.js (React)** + TailwindCSS | 响应式界面，SSR 优化首屏加载。 |
| **状态管理** | **Zustand** | 轻量级状态管理，适合处理实时媒体流状态。 |
| **实时通信 (RTC)** | **LiveKit** | **核心组件**。开源 WebRTC 基础设施，提供 Python SDK 直接对接 AI 模型。 |
| **后端服务 (API)** | **FastAPI (Python)** | 高性能异步框架，完美契合 AI 推理任务。 |
| **AI 编排/胶水层** | **LangChain** 或 **LiveKit Agents** | 管理 LLM 的对话状态和工具调用。 |
| **数据库** | **PostgreSQL** (业务数据) + **pgvector** (向量数据) | 统一存储用户数据和 Embeddings，减少运维成本。 |
| **任务队列** | **Redis** + **Celery** | 异步处理耗时的视频分析和报告生成任务。 |

### 3.2 数据模型设计 (ER Diagram 简述)

*   **Interviews (面试场次表):** `id`, `student_id`, `job_position`, `score_summary`, `created_at`
*   **ConversationLogs (对话日志表):** `id`, `interview_id`, `role (AI/User)`, `content`, `audio_url`, `emotion_tags`
*   **EvaluationMetrics (评测指标表):** `id`, `interview_id`, `dimension (Logic/Skill/Stress)`, `score`, `feedback_text`
*   **Questions (题库表):** `id`, `category`, `content`, `difficulty`, `expected_keywords` (支持向量检索)

---

## 4. 方案 C: 多模态感知系统 (Multimodal Perception)

这是本系统的“眼睛”和“耳朵”，负责捕捉非语言信息。

### 4.1 听觉感知 (Audio Pipeline)
基于 **LiveKit Agents** 框架实现流式处理：
1.  **VAD (语音活动检测):** 使用 `Silero VAD`，精准判断用户何时说话，何时停止，实现“打断 AI”的功能。
2.  **STT (语音转文字):**
    *   方案 A (云端): Deepgram (毫秒级延迟，推荐)。
    *   方案 B (自建): Faster-Whisper (部署在 GPU 服务器)。
3.  **SER (语音情感识别):**
    *   **模型:** 接入 `emotion2vec` (HuggingFace: `ddlBoJack/emotion2vec`)。
    *   **逻辑:** 每 2 秒对音频切片进行一次情感分类（开心/愤怒/悲伤/中性/焦虑）。
    *   **输出:** `{"timestamp": "00:12", "emotion": "anxious", "confidence": 0.85}`

### 4.2 视觉感知 (Visual Pipeline)
为保护隐私并降低服务器压力，视觉分析建议在**前端 (Browser)** 初步处理，仅回传特征数据。
1.  **面部特征提取:** 使用 `MediaPipe Face Mesh` (JavaScript 版)。
    *   **关键点:** 468 个面部地标。
2.  **行为分析逻辑:**
    *   **眼神接触 (Eye Contact):** 计算眼球向量与摄像头的夹角。如果偏离 > 15度 且持续时间 > 5秒，标记为“眼神游离”。
    *   **头部姿态 (Head Pose):** 检测是否频繁低头（缺乏自信）。
3.  **后端深度分析 (可选):** 抽取关键帧发送至后端，使用 `DeepFace` 分析微表情（如回答难题时的“皱眉”）。

### 4.3 多模态融合 (Fusion Strategy)
*   **加权评分算法:**
    *   `最终表现分` = `内容质量(LLM评分) * 0.6` + `语音自信度(SER) * 0.2` + `肢体得体度(Visual) * 0.2`
*   **一致性检测:** 如果内容是“我很自信”，但语音检测到“颤抖”且视觉检测到“眼神躲闪”，系统判定为“言行不一”，并在报告中指出。

---

## 5. 方案 D: 认知核心与大模型 (Cognitive Core)

### 5.1 动态 Prompt 架构 (System Prompt)
AI 面试官需要具备“状态记忆”。
```markdown
Role: 您是 [Company Name] 的资深技术面试官，风格 [严厉/亲和]。
Context: 候选人正在申请 [Position] 岗位。
Current Stage: [Deep Dive / 深度追问阶段]

Instructions:
1. 不要一次性问多个问题。
2. 针对候选人刚才提到的 [Project A]，运用 STAR 法则进行追问。
3. 如果候选人回答太简短，请说："能具体讲讲数据上的提升吗？"
4. 必须保持追问逻辑的连贯性，不要突然跳跃话题。
```

### 5.2 题库与 RAG 系统
*   **数据源:** 爬取牛客网、LeetCode 面经，以及 GitHub 上的 `interview-questions` 开源库。
*   **检索策略:**
    *   根据简历关键词（如 "React"）在向量数据库中检索相关高频题。
    *   **动态难度调整:** 如果用户连续两题回答完美（LLM 评分 > 90），下一题自动检索 "Hard" 标签的题目。

### 5.3 核心模型 (Core Model)
*   **模型选型:** **Kimi K2 Thinking** (Moonshot AI)
*   **理由:** Kimi K2 Thinking 具备强大的 Chain of Thought (CoT) 推理能力，特别适合处理面试中复杂的逻辑追问、代码分析和多维度评分任务。其原生支持的长上下文和工具调用能力，使其能够作为整个多模态系统的“大脑”，串联简历解析、实时对话和最终评价。
*   **集成方式:** 通过 OpenAI 兼容接口 (`https://api.moonshot.cn/v1`) 接入。

### 5.4 自动评分标准 (Rubric)
让 LLM 充当阅卷人，遵循以下 JSON 结构输出评分：
```json
{
  "score": 85,
  "reasoning": "回答涵盖了 React Diff 算法的核心思想，但未提到 Key 的作用。",
  "improvement_suggestion": "建议补充 Key 在列表渲染中对性能优化的具体影响。",
  "missing_keywords": ["Virtual DOM", "Reconciliation", "Key"]
}
```

---

## 6. 方案 E: 用户体验与反馈 (UX & Feedback)

### 6.1 实时交互优化
*   **低延迟机制:** 采用流式响应 (Streaming)。LLM 生成第一个字时，TTS (语音合成) 立即开始播放音频，无需等待整句生成。
*   **数字人/Avatar:**
    *   **高配:** 使用 WebGL 渲染的 3D 模型 (Three.js + React Three Fiber)。
    *   **低配:** 预渲染视频流 (Pre-rendered Video Loops) —— 准备“倾听”、“说话”、“思考”、“点头”几段循环视频，根据 AI 状态平滑切换。

### 6.2 面试诊断报告 (Report Card)
报告页面应包含：
1.  **雷达图:** 逻辑思维、专业技能、沟通表达、抗压能力、人际亲和。
2.  **全盘录音/录像:** 带时间戳的文本回顾。
3.  **AI 批注:** 在时间轴上通过颜色标记情绪变化（🔴 焦虑区间 / 🟢 自信区间）。

---

## 7. 实施路线图 (Implementation Roadmap)

### Phase 1: 原型验证 (MVP) - 第 1 个月
*   **目标:** 跑通“语音对话”全流程。
*   **任务:**
    *   搭建 LiveKit 服务端。
    *   集成 STT (Deepgram) + LLM (OpenAI/DeepSeek) + TTS (EdgeTTS/ElevenLabs)。
    *   实现基础的简历文本上传与解析。

### Phase 2: 多模态接入 - 第 2-3 个月
*   **目标:** 加入“视觉”与“情感分析”。
*   **任务:**
    *   前端接入 MediaPipe 实现面部打点。
    *   后端集成 emotion2vec。
    *   开发面试题库 RAG 系统。

### Phase 3: 产品化与体验升级 - 第 4 个月
*   **目标:** 完整的报告系统与压力测试。
*   **任务:**
    *   开发 PDF 诊断报告生成器。
    *   优化端到端延迟至 < 800ms。
    *   完成高校端的管理 Dashboard。

### Phase 4: 真实场景验证
*   **任务:** 邀请 100 位计算机专业学生进行内测，收集反馈微调 Prompt。
