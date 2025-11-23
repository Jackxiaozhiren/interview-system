# 多模态面试系统整体方案与行为面 MVP 实施文档

> 版本：v1.0（行为面 MVP）
> 目标：为多模态 AI 面试系统打好「从产品体验到技术落地」的一整套基础方案，
> 并聚焦 **单场行为面 MVP** 打通从 Onboarding → 面试房间 → 报告的全流程。

---

## 1. 产品定位与总体目标

### 1.1 产品定位

- **面向对象**：求职者（含应届、实习、1–5 年工作经验、跨专业转行、海外面试者），重点可以先从高校用户切入。
- **核心价值**：
  - 提供高度真实、沉浸式的 AI 面试体验（多模态：语音 / 未来扩展视频、表情、眼神等）。
  - 打通从 **面试准备 → 模拟实战 → 复盘分析 → 持续成长** 的完整闭环。
  - 目标是：
    > 「在系统里被面试 10 次，相当于真实面试 1 次就能拿下。」

### 1.2 行为面 MVP 的范围（本次落地）

- 仅实现 **中文行为面试**，不含技术面/系统设计面。
- 媒介：**音频 + 语音转写（ASR）**，暂不接入视觉多模态（眼神/表情后续迭代）。
- 流程范围：
  - Onboarding：上传简历 + 目标岗位 / JD，生成基础画像。
  - 单场行为面模拟：3–5 个问题 + 简单追问。
  - 实时语音转写 + 简单实时提示（结构 / 节奏）。
  - 会后生成基础报告（整体评分 + 维度评分 + 强项/风险标签 + HR 风格评价 + 下一步建议）。

---

## 2. 竞品要点与差异化策略（简版）

### 2.1 竞品亮点小结

- **FinalRound AI / Verve Copilot / OfferIn 等（偏 Copilot 实时辅助）**
  - 实时转录与提词，支持行为面 / 技术面 / HireVue / Phone 等场景。
  - 支持多语言、多平台（Zoom、Teams 等）。
  - 核心形态偏「真实面试过程中的外挂助理」。

- **OfferGoose / Offermore(面试猫) / Offer蛙 / OfferGenie 等（国内外 AI 面试助手）**
  - 海量题库、多岗位、多语种支持。
  - 实时语音识别 + 提词，Mock Interview + 复盘报告。
  - 主要形态是「题库 + 提词 + 报告」，沉浸感有限。

- **TestGorilla AI Video Interviews（偏招聘方）**
  - 标准化 one-way 视频面试 + AI 评分。
  - 适合大规模筛选。

### 2.2 我们的差异化策略

- **从“外挂”转向“训练场”**：
  - 产品定位是「训练与成长平台」，而非真实面试中的作弊式 Copilot。
- **更强的沉浸感与多模态设计**：
  - 虚拟面试房间 + AI 面试官人格 + 场景选择，而不是简单弹窗 + 文本问答。
- **全流程打通**：
  - 从画像与准备 → 多轮模拟 → 报告与成长时间线，而非零散的工具集合。

---

## 3. 用户全流程体验设计

### 3.1 用户画像与使用场景

- 用户画像：
  - **应届生 / 实习生**：面试经验少、紧张，需要高频练习；
  - **1–5 年从业者**：目标岗位明确，需系统梳理与实战演练；
  - **跨专业转行者**：需补齐基础 + 梳理项目亮点；
  - **海外/多语种候选人**：需要多语言面试训练，尤其口语表达。

- 核心使用场景：
  - 面试前 1–3 天集中突击；
  - 面试前 30 分钟快速热身；
  - 长期学习期（1–4 周）系统提升；
  - 真实面试后，用回忆/录音进行复盘。

### 3.2 全流程概览

1. **Onboarding & 画像生成**
   - 上传简历，选择/填写目标岗位与 JD；
   - 自评状态（紧张/时间紧/跨专业等）；
   - 自动生成「面试体检报告 v0」和训练建议。

