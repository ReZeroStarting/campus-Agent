# 校园搭子 · 鸿蒙原生应用

## 快速开始

### 1. 导入 DevEco Studio

- 打开 DevEco Studio 5.1+
- File → Open → 选择 `harmony-app/` 目录
- 等待依赖同步完成

### 2. 启动后端服务

```bash
cd ../          # 回到 campus-Agent 根目录
npm run api     # 启动 HTTP API 服务 (localhost:3456)
```

### 3. 运行应用

- DevEco Studio 顶部选择模拟器或真机
- 点击 Run ▶

## 项目结构

```
harmony-app/
├── AppScope/app.json5              # 应用基础配置
├── build-profile.json5             # 构建配置
├── oh-package.json5                # 依赖声明
├── hvigorfile.ts                   # 构建脚本
└── entry/                          # 主模块
    ├── build-profile.json5
    ├── oh-package.json5
    ├── hvigorfile.ts
    └── src/main/
        ├── module.json5            # 模块声明(页面/卡片/权限/小艺Intent)
        ├── ets/
        │   ├── entryability/
        │   │   └── EntryAbility.ets          # 主入口 · 解析launchScene参数
        │   ├── entryformability/
        │   │   └── EntryFormAbility.ets      # 服务卡片数据提供
        │   ├── xiaoyi/
        │   │   └── XiaoyiIntentAbility.ets   # 小艺Deeper Intent处理
        │   ├── pages/
        │   │   ├── Index.ets                 # 主对话页面(欢迎页/聊天/卡片)
        │   │   ├── Settings.ets              # 设置(学校/数据导入/API状态)
        │   │   └── Profile.ets               # 关于页
        │   ├── common/
        │   │   ├── CampusAgent.ets           # Agent桥接(本地意图+远程LLM+离线降级)
        │   │   ├── HttpClient.ets            # HTTP客户端(14个API端点)
        │   │   └── MemoryStore.ets           # 本地偏好存储(三层记忆)
        │   ├── model/
        │   │   └── Types.ets                 # 所有数据类型定义
        │   └── widget/pages/
        │       ├── MorningBriefCard.ets      # 🌅 智能早报
        │       ├── ScheduleCard.ets          # 📅 今日课表
        │       ├── ExamCard.ets              # 📝 考试倒计时
        │       ├── BalanceCard.ets           # 💳 一卡通余额
        │       └── PackageCard.ets           # 📦 快递提醒
        └── resources/
            └── base/
                ├── element/string.json       # 字符串资源
                ├── element/color.json        # 颜色资源
                └── profile/
                    ├── main_pages.json       # 页面路由表
                    └── form_config.json      # 卡片注册配置
```

## 核心能力

| 能力 | 实现方式 |
|------|---------|
| 毫秒级意图识别 | 本地关键词匹配 → 12种场景，<1ms |
| LLM 增强 | 远程 DeepSeek 润色，2s超时自动降级 |
| 离线可用 | 完全断网时本地 Mock 数据接管 |
| 三层记忆 | preferences 持久化短期/中期/长期记忆 |
| 服务卡片 | 5张 Form Widget 定时更新，FormAbility 驱动 |
| 小艺Skill | 12个 Deeper Intent，ServiceAbility 处理 |
| 数据导入 | 支持 Excel 课表/成绩导入（通过API） |
| 降级保障 | 本地意图→远程API→本地Mock，三线保障 |

## 与后端的关系

```
┌─────────────────────┐     HTTP API      ┌──────────────────┐
│  鸿蒙原生 App        │ ◄──────────────► │  Node.js 后端     │
│  (ArkTS)            │   localhost:3456  │  (TypeScript)    │
├─────────────────────┤                   ├──────────────────┤
│  CampusAgent.ets   │ ─── 意图快速匹配 →  │  规则引擎 11类    │
│                     │                    │  声明式编排器     │
│  HttpClient.ets    │ ─── 远程调用 ──→   │  LLM 增强层      │
│                     │                    │  RAG 知识库      │
│  MemoryStore.ets   │ ─── 本地缓存 ──→   │  对话持久化层    │
│                     │                    │                  │
│  5张服务卡片         │ ─── 定时拉取 ──→  │  `/api/card/*`   │
│  小艺 Intent处理     │ ─── 意图分发 ──→   │  `/api/xiaoyi`   │
└─────────────────────┘                   └──────────────────┘
```

## 比赛提交清单

- ✅ **鸿蒙原生应用**：完整 ArkTS 工程，可在 DevEco Studio 编译运行
- ✅ **服务卡片**：5张 Form Widget（早安/课表/考试/余额/快递）
- ✅ **小艺 Skill**：12个 Deeper Intent + skill.json 配置
- ✅ **HTTP API**：14个 RESTful 端点
- ✅ **CLI 和 Web Chat**：多端交互入口
- ✅ **单元测试**：146个，100%通过
