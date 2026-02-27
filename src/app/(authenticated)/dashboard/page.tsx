'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import SearchBar from '@/components/ui/SearchBar'
import DonutChart from '@/components/charts/DonutChart'
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
  '年代': [
    '10代前半', '10代後半', '20代前半', '20代後半',
    '30代前半', '30代後半', '40代前半', '40代後半',
    '50代前半', '50代後半', '60代前半', '60代後半',
  ],
  'モード': ['生理管理', '妊活'],
  '生理周期': ['月経期', '卵胞期', '排卵期', '黄体期'],
}

const LABEL_COLOR: Record<string, string> = {
  '10代前半': '#7dd3fc', '10代後半': '#38bdf8',
  '20代前半': '#a5b4fc', '20代後半': '#818cf8',
  '30代前半': '#c4b5fd', '30代後半': '#a78bfa',
  '40代前半': '#d8b4fe', '40代後半': '#c084fc',
  '50代前半': '#f0abfc', '50代後半': '#e879f9',
  '60代前半': '#f9a8d4', '60代後半': '#f472b6',
  '生理管理': '#ff6b9d', '妊活': '#fb923c',
  '月経期': '#ff6b9d', '卵胞期': '#c084fc', '排卵期': '#818cf8', '黄体期': '#f472b6',
}

const swap = (d: CrossTabCell) => ({ row: d.col, col: d.row, count: d.count })

function getCrossTabData(rowAxis: AxisKey, colAxis: AxisKey, data: DashboardData): CrossTabCell[] {
  if (rowAxis === '年代' && colAxis === '生理周期') return data.agePhaseMatrix
  if (rowAxis === '生理周期' && colAxis === '年代') return data.agePhaseMatrix.map(swap)
  if (rowAxis === 'モード' && colAxis === '生理周期') return data.modePhaseMatrix
  if (rowAxis === '生理周期' && colAxis === 'モード') return data.modePhaseMatrix.map(swap)
  if (rowAxis === '年代' && colAxis === 'モード') return data.ageModeMatrix
  if (rowAxis === 'モード' && colAxis === '年代') return data.ageModeMatrix.map(swap)
  return []
}

function get1DData(axis: AxisKey, data: DashboardData) {
  const map: Record<string, number> = {}
  const src = axis === '年代' ? data.agePhaseMatrix
    : axis === 'モード' ? data.modePhaseMatrix
    : data.agePhaseMatrix
  for (const c of src) {
    const key = axis === '生理周期' ? c.col : c.row
    map[key] = (map[key] || 0) + c.count
  }
  const entries = AXIS_VALUES[axis].map(v => ({ label: v, count: map[v] || 0 }))
  const total = entries.reduce((s, e) => s + e.count, 0)
  return { entries, total }
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const keyword = searchParams.get('q') || ''
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [rowAxis, setRowAxis] = useState<AxisKey>('年代')
  const [colAxis, setColAxis] = useState<AxisKey | null>('生理周期')

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
                      <CardDescription>
                        {colAxis
                          ? `「${keyword}」に関する発話数を2軸で集計`
                          : `「${keyword}」に関する発話数を1軸で集計`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-sm shrink-0">
                      <select
                        className="border rounded px-2 py-1 text-sm bg-background text-foreground"
                        value={rowAxis}
                        onChange={e => setRowAxis(e.target.value as AxisKey)}
                      >
                        {AXES.filter(a => a !== colAxis).map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <span className="text-muted-foreground font-medium">×</span>
                      <select
                        className="border rounded px-2 py-1 text-sm bg-background text-foreground"
                        value={colAxis ?? ''}
                        onChange={e => setColAxis(e.target.value === '' ? null : e.target.value as AxisKey)}
                      >
                        <option value="">— なし（1軸）</option>
                        {AXES.filter(a => a !== rowAxis).map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {colAxis ? (
                    <CrossTabHeatmap
                      data={getCrossTabData(rowAxis, colAxis, data)}
                      rows={AXIS_VALUES[rowAxis]}
                      cols={AXIS_VALUES[colAxis]}
                    />
                  ) : (() => {
                    const { entries, total } = get1DData(rowAxis, data)
                    const maxCount = Math.max(...entries.map(e => e.count), 1)
                    return (
                      <div className="space-y-1.5">
                        {entries.map(({ label, count }) => {
                          const p = total > 0 ? (count / total) * 100 : 0
                          const color = LABEL_COLOR[label] ?? '#94a3b8'
                          return (
                            <div key={label} className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-20 text-right shrink-0 flex items-center justify-end gap-1.5">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                                {label}
                              </span>
                              <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                                <div
                                  className="h-full rounded transition-all"
                                  style={{ width: `${(count / maxCount) * 100}%`, background: color + 'cc' }}
                                />
                              </div>
                              <span className="text-xs text-foreground w-24 shrink-0">
                                <span className="font-semibold">{p.toFixed(1)}%</span>
                                <span className="text-muted-foreground ml-1">({count}件)</span>
                              </span>
                            </div>
                          )
                        })}
                        <p className="text-[10px] text-muted-foreground mt-2 text-right">
                          ※ 割合はキーワードに関する発話全体に占める比率
                        </p>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>

              {/* 時間帯別 + 共起キーワード: 2カラム */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 時間帯別 */}
                <Card>
                  <CardHeader>
                    <CardTitle>時間帯別発話数</CardTitle>
                    <CardDescription>「{keyword}」に関する発話が多い時間帯</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-w-xs">
                      <HourlyHeatmapChart data={data.hourlyHeatmap} />
                    </div>
                  </CardContent>
                </Card>

                {/* 共起キーワード */}
                <Card>
                  <CardHeader>
                    <CardTitle>共起キーワード分析</CardTitle>
                    <CardDescription>「{keyword}」と同じ発話内でよく使われるキーワード</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.coOccurrence.length > 0 ? (
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
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">共起キーワードが見つかりませんでした</p>
                    )}
                  </CardContent>
                </Card>
              </div>

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