2. **准备阶段（MVP 简化版）**
   - 简单展示画像 & 推荐「开始行为面模拟」。

3. **行为面模拟（MVP 核心）**
   - 虚拟面试房间，AI 行为面试官发问；
   - 候选人语音作答，ASR 实时转写；
   - 简单实时提示（结构/节奏）。

4. **面试报告与复盘**
   - 总体评分+维度评分+强项/风险标签；
   - HR 风格文字评价；
   - 下一步训练建议。

5. **长期成长（后续版本）**
   - 成长时间线；
   - 问题知识图谱；
   - 个性化训练路线。

---

## 4. 关键交互与状态流

### 4.1 Onboarding 流程状态

- **S0_INIT**：表单未填写完整，提交按钮 Disabled；
- **S1_CONFIG_VALID**：必填项有效，提交按钮 Enabled；
- **S2_SUBMITTING**：提交中，按钮 Loading，防重复点击；
- **S3_SUCCESS**：提交成功，跳转 `/dashboard`；
- **S_ERR**：接口报错，页面展示错误提示，可重试。

按钮：
- 「保存并继续」：S0 -> disabled；S1 -> enabled；S2 -> loading；S3/S_ERR -> 根据结果更新。

### 4.2 行为面 InterviewRoom 顶层状态机

- **R0_CONNECTING**：WebSocket/RTC 连接中；
- **R1_WAITING_FIRST_QUESTION**：连接成功，等待首问；
- **R2_QA_ONGOING**：问答进行中；
- **R3_PAUSED**：用户暂时暂停（选做）；
- **R4_ENDING**：结束中（等待 `/end` 接口）；
- **R5_ENDED**：会话结束，准备跳报告页；
- **R_ERR**：连接或服务异常。

按钮与 Tab 状态（节选）：
- **结束面试按钮**：在 R1/R2/R3 可点击（弹确认），R4/R5/R_ERR 禁用或隐藏；
- **模式切换按钮（训练/沉浸）**：R1/R2/R3 可切换，R4/R5/R_ERR 隐藏；
- **Tab1 对话记录**：R1–R4 可查看；
- **Tab2 实时提示**：训练模式默认展开，沉浸模式默认收起，仅严重提示以 toast 形式出现。

### 4.3 报告页状态流

- **P0_LOADING**：报告生成中，轮询接口；
- **P1_READY**：报告生成完成，展示评分/标签/建议；
- **P_ERR**：报告生成失败，展示错误 + 重试入口。

---

## 5. 技术架构设计（高层）

### 5.1 系统组件

- **Web 前端**：Next.js + React + TS + Tailwind + shadcn/ui。
- **后端网关 / API 层**：提供统一 `/api/v1/**` 接口，负责鉴权和路由。
- **微服务**：
  - auth-service（可并入网关）：JWT 登录鉴权。
  - profile-service：候选人画像管理。
  - interview-service：面试会话生命周期管理 + WebSocket/RTC 协调。
  - report-service：面试报告生成与查询。
  - algo-service：行为面对话引擎 + 评分 + Hint 生成。
- **第三方服务**：ASR 云服务（阿里云/腾讯云/讯飞等）、对象存储（音频文件）。

### 5.2 核心调用链（行为面 MVP）

1. 前端 `/onboarding` → `POST /api/v1/profile` → profile-service 入库；
2. `/dashboard` → `POST /api/v1/interviews` → interview-service 创建 session，返回 `wsUrl`；
3. `/interview/{sessionId}` 前端通过 WebSocket 连到 interview-service；
4. interview-service 将音频/转写请求转发给 ASR + algo-service，获取 `ai_question` / `realtime_hint`；
5. 会话结束后，interview-service 触发 report-service 调用 algo-service 得出报告，存储后由 `GET /report` 提供；
6. 前端 `/report/{sessionId}` 轮询 `GET /report`，展示最终报告。

