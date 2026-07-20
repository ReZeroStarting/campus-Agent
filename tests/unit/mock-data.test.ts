import { describe, it, expect, beforeEach } from 'vitest';
import {
  getMockSchedule, getCardState, getShowerState, getMockWeather,
  getWaterIntake, addWater, resetWaterIntake,
  getPackages, getActivePackages, getPickupPoints,
  getActiveOrders, markPackagePicked, markOrderPicked,
  getForumPosts, getHotPosts, searchForumPosts, getActiveEvents,
  getCampusBuildings, findBuilding, findBuildingsByService,
  getExams, getExamCountdown, getClassrooms, getFreeClassrooms,
  getCourseGrades, getGpa,
} from '../../src/data/mocks/index.js';

describe('Mock Data', () => {
  describe('课表', () => {
    it('should return non-empty schedule', () => {
      const courses = getMockSchedule();
      expect(courses.length).toBeGreaterThan(0);
      expect(courses[0]).toHaveProperty('name');
      expect(courses[0]).toHaveProperty('teacher');
      expect(courses[0]).toHaveProperty('location');
    });
  });

  describe('一卡通', () => {
    it('should return card state with balance', () => {
      const card = getCardState();
      expect(card.balance).toBeGreaterThan(0);
      expect(card.transactions.length).toBeGreaterThan(0);
      expect(card.transactions[0]).toHaveProperty('amount');
      expect(card.transactions[0]).toHaveProperty('category');
    });
  });

  describe('洗澡', () => {
    it('should return shower state', () => {
      const state = getShowerState();
      expect(state.balance).toBeGreaterThan(0);
      expect(state.crowdLevel).toBeDefined();
    });
  });

  describe('天气', () => {
    it('should return weather info for a date', () => {
      const w = getMockWeather(new Date());
      expect(w.condition).toBeDefined();
      expect(w.tempHigh).toBeGreaterThan(w.tempLow);
      expect(w.humidity).toBeGreaterThan(0);
    });
  });

  describe('饮水', () => {
    beforeEach(() => resetWaterIntake());

    it('should track water intake', () => {
      const before = getWaterIntake();
      addWater(200);
      const after = getWaterIntake();
      expect(after.current).toBe(before.current + 200);
    });

    it('should calculate percentage', () => {
      const intake = getWaterIntake();
      expect(intake.percent).toBeGreaterThanOrEqual(0);
      expect(intake.percent).toBeLessThanOrEqual(100);
    });
  });

  describe('快递', () => {
    it('should have packages', () => {
      const pkgs = getPackages();
      expect(pkgs.length).toBeGreaterThan(0);
      expect(pkgs[0]).toHaveProperty('trackingId');
      expect(pkgs[0]).toHaveProperty('carrier');
    });

    it('should have active packages', () => {
      const active = getActivePackages();
      expect(active.length).toBeGreaterThan(0);
    });

    it('should mark package as picked', () => {
      const pkgs = getActivePackages();
      if (pkgs.length > 0) {
        const result = markPackagePicked(pkgs[0].trackingId);
        expect(result).toBe(true);
      }
    });
  });

  describe('取件点', () => {
    it('should have pickup points', () => {
      const points = getPickupPoints();
      expect(points.length).toBeGreaterThan(0);
      expect(points[0]).toHaveProperty('name');
      expect(points[0]).toHaveProperty('commuteFrom');
    });
  });

  describe('外卖', () => {
    it('should have active orders', () => {
      const orders = getActiveOrders();
      expect(orders.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('论坛', () => {
    it('should have forum posts', () => {
      const posts = getForumPosts();
      expect(posts.length).toBeGreaterThan(0);
    });

    it('should have hot posts', () => {
      const hot = getHotPosts();
      expect(hot.length).toBeGreaterThan(0);
      hot.forEach(p => expect(p.hot).toBe(true));
    });

    it('should search posts with multi-term matching', () => {
      const results = searchForumPosts('显示器');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should have active events', () => {
      const events = getActiveEvents();
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('地图', () => {
    it('should have campus buildings', () => {
      const buildings = getCampusBuildings();
      expect(buildings.length).toBeGreaterThan(10);
    });

    it('should find building by name', () => {
      const bld = findBuilding('图书馆');
      expect(bld).toBeDefined();
      expect(bld!.name).toBe('图书馆');
    });

    it('should find building by short name', () => {
      const bld = findBuilding('教三');
      expect(bld).toBeDefined();
      expect(bld!.shortName).toBe('教三');
    });

    it('should find buildings by service', () => {
      const results = findBuildingsByService('打印');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('考试', () => {
    it('should have exams', () => {
      const exams = getExams();
      expect(exams.length).toBeGreaterThan(0);
      expect(exams[0]).toHaveProperty('courseName');
      expect(exams[0]).toHaveProperty('date');
      expect(exams[0]).toHaveProperty('location');
    });

    it('should have exam countdown with future dates', () => {
      const cds = getExamCountdown();
      expect(cds.length).toBeGreaterThan(0);
      cds.forEach(c => expect(c.daysLeft).toBeGreaterThanOrEqual(0));
    });
  });

  describe('教室', () => {
    it('should have classrooms', () => {
      const rooms = getClassrooms();
      expect(rooms.length).toBeGreaterThan(0);
      expect(rooms[0]).toHaveProperty('name');
      expect(rooms[0]).toHaveProperty('building');
      expect(rooms[0]).toHaveProperty('capacity');
    });

    it('should return free classrooms', () => {
      const free = getFreeClassrooms();
      expect(free.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter free classrooms by building', () => {
      const free = getFreeClassrooms('教三');
      free.forEach(f => expect(f.room.building).toBe('教三'));
    });
  });

  describe('绩点', () => {
    it('should have course grades', () => {
      const grades = getCourseGrades();
      expect(grades.length).toBeGreaterThan(0);
      grades.forEach(g => {
        expect(g.score).toBeGreaterThanOrEqual(0);
        expect(g.score).toBeLessThanOrEqual(100);
        expect(g.credits).toBeGreaterThan(0);
      });
    });

    it('should calculate GPA', () => {
      const gpa = getGpa();
      expect(gpa.gpa).toBeGreaterThan(0);
      expect(gpa.gpa).toBeLessThanOrEqual(4.0);
      expect(gpa.totalCredits).toBeGreaterThan(0);
      expect(gpa.trend.length).toBeGreaterThan(0);
    });
  });
});
