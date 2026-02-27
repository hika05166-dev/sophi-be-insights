import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAnthropicClient } from '@/lib/anthropic'

// In-memory cache to avoid re-calling Claude for the same keyword
const cache = new Map<string, string[]>()

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const keyword = searchParams.get('q') || ''

  if (!keyword.trim()) {
    return NextResponse.json({ queries: [] })
  }

  if (cache.has(keyword)) {
    return NextResponse.json({ queries: cache.get(keyword) })
  }

  const client = getAnthropicClient()
  if (!client) {
    return NextResponse.json({ queries: [] })
  }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `女性向けヘルスケアアプリ（生理・妊活管理）のユーザーチャット発話を検索します。「${keyword}」に関連する検索クエリを6〜8個生成してください。

条件:
- ユーザーが実際に発話しそうな口語・症状の具体的な表現・言い換え
- 元のキーワード自体は含めない
- 短いフレーズ（2〜8文字程度）で

例: 「PMS」→ ["イライラする", "気分が落ち込む", "むくみがひどい", "胸が張る", "頭痛がする", "眠い", "だるい", "情緒不安定"]

JSON形式のみで回答: {"queries": ["クエリ1", "クエリ2", ...]}`
      }],
    })

    const content = response.content[0]
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        const queries: string[] = parsed.queries || []
        cache.set(keyword, queries)
        return NextResponse.json({ queries })
      }
    }
  } catch (err) {
    console.warn('Related query generation failed:', err)
  }

  return NextResponse.json({ queries: [] })
}
