'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, AlertCircle, Lightbulb, TrendingUp, MessageSquare, RefreshCw, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Insight } from '@/types'

function InsightsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const idsParam = searchParams.get('ids') || ''
  const keyword = searchParams.get('q') || ''
  const utteranceIds = idsParam.split(',').map(Number).filter(Boolean)

  const [insight, setInsight] = useState<Insight | null>(null)
  const [isAiGenerated, setIsAiGenerated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    if (utteranceIds.length === 0) return
    setIsLoading(true); setError('')
    try {
      const res = await fetch('/api/insights', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ utteranceIds }) })
      const data = await res.json()
      setInsight(data.insights); setIsAiGenerated(data.aiGenerated)
    } catch { setError('インサイトの生成に失敗しました。') }
    finally { setIsLoading(false) }
  }

  useEffect(() => { generate() }, [idsParam])

  const backHref = keyword ? `/results?q=${encodeURIComponent(keyword)}` : '/results'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push(backHref)} className="mb-4 -ml-2 text-muted-foreground">
          <ArrowLeft size={14} className="mr-1" />検索結果に戻る
        </Button>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
              <Sparkles size={18} />インサイトレポート
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              {keyword && <Badge variant="outline">🔍 「{keyword}」</Badge>}
              <Badge variant="secondary"><MessageSquare size={10} className="mr-1" />{utteranceIds.length}件を分析</Badge>
              {!isLoading && insight && (
                <Badge variant={isAiGenerated ? 'default' : 'secondary'}>{isAiGenerated ? '✨ AI生成' : 'サンプル'}</Badge>
              )}
            </div>
          </div>
          {!isLoading && (
            <Button variant="outline" size="sm" onClick={generate}>
              <RefreshCw size={13} className="mr-1.5" />再生成
            </Button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            AIがインサイトを生成中です...
          </div>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      )}

      {error && !isLoading && (
        <div className="p-4 rounded-md border border-destructive/30 bg-destructive/5 text-destructive text-sm">{error}</div>
      )}

      {!isLoading && insight && (
        <div className="space-y-4 animate-fade-in">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm"><Sparkles size={14} />主な悩み・関心事</CardTitle>
            </CardHeader>
            <CardContent><p className="text-sm text-foreground leading-relaxed">{insight.summary}</p></CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm"><TrendingUp size={14} />感情・心理の流れ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">{insight.emotionTrend}</p>
              <div className="mt-4 flex items-end gap-1.5 h-10">
                {['不安', '困惑', '情報収集', '前向き', '安心'].map((label, i) => {
                  const heights = [40, 65, 75, 60, 85]
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-sm bg-muted-foreground/30" style={{ height: `${heights[i]}%`, opacity: i > 2 ? 1 : 0.5 }} />
                      <span className="text-[9px] text-muted-foreground text-center leading-tight">{label}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm"><AlertCircle size={14} />未解決の課題・潜在ニーズ</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insight.unresolvedIssues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center mt-0.5 font-bold">{i + 1}</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm"><Lightbulb size={14} />プロダクト改善のヒント</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insight.productHints.map((hint, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <ChevronRight size={14} className="shrink-0 text-muted-foreground mt-0.5" />{hint}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">次のアクション</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: '📊 キーワード分析', desc: `「${keyword}」の傾向をグラフで確認`, href: `/dashboard?q=${encodeURIComponent(keyword)}` },
                  { label: '🔍 発話を再絞り込み', desc: 'グルーピングや属性で絞り込む', href: backHref },
                  { label: '🏠 新しい検索', desc: '別のキーワードで新規検索', href: '/search' },
                ].map(({ label, desc, href }) => (
                  <button key={label} onClick={() => router.push(href)} className="p-3 rounded-md border bg-background hover:bg-accent text-left transition-colors">
                    <p className="text-sm font-medium text-foreground mb-1">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && !insight && !error && (
        <div className="text-center py-20 text-muted-foreground">
          <Sparkles size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">発話が選択されていません</p>
          <Button variant="link" size="sm" onClick={() => router.push(backHref)} className="mt-2">検索結果に戻る</Button>
        </div>
      )}
    </div>
  )
}

export default function InsightsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center py-20"><div className="loading-spinner" /></div>}>
      <InsightsContent />
    </Suspense>
  )
}
