# Multimodal Interview System - Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+
- Python 3.9+

### 1. Clone & Setup

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```bash
DATABASE_URL=sqlite:///./interview.db
SECRET_KEY=dev-secret-key-change-in-production-min-32-chars
KIMI_API_KEY=your-api-key-here
```

**Frontend** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### 3. Run Servers

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Access Application

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/

### 5. Create Account & Test

1. Register at http://localhost:3000/register
2. Login with your credentials
3. Navigate to "Start New Interview"
4. Complete the Green Room setup (3 steps)
5. Enter Live Mode and test recording
6. Click "End & Review" to see the Game Tape page

---

## 📁 Project Structure

```
interview-system/
├── backend/
│   ├── app/
│   │   ├── routers/          # API endpoints
│   │   │   ├── interview.py  # Interview sessions
│   │   │   ├── auth.py       # Authentication
│   │   │   ├── payment.py    # Payment handling
│   │   │   └── websocket.py  # Real-time WebSocket
│   │   ├── services/         # Business logic
│   │   │   ├── audio_processor.py  # Audio analysis
│   │   │   ├── audio_analysis.py   # ASR & features
│   │   │   └── video_analysis.py   # Visual features
│   │   ├── models/           # Database models
│   │   └── core/             # Config & security
│   ├── main.py               # FastAPI application
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── app/              # Next.js pages
    │   │   ├── interview/
    │   │   │   ├── setup/    # Green Room
    │   │   │   └── review/   # Game Tape
    │   │   └── av-interview/ # Live Mode
    │   ├── components/       # React components
    │   │   ├── interview/    # Phase 3 components
    │   │   └── ui/           # Shared UI
    │   └── lib/              # Utilities
    └── package.json
```

---

## 🔑 Key Features

### Phase 1: Green Room
- Job context ingestion
- Camera/mic tech check
- Breathing exercise

### Phase 2: Immersive Interview
- Live Mode split-screen UI
- WebSocket real-time streaming
- Adaptive AI questioning
- Auto-recording & upload

### Phase 3: Game Tape Review
- Timeline-based video player
- Multimodal report card (charts)
- Actionable practice drills

### Phase 4: WebSocket Infrastructure
- Real-time audio streaming
- Server-side analysis
- Low-latency nudges

---

## 🛠️ Common Commands

### Development
```bash
# Backend
uvicorn main:app --reload              # Run backend
pytest                                  # Run backend tests

# Frontend
npm run dev                             # Run frontend
npm run build                           # Build for production
npm test                                # Run frontend tests
```

### Database
```bash
# Initialize database
python -c "from app.db import Base, engine; Base.metadata.create_all(bind=engine)"

# Reset database (caution!)
rm interview.db
```

