// ============================================================
// 课表模拟数据
// ============================================================

import type { Course } from '../../models/index.js';

export function getMockSchedule(): Course[] {
  return [
    {
      courseId: 'DS101',
      name: '数据结构',
      teacher: '张明远',
      location: '教三401',
      weekday: 1,
      startTime: '08:00',
      endTime: '09:40',
      weeks: Array.from({ length: 16 }, (_, i) => i + 1),
    },
    {
      courseId: 'DS101',
      name: '数据结构',
      teacher: '张明远',
      location: '教三401',
      weekday: 3,
      startTime: '08:00',
      endTime: '09:40',
      weeks: Array.from({ length: 16 }, (_, i) => i + 1),
    },
    {
      courseId: 'DS101',
      name: '数据结构',
      teacher: '张明远',
      location: '教三401',
      weekday: 5,
      startTime: '10:00',
      endTime: '11:40',
      weeks: Array.from({ length: 16 }, (_, i) => i + 1),
    },
    {
      courseId: 'OS202',
      name: '操作系统',
      teacher: '李华',
      location: '教二305',
      weekday: 2,
      startTime: '14:00',
      endTime: '15:40',
      weeks: Array.from({ length: 16 }, (_, i) => i + 1),
    },
    {
      courseId: 'OS202',
      name: '操作系统',
      teacher: '李华',
      location: '教二305',
      weekday: 4,
      startTime: '14:00',
      endTime: '15:40',
      weeks: Array.from({ length: 16 }, (_, i) => i + 1),
    },
    {
      courseId: 'DB301',
      name: '数据库原理',
      teacher: '王芳',
      location: '教五201',
      weekday: 1,
      startTime: '10:00',
      endTime: '11:40',
      weeks: Array.from({ length: 16 }, (_, i) => i + 1),
    },
    {
      courseId: 'DB301',
      name: '数据库原理',
      teacher: '王芳',
      location: '教五201',
      weekday: 3,
      startTime: '10:00',
      endTime: '11:40',
      weeks: Array.from({ length: 16 }, (_, i) => i + 1),
    },
  ];
}

export function getScheduleForDate(date: Date, schedule?: Course[]): Course[] {
  const courses = schedule || getMockSchedule();
  const weekday = date.getDay() === 0 ? 7 : date.getDay();
  return courses.filter((c) => c.weekday === weekday).sort((a, b) => a.startTime.localeCompare(b.startTime));
}
