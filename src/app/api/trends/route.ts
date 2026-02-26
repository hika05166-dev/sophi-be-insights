import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/lib/db/index'
import { initSchema } from '@/lib/db/schema'
import { seedDatabase } from '@/lib/db/seed'

function ensureDb() {
  initSchema()
  seedDatabase()
}

// 発話からトレンドキーワードを抽出
const TOPIC_KEYWORDS = [
  '生理痛', 'PMS', '月経前症候群', '生理不順', '月経不順',
  '睡眠不足', '不眠', 'ストレス', '肌荒れ', 'ニキビ',
  '妊活', '不妊', '排卵', '基礎体温', '排卵検査薬',
  '経血量', '子宮筋腫', '子宮内膜症', '漢方', '低用量ピル',
  '更年期', 'ホルモン', 'サプリ', 'ヨガ', '頭痛',
  '鎮痛剤', 'ロキソニン', 'セルフケア', '婦人科', '不妊治療',
]

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    ensureDb()
    const db = getDb()

    // ユーザーのトレンド: 発話内容から頻出キーワードを集計
    const allUserUtterances = db.prepare(
      "SELECT content FROM utterances WHERE role = 'user'"
    ).all() as { content: string }[]

    const topicCounts: Record<string, number> = {}
    for (const { content } of allUserUtterances) {
      for (const kw of TOPIC_KEYWORDS) {
        if (content.includes(kw)) {
          topicCounts[kw] = (topicCounts[kw] || 0) + 1
        }
      }
    }

    const userTrends = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }))

    // 検索トレンド: search_logsから集計
    const searchTrends = db.prepare(
      `SELECT keyword, COUNT(*) as count
       FROM search_logs
       GROUP BY keyword
       ORDER BY count DESC
       LIMIT 10`
    ).all() as { keyword: string; count: number }[]

    return NextResponse.json({ userTrends, searchTrends })
  } catch (error) {
    console.error('Trends error:', error)
    return NextResponse.json({ error: 'トレンド取得中にエラーが発生しました' }, { status: 500 })
  }
}
