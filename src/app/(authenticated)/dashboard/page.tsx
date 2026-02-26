'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import SearchBar from '@/components/ui/SearchBar'
import DonutChart from '@/components/charts/DonutChart'
import HeatmapChart from '@/components/charts/HeatmapChart'
import TrendLineChart from '@/components/charts/TrendLineChart'
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
    fetch(`/api/dashboard?q=${encodeURIComponent(keyword)}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [keyword])

  const handleSearch = (kw: string) => {
    if (kw.trim()) {
      router.push(`/dashboard?q=${encodeURIComponent(kw.trim())}`)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800 mb-4">キーワード分析ダッシュボード</h1>
        <SearchBar defaultValue={keyword} onSearch={handleSearch} placeholder="分析したいキーワードを入力..." />
      </div>

      {!keyword && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-lg">キーワードを入力して分析を開始</p>
          <p className="text-sm mt-1">例：生理痛、PMS、妊活</p>
        </div>
      )}

      {keyword && isLoading && (
        <div className="flex justify-center py-20">
          <div className="loading-spinner" />
        </div>
      )}

      {keyword && !isLoading && data && (
        <div className="animate-fade-in">
          {/* 概要 */}
          <div className="mb-6 p-4 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #fff0f5, #f5f0ff)', border: '1px solid #ffc2d8' }}>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">「{keyword}」</span>
              に関する発話データ：合計
              <span className="font-bold mx-1" style={{ color: '#ff6b9d' }}>{data.totalCount}件</span>
              のユーザー発話が見つかりました
            </p>
          </div>

          {data.totalCount === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>「{keyword}」に関するデータが見つかりませんでした</p>
            </div>
          ) : (
            <>
              {/* 構成比チャート */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-5">
                  <h2 className="font-semibold text-gray-700 mb-4">年代別構成比</h2>
                  <DonutChart
                    data={data.ageGroups.map(d => ({ name: d.age_group, value: d.count }))}
                    colors={['#ff6b9d', '#c084fc', '#818cf8', '#38bdf8']}
                  />
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-5">
                  <h2 className="font-semibold text-gray-700 mb-4">モード別構成比</h2>
                  <DonutChart
                    data={data.modes.map(d => ({ name: d.mode, value: d.count }))}
                    colors={['#ff6b9d', '#c084fc']}
                  />
                </div>
              </div>

              {/* ヒートマップ */}
              <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-5 mb-6">
                <h2 className="font-semibold text-gray-700 mb-1">生理周期フェーズ × 曜日 ヒートマップ</h2>
                <p className="text-xs text-gray-400 mb-4">色が濃いほど「{keyword}」に関する発話が多い</p>
                <HeatmapChart data={data.heatmap} />
              </div>

              {/* 時系列トレンド */}
              <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-5">
                <h2 className="font-semibold text-gray-700 mb-1">月別発話数トレンド</h2>
                <p className="text-xs text-gray-400 mb-4">「{keyword}」に関する月別の発話数推移</p>
                <TrendLineChart data={data.monthlyTrend} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20">
        <div className="loading-spinner" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
