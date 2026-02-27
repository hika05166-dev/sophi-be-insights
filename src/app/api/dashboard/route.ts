import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/lib/db/index'
import { initSchema } from '@/lib/db/schema'
import { seedDatabase } from '@/lib/db/seed'
import type { AgeGroupData, ModeData, CyclePhaseData, HeatmapCell, HourlyHeatmapCell, MonthlyTrend, CoOccurrenceItem, CrossTabCell } from '@/types'

function ensureDb() {
  initSchema()
  seedDatabase()
}

const CYCLE_PHASES = ['月経期', '卵胞期', '排卵期', '黄体期'] as const
const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'] as const
const DAY_NUM_TO_JP: Record<number, string> = { 0: '日', 1: '月', 2: '火', 3: '水', 4: '木', 5: '金', 6: '土' }

const CO_OCCUR_KEYWORDS = [
  '生理痛', 'PMS', '生理不順', '睡眠', 'ストレス', '肌荒れ',
  'ロキソニン', 'イブプロフェン', '低用量ピル', '子宮筋腫', '子宮内膜症',
  '妊活', '排卵', '基礎体温', '排卵検査薬', '葉酸', '鉄分', '不妊治療',
  '体外受精', '経血量', '月経困難症', '月経前症候群', 'ホルモン',
  'サプリ', 'ヨガ', '漢方', '頭痛', '更年期', '鎮痛剤', '婦人科',
  '運動', 'ピル', '不妊', '経血', '排卵痛', '低用量',
]

function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr)
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return days[date.getDay()]
}