---

## 6. 接口设计概览（基于 OpenAPI 草稿）

主要接口列表（详细字段见下方 YAML 摘要）：

- Profile
  - `POST /api/v1/profile` 初始化/更新画像
  - `GET /api/v1/profile/me` 获取当前用户画像

- Interview
  - `POST /api/v1/interviews` 创建会话（MVP 固定 type=behavior）
  - `GET /api/v1/interviews/{sessionId}` 查询会话
  - `POST /api/v1/interviews/{sessionId}/env-check` 更新环境检测结果（MVP 可简化）
  - `POST /api/v1/interviews/{sessionId}/end` 结束会话

- Report
  - `GET /api/v1/interviews/{sessionId}/report` 获取报告（status: PENDING/READY/FAILED）

- 实时通道
  - WebSocket：`wss://.../rt/v1/interviews/{sessionId}`
  - 消息类型：`ai_question` / `ai_transcript_update` / `realtime_hint` / `session_status` 等。

### 6.1 OpenAPI 3.0 YAML 摘要（可导入 Swagger / Apifox）

> 注：此处为 MVP 关键接口的简化版本，如需完整字段可在后续版本中补全。

```yaml
openapi: 3.0.3
info:
  title: Multimodal Interview MVP API
  version: 1.0.0
servers:
  - url: https://api.example.com

paths:
  /api/v1/profile:
    post:
      summary: Init or update candidate profile
      security:
        - bearerAuth: []
      tags: [Profile]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/InitProfileRequest'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CandidateProfileResponse'

  /api/v1/profile/me:
    get:
      summary: Get current user's profile
      security:
        - bearerAuth: []
      tags: [Profile]
      responses:
        '200':
          description: Profile
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CandidateProfileResponse'

  /api/v1/interviews:
    post:
      summary: Create a new interview session
      security:
        - bearerAuth: []
      tags: [Interview]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateInterviewSessionRequest'
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InterviewSessionResponse'

  /api/v1/interviews/{sessionId}:
    get:
      summary: Get interview session detail
      security:
        - bearerAuth: []
      tags: [Interview]
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Session detail
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InterviewSessionResponse'

  /api/v1/interviews/{sessionId}/env-check:
    post:
      summary: Update environment check result
      security:
        - bearerAuth: []
      tags: [Interview]
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EnvCheckResultRequest'
      responses:
        '204':
          description: Updated

  /api/v1/interviews/{sessionId}/end:
    post:
      summary: End an interview session
      security:
        - bearerAuth: []
      tags: [Interview]
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EndSessionRequest'
      responses:
        '204':
          description: Ended

  /api/v1/interviews/{sessionId}/report:
    get:
      summary: Get interview report
      security:
        - bearerAuth: []
      tags: [Report]
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Report
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InterviewReportResponse'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    InitProfileRequest:
      type: object
      properties:
        resumeFileId:
          type: string
        targetJob:
          $ref: '#/components/schemas/TargetJob'
        selfStatusTags:
          type: array
          items:
            type: string
        timeWindowDays:
          type: integer
      required: [resumeFileId, targetJob]

    TargetJob:
      type: object
      properties:
        title:
          type: string
        company:
          type: string
        industry:
          type: string
        jdText:
          type: string
      required: [title]

    CandidateProfileResponse:
      type: object
      properties:
        profileId:
          type: string
        skills:
          type: array
          items:
            $ref: '#/components/schemas/SkillScore'
        softSkills:
          type: array
          items:
            $ref: '#/components/schemas/SkillScore'
        riskAreas:
          type: array
          items:
            type: string

    SkillScore:
      type: object
      properties:
        name:
          type: string
        level:
          type: number

    CreateInterviewSessionRequest:
      type: object
      properties:
        profileId:
          type: string
        type:
          type: string
        scene:
          type: string
        persona:
          type: string
        mode:
          type: string
          enum: [training, immersive]
        durationMin:
          type: integer
        language:
          type: string
      required: [profileId, type, mode]

    InterviewSessionResponse:
      type: object
      properties:
        sessionId:
          type: string
        status:
          type: string
        wsUrl:
          type: string
        webrtc:
          type: object
          properties:
            token:
              type: string
            serverUrl:
              type: string

    EnvCheckResultRequest:
      type: object
      properties:
        camera:
          type: object
          additionalProperties: true
        microphone:
          type: object
          additionalProperties: true
        gazeCalibration:
          type: object
          properties:
            done:
              type: boolean

    EndSessionRequest:
      type: object
      properties:
        reason:
          type: string
          enum: [user_end, time_up, error]
      required: [reason]

    InterviewReportResponse:
      type: object
      properties:
        status:
          type: string
          enum: [PENDING, READY, FAILED]
        report:
          type: object
          nullable: true
          properties:
            sessionId:
              type: string
            overallScore:
              type: number
            dimensions:
              type: array
              items:
                $ref: '#/components/schemas/ScoreDimension'
            strengthTags:
              type: array
              items:
                type: string
            riskTags:
              type: array
              items:
                type: string
            hrStyleComment:
              type: string
            suggestedNextTasks:
              type: array
              items:
                $ref: '#/components/schemas/SuggestedTask'

    ScoreDimension:
      type: object
      properties:
        name:
          type: string
        score:
          type: number

    SuggestedTask:
      type: object
      properties:
        type:
          type: string
        focus:
          type: string
        suggestedDurationMin:
          type: integer
```

