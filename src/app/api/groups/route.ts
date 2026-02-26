import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAnthropicClient } from '@/lib/anthropic'
import { getDb } from '@/lib/db/index'
import { initSchema } from '@/lib/db/schema'
import { seedDatabase } from '@/lib/db/seed'
import type { Group } from '@/types'

function ensureDb() {
  initSchema()
  seedDatabase()
}

// APIキー未設定時のフォールバックグループ
function generateFallbackGroups(utterances: { id: number; content: string }[], keyword: string): Group[] {
  const total = utterances.length
  if (total === 0) return []

  return [
    {
      id: 1,
      label: `「${keyword}」に関する不安・悩みの相談`,
      count: Math.ceil(total * 0.45),
      utterance_ids: utterances.slice(0, Math.ceil(total * 0.45)).map(u => u.id),
    },
    {
      id: 2,
      label: `「${keyword}」についての情報収集・対処法の質問`,
      count: Math.ceil(total * 0.35),
      utterance_ids: utterances.slice(Math.ceil(total * 0.45), Math.ceil(total * 0.80)).map(u => u.id),
    },
    {
      id: 3,
      label: `「${keyword}」に関連した受診・治療の検討`,
      count: total - Math.ceil(total * 0.80),
      utterance_ids: utterances.slice(Math.ceil(total * 0.80)).map(u => u.id),
    },
  ].filter(g => g.count > 0)
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
    const keyword = body.keyword || ''

    if (!keyword.trim()) {
      return NextResponse.json({ groups: [], keyword: '' })
    }

    // 検索結果の発話取得（最大50件）
    const utterances = db.prepare(
      `SELECT u.id, u.content FROM utterances u
       WHERE u.role = 'user' AND u.content LIKE ?
       ORDER BY u.created_at DESC
       LIMIT 50`
    ).all(`%${keyword}%`) as { id: number; content: string }[]

    const client = getAnthropicClient()
    if (!client || utterances.length === 0) {
      return NextResponse.json({
        groups: generateFallbackGroups(utterances, keyword),
        keyword,
        aiGenerated: false,
      })
    }

    // Claude APIでグルーピング
    const utteranceText = utterances.slice(0, 20)
      .map((u, i) => `[${i + 1}] (ID:${u.id}) ${u.content}`)
      .join('\n')

    const prompt = `以下は「${keyword}」に関するユーザーの発話データです。これらをテーマ別に3〜5グループに分類し、各グループの特徴を簡潔に説明してください。

発話データ:
${utteranceText}

以下のJSON形式で回答してください：
{
  "groups": [
    {
      "id": 1,
      "label": "グループの特徴を表す説明（30文字以内）",
      "utterance_indices": [1, 3, 5]
    }
  ]
}

utterance_indicesには上記の[番号]を使用してください。`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
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

    const parsed = JSON.parse(jsonMatch[0])
    const allIds = utterances.map(u => u.id)

    const groups: Group[] = parsed.groups.map((g: { id: number; label: string; utterance_indices: number[] }) => {
      const ids = (g.utterance_indices || [])
        .filter((idx: number) => idx >= 1 && idx <= utterances.length)
        .map((idx: number) => utterances[idx - 1].id)

      // グループ未分類のものは最初のグループに追加
      const remainingIds = allIds.filter(id => !parsed.groups.some(
        (og: { utterance_indices: number[] }) => og.utterance_indices?.some((idx: number) => utterances[idx - 1]?.id === id)
      ))

      return {
        id: g.id,
        label: g.label,
        count: ids.length,
        utterance_ids: g.id === parsed.groups[0].id ? [...ids, ...remainingIds] : ids,
      }
    })

    return NextResponse.json({ groups, keyword, aiGenerated: true })
  } catch (error) {
    console.error('Groups error:', error)
    // エラー時もフォールバックを返す
    try {
      const db = getDb()
      const keyword = (await request.json().catch(() => ({ keyword: '' }))).keyword || ''
      const utterances = db.prepare(
        `SELECT id, content FROM utterances WHERE role = 'user' AND content LIKE ? LIMIT 50`
      ).all(`%${keyword}%`) as { id: number; content: string }[]
      return NextResponse.json({
        groups: generateFallbackGroups(utterances, keyword),
        keyword,
        aiGenerated: false,
      })
    } catch {
      return NextResponse.json({ error: 'グルーピング中にエラーが発生しました' }, { status: 500 })
    }
  }
}
