// ============================================================
// 饮水模拟数据
// ============================================================

let waterToday = 600;

export function getWaterIntake(): { current: number; goal: number; percent: number } {
  return {
    current: waterToday,
    goal: 1500,
    percent: Math.round((waterToday / 1500) * 100),
  };
}

export function addWater(ml: number): { current: number; goal: number; percent: number } {
  waterToday += ml;
  return getWaterIntake();
}

export function resetWaterIntake(): void {
  waterToday = 0;
}
