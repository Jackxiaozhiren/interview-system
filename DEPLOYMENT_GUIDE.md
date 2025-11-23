# 🚀 Deployment Guide: Multimodal Interview Platform

## 📋 Pre-Deployment Checklist

Before deploying, ensure:
- ✅ All 11 phases are complete (check `task.md`)
- ✅ Backend runs locally without errors (`python backend/main.py`)
- ✅ Frontend builds successfully (`npm run build` in `frontend/`)
- ✅ Database migrations work (`Base.metadata.create_all()`)
- ✅ Environment variables are documented

---

## 🔧 Local Testing (Do This First!)

### 1. Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set environment variables
# Create a .env file:
DATABASE_URL=sqlite:///./interview.db
SECRET_KEY=your-super-secret-jwt-key-change-this
KIMI_API_KEY=your-kimi-api-key

# Run server
python main.py
# Should see: "Application startup complete" at http://localhost:8000
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file:
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api

# Run dev server
npm run dev
# Should open: http://localhost:3000
```

### 3. Test Critical Flows
Walk through these paths:
1. Register → Login → Dashboard
2. Create Interview Session → Complete Interview
3. Review Session Results
4. Chat with AI Copilot (`/coach`)
5. Solve Coding Problem (`/interview/coding`)
6. Save Answer (`/library`)

---

## 🌐 Production Deployment

### Option A: Vercel (Frontend) + Render (Backend) [RECOMMENDED]

#### Step 1: Deploy Backend to Render

1. **Create Render Account**: https://render.com

2. **Create New Web Service**:
   - Connect your GitHub repo
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Set Environment Variables** (in Render dashboard):
   ```
   DATABASE_URL=postgresql://... (use Render's free PostgreSQL)
   SECRET_KEY=<generate random 32-char string>
   KIMI_API_KEY=<your kimi key>
   PYTHONPATH=/opt/render/project/src
   ```

4. **Upgrade Database** (if using PostgreSQL):
   ```python
   # In backend/app/db.py, change:
   DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://...")
   ```

5. **Note Backend URL**: e.g., `https://your-app.onrender.com`

#### Step 2: Deploy Frontend to Vercel

1. **Create Vercel Account**: https://vercel.com

2. **Import Project**:
   - Connect GitHub repo
   - Framework: Next.js
   - Root directory: `frontend`

3. **Set Environment Variables** (in Vercel dashboard):
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-app.onrender.com/api
   ```

4. **Build Settings**:
   - Build command: `npm run build`
   - Output directory: `.next`
   - Install command: `npm install`

5. **Deploy**: Click "Deploy"

6. **Note Frontend URL**: e.g., `https://your-app.vercel.app`

#### Step 3: Update CORS

In `backend/main.py`, update CORS origins:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local dev
        "https://your-app.vercel.app"  # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Redeploy backend after this change.

---

### Option B: Railway (All-in-One) [SIMPLER BUT PAID]

1. **Create Railway Account**: https://railway.app

2. **Create New Project** → **Deploy from GitHub**

3. **Add PostgreSQL Service**:
   - Click "+" → "Database" → "PostgreSQL"
   - Railway auto-generates `DATABASE_URL`

4. **Add Backend Service**:
   - Root directory: `/backend`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Environment variables:
     ```
     DATABASE_URL=${{Postgres.DATABASE_URL}}
     SECRET_KEY=<random string>
     KIMI_API_KEY=<your key>
     ```

5. **Add Frontend Service**:
   - Root directory: `/frontend`
   - Build command: `npm run build`
   - Start command: `npm start`
   - Environment variables:
     ```
     NEXT_PUBLIC_API_BASE_URL=https://backend-service.railway.app/api
     ```

6. **Enable Public Domains** for both services

---

### Option C: Docker + Any Cloud Provider

#### Create `backend/Dockerfile`:
```dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Create `frontend/Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Create `docker-compose.yml` (root directory):
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: interview_db
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: your_password
    volumes:
      - db_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://admin:your_password@postgres:5432/interview_db
      SECRET_KEY: your_secret_key
      KIMI_API_KEY: your_kimi_key
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://localhost:8000/api
    depends_on:
      - backend

volumes:
  db_data:
