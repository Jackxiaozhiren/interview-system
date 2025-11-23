# 🧪 AI面试系统 - E2E测试脚本

## 测试环境准备

### 前提条件
- Backend运行: `http://localhost:8000`
- Frontend运行: `http://localhost:3000`
- 测试账户: `test@example.com` / `Test123456`

---

## 1️⃣ 核心流程测试

### Test Case 1: 用户注册与登录
```bash
测试步骤:
1. 访问 http://localhost:3000/register
2. 填写信息:
   - Email: test_{timestamp}@example.com
   - Password: Test123456
   - Full Name: E2E Test User
3. 点击"注册"
4. 验证跳转到登录页
5. 使用相同凭证登录
6. 验证跳转到Dashboard

预期结果:
✅ 注册成功
✅ 登录成功
✅ Dashboard显示用户信息
```

---

### Test Case 2: 智能简历匹配（Match Report）
```bash
测试步骤:
1. 登录后访问 /interview/setup
2. 上传任意PDF文件作为简历
3. 输入岗位描述:
   "招聘前端工程师，要求熟悉React、TypeScript，有项目经验"
4. 点击"生成匹配报告"
5. 等待AI分析（10-30秒）

预期结果:
✅ 显示匹配报告
✅ 包含"优势"、"劣势"、"建议"
✅ "开始面试"按钮可点击
```

---

### Test Case 3: 完整行为面试流程
```bash
测试步骤:
1. 从Match Report页面点击"开始面试"
2. 选择面试官风格: "专业面试官"
3. 开始面试
4. 回答3个问题（每个问题输入至少50字）
5. 点击"提交所有答案"
6. 查看评分报告

预期结果:
✅ 问题逐个显示
✅ 可以输入答案
✅ 提交成功
✅ 显示多维度评分（结构化、清晰度等）
✅ 自动跳转到Review页面
```

---

### Test Case 4: 视频复盘（Game Tape）
```bash
测试步骤:
1. 完成面试后，访问 /interview/review/[sessionId]
2. 查看时间线播放器
3. 点击时间线上的反馈事件
4. 验证视频跳转到对应时间

预期结果:
✅ 时间线显示反馈事件
✅ 点击事件可跳转
✅ 显示评分和改进建议
```

---

### Test Case 5: AI答案优化（Answer Doctor）
```bash
测试步骤:
1. 在Review页面选择一个答案
2. 点击"Fix My Answer"
3. 查看AI优化建议
4. 对比原答案和优化后的答案

预期结果:
✅ 显示优化后的答案
✅ 使用STAR方法结构化
✅ 包含改进说明
```

---

### Test Case 6: 游戏化系统
```bash
测试步骤:
1. 完成一次面试
2. 访问 /gamification
3. 查看等级、XP、徽章

预期结果:
✅ 显示当前等级（新用户应为Lv.1）
✅ 完成首次面试后解锁"破冰者"徽章
✅ XP增加50+
✅ Streak显示为1天
```

---

### Test Case 7: 免费/付费配额检查
```bash
测试步骤:
1. 访问 GET /tier/status API
2. 验证返回:
   {
     "tier": "free",
     "remaining": 3
   }
3. 完成3次面试
4. 尝试第4次面试

预期结果:
✅ 前3次正常
✅ 第4次弹出升级提示
✅ UpgradeModal显示
```

---

## 2️⃣ 技术面试测试

### Test Case 8: 代码编辑器基础功能
```bash
测试步骤:
1. 确保已运行种子数据: python backend/seed_coding_problems.py
2. 访问 /coding-interview
3. 点击"Two Sum"问题
4. 验证Monaco编辑器加载
5. 切换语言: Python → JavaScript → Python
6. 编写代码并提交

预期结果:
✅ 编辑器正常显示
✅ 语法高亮工作
✅ 语言切换时代码模板更新
✅ 可以输入代码
```

---

### Test Case 9: AI代码评判
```bash
测试步骤:
1. 在Two Sum问题中提交代码:

Python正确解法:
def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        if target - num in seen:
            return [seen[target - num], i]
        seen[num] = i

2. 点击"Submit Code"
3. 等待AI评判（5-15秒）

预期结果:
✅ 状态显示"Accepted"
✅ Pass rate: 100%
✅ Time complexity: O(n)
✅ Space complexity: O(n)
✅ 反馈详细且准确
```

---

### Test Case 10: 获取提示功能
```bash
测试步骤:
1. 在任意编程题页面
2. 写部分代码（不完整）
3. 点击"Get Hint"
4. 查看AI生成的提示

预期结果:
✅ 显示3个渐进式hint
✅ 第1个hint最模糊
✅ 第3个hint较具体
✅ 不直接给出答案
```

