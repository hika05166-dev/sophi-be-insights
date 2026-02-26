'use client'

import { Sparkles, AlertCircle, Lightbulb, TrendingUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Insight } from '@/types'

interface InsightPanelProps {
  insight: Insight | null
  isLoading: boolean
  isAiGenerated: boolean
  onGenerate: () => void
}

export default function InsightPanel({ insight, isLoading, isAiGenerated, onGenerate }: InsightPanelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles size={14} />生成中...</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    )
  }

  if (!insight) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles size={14} />インサイト</CardTitle></CardHeader>
        <CardContent className="text-center py-8">
          <Sparkles size={28} className="mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground mb-4">会話からインサイトを自動生成できます</p>
          <Button onClick={onGenerate}>インサイトを生成する</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Sparkles size={14} />インサイト</CardTitle>
          <Badge variant={isAiGenerated ? 'default' : 'secondary'}>{isAiGenerated ? 'AI生成' : 'サンプル'}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-3 rounded-md bg-muted">
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">主な悩み・関心事</p>
          <p className="text-sm text-foreground leading-relaxed">{insight.summary}</p>
        </div>

        <div className="p-3 rounded-md border">
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingUp size={12} className="text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground">感情の変化</p>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{insight.emotionTrend}</p>
        </div>

        <div className="p-3 rounded-md border">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertCircle size={12} className="text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground">未解決の課題</p>
          </div>
          <ul className="space-y-1">
            {insight.unresolvedIssues.map((issue, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm text-foreground">
                <span className="text-muted-foreground shrink-0 mt-0.5">•</span>{issue}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-3 rounded-md border">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lightbulb size={12} className="text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground">プロダクト改善ヒント</p>
          </div>
          <ul className="space-y-1">
            {insight.productHints.map((hint, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm text-foreground">
                <span className="text-muted-foreground shrink-0 mt-0.5">•</span>{hint}
              </li>
            ))}
          </ul>
        </div>

        <Button variant="ghost" size="sm" onClick={onGenerate} className="w-full text-muted-foreground">
          再生成する
        </Button>
      </CardContent>
    </Card>
  )
}
