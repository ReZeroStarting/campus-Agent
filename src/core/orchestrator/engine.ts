// ============================================================
// 任务编排引擎
// 支持并行/串行执行、超时降级、失败不阻断主流程
// ============================================================

import type {
  OrchestrationTask,
  SubAction,
  IntentCategory,
  TaskStatus,
  ActionStatus,
} from '../../models/index.js';

let taskCounter = 0;
const DEFAULT_TIMEOUT_MS = 3000;

function generateTaskId(): string {
  taskCounter++;
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `tsk_${date}_${String(taskCounter).padStart(3, '0')}`;
}

// ---- 基础类型 ----

type AsyncAction = {
  name: string;
  execute: () => Promise<unknown>;
  fallback: string | null;   // 失败时的降级描述，null 表示必须成功（失败则整体失败）
};

type ActionGroup = {
  mode: 'parallel' | 'serial';
  actions: AsyncAction[];
};

// ---- 编排函数 ----

/**
 * 执行编排计划
 *
 * @param intent - 意图分类
 * @param trigger - 触发来源
 * @param plan - 编排计划（action groups）
 * @param summaryBuilder - 汇总函数，用所有 action 结果生成最终文本
 */
export async function orchestrate(
  intent: IntentCategory,
  trigger: string,
  plan: ActionGroup[],
  summaryBuilder: (results: Map<string, unknown>) => string,
): Promise<OrchestrationTask> {
  const taskId = generateTaskId();
  const subActions: SubAction[] = [];
  const results = new Map<string, unknown>();

  const task: OrchestrationTask = {
    taskId,
    intent,
    trigger,
    status: 'running',
    createdAt: new Date().toISOString(),
    subActions,
    result: {
      summary: '',
      pushedTo: ['console'],
    },
  };

  let hasFailure = false;

  for (const group of plan) {
    if (group.mode === 'parallel') {
      // 并行执行
      const promises = group.actions.map((action) =>
        executeAction(action, results, subActions, DEFAULT_TIMEOUT_MS),
      );
      const actionResults = await Promise.allSettled(promises);

      for (const r of actionResults) {
        if (r.status === 'rejected') hasFailure = true;
      }
    } else {
      // 串行执行
      for (const action of group.actions) {
        try {
          await executeAction(action, results, subActions, DEFAULT_TIMEOUT_MS);
        } catch {
          hasFailure = true;
          // 串行中失败不阻断后续？看是否有 fallback
          if (!action.fallback) {
            // 没有 fallback 且串行失败 → 整体失败
            task.status = 'failed';
            task.result.summary = `抱歉，${action.name} 出了点问题，暂时无法处理。`;
            return task;
          }
        }
      }
    }
  }

  // 汇总结果
  task.result.summary = summaryBuilder(results);
  task.status = hasFailure ? 'degraded' : 'done';
  task.subActions = subActions;

  return task;
}

// ---- 内部函数 ----

async function executeAction(
  action: AsyncAction,
  results: Map<string, unknown>,
  subActions: SubAction[],
  timeoutMs: number,
): Promise<void> {
  const subAction: SubAction = {
    name: action.name,
    status: 'running',
    fallback: action.fallback,
    durationMs: 0,
  };

  const start = Date.now();

  try {
    const result = await withTimeout(action.execute(), timeoutMs);
    subAction.status = 'done';
    results.set(action.name, result);
  } catch (err) {
    if (action.fallback) {
      // 有降级策略
      subAction.status = 'failed';
      results.set(action.name, { error: true, fallback: action.fallback });
    } else {
      // 无降级，向上抛
      subAction.status = 'failed';
      subAction.durationMs = Date.now() - start;
      subActions.push(subAction);
      throw err;
    }
  }

  subAction.durationMs = Date.now() - start;
  subActions.push(subAction);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

// ---- 编排计划工厂 ----

export { generateTaskId, DEFAULT_TIMEOUT_MS };
export type { AsyncAction, ActionGroup };
