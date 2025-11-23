# 🚀 快速开始测试指南

## 前提条件

确保backend正在运行：
```powershell
# 在 g:\windsurf_interview system\backend 目录
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

确保frontend正在运行：
```powershell
# 在 g:\windsurf_interview system\frontend 目录
npm run dev
```

---

## 🧪 5分钟快速测试

### 1. 测试认证系统 (1分钟)
```bash
# 访问
http://localhost:3000/register

# 创建账户
Email: test@example.com
Password: Test123456
Name: 测试用户
```

### 2. 测试Match Report (1分钟)
```bash
# 访问
http://localhost:3000/interview/setup

# 上传一个PDF简历（任何PDF都可以）
# 输入岗位描述（随便写几句话）
# 点击"生成匹配报告"
```

### 3. 测试面试流程 (2分钟)
```bash
# 从setup页面继续
# 开始面试
# 回答2-3个问题
# 提交面试
```

### 4. 测试Game Tape (1分钟)
```bash
# 面试结束后自动跳转到Review页面
# 查看视频复盘
# 点击时间线事件
# 查看评分
```

---

## 🔍 重点测试项

### 必测功能（这些是核心价值）
1. ✅ **Match Report** - AI匹配分析
2. ✅ **实时HUD** - WPM/填充词检测
3. ✅ **Game Tape** - 视频复盘
4. ✅ **Gamification** - XP/徽章
5. ✅ **语音AI** - TTS播报

### 可选测试
- Answer Doctor
- Mirror Check
- 进度Dashboard
- 免费/付费quota

---

## 📊 测试后操作

1. **填写** `TESTING_CHECKLIST.md`
2. **记录**所有bug
3. **告诉我**测试结果

我将基于您的反馈：
- 优先修复关键bug
- 然后继续Week 2开发

---

**准备好了吗？开始测试吧！** 🎯
