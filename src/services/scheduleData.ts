// ============================================================
// 课表数据服务
// 支持导入课表（ICS/Excel）替代模拟数据
// ============================================================

import { getMockSchedule, getScheduleForDate } from '../data/mock.js';
import { getImportedSchedule, getCoursesForDate } from './scheduleImport.js';
import type { Course } from '../models/index.js';

/**
 * 获取全部课程
 * 优先返回导入的课表，否则使用模拟数据
 */
export function fetchAllCourses(): Course[] {
  return getImportedSchedule() || getMockSchedule();
}

/**
 * 获取指定日期的课程
 */
export function fetchCoursesForDate(date: Date): Course[] {
  return getCoursesForDate(date, () => getScheduleForDate(date));
}

/**
 * 是否有导入的课表
 */
export function hasImportedSchedule(): boolean {
  return getImportedSchedule() !== null;
}
