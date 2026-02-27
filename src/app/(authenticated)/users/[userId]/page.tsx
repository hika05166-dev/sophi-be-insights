'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ChatHistory from '@/components/ui/ChatHistory'
import InsightPanel from '@/components/ui/InsightPanel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import type { ChatSession, Insight, UserStats } from '@/types'
import { ArrowLeft, Sparkles, User, Clock, Calendar, MessageSquare, BarChart2 } from 'lucide-react'

interface UserData { id: number; anonymous_id: string; age_group: string; mode: string; cycle_phase: string; created_at: string }

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string

  const [user, setUser] = useState<UserData | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set())
  const [insight, setInsight] = useState<Insight | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false)
  const [isAiGenerated, setIsAiGenerated] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/users/${userId}`).then(r => r.json()),
      fetch(`/api/users/${userId}/stats`).then(r => r.json()),
    ])
      .then(([data, statsData]) => {
        if (data.error) { setError(data.error) } else {
          setUser(data.user)
          const fetched: ChatSession[] = data.sessions || []
          setSessions(fetched)
          setSelectedSessions(new Set(fetched.map((s: ChatSession) => s.session_id)))
        }
        if (!statsData.error) setStats(statsData)
      })
      .catch(() => setError('データの取得に失敗しました'))
      .finally(() => setIsLoading(false))
  }, [userId])

  const toggleSession = (sessionId: string) => {
    setSelectedSessions(prev => { const next = new Set(prev); next.has(sessionId) ? next.delete(sessionId) : next.add(sessionId); return next })
  }
  const toggleAllSessions = () => {
    setSelectedSessions(selectedSessions.size === sessions.length ? new Set() : new Set(sessions.map(s => s.session_id)))
  }
  const generateInsight = async () => {
    setIsGeneratingInsight(true)
    try {
      const sessionIds = selectedSessions.size > 0 ? Array.from(selectedSessions) : sessions.map(s => s.session_id)
      const res = await fetch(`/api/users/${userId}/insights`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionIds }) })
      const data = await res.json()
      setInsight(data.insights); setIsAiGenerated(data.aiGenerated)
    } catch { setError('インサイトの生成に失敗しました') }
    finally { setIsGeneratingInsight(false) }
  }

  if (isLoading) return <div className="flex justify-center items-center min-h-96"><div className="loading-spinner" /></div>
  if (error) return (
    <div className="p-6 text-center text-destructive">
      <p>{error}</p>
      <Button variant="link" onClick={() => router.back()} className="mt-4">戻る</Button>
    </div>
  )

  const allSelected = selectedSessions.size === sessions.length
  const someSelected = selectedSessions.size > 0 && selectedSessions.size < sessions.length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 mb-4 text-muted-foreground">
          <ArrowLeft size={14} className="mr-1" />戻る
        </Button>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <User size={18} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{user?.anonymous_id}</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="outline">{user?.age_group}</Badge>
                <Badge variant="outline">{user?.mode}モード</Badge>
                <Badge variant="outline">{user?.cycle_phase}</Badge>
              </div>
            </div>
          </div>
          <Button onClick={generateInsight} disabled={isGeneratingInsight || selectedSessions.size === 0}>
            {isGeneratingInsight ? (
              <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />生成中...</>
            ) : (
              <><Sparkles size={14} className="mr-1.5" />{selectedSessions.size > 0 ? `${selectedSessions.size}件からインサイトを生成` : 'セッションを選択'}</>
            )}
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <MessageSquare size={18} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">セッション数</p>
                <p className="text-lg font-bold">{stats.totalSessions}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <BarChart2 size={18} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">発話数</p>
                <p className="text-lg font-bold">{stats.totalUtterances}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock size={18} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">最多利用時間</p>
                <p className="text-lg font-bold">{stats.topHour !== null ? `${stats.topHour}時台` : '—'}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Calendar size={18} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">最多利用曜日</p>
                <p className="text-lg font-bold">{stats.topDay !== null ? `${stats.topDay}曜日` : '—'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {stats && stats.topKeywords.length > 0 && (
        <Card className="mb-5">
          <CardHeader className="pb-2"><CardTitle className="text-sm">よく話したトピック</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.topKeywords.map(kw => (
                <span
                  key={kw.keyword}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-muted text-foreground"
                >
                  {kw.keyword}
                  <span className="text-muted-foreground">×{kw.count}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle>チャット履歴 ({sessions.length}セッション)</CardTitle>
              {sessions.length > 1 && (
                <div className="flex items-center gap-2 cursor-pointer" onClick={toggleAllSessions}>
                  <Checkbox checked={allSelected ? true : someSelected ? 'indeterminate' : false} onCheckedChange={toggleAllSessions} />
                  <span className="text-xs text-muted-foreground">{allSelected ? 'すべて解除' : 'すべて選択'}</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0 divide-y max-h-[70vh] overflow-y-auto">
              {sessions.map(session => (
                <ChatHistory key={session.session_id} session={session} isSelected={selectedSessions.has(session.session_id)} onToggle={toggleSession} />
              ))}
              {sessions.length === 0 && <p className="p-8 text-center text-muted-foreground text-sm">会話履歴がありません</p>}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <InsightPanel insight={insight} isLoading={isGeneratingInsight} isAiGenerated={isAiGenerated} onGenerate={generateInsight} />
        </div>
      </div>
    </div>
  )
}