---

## 7. 实施计划与任务拆解（Sprint 视角）

### 7.1 Sprint 目标

- **Sprint 1**：完成行为面 MVP 的最小闭环：
  - Onboarding → 创建会话 → 行为面房间 → 报告页；
  - 不追求完美多模态，保证流程跑通 + 体验可用。

- **Sprint 2**：增强体验与稳定性：
  - 接入实时提示 Hint；
  - 完善错误处理与状态流；
  - 做基础性能与回归测试。

### 7.2 后端（BE）任务概览

- BE-EP1：基础架构与鉴权
  - 创建 Spring Boot / NestJS 项目骨架
  - 接入 JWT 鉴权中间件
  - 统一错误码与响应结构

- BE-EP2：Profile 服务
  - 定义 Profile 实体与表结构
  - 实现 `POST /profile` 与 `GET /profile/me`

- BE-EP3：Interview 会话管理
  - 定义 InterviewSession 实体与状态机
  - 实现 `POST /interviews` / `GET /interviews/{id}` / `/env-check` / `/end`

- BE-EP4：Report 服务
  - 定义 InterviewReport 实体与表结构
  - 实现 `GET /interviews/{id}/report` 与异步生成逻辑

- BE-EP5：WebSocket 通道
  - 设计消息协议
  - 实现 `/rt/v1/interviews/{sessionId}` 端点及消息路由

### 7.3 前端（FE）任务概览

- FE-EP1：基础框架与路由
  - Next.js 项目初始化、路由 `/onboarding` `/dashboard` `/interview/[id]` `/report/[id]`

- FE-EP2：Onboarding
  - 表单 UI + 校验 + `POST /profile` 对接

- FE-EP3：Dashboard
  - 显示欢迎信息与“开始行为面模拟”按钮
  - `POST /interviews` 创建会话并跳转

- FE-EP4：InterviewRoom
  - 房间布局（视频区、Tab、控制条）
  - Zustand `useInterviewStore` 状态管理
  - WebSocket 连接与消息处理
  - 按钮/Tab 状态流实现

- FE-EP5：ReportPage
  - 报告 UI + 轮询 `GET /report`

### 7.4 算法（Algo）任务概览

- ALG-1：行为面问题模板与对话引擎
- ALG-2：ASR 接入与封装
- ALG-3：行为面评分与标签生成
- ALG-4：实时 Hint 规则（结构/节奏）

