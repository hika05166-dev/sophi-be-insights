export type AgeGroup = '10代' | '20代' | '30代' | '40代〜'
export type UserMode = '生理管理' | '妊活'
export type CyclePhase = '月経期' | '卵胞期' | '排卵期' | '黄体期'
export type Role = 'user' | 'assistant'
export type UserAttribute = 'detailed' | 'self_solving' | 'none'

export interface User {
  id: number
  anonymous_id: string
  age_group: AgeGroup
  mode: UserMode
  cycle_phase: CyclePhase
  created_at: string
}

export interface Utterance {
  id: number
  user_id: number
  session_id: string
  role: Role
  content: string
  created_at: string
  // JOINで付与
  anonymous_id?: string
  age_group?: AgeGroup
  mode?: UserMode
  cycle_phase?: CyclePhase
}

export interface UtteranceWithAttribute extends Utterance {
  attribute?: UserAttribute
  matchedQueries?: string[]  // マッチした検索クエリ（元キーワード + 関連クエリ）
}

export interface SearchLog {
  id: number
  keyword: string
  searched_by: string
  searched_at: string
}

export interface TrendTopic {
  keyword: string
  count: number
  sample?: string
}

export interface SearchResult {
  utterances: Utterance[]
  total: number
  keyword: string
}

export interface Group {
  id: number
  label: string
  count: number
  utterance_ids: number[]
}

export interface GroupingSummary {
  groups: Group[]
  keyword: string
}

export interface Insight {
  summary: string
  emotionTrend: string
  unresolvedIssues: string[]
  productHints: string[]
}

export interface ChatSession {
  session_id: string
  messages: Utterance[]
  created_at: string
}

// ダッシュボード用
export interface AgeGroupData {
  age_group: AgeGroup
  count: number
}

export interface ModeData {
  mode: UserMode
  count: number
}

export interface CyclePhaseData {
  cycle_phase: CyclePhase
  count: number
}

export interface HeatmapCell {
  phase: CyclePhase
  day: string
  count: number
}

export interface HourlyHeatmapCell {
  hour: number
  day: string
  count: number
}

export interface MonthlyTrend {
  month: string
  count: number
}

export interface CoOccurrenceItem {
  keyword: string
  count: number
}

export interface CrossTabCell {
  row: string
  col: string
  count: number
}

export interface DashboardData {
  ageGroups: AgeGroupData[]
  modes: ModeData[]
  cyclePhases: CyclePhaseData[]
  heatmap: HeatmapCell[]
  hourlyHeatmap: HourlyHeatmapCell[]
  monthlyTrend: MonthlyTrend[]
  coOccurrence: CoOccurrenceItem[]
  agePhaseMatrix: CrossTabCell[]
  modePhaseMatrix: CrossTabCell[]
  ageModeMatrix: CrossTabCell[]
  keyword: string
  totalCount: number
}

export interface UserStats {
  totalSessions: number
  totalUtterances: number
  topHour: number | null
  topDay: string | null
  topKeywords: CoOccurrenceItem[]
}

// API レスポンス共通
export interface ApiError {
  error: string
  details?: string
}