---

## 3️⃣ 性能测试

### Test Case 11: Redis缓存验证
```bash
测试步骤:
1. 第一次访问 GET /coding/problems/two-sum
   - 记录响应时间 T1
2. 第二次访问相同endpoint
   - 记录响应时间 T2

预期结果:
✅ T2 < T1 * 0.5 (至少快50%)
✅ 使用redis-cli查看: KEYS "problem:*"
✅ 缓存key存在
```

---

## 4️⃣ API测试脚本

### 使用cURL测试

#### 注册
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "full_name": "Test User"
  }'
```

#### 登录
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

#### 获取编程题
```bash
TOKEN="your_token_here"
curl -X GET "http://localhost:8000/coding/problems" \
  -H "Authorization: Bearer $TOKEN"
```

#### 提交代码
```bash
curl -X POST http://localhost:8000/coding/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": "two-sum",
    "code": "def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        if target - num in seen:\n            return [seen[target - num], i]\n        seen[num] = i",
    "language": "python"
  }'
```

---

## 5️⃣ UI/UX测试清单

### 响应式设计
- [ ] 在1920x1080分辨率下布局正常
- [ ] 在1366x768分辨率下布局正常
- [ ] 在移动设备模拟器下浏览（虽然主要是桌面应用）

### 视觉一致性
- [ ] 所有按钮hover效果一致
- [ ] 颜色主题统一（蓝色/紫色渐变）
- [ ] 字体大小合理（标题24px+，正文16px）
- [ ] Loading状态有动画

### 交互反馈
- [ ] 按钮点击有loading状态
- [ ] 表单提交有成功/失败提示
- [ ] 错误信息清晰易懂
- [ ] 长操作有进度指示

---

## 6️⃣ 浏览器兼容性测试

### 应测试的浏览器
- [ ] Chrome (最新版)
- [ ] Edge (最新版)
- [ ] Firefox (最新版)
- [ ] Safari (Mac用户)

### 关键功能验证
- [ ] Monaco编辑器在所有浏览器正常
- [ ] WebSocket连接稳定
- [ ] 音频播放正常（语音面试官）
- [ ] 视频录制/播放正常

---

## 7️⃣ 边界情况测试

### 输入验证
- [ ] 空邮箱注册 → 显示错误
- [ ] 弱密码注册 → 显示错误
- [ ] 重复邮箱注册 → 显示'已存在'
- [ ] 超长答案输入（10000+字） → 正常处理

### 网络异常
- [ ] API请求失败 → 显示友好错误信息
- [ ] WebSocket断开 → 自动重连
- [ ] 长时间无操作 → Token过期提示

---

## 8️⃣ 性能基准

### 目标指标
- 页面首次加载: < 3秒
- API响应时间: < 500ms
- 代码提交评判: < 15秒
- Monaco编辑器加载: < 2秒

### 测试工具
- Chrome DevTools (Performance tab)
- Lighthouse (性能评分目标: 80+)
- Backend日志中的ProcessTime

---

## 9️⃣ 数据完整性测试

### 数据库验证
```bash
# 检查用户创建
SELECT * FROM users WHERE email='test@example.com';

# 检查面试session
SELECT * FROM interview_sessions ORDER BY created_at DESC LIMIT 5;

# 检查gamification数据
SELECT * FROM user_gamification WHERE user_id='...';

# 检查编程题
SELECT id, title, difficulty FROM coding_problems;
```

---

## 🔟 自动化测试建议

### 推荐工具
- **Playwright**: E2E测试框架
- **Pytest**: Backend单元测试
- **Jest**: Frontend单元测试

### 优先级
1. **P0**: 注册/登录流程
2. **P1**: 完整面试流程
3. **P2**: 代码提交评判
4. **P3**: UI细节

---

## 📋 测试报告模板

```markdown
# 测试报告

**日期**: 2025-XX-XX
**测试人员**: XXX
**版本**: v1.0

## 测试摘要
- 总测试用例: 30
- 通过: 28
- 失败: 2
- 阻塞: 0

## 失败用例
1. Test Case 11: Redis缓存
   - 问题: Redis未启动
   - 影响: 性能未优化
   - 解决方案: docker-compose up redis

2. Test Case 9: 代码评判
   - 问题: Kimi API超时
   - 影响: 部分提交失败
   - 解决方案: 增加重试机制

## 建议
- 增加更多编程题
- 优化Monaco编辑器加载速度
- 添加更多徽章类型
```

---

**E2E Testing Ready!** 🧪