---

## 8. 前端开发 CheckList（FE 视角）

> 便于 FE 开发同学在实现时逐项自检。

### 8.1 工程基础

- [ ] Next.js + TS + ESLint + Prettier 初始化完成
- [ ] TailwindCSS + shadcn/ui 引入并可用
- [ ] `apiClient` 封装（含 baseURL、JWT、错误处理）

### 8.2 Onboarding

- [ ] `/onboarding` 路由可访问
- [ ] 表单字段完整（简历/岗位/公司/JD/状态标签）
- [ ] 必填校验与错误提示
- [ ] 成功调用 `POST /profile` 后跳转 `/dashboard`

### 8.3 Dashboard

- [ ] `/dashboard` 显示欢迎信息
- [ ] 点击“开始行为面模拟” → `POST /interviews`
- [ ] 请求成功后跳转 `/interview/{sessionId}`

### 8.4 InterviewRoom

- [ ] 页面布局符合：左侧视频，中间/右侧 Tabs，底部控制条
- [ ] `useInterviewStore` 管理状态与消息
- [ ] WebSocket 连接成功可收到 `ai_question`
- [ ] `ai_transcript_update(final=true)` 正确显示候选人回答
- [ ] 模式切换按钮 & Tab 行为符合状态机
- [ ] 结束按钮调用 `/end` 并跳转报告页

### 8.5 ReportPage

- [ ] `/report/{sessionId}` 可访问
- [ ] `GET /report` 轮询逻辑实现
- [ ] PENDING / READY / FAILED 三种状态 UI 正确

---

## 9. 算法任务模版（供 Algo 团队使用）

- ALG-1：行为面问题模板与对话引擎（3–5 问 + 追问）
- ALG-2：ASR 接入与统一转写接口
- ALG-3：基于文本的评分与标签生成
- ALG-4：基于实时转写的 Hint 生成（结构/节奏）

> 每条任务均包含：目标、子任务清单、验收标准，可在飞书项目中进一步拆解。

---

## 10. QA 测试用例与 E2E 回归 Checklist

### 10.1 QA 单点测试 CheckList（概要）

- **QA-1：Onboarding & Profile**
  - 正向提交流程
  - 表单校验（未填必填项、异常输入）
  - 接口错误处理

- **QA-2：InterviewRoom 行为面房间**
  - 正常问答流程
  - WebSocket 连通性
  - 实时提示显示与模式切换
  - 网络异常 / 重连 / 刷新场景

- **QA-3：报告页与轮询**
  - 报告生成中/成功/失败三种状态
  - 轮询重试逻辑

### 10.2 E2E 回归 CheckList（每次发版前）

- 场景 A：新用户首次全流程
  - 从 `/onboarding` → `/dashboard` → `/interview/{id}` → `/report/{id}` 完整闭环

- 场景 B：已有画像用户快速开始
  - 直接从 `/dashboard` 创建新会话并完成一场行为面

- 场景 C：中途网络异常 & 恢复
  - 断网/重连时，前端行为与提示正确

- 场景 D：报告生成异常
  - FAILED / 超时场景下的错误提示与重试

- 场景 E：多浏览器与基础兼容
  - Chrome/Edge + 主流分辨率（1920/1366 等）

> 完整详细版 E2E Checklist 可在测试文档中单独维护，此处为概要索引。

---

## 11. 后续优化与扩展思路（超出 MVP）

> 在整理过程中新增的一些可迭代方向。

- **引入视觉多模态**：
  - 眼神接触、表情、姿态分析；
  - 提供「镜前练习」模式，专门纠正紧张小动作与眼神游离。

- **更丰富的面试官人格与场景库**：
  - 不同行业、不同比例的“严厉/友善/沉默”型面试官；
  - 场景化面试（初创公司合伙人、大厂 HRBP、外企 Hiring Manager 等）。