```

Deploy to:
- **AWS**: ECS + RDS
- **Google Cloud**: Cloud Run + Cloud SQL
- **DigitalOcean**: App Platform
- **Azure**: Container Instances

---

## 🔒 Security Checklist

Before going live:

### Backend
- [ ] Change `SECRET_KEY` to a strong random string
- [ ] Disable `DEBUG=True` in production
- [ ] Use HTTPS (Render/Vercel/Railway provide this free)
- [ ] Set up rate limiting (add `slowapi` package)
- [ ] Enable CORS only for your frontend domain
- [ ] Use PostgreSQL instead of SQLite

### Frontend
- [ ] Remove all `console.log` statements
- [ ] Set up error tracking (Sentry)
- [ ] Enable CSP headers
- [ ] Use `NEXT_PUBLIC_` prefix for env vars

### Database
- [ ] Enable backups (automatic on Render/Railway)
- [ ] Use connection pooling if needed
- [ ] Add database indexes for frequently queried columns

---

## 📊 Post-Deployment Monitoring

### Free Monitoring Tools
1. **Vercel Analytics**: Built-in, shows pageviews
2. **Render Metrics**: CPU/Memory usage
3. **Sentry** (free tier): Error tracking
4. **Google Analytics**: User behavior

### Key Metrics to Track
- User signups per day
- Interview completion rate
- Average session duration
- Most-used features (Dashboard, Coding, Coach, etc.)
- Error rates by endpoint

---

## 🐛 Common Deployment Issues

### Issue 1: "500 Internal Server Error" on Backend
**Cause**: Missing environment variables
**Fix**: Check Render/Railway logs, ensure all env vars are set

### Issue 2: Frontend can't connect to Backend
**Cause**: Wrong `NEXT_PUBLIC_API_BASE_URL`
**Fix**: Use full backend URL (https://...), not localhost

### Issue 3: Database connection fails
**Cause**: Wrong `DATABASE_URL` format
**Fix**: PostgreSQL format: `postgresql://user:pass@host:5432/dbname`

### Issue 4: CORS errors
**Cause**: Frontend URL not in CORS origins
**Fix**: Update `main.py` CORS middleware with Vercel URL

### Issue 5: Build fails on Vercel
**Cause**: Missing dependencies or build command
**Fix**: Ensure `package.json` has all deps, check build logs

---

## 🎯 First 10 Users Strategy

### Week 1: Friends & Family
- Send personal invites to 5-10 people
- Ask for honest feedback (not just "it's great!")
- Schedule 15-min video calls to watch them use it

### Week 2: University / Online Communities
- Post in:
  - r/cscareerquestions
  - r/interviews
  - University career center
  - LinkedIn
- Offer: "Free beta access - help me improve this tool"

### Week 3: Collect Feedback
Create a Google Form:
1. What confused you?
2. What feature did you use most?
3. What's missing?
4. Would you pay for this? How much?

### Week 4: Iterate
Based on feedback, prioritize:
- Bug fixes (HIGH priority)
- UX improvements (MEDIUM priority)
- New features (LOW priority - only if 5+ users ask)

---

## 💰 Monetization (After 100+ Users)

### Free Tier
- 5 interviews/month
- Basic AI feedback
- No coding problems

### Pro Tier ($10-20/month)
- Unlimited interviews
- AI Copilot access
- Coding arena
- Advanced analytics
- Answer library

### Implementation
Use Stripe for payments:
```bash
pip install stripe
```

Add to `backend/app/routers/payment.py` (already exists!)

---

## ✅ Launch Checklist

Before announcing publicly:

- [ ] All features tested locally
- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] Database backups enabled
- [ ] Error tracking set up
- [ ] Privacy policy page created
- [ ] Terms of service page created
- [ ] Support email set up (e.g., support@yourapp.com)
- [ ] Landing page explains value clearly
- [ ] At least 3 friends tested it successfully

---

## 📣 Announcement Template

Post this on Reddit/LinkedIn after deployment:

> **I built an AI-powered interview prep platform (open beta!)**
> 
> Hey everyone! I'm a [student/developer] who just finished building a multimodal interview practice platform. It has:
> 
> - 🎙️ Real-time AI interviews with feedback
> - 💻 LeetCode-style coding challenges
> - 🤖 24/7 AI coach to help you improve
> - 🎮 Gamification (XP, badges, streaks)
> 
> I'm looking for 10-20 beta users to try it out and give feedback. It's completely free for now!
> 
> Link: [your-app.vercel.app]
> 
> Would love to hear what you think!

---

## 🚀 You're Ready to Launch!

**Remember**:
1. Deploy first, perfect later
2. Real user feedback > more features
3. Start small (10 users), then scale
4. Iterate based on data, not assumptions

Good luck! 🎓✨
