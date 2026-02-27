import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/lib/db/index'
import { initSchema } from '@/lib/db/schema'
import { seedDatabase } from '@/lib/db/seed'
import type { UserStats, CoOccurrenceItem } from '@/types'

function ensureDb() {
  initSchema()
  seedDatabase()
}

const DAY_NUM_TO_JP: Record<number, string> = { 0: '日', 1: '月', 2: '火', 3: '水', 4: '木', 5: '金', 6: '土' }

const HEALTH_KEYWORDS = [
  '生理痛', 'PMS', '生理不順', '睡眠', 'ストレス', '肌荒れ',
  'ロキソニン', 'イブプロフェン', '低用量ピル', '子宮筋腫', '子宮内膜症',
  '妊活', '排卵', '基礎体温', '排卵検査薬', '葉酸', '鉄分', '不妊治療',
  '体外受精', '経血量', '月経困難症', '月経前症候群', 'ホルモン',
  'サプリ', 'ヨガ', '漢方', '頭痛', '更年期', '鎮痛剤', '婦人科',
  '運動', 'ピル', '不妊', '排卵痛',
]

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    ensureDb()
    const db = getDb()
    const { userId } = params

    const user = db.prepare('SELECT id FROM users WHERE anonymous_id = ?').get(userId) as { id: number } | undefined
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    const totalSessionsRow = db.prepare(
      `SELECT COUNT(DISTINCT session_id) as count FROM utterances WHERE user_id = ?`
    ).get(user.id) as { count: number }

    const totalUtterancesRow = db.prepare(
      `SELECT COUNT(*) as count FROM utterances WHERE user_id = ? AND role = 'user'`
    ).get(user.id) as { count: number }

    const topHourRow = db.prepare(
      `SELECT CAST(substr(created_at, 12, 2) AS INTEGER) as hour, COUNT(*) as count
       FROM utterances WHERE user_id = ? AND role = 'user'
       GROUP BY hour ORDER BY count DESC LIMIT 1`
    ).get(user.id) as { hour: number; count: number } | undefined

    const topDayRow = db.prepare(
      `SELECT CAST(strftime('%w', created_at) AS INTEGER) as day_num, COUNT(*) as count
       FROM utterances WHERE user_id = ? AND role = 'user'
       GROUP BY day_num ORDER BY count DESC LIMIT 1`
    ).get(user.id) as { day_num: number; count: number } | undefined

    const userContents = db.prepare(
      `SELECT content FROM utterances WHERE user_id = ? AND role = 'user'`
    ).all(user.id) as { content: string }[]

    const kwCounts: Record<string, number> = {}
    for (const { content } of userContents) {
      for (const kw of HEALTH_KEYWORDS) {
        if (content.includes(kw)) {
          kwCounts[kw] = (kwCounts[kw] || 0) + 1
        }
      }
    }
    const topKeywords: CoOccurrenceItem[] = Object.entries(kwCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([keyword, count]) => ({ keyword, count }))

    const stats: UserStats = {
      totalSessions: totalSessionsRow.count,
      totalUtterances: totalUtterancesRow.count,
      topHour: topHourRow?.hour ?? null,
      topDay: topDayRow ? (DAY_NUM_TO_JP[topDayRow.day_num] ?? null) : null,
      topKeywords,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('User stats error:', error)
    return NextResponse.json({ error: 'ユーザー統計取得中にエラーが発生しました' }, { status: 500 })
  }
}
