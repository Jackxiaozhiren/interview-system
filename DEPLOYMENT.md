# Multimodal Interview System - Deployment Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development](#local-development)
4. [Production Deployment](#production-deployment)
5. [WebSocket Configuration](#websocket-configuration)
6. [Media Storage Setup](#media-storage-setup)
7. [Monitoring & Logging](#monitoring--logging)

---

## Prerequisites

### System Requirements
- **Node.js**: v18+ (for frontend)
- **Python**: 3.9+ (for backend)
- **PostgreSQL**: 13+ (recommended for production)
- **Redis**: 6+ (optional, for session management)

### Required Accounts
- Cloud provider account (AWS/Azure/GCP)
- S3 or equivalent object storage
- Domain name with SSL certificate

---

## Environment Setup

### Backend Environment Variables

Create `backend/.env`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/interview_db
# For local dev: DATABASE_URL=sqlite:///./interview.db

# Authentication
SECRET_KEY=your-secret-key-here-minimum-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Services
KIMI_API_KEY=your-kimi-api-key
KIMI_API_BASE=https://api.moonshot.cn/v1

# CORS (adjust for production domain)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Media Storage
MEDIA_STORAGE_PATH=./media_files
# For S3: S3_BUCKET_NAME=your-bucket-name
# For S3: AWS_REGION=us-east-1

# WebSocket
WS_MAX_CONNECTIONS=100
WS_MESSAGE_QUEUE_SIZE=1000
```

### Frontend Environment Variables

Create `frontend/.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
# For production: NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com

# WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:8000
# For production: NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_MOCK_PAYMENT=true
```

---

## Local Development

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python -c "from app.db import Base, engine; Base.metadata.create_all(bind=engine)"

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production (test)
npm run build
```

### 3. Verify Installation

- Backend API: http://localhost:8000/docs (Swagger UI)
- Frontend: http://localhost:3000
- Health Check: http://localhost:8000/

---

## Production Deployment

### Option 1: Docker Deployment

#### Backend Dockerfile
Create `backend/Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Frontend Dockerfile
Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

#### Docker Compose
Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: interview_db
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/interview_db
      SECRET_KEY: ${SECRET_KEY}
      KIMI_API_KEY: ${KIMI_API_KEY}
    ports:
      - "8000:8000"
    depends_on:
      - postgres
    volumes:
      - ./media_files:/app/media_files

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://backend:8000
      NEXT_PUBLIC_WS_URL: ws://backend:8000
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

**Deploy:**
```bash
docker-compose up -d
```

### Option 2: Cloud Deployment (AWS Example)

#### Backend (Elastic Beanstalk / ECS)

1. **Prepare application**:
```bash
cd backend
pip freeze > requirements.txt
```

2. **Create Procfile**:
```
web: uvicorn main:app --host 0.0.0.0 --port 8000
```

3. **Deploy**:
```bash
eb init -p python-3.9 interview-backend
eb create interview-backend-env
eb deploy
```

#### Frontend (Vercel / Amplify)

**Vercel Deployment:**
```bash
cd frontend
npm install -g vercel
vercel --prod
```

**Configure Environment Variables** in Vercel dashboard:
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_WS_URL`

---

## WebSocket Configuration

### Production WebSocket Setup

#### 1. Use WSS (Secure WebSocket)

Update `frontend/src/app/av-interview/page.tsx`:

```typescript
// Use environment variable for WebSocket URL
const wsUrl = process.env.NODE_ENV === 'production'
  ? `wss://${window.location.host}/ws/analysis/${session.id}`
  : `ws://localhost:8000/ws/analysis/${session.id}`;
```

#### 2. Nginx Configuration (Reverse Proxy)

Create `/etc/nginx/sites-available/interview-app`:

```nginx
upstream backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # WebSocket support
    location /ws/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeout settings
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Regular API requests
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/interview-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 3. Update Backend for Production

Update `backend/app/routers/websocket.py`:

```python
# Add CORS headers for WebSocket
@router.websocket("/ws/analysis/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    # Accept connection with origin check
    origin = websocket.headers.get("origin")
    if origin not in allowed_origins:
        await websocket.close(code=403)
        return
    
    await websocket.accept()
    # ... rest of the code
```

---

## Media Storage Setup

### Option 1: Local Storage (Development Only)

Already configured. Files stored in `backend/media_files/`.

### Option 2: AWS S3 (Recommended for Production)

#### 1. Install boto3:
```bash
pip install boto3
```

#### 2. Create S3 Service

Create `backend/app/services/s3_storage.py`:

```python
import boto3
from botocore.exceptions import ClientError
import os

class S3Storage:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION', 'us-east-1')
        )
        self.bucket_name = os.getenv('S3_BUCKET_NAME')
    
    def upload_file(self, file_path: str, object_name: str):
        try:
            self.s3_client.upload_file(file_path, self.bucket_name, object_name)
            return f"https://{self.bucket_name}.s3.amazonaws.com/{object_name}"
        except ClientError as e:
            print(f"Error uploading file: {e}")
            return None
    
    def generate_presigned_url(self, object_name: str, expiration=3600):
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': object_name},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            print(f"Error generating presigned URL: {e}")
            return None
```

#### 3. Update Environment Variables:
```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=interview-media-files
```

#### 4. Update Media Upload Handler

Modify `backend/app/routers/interview.py`:

```python
from app.services.s3_storage import S3Storage

s3_storage = S3Storage()

@router.post("/sessions/{session_id}/media")
async def upload_media(
    session_id: str,
    file: UploadFile,
    media_type: str = Query(...),
    db: Session = Depends(get_db),
):
    # Save to S3 instead of local storage
    file_path = f"sessions/{session_id}/{file.filename}"
    
    # Upload to S3
    s3_url = s3_storage.upload_file(temp_file_path, file_path)
    
    # Store S3 URL in database
    media_obj = InterviewMediaORM(
        session_id=session_id,
        media_type=media_type,
        filename=file.filename,
        filepath=s3_url  # Store S3 URL
    )
    # ... rest of code
```

---

## Monitoring & Logging

### 1. Application Logging

#### Backend Logging Configuration

Update `backend/main.py`:

```python
import logging
from logging.handlers import RotatingFileHandler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler(
            'logs/app.log',
            maxBytes=10485760,  # 10MB
            backupCount=5
        ),
        logging.StreamHandler()
    ]
)
```

### 2. Performance Monitoring

Install monitoring tools:
```bash
pip install prometheus-fastapi-instrumentator
```

Add to `backend/main.py`:
```python
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()
Instrumentator().instrument(app).expose(app)
```

### 3. Error Tracking (Sentry)

```bash
pip install sentry-sdk[fastapi]
```

Add to `backend/main.py`:
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0,
)
```

---

## Security Checklist

- [ ] Use HTTPS/WSS in production
- [ ] Set strong `SECRET_KEY` (32+ characters)
- [ ] Configure CORS with specific origins
- [ ] Enable rate limiting
- [ ] Use environment variables for secrets
- [ ] Implement request validation
- [ ] Add authentication to WebSocket endpoints
- [ ] Use signed URLs for media access
- [ ] Enable database connection pooling
- [ ] Set up firewall rules

---

## Performance Optimization

### 1. Database Optimization
```python
# Use connection pooling
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=10
)
```

### 2. Frontend Optimization
```bash
# Enable compression
npm install compression

# Optimize images
npm install next-optimized-images
```

### 3. CDN Configuration
- Use CloudFront/CloudFlare for static assets
- Enable caching for media files
- Implement lazy loading for videos

---

## Deployment Checklist

### Pre-Deployment
- [ ] Run all tests (`pytest`, `npm test`)
- [ ] Build frontend (`npm run build`)
- [ ] Update environment variables
- [ ] Database migrations ready
- [ ] SSL certificates configured

### Deployment
- [ ] Deploy database first
- [ ] Deploy backend with health checks
- [ ] Deploy frontend
- [ ] Configure DNS
- [ ] Enable monitoring

### Post-Deployment
- [ ] Verify health endpoints
- [ ] Test WebSocket connection
- [ ] Upload test media file
- [ ] Check error logs
- [ ] Monitor performance metrics

---

## Troubleshooting

### WebSocket Connection Fails
```bash
# Check firewall
sudo ufw status

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test WebSocket
wscat -c ws://api.yourdomain.com/ws/analysis/test-session
```

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U username -d interview_db
```

### Media Upload Fails
```bash
# Check disk space
df -h

# Check S3 permissions
aws s3 ls s3://your-bucket-name
```

---

## Support & Maintenance

### Regular Maintenance
- Weekly: Review error logs
- Monthly: Update dependencies
- Quarterly: Security audit
- Annually: Infrastructure review

### Backup Strategy
- **Database**: Daily automated backups
- **Media Files**: Replicate to multiple regions (S3)
- **Code**: Git repository with tags for releases

---

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [WebSocket Best Practices](https://www.nginx.com/blog/websocket-nginx/)
- [AWS S3 Guide](https://docs.aws.amazon.com/s3/)

---

**Last Updated**: 2025-11-22  
**Version**: 1.0.0
