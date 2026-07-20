// ============================================================
// Mock Data — 统一导出入口
// 替代原 src/data/mock.ts（1200 行巨石）
// 每个模块独立，按需替换真实 API
// ============================================================

export {
  getMockSchedule,
  getScheduleForDate,
} from './schedule.mock.js';

export {
  getCardState,
  deductCardBalance,
  resetCardState,
} from './card.mock.js';

export {
  getShowerState,
  deductShowerBalance,
} from './shower.mock.js';

export {
  getMockWeather,
  getWeatherToday,
} from './weather.mock.js';

export {
  getWaterIntake,
  addWater,
  resetWaterIntake,
} from './water.mock.js';

export {
  getPickupPoints,
  getPickupPoint,
  getPackages,
  getActivePackages,
  markPackagePicked,
  getDeliveryOrders,
  getActiveOrders,
  markOrderPicked,
  addDeliveryOrder,
  resetDeliveryData,
} from './delivery.mock.js';

export {
  getForumPosts,
  getHotPosts,
  searchForumPosts,
  getForumPostById,
  getExtractedInfos,
  getActiveEvents,
  searchExtractedInfos,
} from './forum.mock.js';

export {
  getCampusBuildings,
  findBuilding,
  searchBuildings,
  findBuildingsByService,
} from './map.mock.js';

export {
  getExams,
  getUpcomingExams,
  getExamCountdown,
} from './exam.mock.js';

export {
  getCourseGrades,
  getGpa,
} from './grade.mock.js';

export {
  getClassrooms,
  getFreeClassrooms,
} from './classroom.mock.js';
