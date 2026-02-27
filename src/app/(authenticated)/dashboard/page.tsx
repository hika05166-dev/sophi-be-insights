'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import SearchBar from '@/components/ui/SearchBar'
import DonutChart from '@/components/charts/DonutChart'
import HeatmapChart from '@/components/charts/HeatmapChart'
import HourlyHeatmapChart from '@/components/charts/HourlyHeatmapChart'
import TrendLineChart from '@/components/charts/TrendLineChart'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardData } from '@/types'

function DashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const keyword = searchParams.get('q') || ''
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!keyword) return
    setIsLoading(true)
    fetch(`/api/dashboard?q=${encodeURIComponent(keyword)}`).then(r => r.json()).then(setData).catch(console.error).finally(() => setIsLoading(false))
  }, [keyword])

  const handleSearch = (kw: string) => { if (kw.trim()) router.push(`/dashboard?q=${encodeURIComponent(kw.trim())}`) }

  const coOccurMax = data?.coOccurrence?.[0]?.count || 1

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        {keyword && (
          <Button variant="ghost" size="sm" onClick={() => router.push(`/results?q=${encodeURIComponent(keyword)}`)} className="-ml-2 mb-4 text-muted-foreground">
            <ArrowLeft size={14} className="mr-1" />検索結果に戻る
          </Button>
        )}
        <h1 className="text-xl font-bold text-foreground mb-4">キーワード分析ダッシュボード</h1>
        <SearchBar defaultValue={keyword} onSearch={handleSearch} placeholder="分析したいキーワードを入力..." />
      </div>

      {!keyword && (
        <div className="text-center py-20 text-muted-foreground">
          <div className="text-4xl mb-4">📊</div>
          <p>キーワードを入力して分析を開始</p>
          <p className="text-sm mt-1">例：生理痛、PMS、妊活</p>
        </div>
      )}

      {keyword && isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full" />)}
          </div>
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {keyword && !isLoading && data && (
        <div className="animate-fade-in space-y-5">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-foreground">
                <span className="font-semibold">「{keyword}」</span>に関する発話データ：合計
                <span className="font-bold mx-1">{data.totalCount}件</span>のユーザー発話が見つかりました
              </p>
            </CardContent>
          </Card>

          {data.totalCount === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p>「{keyword}」に関するデータが見つかりませんでした</p>
            </div>
          ) : (
            <>
              {/* ユーザー属性ごとの比較 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Card>
                  <CardHeader><CardTitle>年代別構成比</CardTitle></CardHeader>
                  <CardContent><DonutChart data={data.ageGroups.map(d => ({ name: d.age_group, value: d.count }))} colors={['#18181b', '#52525b', '#a1a1aa', '#d4d4d8']} /></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>モード別構成比</CardTitle></CardHeader>
                  <CardContent><DonutChart data={data.modes.map(d => ({ name: d.mode, value: d.count }))} colors={['#18181b', '#71717a']} /></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>周期フェーズ別構成比</CardTitle></CardHeader>
                  <CardContent><DonutChart data={data.cyclePhases.map(d => ({ name: d.cycle_phase, value: d.count }))} colors={['#ff6b9d', '#c084fc', '#818cf8', '#f472b6']} /></CardContent>
                </Card>
              </div>

              {/* 時間帯別ヒートマップ */}
              <Card>
                <CardHeader>
                  <CardTitle>時間帯別発話数ヒートマップ</CardTitle>
                  <CardDescription>「{keyword}」に関する発話が多い時間帯・曜日</CardDescription>
                </CardHeader>
                <CardContent><HourlyHeatmapChart data={data.hourlyHeatmap} /></CardContent>
              </Card>

              {/* 共起キーワード */}
              {data.coOccurrence.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>共起キーワード分析</CardTitle>
                    <CardDescription>「{keyword}」と同じ発話内でよく使われるキーワード</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.coOccurrence.map(item => (
                        <div key={item.keyword} className="flex items-center gap-3">
                          <span className="text-sm text-foreground w-28 shrink-0">{item.keyword}</span>
                          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="h-2 rounded-full bg-primary transition-all"
                              style={{ width: `${(item.count / coOccurMax) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 生理周期フェーズ × 曜日 */}
              <Card>
                <CardHeader>
                  <CardTitle>生理周期フェーズ × 曜日</CardTitle>
                  <CardDescription>色が濃いほど「{keyword}」に関する発話が多い</CardDescription>
                </CardHeader>
                <CardContent><HeatmapChart data={data.heatmap} /></CardContent>
              </Card>

              {/* 月別トレンド */}
              <Card>
                <CardHeader>
                  <CardTitle>月別発話数トレンド</CardTitle>
                  <CardDescription>「{keyword}」に関する月別の発話数推移</CardDescription>
                </CardHeader>
                <CardContent><TrendLineChart data={data.monthlyTrend} /></CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center py-20"><div className="loading-spinner" /></div>}>
      <DashboardContent />
    </Suspense>
  )
}
