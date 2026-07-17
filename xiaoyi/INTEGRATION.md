# 小艺 Skill 对接指南

## 1. 架构概览

```
用户语音 → 小艺引擎 → Deeper Intent → 校园搭子 API → 返回结果 → 小艺播报/卡片
                 ↑
          skill.json (意图注册)
```

## 2. 对接步骤

### Step 1: 部署 API 服务

```bash
# Docker 一键部署
docker compose up -d
# API: http://localhost:3456
```

### Step 2: 注册 Skill

将 `xiaoyi/skill.json` 上传到鸿蒙开发者平台 → 小艺 Skill 管理 → 新建 Skill。

### Step 3: 配置 Intent Fulfillment

小艺会在用户说出意图匹配的 utterance 后，POST 到 `/api/xiaoyi`：

```json
// 请求
{
  "intent": "query_exam",
  "query": "高数什么时候考",
  "parameters": { "courseName": "高数" },
  "sessionId": "sess_abc123",
  "deviceId": "device_xyz"
}

// 响应
{
  "fulfillmentText": "📝 高等数学（下）\n📅 7月22日 08:30-10:30 @教一101\n📊 5学分 · 期末考试\n⏰ 还有5天，按计划复习",
  "suggestions": ["找空教室复习", "考试倒计时", "绩点"],
  "card": {
    "type": "info",
    "title": "高等数学（下）",
    "content": "7月22日 08:30 教一101"
  }
}
```

## 3. 意图映射表

| 用户说 | 小艺 Intent | 校园搭子场景 | API 路由 |
|--------|-----------|------------|---------|
| "明天什么课" | `SCHEDULE.query` | 课表管家 | `schedule` |
| "今天天气" | `WEATHER.query` | 天气 | `weather` |
| "我要洗澡" | `LIFE_SERVICE.query_bath` | 洗澡助手 | `shower` |
| "卡里还有多少钱" | `FINANCE.balance_query` | 一卡通 | `card` |
| "查快递" | `LOGISTICS.package_query` | 快递外卖 | `delivery` |
| "论坛首页" | `INFORMATION.forum` | 校园论坛 | `forum` |
| "教三在哪" | `NAVIGATION.campus_building` | 校园地图 | `map` |
| "考试倒计时" | `EDUCATION.exam` | 考试 | `exam` |
| "找空教室" | `EDUCATION.classroom` | 空闲教室 | `classroom` |
| "绩点多少" | `EDUCATION.gpa` | 绩点 | `grade` |
| "早安" | `INFORMATION.morning_brief` | 智能早报 | `morning_brief` |
| "喝了200ml" | `HEALTH.water_tracking` | 饮水 | `water` |

## 4. 服务卡片 (Phase 4)

小艺可以在负一屏/桌面展示服务卡片：

```json
// 早八提醒卡片
{
  "type": "schedule_reminder",
  "title": "明天早八：数据结构",
  "subtitle": "教三401 · 08:00-09:40",
  "action": "设置闹钟"
}

// 低余额卡片
{
  "type": "balance_alert",
  "title": "一卡通余额不足",
  "subtitle": "余额 12.0 元，建议充值",
  "action": "查看消费明细"
}
```

## 5. 测试验证

```bash
# 模拟小艺调用
curl -X POST http://localhost:3456/api/xiaoyi \
  -H "Content-Type: application/json" \
  -d '{"intent":"query_exam","query":"考试倒计时","parameters":{}}'

# 预期返回
# {"fulfillmentText":"📝 考试倒计时：\n...","suggestions":["找个空教室复习","绩点","一卡通余额"],"card":{...}}
```
