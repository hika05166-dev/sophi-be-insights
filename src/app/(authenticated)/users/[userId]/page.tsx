'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ChatHistory from '@/components/ui/ChatHistory'
import InsightPanel from '@/components/ui/InsightPanel'
import type { ChatSession, Insight } from '@/types'
import { ArrowLeft, Sparkles, User } from 'lucide-react'

interface UserData {
  id: number
  anonymous_id: string
  age_group: string
  mode: string
  cycle_phase: string
  created_at: string
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string

  const [user, setUser] = useState<UserData | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [insight, setInsight] = useState<Insight | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false)
  const [isAiGenerated, setIsAiGenerated] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setUser(data.user)
          setSessions(data.sessions || [])
        }
      })
      .catch(() => setError('データの取得に失敗しました'))
      .finally(() => setIsLoading(false))
  }, [userId])

  const generateInsight = async () => {
    setIsGeneratingInsight(true)
    try {
      const res = await fetch(`/api/users/${userId}/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      setInsight(data.insights)
      setIsAiGenerated(data.aiGenerated)
    } catch {
      setError('インサイトの生成に失敗しました')
    } finally {
      setIsGeneratingInsight(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>{error}</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-gray-500 underline">
          戻る
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          戻る
        </button>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #ff6b9d, #c084fc)' }}>
              <User size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{user?.anonymous_id}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-600">
                  {user?.age_group}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
                  {user?.mode}モード
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600">
                  {user?.cycle_phase}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={generateInsight}
            disabled={isGeneratingInsight}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #ff6b9d, #c084fc)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(255, 107, 157, 0.3)',
            }}
          >
            {isGeneratingInsight ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                インサイトを生成
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* チャット履歴 */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-pink-50">
              <h2 className="font-semibold text-gray-700 text-sm">
                チャット履歴 ({sessions.length}セッション)
              </h2>
            </div>
            <div className="divide-y divide-pink-50 max-h-[70vh] overflow-y-auto">
              {sessions.map(session => (
                <ChatHistory key={session.session_id} session={session} />
              ))}
              {sessions.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">
                  会話履歴がありません
                </div>
              )}
            </div>
          </div>
        </div>

        {/* インサイトパネル */}
        <div className="lg:col-span-2">
          <InsightPanel
            insight={insight}
            isLoading={isGeneratingInsight}
            isAiGenerated={isAiGenerated}
            onGenerate={generateInsight}
          />
        </div>
      </div>
    </div>
  )
}