### Docker
```bash
docker-compose up -d                    # Start all services
docker-compose logs -f backend          # View backend logs
docker-compose down                     # Stop all services
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8000 (backend)
lsof -ti:8000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### WebSocket Not Connecting
1. Check backend is running on port 8000
2. Verify `.env.local` has correct `NEXT_PUBLIC_WS_URL`
3. Open browser console and look for connection errors

### Camera/Mic Not Working
1. Allow browser permissions for camera/mic
2. Use HTTPS in production (browsers require it)
3. Check browser compatibility (Chrome/Edge recommended)

---

## 用户试用方案（MVP 验证）

本项目内置了一套**小规模用户试用方案**，用于验证多模态 AI 面试系统对大学生是否有实际帮助，并为下一阶段产品迭代提供依据。

### 1. 目标与范围

- **目标用户**：准备实习 / 校招的高校学生（大三 / 大四 / 研究生）。
- **主要目标**：
  - 验证以下模块的实际价值：
    - 行为面结构化报告（维度评分、强项 / 风险标签、训练建议）
    - 多模态录制回放 + 训练 Drills
    - 实时教练（WebSocket 音频 nudges + Live Coach 面板）
    - Dashboard 近期能力概览
  - 收集一手反馈，用于决定下一阶段重点是：
    - 「能力画像 & 长期成长曲线」，还是
    - 「流式 ASR & 实时教练升级」。

### 2. 整体流程（30–45 分钟 / 人）

每位受试者完整体验建议为 30–45 分钟，包含：

1. **使用前问卷（Pre-study Survey）**（约 3 分钟）
2. **文字版面试（Text Interview）**（10–15 分钟）
3. **音视频面试  Training 模式**（15–20 分钟）
4. **（可选）音视频面试  Exam 模式**（约 10 分钟）
5. **使用后问卷 + 简短访谈**（约 10 分钟）

### 3. 使用前问卷（Pre-study Survey）

示例问题（部分使用 1–5 量表）：

- **基本信息**：年级、专业、真实面试次数。
- **当前求职阶段**：探索、投递、已在面试、已有 offer 等。
- **自评能力（1–5）**：
  - 是否能用 **STAR 结构**讲清经历。
  - 回答是否 **清晰、有重点**。
  - 回答中是否能体现 **反思与成长**。
  - 面试中的 **紧张程度**（分数越高越紧张）。
- **最希望提升的方面（多选）**：
  - 题目覆盖 / 与 JD 的贴合度
  - 回答结构（如 STAR）
  - 表达清晰度 / 逻辑性
  - 临场反应 / 追问应对
  - 表达与呈现（眼神、表情、语速等）
  - 面试后的复盘与改进指导

### 4. 测试流程脚本（主持人指引）

用于主持人现场执行，保证每位受试者体验一致。

#### 4.1 开场（约 1 分钟）

- 说明：本次是测试「系统」而不是考核学生本人。
- 说明：所有记录仅用于改进产品，与真实求职评价无关。

#### 4.2 使用前问卷（3 分钟）

- 引导受试者填写 Pre-study Survey。

#### 4.3 文字版面试（10–15 分钟）

- 登录并打开 `/text-interview`。
- 受试者填写目标岗位 & JD / 简历摘要（尽量使用真实信息）。
- 进行 3–5 轮问答，点击 **「结束本轮面试并生成报告」**。
- 给 2–3 分钟静默阅读报告，主持人观察受试者主要关注哪些内容。

#### 4.4 音视频面试  Training 模式（15–20 分钟）

- 使用 `/interview/setup` → `/av-interview` 创建并启动会话。
- 向受试者说明 Training 模式特点（提示较多，有 nudges 和 Live Coach）。
- 要求至少录制 2 段回答：
  - 自我介绍或一个代表性项目；
  - 一道行为面问题（系统生成或主持人口头给出）。
- 会话结束后前往 `/interview/review/{sessionId}`：
  - 至少回放一段录制；
  - 查看多模态分析卡片；
  - 查看 Recommended Drills。

#### 4.5 音视频面试  Exam 模式（可选，10 分钟）

- 在 AV 面试房间切换至 Exam 模式（提示更少，更接近真实考场）。
- 受试者回答 1–2 个问题后结束。

#### 4.6 使用后问卷 & 访谈（10 分钟）

- 受试者填写 Post-study Survey。
- 主持人根据问卷答案追问，记录关键原话。

### 5. 使用后问卷（Post-study Survey）

推荐结构：

**整体体验**

- 这套系统对你「准备面试」的帮助有多大？（1–5）
- 如果满分 10 分，你会给本次体验打几分？（0–10）

**模块价值评分（1–5）**

- 文字面试 **问题质量**（是否贴合岗位 / 有启发）。
- 文字面试 **行为面报告**（维度 + 标签 + 建议）的实用程度。
- AV 面试 **实时提示**（题面展示、音量 nudges、Live Coach）的帮助程度。
- Game Tape Review 中 **回放 + 多模态分析 + Drills** 的帮助程度。
- Dashboard 中 **近期能力概览** 的参考价值。

**开放问题**

- 你觉得系统里 **最有用的 1–2 个功能** 是什么？为什么？
- 有没有哪些内容让你觉得「看了也不知道该怎么改进自己」？请举例。
- 如果只能改动一件事，让这套系统对你更有帮助，你会改什么？
- 你愿意持续用这套系统来准备面试吗？为什么？

### 6. 面对面访谈提纲（可选）

可以基于问卷答案做进一步追问，例如：

- 让受试者举例说明某个报告 / 功能具体是如何帮助到 TA 的。
- 追问实时提示是否真的改变了行为（比如语速、是否补充结果等）。
- 询问在 Game Tape Review 中，更多是在看时间轴、文字转写、图表还是 Drills。
- 询问是否希望看到 **能力随时间变化的趋势**（如 STAR 能力曲线）。

### 7. 数据记录表模板（分析用）

建议以 Excel / Notion 建表，每位受试者一行，字段包括（示例）：

- 学生 ID / 姓名缩写
- 年级
- 专业
- 真实面试次数
- 前测自评：STAR（1–5）
- 前测自评：表达清晰度（1–5）
- 后测整体帮助评分（1–5）
- 后测体验总评分（0–10）
- 文本报告有用度（1–5）
- AV 实时提示有用度（1–5）
- Game Tape Review 有用度（1–5）
- 使用过程中最常关注的功能（文本）
- 观察到的行为变化（如「有意识补充结果」「刻意放慢语速」等）
- 最强烈的改进建议（原话记录）
- 是否愿意持续使用系统（是 / 否 + 理由）

---

## 📚 Documentation

- **Full Deployment Guide**: See `DEPLOYMENT.md`
- **API Documentation**: http://localhost:8000/docs (when backend running)
- **Verification Report**: See `verification_test_results.md`

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature-name`
2. Make changes and test thoroughly
3. Run linters: `black .` (backend), `npm run lint` (frontend)
4. Commit: `git commit -m "Description"`
5. Push and create PR

---

## 📝 License

Proprietary - All Rights Reserved

---

## 💬 Support

For issues or questions:
1. Check `DEPLOYMENT.md` for detailed setup
2. Review `verification_test_results.md` for known issues
3. Contact: support@yourdomain.com

---

**Version**: 1.0.0
**Last Updated**: 2025-11-22
