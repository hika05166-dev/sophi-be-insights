import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAnthropicClient } from '@/lib/anthropic'
import { getDb } from '@/lib/db/index'
import { initSchema } from '@/lib/db/schema'
import { seedDatabase } from '@/lib/db/seed'
import type { UtteranceWithAttribute } from '@/types'

function ensureDb() {
  initSchema()
  seedDatabase()
}

// 属性判定のフォールバック（ヒューリスティック）
function classifyAttributeHeuristic(content: string): 'detailed' | 'self_solving' | 'none' {
  const length = content.length
  const hasQuestion = content.includes('？') || content.includes('?') || content.includes('ですか')
  const hasConcern = ['不安', '心配', '怖い', '辛い', 'つらい', '困って', 'ひどい', '悪化'].some(w => content.includes(w))
  const hasSolution = ['飲んでいます', '試してみました', '実践', '使っています', 'やってみた', '効果がありました', '改善', '対処'].some(w => content.includes(w))

  if (length > 80 && (hasConcern || hasQuestion)) {
    return 'detailed'
  }
  if (hasSolution && length > 50) {
    return 'self_solving'
  }
  return 'none'
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
    const filter = searchParams.get('filter') || 'all' // 'all' | 'detailed' | 'self_solving'
    const groupIds = searchParams.get('group_ids')?.split(',').map(Number).filter(Boolean) || []
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '30')
    const offset = (page - 1) * limit

    let conditions = ["u.role = 'user'"]
    const params: (string | number)[] = []

    if (keyword) {
      conditions.push('u.content LIKE ?')
      params.push(`%${keyword}%`)
    }

    let utterances = db.prepare(
      `SELECT u.*, us.anonymous_id, us.age_group, us.mode, us.cycle_phase
       FROM utterances u
       JOIN users us ON u.user_id = us.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(...params, 200, 0) as UtteranceWithAttribute[]

    // グループIDフィルタ
    if (groupIds.length > 0) {
      utterances = utterances.filter(u => groupIds.includes(u.id))
    }

    // 属性分類
    const client = getAnthropicClient()
    if (client && utterances.length > 0 && utterances.length <= 30) {
      // 少量のデータはClaudeで分類
      const utteranceText = utterances.map((u, i) => `[${i + 1}] ${u.content}`).join('\n')
      const prompt = `以下のユーザー発話を分析し、各発話の属性を分類してください。

発話データ:
${utteranceText}

各発話について以下の3種類のいずれかに分類してください：
- "detailed": 長文で詳細に不安や悩みを相談している（長文かつ深刻な内容）
- "self_solving": 自分なりの対処法や解決策を実践・共有している
- "none": 上記に当てはまらない

以下のJSON形式で回答してください：
{"classifications": [{"index": 1, "attribute": "detailed"}, ...]}
      `

      try {
        const response = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        })
        const content = response.content[0]
        if (content.type === 'text') {
          const jsonMatch = content.text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            const classMap: Record<number, string> = {}
            for (const c of parsed.classifications || []) {
              classMap[c.index - 1] = c.attribute
            }
            utterances = utterances.map((u, i) => ({
              ...u,
              attribute: (classMap[i] as 'detailed' | 'self_solving' | 'none') || 'none',
            }))
          }
        }
      } catch (err) {
        console.warn('Claude classification failed, using heuristic:', err)
        utterances = utterances.map(u => ({
          ...u,
          attribute: classifyAttributeHeuristic(u.content),
        }))
      }
    } else {
      // フォールバック: ヒューリスティック分類
      utterances = utterances.map(u => ({
        ...u,
        attribute: classifyAttributeHeuristic(u.content),
      }))
    }

    // 属性フィルタ適用
    let filtered = utterances
    if (filter === 'detailed') {
      filtered = utterances.filter(u => u.attribute === 'detailed')
    } else if (filter === 'self_solving') {
      filtered = utterances.filter(u => u.attribute === 'self_solving')
    }

    const total = filtered.length
    const paginated = filtered.slice(offset, offset + limit)

    return NextResponse.json({ utterances: paginated, total, keyword })
  } catch (error) {
    console.error('Utterances error:', error)
    return NextResponse.json({ error: '発話取得中にエラーが発生しました' }, { status: 500 })
  }
}
