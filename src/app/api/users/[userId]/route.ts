import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/lib/db/index'
import { initSchema } from '@/lib/db/schema'
import { seedDatabase } from '@/lib/db/seed'
import type { ChatSession, Utterance } from '@/types'

function ensureDb() {
  initSchema()
  seedDatabase()
}

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

    // ユーザー情報取得（anonymous_idで検索）
    const user = db.prepare(
      'SELECT * FROM users WHERE anonymous_id = ?'
    ).get(userId)

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    const typedUser = user as { id: number; anonymous_id: string; age_group: string; mode: string; cycle_phase: string; created_at: string }

    // 全発話を取得
    const utterances = db.prepare(
      `SELECT * FROM utterances
       WHERE user_id = ?
       ORDER BY session_id, created_at ASC`
    ).all(typedUser.id) as Utterance[]

    // セッション単位でグルーピング
    const sessionMap = new Map<string, Utterance[]>()
    for (const u of utterances) {
      if (!sessionMap.has(u.session_id)) {
        sessionMap.set(u.session_id, [])
      }
      sessionMap.get(u.session_id)!.push(u)
    }

    const sessions: ChatSession[] = Array.from(sessionMap.entries()).map(([session_id, messages]) => ({
      session_id,
      messages,
      created_at: messages[0]?.created_at || '',
    }))

    return NextResponse.json({ user: typedUser, sessions })
  } catch (error) {
    console.error('User history error:', error)
    return NextResponse.json({ error: 'チャット履歴取得中にエラーが発生しました' }, { status: 500 })
  }
}
