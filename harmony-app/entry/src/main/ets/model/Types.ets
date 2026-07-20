// 校园搭子 - 数据类型定义

export interface Message {
  id: string
  role: 'user' | 'agent'
  text: string
  timestamp: number
  card?: CardData
}

export interface CardData {
  type: 'morning_brief' | 'schedule' | 'exam' | 'balance' | 'package' | 'weather' | 'shower' | 'grade' | 'map' | 'forum' | 'classroom' | 'delivery' | 'water'
  title: string
  content: string
  icon?: string
  items?: string[]
  extra?: Record<string, string>
}

export interface AgentResponse {
  text: string
  suggestions: string[]
  card?: CardData
  scene?: string
}

export interface Course {
  name: string
  teacher: string
  room: string
  time: string
  dayOfWeek: number
  startPeriod: number
  endPeriod: number
}

export interface Exam {
  courseName: string
  date: string
  time: string
  room: string
  credits: number
  daysLeft: number
  urgent: boolean
}

export interface Coordinate {
  lat: number
  lng: number
}

export interface Building {
  id: string
  name: string
  shortName: string
  coordinate: Coordinate
  services: string[]
  floors: number
}

export interface ShowerInfo {
  balance: number
  pricePerTime: number
  estimatedTimes: number
  crowded: boolean
  peakHour: boolean
}

export interface WeatherInfo {
  date: string
  temperature: string
  condition: string
  dressSuggestion: string
  needUmbrella: boolean
}

export interface GPACourse {
  name: string
  score: number
  credits: number
  gpa: number
}

export interface GPAData {
  gpa: number
  totalCredits: number
  courses: Array<GPACourse>
  trend: 'up' | 'down' | 'stable'
  hasFailing: boolean
}

export interface WaterRecord {
  date: string
  totalMl: number
  targetMl: number
  percentage: number
}

export interface Package {
  id: string
  company: string
  status: string
  pickupCode: string
  pickupPoint: string
  arrived: boolean
}

export interface Takeout {
  id: string
  restaurant: string
  status: string
  estimatedTime: string
}

export interface DeliveryInfo {
  packages: Array<Package>
  takeout: Array<Takeout>
}

export interface ForumPost {
  id: string
  title: string
  author: string
  section: string
  hotness: number
  time: string
  tags: string[]
}

// HTTP 响应类型
export interface CoursesResponse {
  courses: Course[]
}

export interface ExamsResponse {
  exams: Exam[]
}

export interface BuildingsResponse {
  buildings: Building[]
}

export interface ClassroomInfo {
  name: string
  free: boolean
  features: string[]
}

export interface ClassroomsResponse {
  classrooms: ClassroomInfo[]
}

export interface BalanceResponse {
  balance: number
}

export interface PostsResponse {
  posts: ForumPost[]
}

export interface SessionInfo {
  sessionId: string
  title: string
  messageCount: number
  startTime: string
}

export interface SessionsResponse {
  sessions: SessionInfo[]
}

export interface SuccessResponse {
  success: boolean
}

export interface AgentRequest {
  query: string
  session?: string
}

// Mock 数据类型
export interface MockData {
  shower: AgentResponse
  schedule: AgentResponse
  card: AgentResponse
  weather: AgentResponse
  water: AgentResponse
  delivery: AgentResponse
  forum: AgentResponse
  map: AgentResponse
  exam: AgentResponse
  classroom: AgentResponse
  grade: AgentResponse
  morning_brief: AgentResponse
}

// 场景消息映射
export interface SceneMessages {
  shower: string
  schedule: string
  card: string
  weather: string
  water: string
  delivery: string
  forum: string
  map: string
  exam: string
  classroom: string
  grade: string
  morning_brief: string
}