function getYearMonth(dateStr: string): string {
  return dateStr.substring(0, 7)
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    ensureDb()
    const db = getDb()

    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('q') || ''

    if (!keyword.trim()) {
      return NextResponse.json({
        ageGroups: [], modes: [], cyclePhases: [], heatmap: [], hourlyHeatmap: [],
        monthlyTrend: [], coOccurrence: [], agePhaseMatrix: [], modePhaseMatrix: [], ageModeMatrix: [],
        keyword: '', totalCount: 0,
      })
    }

    // キーワードに一致する発話のユーザーIDを取得
    const matchingUtterances = db.prepare(
      `SELECT DISTINCT u.user_id, u.created_at
       FROM utterances u
       WHERE u.role = 'user' AND u.content LIKE ?`
    ).all(`%${keyword}%`) as { user_id: number; created_at: string }[]

    const totalCount = matchingUtterances.length

    // ユーザーIDのリスト
    const userIds = Array.from(new Set(matchingUtterances.map(u => u.user_id)))

    if (userIds.length === 0) {
      return NextResponse.json({
        ageGroups: [], modes: [], cyclePhases: [], heatmap: [], hourlyHeatmap: [],
        monthlyTrend: [], coOccurrence: [], agePhaseMatrix: [], modePhaseMatrix: [], ageModeMatrix: [],
        keyword, totalCount: 0,
      })
    }

    const placeholders = userIds.map(() => '?').join(',')

    // 年代別集計
    const ageGroupRows = db.prepare(
      `SELECT age_group, COUNT(*) as count FROM users WHERE id IN (${placeholders}) GROUP BY age_group`
    ).all(...userIds) as AgeGroupData[]

    // モード別集計
    const modeRows = db.prepare(
      `SELECT mode, COUNT(*) as count FROM users WHERE id IN (${placeholders}) GROUP BY mode`
    ).all(...userIds) as ModeData[]

    // 周期フェーズ別集計
    const cyclePhaseRows = db.prepare(
      `SELECT cycle_phase, COUNT(*) as count FROM users WHERE id IN (${placeholders}) GROUP BY cycle_phase`
    ).all(...userIds) as CyclePhaseData[]

    // ヒートマップ: 生理周期フェーズ × 曜日
    const heatmapData: HeatmapCell[] = []
    for (const phase of CYCLE_PHASES) {
      const phaseUserIds = db.prepare(
        `SELECT id FROM users WHERE id IN (${placeholders}) AND cycle_phase = ?`
      ).all(...userIds, phase) as { id: number }[]

      if (phaseUserIds.length === 0) {
        for (const day of WEEKDAYS) {
          heatmapData.push({ phase, day, count: 0 })
        }
        continue
      }

      const phaseIds = phaseUserIds.map(u => u.id)
      const phasePlaceholders = phaseIds.map(() => '?').join(',')

      const utterancesForPhase = db.prepare(
        `SELECT created_at FROM utterances
         WHERE user_id IN (${phasePlaceholders}) AND role = 'user' AND content LIKE ?`
      ).all(...phaseIds, `%${keyword}%`) as { created_at: string }[]

      const dayCounts: Record<string, number> = {}
      for (const { created_at } of utterancesForPhase) {
        const day = getDayOfWeek(created_at)
        dayCounts[day] = (dayCounts[day] || 0) + 1
      }

      for (const day of WEEKDAYS) {
        heatmapData.push({ phase, day, count: dayCounts[day] || 0 })
      }
    }

    // 年代 × 周期フェーズ クロス集計
    const agePhaseRaw = db.prepare(
      `SELECT u.age_group as row, u.cycle_phase as col, COUNT(*) as count
       FROM utterances ut
       JOIN users u ON ut.user_id = u.id
       WHERE ut.role = 'user' AND ut.content LIKE ?
       GROUP BY u.age_group, u.cycle_phase`
    ).all(`%${keyword}%`) as CrossTabCell[]

    // モード × 周期フェーズ クロス集計
    const modePhaseRaw = db.prepare(
      `SELECT u.mode as row, u.cycle_phase as col, COUNT(*) as count
       FROM utterances ut
       JOIN users u ON ut.user_id = u.id
       WHERE ut.role = 'user' AND ut.content LIKE ?
       GROUP BY u.mode, u.cycle_phase`
    ).all(`%${keyword}%`) as CrossTabCell[]

    // 年代 × モード クロス集計
    const ageModeRaw = db.prepare(
      `SELECT u.age_group as row, u.mode as col, COUNT(*) as count
       FROM utterances ut
       JOIN users u ON ut.user_id = u.id
       WHERE ut.role = 'user' AND ut.content LIKE ?
       GROUP BY u.age_group, u.mode`
    ).all(`%${keyword}%`) as CrossTabCell[]

    // 時間帯別ヒートマップ (時間 × 曜日)
    const hourlyRaw = db.prepare(
      `SELECT
        CAST(substr(created_at, 12, 2) AS INTEGER) as hour,
        CAST(strftime('%w', created_at) AS INTEGER) as day_num,
        COUNT(*) as count
       FROM utterances
       WHERE role = 'user' AND content LIKE ?
       GROUP BY hour, day_num`
    ).all(`%${keyword}%`) as { hour: number; day_num: number; count: number }[]

    const hourlyHeatmap: HourlyHeatmapCell[] = hourlyRaw.map(r => ({
      hour: r.hour,
      day: DAY_NUM_TO_JP[r.day_num] ?? '不明',
      count: r.count,
    }))

    // 共起キーワード分析
    const coOccurContents = db.prepare(
      `SELECT content FROM utterances WHERE role = 'user' AND content LIKE ?`
    ).all(`%${keyword}%`) as { content: string }[]

    const coOccurCounts: Record<string, number> = {}
    for (const { content } of coOccurContents) {
      for (const kw of CO_OCCUR_KEYWORDS) {
        if (kw !== keyword && content.includes(kw)) {
          coOccurCounts[kw] = (coOccurCounts[kw] || 0) + 1
        }
      }
    }
    const coOccurrence: CoOccurrenceItem[] = Object.entries(coOccurCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([kw, count]) => ({ keyword: kw, count }))

    // 月別トレンド
    const monthlyRows = db.prepare(
      `SELECT substr(created_at, 1, 7) as month, COUNT(*) as count
       FROM utterances
       WHERE role = 'user' AND content LIKE ?
       GROUP BY month
       ORDER BY month ASC
       LIMIT 12`
    ).all(`%${keyword}%`) as MonthlyTrend[]

    return NextResponse.json({
      ageGroups: ageGroupRows,
      modes: modeRows,
      cyclePhases: cyclePhaseRows,
      heatmap: heatmapData,
      hourlyHeatmap,
      monthlyTrend: monthlyRows,
      coOccurrence,
      agePhaseMatrix: agePhaseRaw,
      modePhaseMatrix: modePhaseRaw,
      ageModeMatrix: ageModeRaw,
      keyword,
      totalCount,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'ダッシュボードデータ取得中にエラーが発生しました' }, { status: 500 })
  }
}
