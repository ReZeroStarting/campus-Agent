// 校园搭子 - HTTP 客户端（鸿蒙原生 http 模块）
import { http } from '@kit.NetworkKit';
import type { AgentResponse, GPAData, ShowerInfo, WeatherInfo, Exam, Course, Building, DeliveryInfo, ForumPost, WaterRecord, CoursesResponse, ExamsResponse, BuildingsResponse, ClassroomsResponse, BalanceResponse, PostsResponse, SessionsResponse, SuccessResponse, AgentRequest } from '../model/Types';

const BASE_URL: string = 'http://10.0.2.2:3456'; // 开发环境 → 模拟器映射到宿主机 localhost

export class HttpClient {
  private static instance: HttpClient;

  static getInstance(): HttpClient {
    if (!HttpClient.instance) HttpClient.instance = new HttpClient();
    return HttpClient.instance;
  }

  private async request<T>(path: string, method: http.RequestMethod = http.RequestMethod.GET, body?: object): Promise<T | null> {
    try {
      const req = http.createHttp();
      const header: Record<string, string> = { 'Content-Type': 'application/json' };
      const opts: http.HttpRequestOptions = {
        method: method,
        header: header,
        connectTimeout: 5000,
        readTimeout: 5000,
        extraData: body ? JSON.stringify(body) : undefined
      };
      const resp = await req.request(`${BASE_URL}${path}`, opts);
      req.destroy();

      if (resp.responseCode === 200) {
        const data = JSON.parse(resp.result as string) as T;
        return data;
      }
      return null;
    } catch (e) {
      console.error('[HttpClient] request failed:', path, JSON.stringify(e));
      return null;
    }
  }

  // ── 对话 ──
  async chat(query: string, session: string): Promise<AgentResponse | null> {
    const body: AgentRequest = { query, session };
    return this.request<AgentResponse>('/api/chat', http.RequestMethod.POST, body);
  }

  // ── 场景直查 ──
  async getSchedule(date?: string): Promise<CoursesResponse | null> {
    const path = date ? `/api/scene/schedule?date=${date}` : '/api/scene/schedule';
    return this.request<CoursesResponse>(path);
  }

  async getExams()   : Promise<ExamsResponse | null>           { return this.request('/api/scene/exam'); }
  async getShower()  : Promise<ShowerInfo | null>                   { return this.request('/api/scene/shower'); }
  async getWeather() : Promise<WeatherInfo | null>                  { return this.request('/api/scene/weather'); }
  async getGPA()     : Promise<GPAData | null>                      { return this.request('/api/scene/grade'); }
  async getMap(building?: string): Promise<BuildingsResponse | null> {
    const path = building ? `/api/scene/map?q=${building}` : '/api/scene/map';
    return this.request(path);
  }
  async getClassroom(building?: string): Promise<ClassroomsResponse | null> {
    const path = building ? `/api/scene/classroom?b=${building}` : '/api/scene/classroom';
    return this.request(path);
  }
  async getCard()        : Promise<BalanceResponse | null>      { return this.request('/api/scene/card'); }
  async getDelivery()    : Promise<DeliveryInfo | null>             { return this.request('/api/scene/delivery'); }
  async getForum()       : Promise<PostsResponse | null>    { return this.request('/api/scene/forum'); }
  async getWater()       : Promise<WaterRecord | null>              { return this.request('/api/scene/water'); }
  async getMorningBrief(): Promise<AgentResponse | null>            { return this.request('/api/scene/morning_brief'); }

  // ── 对话管理 ──
  async listSessions(): Promise<SessionsResponse | null> {
    return this.request('/api/conversations');
  }

  async newSession(): Promise<SuccessResponse | null> {
    return this.request('/api/conversations/new', http.RequestMethod.POST);
  }

  async deleteSession(sessionId: string): Promise<SuccessResponse | null> {
    return this.request(`/api/conversations/${sessionId}`, http.RequestMethod.DELETE);
  }
}
