import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAnthropicClient } from '@/lib/anthropic'
import { getDb } from '@/lib/db/index'
import { initSchema } from '@/lib/db/schema'
import { seedDatabase } from '@/lib/db/seed'

function ensureDb() {
  initSchema()
  seedDatabase()
}

const FALLBACK_INSIGHTS = {
  summary: '選択された発話から、ユーザーは生理周期や体調管理について積極的に情報収集しています。特に生理痛やPMSに関する悩みが中心で、セルフケアの方法を求めています。',
  emotionTrend: '発話全体を通じて、最初は不安や困惑が見られますが、情報提供後は前向きな反応を示しています。特に具体的なアドバイスを受けた後は安心感が感じられます。',
  unresolvedIssues: [
    '生理痛の根本的な原因の特定',
    '婦人科受診へのためらい',
    '日常生活での継続的なセルフケア方法',
  ],
  productHints: [
    '生理周期フェーズに合わせたパーソナライズされたアドバイス機能',
    '受診タイミングを判断するためのチェックリスト機能',
    '同じ悩みを持つユーザーとのコミュニティ機能',
    '生理痛緩和グッズや市販薬のレコメンド機能',
  ],
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    ensureDb()
    const db = getDb()

    const body = await request.json()
    const utteranceIds: number[] = body.utteranceIds

    if (!utteranceIds || utteranceIds.length === 0) {
      return NextResponse.json({ error: '発話IDが必要です' }, { status: 400 })
    }

    const placeholders = utteranceIds.map(() => '?').join(', ')
    const utterances = db.prepare(
      `SELECT u.role, u.content, u.created_at, usr.anonymous_id, usr.age_group, usr.cycle_phase
       FROM utterances u
       LEFT JOIN users usr ON u.user_id = usr.id
       WHERE u.id IN (${placeholders})
       ORDER BY u.created_at ASC`
    ).all(...utteranceIds) as {
      role: string
      content: string
      created_at: string
      anonymous_id: string
      age_group: string
      cycle_phase: string
    }[]

    const client = getAnthropicClient()
    if (!client) {
      return NextResponse.json({ insights: FALLBACK_INSIGHTS, aiGenerated: false })
    }

    const conversationText = utterances.map(u =>
      `[${u.anonymous_id} / ${u.age_group} / ${u.cycle_phase}] ${u.content}`
    ).join('\n')

    const prompt = `以下の${utteranceIds.length}件のユーザー発話を分析し、商品開発やサービス改善に役立つインサイトを生成してください。

【発話一覧】
${conversationText}

以下のJSON形式で回答してください：
{
  "summary": "これらの発話から見えるユーザーの主な悩み・関心事のサマリー（200文字程度）",
  "emotionTrend": "発話全体から読み取れる感情や傾向の説明（150文字程度）",
  "unresolvedIssues": [
    "未解決の課題・潜在ニーズ1",
    "未解決の課題・潜在ニーズ2",
    "未解決の課題・潜在ニーズ3"
  ],
  "productHints": [
    "商品開発・サービス改善へのヒント1",
    "商品開発・サービス改善へのヒント2",
    "商品開発・サービス改善へのヒント3",
    "商品開発・サービス改善へのヒント4"
  ]
}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const insights = JSON.parse(jsonMatch[0])
    return NextResponse.json({ insights, aiGenerated: true })
  } catch (error) {
    console.error('Insights error:', error)
    return NextResponse.json({ insights: FALLBACK_INSIGHTS, aiGenerated: false })
  }
}
