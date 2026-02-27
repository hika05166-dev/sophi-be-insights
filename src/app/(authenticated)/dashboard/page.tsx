'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import SearchBar from '@/components/ui/SearchBar'
import DonutChart from '@/components/charts/DonutChart'
import HeatmapChart from '@/components/charts/HeatmapChart'
import HourlyHeatmapChart from '@/components/charts/HourlyHeatmapChart'
import CrossTabHeatmap from '@/components/charts/CrossTabHeatmap'
import TrendLineChart from '@/components/charts/TrendLineChart'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardData, CrossTabCell } from '@/types'

type AxisKey = '年代' | 'モード' | '生理周期'
const AXES: AxisKey[] = ['年代', 'モード', '生理周期']
const AXIS_VALUES: Record<AxisKey, string[]> = {
  '年代': ['10代', '20代', '30代', '40代〜'],
  'モード': ['生理管理', '妊活'],
  '生理周期': ['月経期', '卵胞期', '排卵期', '黄体期'],
}

function getCrossTabData(
  rowAxis: AxisKey,
  colAxis: AxisKey,
  data: DashboardData,
): CrossTabCell[] {
  const key = [rowAxis, colAxis].sort().join('×') as string
  let matrix: CrossTabCell[]
  if (key === '年代×生理周期') matrix = data.agePhaseMatrix
  else if (key === 'モード×生理周期') matrix = data.modePhaseMatrix
  else matrix = data.ageModeMatrix

  // rowAxisが「大きい方」の軸でない場合はrow/colを入れ替える
  const canonical = [rowAxis, colAxis].sort()
  if (canonical[0] !== rowAxis) {
    return matrix.map(d => ({ row: d.col, col: d.row, count: d.count }))
  }
  return matrix
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const keyword = searchParams.get('q') || ''
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [rowAxis, setRowAxis] = useState<AxisKey>('年代')
  const [colAxis, setColAxis] = useState<AxisKey>('生理周期')

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
              {/* クロス集計: 軸選択式 */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle>クロス集計</CardTitle>
                      <CardDescription>「{keyword}」に関する発話数を2軸で集計</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-sm shrink-0">
                      <select
                        className="border rounded px-2 py-1 text-sm bg-background text-foreground"
                        value={rowAxis}
                        onChange={e => {
                          const v = e.target.value as AxisKey
                          if (v === colAxis) setColAxis(AXES.find(a => a !== v)!)
                          setRowAxis(v)
                        }}
                      >
                        {AXES.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <span className="text-muted-foreground font-medium">×</span>
                      <select
                        className="border rounded px-2 py-1 text-sm bg-background text-foreground"
                        value={colAxis}
                        onChange={e => {
                          const v = e.target.value as AxisKey
                          if (v === rowAxis) setRowAxis(AXES.find(a => a !== v)!)
                          setColAxis(v)
                        }}
                      >
                        {AXES.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CrossTabHeatmap
                    data={getCrossTabData(rowAxis, colAxis, data)}
                    rows={AXIS_VALUES[rowAxis]}
                    cols={AXIS_VALUES[colAxis]}
                    color="#18181b"
                  />
                </CardContent>
              </Card>

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
