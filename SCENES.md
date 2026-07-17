# 场景开发指南

## 添加一个新场景只需 4 步

以「空闲教室」为例：

### Step 1: 定义模型 (`src/models/index.ts`)

```typescript
export interface Classroom {
  id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  features: string[];
}
```

### Step 2: 添加模拟数据 (`src/data/mock.ts`)

```typescript
const classrooms: Classroom[] = [
  { id: 'cr_01', name: '教一 101', building: '教一', floor: 1, capacity: 200, features: ['多媒体', '空调'] },
  // ...
];

export function getFreeClassrooms(building?: string): { room: Classroom; nextOccupied: string }[] {
  // 返回当前空闲教室
}
```

### Step 3: 实现场景 (`src/scenes/classroom.ts`)

```typescript
import { getClassrooms, getFreeClassrooms } from '../data/mock.js';

export function handleClassroomQuery(text: string): { text: string; suggestions: string[] } {
  // 解析意图 → 查询数据 → 组装回复
  return { text: '...', suggestions: ['教一空教室', '图书馆在哪'] };
}
```

**契约：每个场景函数签名为 `(text: string) => { text: string, suggestions: string[] }`**

### Step 4: 接线 (3 处)

**a) 意图规则** (`src/core/intent/engine.ts`)：
```typescript
{
  category: 'classroom',
  keywords: ['教室', '自习', '空教室'],
  patterns: [/空教室/, /找个.*教室/],
}
```

**b) Agent 路由** (`src/agent.ts`)：
```typescript
import { handleClassroomQuery } from './scenes/classroom.js';

// 在 switch 中添加：
case 'classroom':
  response = handleClassroomQuery(text);
  break;
```

**c) 提示更新** (`src/index.ts`)：
```typescript
console.log('试试说：找个空教室');
```

## 完成！新场景自动接入意图识别和路由系统

无需修改核心引擎代码，场景之间完全解耦。

## 场景接口规范

```typescript
interface AgentResponse {
  text: string;              // 回复正文
  suggestions: string[];     // 快捷追问建议（shown as buttons）
}
```

`suggestions` 字段设计原则：
- 2-4 个建议按钮
- 引导用户进入下一步场景
- 支持跨场景跳转（如从课表 → 天气、从教室 → 图书馆）

## 当前场景注册表

| 意图 | 文件 | 入口函数 | 注册时间 |
|------|------|---------|---------|
| `shower` | `scenes/shower.ts` | `handleShowerIntent` | Phase 1 |
| `schedule` | `scenes/schedule.ts` | `handleScheduleQuery` | Phase 1 |
| `card` | `scenes/card.ts` | `handleCardQuery` | Phase 1 |
| `weather` | `agent.ts` | embedded | Phase 1 |
| `water` | `agent.ts` | embedded | Phase 1 |
| `delivery` | `scenes/delivery.ts` | `handleDeliveryQuery` | Phase 1.5 |
| `forum` | `scenes/forum.ts` | `handleForumQuery` | Phase 1.6 |
| `map` | `scenes/map.ts` | `handleMapQuery` | Phase 1.7 |
| (shortcut) | `scenes/morning-brief.ts` | `handleMorningBrief` | Phase 1.8 |
| `exam` | `scenes/exam.ts` | `handleExamQuery` | Phase 1.8 |
| `classroom` | `scenes/classroom.ts` | `handleClassroomQuery` | Phase 1.8 |
| `grade` | `scenes/grade.ts` | `handleGradeQuery` | Phase 1.8 |
