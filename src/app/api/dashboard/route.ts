import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/lib/db/index'
import { initSchema } from '@/lib/db/schema'
import { seedDatabase } from '@/lib/db/seed'
import type { AgeGroupData, ModeData, HeatmapCell, MonthlyTrend } from '@/types'

function ensureDb() {
  initSchema()
  seedDatabase()
}

const CYCLE_PHASES = ['月経期', '卵胞期', '排卵期', '黄体期'] as const
const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'] as const

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
        ageGroups: [],
        modes: [],
        heatmap: [],
        monthlyTrend: [],
        keyword: '',
        totalCount: 0,
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
        ageGroups: [],
        modes: [],
        heatmap: [],
        monthlyTrend: [],
        keyword,
        totalCount: 0,
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
      heatmap: heatmapData,
      monthlyTrend: monthlyRows,
      keyword,
      totalCount,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'ダッシュボードデータ取得中にエラーが発生しました' }, { status: 500 })
  }
}
