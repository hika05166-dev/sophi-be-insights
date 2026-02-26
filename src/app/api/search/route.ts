import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/lib/db/index'
import { initSchema } from '@/lib/db/schema'
import { seedDatabase } from '@/lib/db/seed'

// 検索キーワードの関連語マップ
const RELATED_KEYWORDS: Record<string, string[]> = {
  '生理痛': ['月経困難症', '痛み', '鎮痛', 'ロキソニン', 'イブプロフェン', '下腹部痛'],
  'PMS': ['月経前症候群', 'イライラ', '気分', '浮腫', 'むくみ', '頭痛'],
  '生理不順': ['月経不順', '周期', '不規則', '無月経', '遅れ'],
  '睡眠': ['不眠', '眠れない', '睡眠不足', '寝付き', 'ほてり'],
  'ストレス': ['緊張', 'プレッシャー', 'ストレス解消', '自律神経'],
  '肌荒れ': ['ニキビ', '乾燥', '吹き出物', '皮脂'],
  '妊活': ['不妊', '妊娠', '体外受精', '人工授精', '不妊治療'],
  '排卵': ['排卵日', '排卵検査薬', '排卵痛', 'LH'],
  '基礎体温': ['体温計', '高温期', '低温期', 'グラフ'],
  '経血量': ['月経量', '多い', '少ない', '過多月経'],
  '子宮筋腫': ['筋腫', '良性', '腫瘍'],
  '子宮内膜症': ['内膜症', 'チョコレート嚢腫'],
  '漢方': ['当帰芍薬散', '桂枝茯苓丸', '加味逍遙散'],
  '更年期': ['プレ更年期', 'ホルモン', 'のぼせ', 'ホットフラッシュ'],
}

function getRelatedKeywords(keyword: string): string[] {
  const related: string[] = []
  for (const [key, values] of Object.entries(RELATED_KEYWORDS)) {
    if (keyword.includes(key) || key.includes(keyword)) {
      related.push(key, ...values)
    }
    for (const v of values) {
      if (keyword.includes(v) || v.includes(keyword)) {
        related.push(key, ...values)
        break
      }
    }
  }
  return Array.from(new Set(related))
}

function ensureDb() {
  initSchema()
  seedDatabase()
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '30')
    const offset = (page - 1) * limit

    if (!keyword.trim()) {
      return NextResponse.json({ utterances: [], total: 0, keyword: '' })
    }

    // 関連キーワードも含めた検索
    const relatedKeywords = getRelatedKeywords(keyword)
    const allKeywords = [keyword, ...relatedKeywords]

    const conditions = allKeywords.map(() => "content LIKE ?").join(' OR ')
    const params = allKeywords.map(k => `%${k}%`)

    const countRow = db.prepare(
      `SELECT COUNT(*) as count FROM utterances
       WHERE role = 'user' AND (${conditions})`
    ).get(...params) as { count: number }

    const utterances = db.prepare(
      `SELECT u.*, us.anonymous_id, us.age_group, us.mode, us.cycle_phase
       FROM utterances u
       JOIN users us ON u.user_id = us.id
       WHERE u.role = 'user' AND (${conditions})
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(...params, limit, offset)

    // 検索ログ保存
    const searchedBy = (session.user as { name?: string }).name || 'unknown'
    db.prepare(
      'INSERT INTO search_logs (keyword, searched_by, searched_at) VALUES (?, ?, ?)'
    ).run(keyword, searchedBy, new Date().toISOString().replace('T', ' ').substring(0, 19))

    return NextResponse.json({
      utterances,
      total: countRow.count,
      keyword,
      relatedKeywords: allKeywords,
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: '検索中にエラーが発生しました' }, { status: 500 })
  }
}