- **成长体系与激励机制**：
  - 面试等级/段位体系（从“新手候选人”到“面试高手”）；
  - 日历打卡与连续训练奖励；
  - 可视化成长曲线。

- **多语言与跨文化面试**：
  - 支持英语及其他语种行为面；
  - 针对海外公司文化差异给出本地化建议。

- **企业端合作模式**：
  - 为校招/社招项目提供“候选人训练营”；
  - 将部分能力开放为企业内部培训工具（面试官训练、录用标准标注）。

---

## 12. 总结

本文件汇总了：

- 多模态面试系统的产品定位与竞品差异化；
- 用户全流程体验设计与关键交互状态机；
- 行为面 MVP 的技术架构与核心接口；
- 后端 / 前端 / 算法的实施计划与任务拆解；
- FE 开发 CheckList、算法任务模版、QA 与 E2E 回归 CheckList；
- 以及未来可扩展的多模态与业务方向。

基于此文档，团队可以直接：

- 在评审会上快速对齐“我们要做什么、怎么做”；
- 按 Sprint 维度排期和拆解任务（飞书项目/Jira/禅道）；
- 在 MVP 成功后，有清晰的下一步演进路线（更多面试类型、多模态与 ToB 方向）。

---

## 13. V2+ 优化规划（中长期路线）

> 本章节在现有 MVP 方案基础上，给出中长期可迭代的方向，便于对内规划 Roadmap、对外讲述产品故事。

### 13.1 从“单场行为面”到“能力训练操作系统”

- **能力维度体系化（标准化画像）**
  - 在现有 `skills/softSkills` 基础上，固化一套能力字典，例如：
    - 通用能力：结构化表达、复盘能力、Ownership、抗压、沟通协作；
    - 技术向能力：问题拆解、复杂度意识、风险意识等。
  - 所有题目、评分、报告、训练计划都映射到统一的能力维度，形成“一种共同语言”。

- **能力驱动的训练路线（从“练题”到“练能力”）**
  - 面试训练路线不再只是“行为面 × N 场”，而是「围绕某几个能力维度」设计：
    - 本周主修：结构化表达 + 冲突管理；
    - 下周主修：复盘能力 + 抗压表现。
  - 行为面问题自动优先抽取用户能力短板对应的题型，形成真正个性化的题目分配。

- **训练包 / 场景包产品化**
  - 封装为若干「训练包」：
    - 大厂校招行为面训练营；
    - 转行产品经理行为面训练包；
    - 海外英语行为面训练包等。
  - 每个包 = 题库 + 面试官人格 + 评分 Rubric + 报告话术模板，可作为运营活动与商业化售卖单元。

### 13.2 体验深化：情绪、安全感与真实感

- **准备阶段：情绪与状态管理模块**
  - 在 Onboarding → Dashboard 之间插入轻量「面试准备模块」：
    - 1–2 分钟呼吸引导 + 积极暗示（降低紧张感）；
    - 明确告诉用户“这里是训练场，不是被评判的考场”。
  - 可结合简单心理问卷，动态调节训练节奏（问题数量、难度）。

- **双模式命名与难度可调**
  - 将 training/immersive 正式产品化为：
    - 训练营模式：显示 STAR 提示板、结构 checklist、提示 Tab 默认展开；
    - 考场模拟模式：只保留计时与极少提示，不展示结构板。
  - 加一个「难度滑杆」或分级标签（新手/进阶/冲刺），逐步减少提示频率，构建成长感。

- **时间感与面试官打断机制**
  - 每题展示“当前用时 / 推荐用时（如 2 分钟）”的柔和计时条，帮助用户把握节奏；
  - 针对明显过长回答，引入 AI 面试官“礼貌打断”：
    - 如：「时间有限，我们可以先快速说下结果吗？」
  - 这类行为会显著增强“像真的面试”的沉浸感与抗压训练效果。

