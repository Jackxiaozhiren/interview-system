# 🚀 部署步骤清单 (Deployment Checklist)

## ✅ 准备工作已完成

我已经帮你完成了：
- ✅ 更新 `backend/requirements.txt`（添加 PostgreSQL 支持）
- ✅ 创建 `frontend/vercel.json`（Vercel 配置文件）
- ✅ 创建 `.env.example` 文件（环境变量模板）

---

## 📋 第一步：部署后端到 Render

### 1.1 注册/登录 Render
- 访问：https://render.com
- 点击 **"Get Started"** 或 **"Sign In"**
- 使用 GitHub 账号登录（推荐）

### 1.2 创建 PostgreSQL 数据库
1. 在 Render Dashboard，点击 **"New +"** → **"PostgreSQL"**
2. 填写信息：
   - Name: `interview-db`（或任意名称）
   - Database: `interview_db`
   - User: `admin`（自动生成）
   - Region: 选择离你最近的区域
3. Plan: **"Free"**（免费版，有 90 天限制，足够测试）
4. 点击 **"Create Database"**
5. **重要：保存 "Internal Database URL"**（稍后需要）

### 1.3 创建 Web Service（后端）
1. 点击 **"New +"** → **"Web Service"**
2. 选择 **"Build and deploy from a Git repository"**
3. 如果第一次使用，需要连接你的 GitHub 账号
4. 选择你的仓库（需要先推送代码到 GitHub）
5. 填写配置：
   - **Name**: `interview-backend`
   - **Region**: 与数据库相同
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. 选择 **"Free"** plan
7. **环境变量**（点击 "Environment" 标签添加）：
   ```
   DATABASE_URL = <刚才保存的 PostgreSQL Internal URL>
   SECRET_KEY = <随机生成32位字符串>
   KIMI_API_KEY = <你的 Kimi API Key>
   PYTHONPATH = /opt/render/project/src
   ```
8. 点击 **"Create Web Service"**
9. 等待部署（约 5-10 分钟）
10. **保存后端URL**（例如：`https://interview-backend-abc123.onrender.com`）

---

## 📋 第二步：部署前端到 Vercel

### 2.1 注册/登录 Vercel
- 访问：https://vercel.com
- 点击 **"Start Deploying"** 或 **"Sign In"**
- 使用 GitHub 账号登录

### 2.2 导入项目
1. 在 Vercel Dashboard，点击 **"Add New..." → "Project"**
2. 选择你的 GitHub 仓库
3. 配置设置：
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend` （点击 "Edit" 修改）
   - **Build Command**: 默认即可 (`npm run build`)
   - **Output Directory**: 默认即可 (`.next`)
   - **Install Command**: 默认即可 (`npm install`)

### 2.3 设置环境变量
1. 展开 **"Environment Variables"** 部分
2. 添加变量：
   - **Key**: `NEXT_PUBLIC_API_BASE_URL`
   - **Value**: `https://interview-backend-abc123.onrender.com/api`
     （用你第一步保存的 Render 后端 URL，记得加 `/api`）
3. 点击 **"Deploy"**
4. 等待部署（约 2-5 分钟）
5. **保存前端URL**（例如：`https://your-app.vercel.app`）

---

## 📋 第三步：更新 CORS 配置

### 3.1 修改后端代码
1. 在本地，打开 `backend/main.py`
2. 找到 `CORSMiddleware` 配置
3. 修改为：
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # 本地开发
        "https://your-app.vercel.app",  # 替换为你的 Vercel URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
4. **提交代码到 GitHub**：
```bash
git add backend/main.py
git commit -m "Add production CORS origin"
git push
```
5. Render 会自动重新部署（约 2-3 分钟）

---

## 📋 第四步：测试部署

### 4.1 测试后端
1. 打开：`https://your-backend.onrender.com/docs`
2. 应该看到 FastAPI 的 Swagger UI
3. 测试 `/` 端点，应该返回 `{"status": "ok"}`

### 4.2 测试前端
1. 打开：`https://your-app.vercel.app`
2. 应该看到主页/Dashboard
3. 尝试注册一个账号
4. 尝试创建一个面试 session
5. 测试聊天功能 (`/coach`)

### 4.3 常见问题
如果遇到错误：

**后端 500 错误**：
- 检查 Render 日志（Dashboard → Logs）
- 确认环境变量设置正确

**前端无法连接后端**：
- 检查 `NEXT_PUBLIC_API_BASE_URL` 是否正确
- 检查后端 CORS 配置是否包含 Vercel URL

**数据库连接失败**：
- 确认 `DATABASE_URL` 是 "Internal Database URL"，不是 "External"

---

## 📋 第五步：推送代码到 GitHub（如果还没做）

如果你还没有 GitHub 仓库：

```bash
# 在项目根目录
git init
git add .
git commit -m "Initial commit - Interview platform"

# 创建 GitHub 仓库（在 https://github.com/new）
# 然后：
git remote add origin https://github.com/你的用户名/interview-system.git
git branch -M main
git push -u origin main
```

---

## ✅ 部署完成检查清单

完成后，你应该有：
- [ ] 后端运行在 Render：`https://xxx.onrender.com`
- [ ] 前端运行在 Vercel：`https://xxx.vercel.app`
- [ ] PostgreSQL 数据库在 Render
- [ ] 环境变量配置正确
- [ ] CORS 配置包含前端 URL
- [ ] 可以访问前端并注册账号
- [ ] 可以创建面试 session
- [ ] 可以使用 AI Coach

---

## 🎉 下一步

部署成功后：
1. 分享给 5-10 个朋友测试
2. 收集反馈（创建一个 Google Form）
3. 修复他们发现的 bug
4. 在 Reddit/LinkedIn 上宣布

**恭喜！你的产品已经上线了！🚀**

---

## 📞 需要帮助？

如果遇到问题：
1. 检查 Render 的日志
2. 检查 Vercel 的部署日志
3. 使用浏览器开发者工具（F12）查看网络错误
