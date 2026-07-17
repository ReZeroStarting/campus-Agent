// ============================================================
// 空闲教室场景
// ============================================================

import { getClassrooms, getFreeClassrooms } from '../data/mock.js';
import type { Classroom } from '../models/index.js';

export function handleClassroomQuery(text: string): { text: string; suggestions: string[] } {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  // 提取教学楼
  let building: string | undefined;
  if (text.includes('教一')) building = '教一';
  else if (text.includes('教二')) building = '教二';
  else if (text.includes('教三')) building = '教三';

  // 提取特征
  const wantPlug = text.includes('充电') || text.includes('插座');
  const wantAc = text.includes('空调');
  const wantBig = text.includes('大教室') || text.includes('大屏');
  const wantSmall = text.includes('小教室') || text.includes('安静');

  const allRooms = getClassrooms();
  let candidates = building ? allRooms.filter(r => r.building === building) : allRooms;

  if (wantPlug) candidates = candidates.filter(r => r.features.includes('插座'));
  if (wantAc) candidates = candidates.filter(r => r.features.includes('空调'));
  if (wantBig) candidates = candidates.filter(r => r.capacity >= 100);
  if (wantSmall) candidates = candidates.filter(r => r.capacity <= 40);

  const freeData = getFreeClassrooms(building);
  const freeRoomNames = new Set(freeData.map(f => f.room.name));
  const free = candidates.filter(r => freeRoomNames.has(r.name));

  if (free.length === 0) {
    const allFree = freeData.map(f => f.room);
    if (allFree.length === 0) {
      return {
        text: `现在（${hour}:${String(minute).padStart(2, '0')}）${building || '所有教学楼'}暂时没有空闲教室。试试图书馆？`,
        suggestions: ['图书馆在哪', '教一空教室', '考试倒计时'],
      };
    }

    const lines: string[] = [];
    lines.push(`🟢 当前${building || ''}空闲教室（${allFree.length} 间）：\n`);

    const buildingGroups: Record<string, Classroom[]> = {};
    for (const r of allFree) {
      if (!buildingGroups[r.building]) buildingGroups[r.building] = [];
      buildingGroups[r.building].push(r);
    }

    for (const [bld, rooms] of Object.entries(buildingGroups)) {
      lines.push(`📍 ${bld}（${rooms.length}间）：`);
      rooms.slice(0, 5).forEach(r => {
        const features = r.features.filter(f => f !== '多媒体').join('·');
        lines.push(`   ${r.name}  ${r.capacity}座${features ? ' · ' + features : ''}`);
      });
      if (rooms.length > 5) lines.push(`   ...还有 ${rooms.length - 5} 间`);
    }

    return { text: lines.join('\n'), suggestions: ['教三空教室', '图书馆在哪', '考试倒计时'] };
  }

  const lines: string[] = [];
  const cond: string[] = [];
  if (building) cond.push(building);
  if (wantPlug) cond.push('有插座');
  if (wantAc) cond.push('有空调');
  if (wantBig) cond.push('大教室');
  if (wantSmall) cond.push('小教室');
  const condStr = cond.length > 0 ? `（${cond.join('+')}）` : '';

  lines.push(`🟢 空闲教室${condStr}：\n`);

  free.slice(0, 8).forEach(r => {
    const features = r.features.filter(f => f !== '多媒体').join('·');
    const f = freeData.find(fd => fd.room.name === r.name);
    const nextOcc = f?.nextOccupied || '闭馆';
    lines.push(`• ${r.name}  ${r.capacity}座 · ${r.floor}楼${features ? ' · ' + features : ''}  → 可用到 ${nextOcc}`);
  });

  return { text: lines.join('\n'), suggestions: ['教一空教室', '图书馆在哪', '考试倒计时'] };
}