- **复盘阶段：从单份报告到“学习资产库”**
  - 在 report 中允许用户：
    - 将某些高质量回答片段标记为「可复用模版」；
    - 将不佳回答标记为「反面教材」，方便集中重练。
  - 提供「我的高能回答库」视图：
    - 按能力维度 / 岗位 / 公司过滤；
    - 支持导出到飞书/Notion 等做个人知识库。
  - 一键生成「面试手记」：基于本场报告，自动生成总结与 3 条行动项，帮助用户形成长期反思习惯。

### 13.3 多模态与算法路线：从“转写”到“教练”

- **音频层：说话风格与表达教练**
  - 在 ASR 基础上增加音频特征分析：
    - 语速：字数/秒；音量曲线；停顿分布；
    - 口头禅：统计“然后、就是、那个、嗯”等频次。
  - 报告中增加「表达风格」模块：
    - 语速建议（偏快/偏慢，目标区间）；
    - 口头禅指数 + 具体减少建议（如“先写下关键点再开口”）。

- **内容层：基于 Rubric 的结构化评估**
  - 为行为面构建 Rubric：是否回答到点、是否讲清情境/任务、是否说明自己的角色和行动、是否有结果与反思。
  - 利用 LLM + 规则结合：
    - Input：某题回答文本 + Rubric；
    - Output：逐项评分/布尔值 + 结构化改写建议。
  - 报告中可以逐题展示：「这一题你有讲清背景和行动，但缺少结果，下次建议补充 X。」

- **视觉多模态预留（V2+ 可选）**
  - 在算法输入/输出结构中预留字段：
    - `gazeAttention`：眼神接触度；
    - `postureStability`：姿态稳定度；
    - `facialExpressionStability`：表情紧张度。
  - 报告 UI 中预留「非语言表现」区域，即便短期先展示“待解锁”，也能给用户未来期待与产品 Roadmap 的展示空间。

### 13.4 数据与 A/B 实验：让系统“自己变聪明”

- **埋点与指标体系**
  - 核心漏斗：注册 → 完成 Onboarding → 完成首次行为面 → 查看报告 → N 日内再次练习；
  - 行为指标：每场问题数、平均回答时长、提示触发次数、中途退出率；
  - 体验指标：面试结束后的一题满意度评分 + 开放反馈。

- **A/B 测试与 Feature Flag**
  - 典型 A/B 场景：
    - A 组：有 STAR 结构提示板；B 组：只有轻量提示；
    - A 组：报告中附带「建议训练任务」；B 组：只有评分和标签。
  - 通过数据比较留存率、再次练习次数、主观满意度等，指导产品方向。
  - 在技术上通过简单 Feature Flag（按 userId/实验组分流）实现按需灰度发布。

### 13.5 商业化与生态：从工具到平台

- **ToC：订阅 + 训练包**
  - 免费层：有限次数行为面 + 基础报告；
  - 订阅层：无限次模拟 + 深度报告（多模态、能力曲线、训练计划）+ 专属训练包；
  - 单次付费：购买特定场景包（如“字节跳动后端校招行为面训练营”）。

- **ToB：高校与培训机构合作**
  - 为高校就业指导中心提供白标版本：
    - 校园专属题库 + 行为面训练营；
    - 学生整体能力画像报表，辅助学校就业数据分析。
  - 与培训机构/职业教练合作：作为课程配套的实战系统，提高课程付费价值和留存。

- **导师/教练模式**
  - 在 AI 报告基础上增加人类专家二次点评：
    - 用户可付费请导师对某场报告进行细致标注与一对一建议；
  - 支持导师端工具：快速浏览候选人多场报告与能力曲线，提高辅导效率。

> 通过以上 V2+ 规划，多模态面试系统可以从一个“好用的面试练习工具”，成长为一个围绕「能力提升与职业成长」的长期平台，同时具备清晰的商业模式和对 B 端/学校/机构的延展空间。
