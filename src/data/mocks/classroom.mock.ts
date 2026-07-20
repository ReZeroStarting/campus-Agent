// ============================================================
// 教室模拟数据
// ============================================================

import type { Classroom } from '../../models/index.js';

const classrooms: Classroom[] = [
  { id: 'cr_01', name: '教一 101', building: '教一', floor: 1, capacity: 200, features: ['多媒体', '空调', '大屏'] },
  { id: 'cr_02', name: '教一 102', building: '教一', floor: 1, capacity: 120, features: ['多媒体', '空调'] },
  { id: 'cr_03', name: '教一 201', building: '教一', floor: 2, capacity: 150, features: ['多媒体', '空调', '大屏'] },
  { id: 'cr_04', name: '教一 301', building: '教一', floor: 3, capacity: 80, features: ['空调'] },
  { id: 'cr_05', name: '教一 302', building: '教一', floor: 3, capacity: 60, features: ['空调', '插座'] },
  { id: 'cr_06', name: '教一 401', building: '教一', floor: 4, capacity: 40, features: ['空调', '插座', '小教室'] },
  { id: 'cr_07', name: '教三 101', building: '教三', floor: 1, capacity: 80, features: ['机房', '空调', '插座', '多媒体'] },
  { id: 'cr_08', name: '教三 201', building: '教三', floor: 2, capacity: 80, features: ['机房', '空调', '插座', '多媒体'] },
  { id: 'cr_09', name: '教三 401', building: '教三', floor: 4, capacity: 100, features: ['多媒体', '空调', '大屏'] },
  { id: 'cr_10', name: '教三 402', building: '教三', floor: 4, capacity: 60, features: ['空调', '插座'] },
  { id: 'cr_11', name: '教三 501', building: '教三', floor: 5, capacity: 40, features: ['空调', '插座', '小教室'] },
  { id: 'cr_12', name: '教三 502', building: '教三', floor: 5, capacity: 30, features: ['空调', '插座', '小教室'] },
  { id: 'cr_13', name: '教二 101', building: '教二', floor: 1, capacity: 100, features: ['多媒体', '空调'] },
  { id: 'cr_14', name: '教二 201', building: '教二', floor: 2, capacity: 60, features: ['空调', '插座'] },
  { id: 'cr_15', name: '教二 301', building: '教二', floor: 3, capacity: 80, features: ['多媒体', '空调', '大屏', '语音'] },
];

function getOccupiedRoomsNow(): Set<string> {
  const hour = new Date().getHours();
  const occupiedByTime: Record<number, string[]> = {
    8: ['教一 101', '教一 102', '教三 401'],
    9: ['教一 101', '教一 102', '教三 401', '教二 101'],
    10: ['教一 201', '教三 101', '教三 201', '教二 301'],
    11: ['教一 201', '教三 101', '教二 301'],
    14: ['教一 301', '教三 401', '教三 402', '教二 101'],
    15: ['教一 301', '教三 401', '教二 101', '教二 201'],
    16: ['教一 302', '教三 501', '教二 201'],
  };
  return new Set(occupiedByTime[hour] || []);
}

function getNextOccupiedHour(roomName: string): string {
  const hour = new Date().getHours();
  const nextMap: Record<string, number> = {
    '教一 101': 10, '教一 102': 10, '教一 201': 12, '教一 301': 16, '教一 302': 18,
    '教一 401': 22, '教三 101': 12, '教三 201': 14, '教三 401': 16, '教三 402': 18,
    '教三 501': 22, '教三 502': 22, '教二 101': 11, '教二 201': 15, '教二 301': 14,
  };
  const next = nextMap[roomName];
  if (next && next > hour) return `${String(next).padStart(2, '0')}:00`;
  return '闭馆';
}

export function getClassrooms(): Classroom[] {
  return classrooms;
}

export function getFreeClassrooms(building?: string): { room: Classroom; nextOccupied: string }[] {
  const occupied = getOccupiedRoomsNow();
  const filtered = building ? classrooms.filter(c => c.building === building) : classrooms;
  return filtered
    .filter(c => !occupied.has(c.name))
    .map(c => ({ room: c, nextOccupied: getNextOccupiedHour(c.name) }));
}
