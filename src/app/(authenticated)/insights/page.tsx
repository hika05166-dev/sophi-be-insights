'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Sparkles, AlertCircle, Lightbulb, TrendingUp,
  Users, MessageSquare, RefreshCw, ChevronRight,
} from 'lucide-react'
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
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utteranceIds }),
      })
      const data = await res.json()
      setInsight(data.insights)
      setIsAiGenerated(data.aiGenerated)
    } catch {
      setError('インサイトの生成に失敗しました。')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    generate()
  }, [idsParam])

  const backHref = keyword
    ? `/results?q=${encodeURIComponent(keyword)}`
    : '/results'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-6">
        <button
          onClick={() => router.push(backHref)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
        >
          <ArrowLeft size={15} />
          検索結果に戻る
        </button>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #ff6b9d, #c084fc)' }}>
                <Sparkles size={16} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">インサイトレポート</h1>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {keyword && (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(255, 107, 157, 0.1)', color: '#e8005a' }}>
                  🔍 「{keyword}」
                </span>
              )}
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                <MessageSquare size={11} />
                {utteranceIds.length}件の発話を分析
              </span>
              {!isLoading && insight && (
                <span className="text-xs px-2.5 py-1 rounded-full"
                  style={isAiGenerated
                    ? { background: 'rgba(192, 132, 252, 0.12)', color: '#7700e8' }
                    : { background: '#f3f4f6', color: '#9ca3af' }}>
                  {isAiGenerated ? '✨ AI生成' : 'サンプル'}
                </span>
              )}
            </div>
          </div>

          {!isLoading && (
            <button
              onClick={generate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(255,107,157,0.1), rgba(192,132,252,0.1))',
                color: '#9333ea',
                border: '1px solid rgba(192,132,252,0.3)',
              }}
            >
              <RefreshCw size={14} />
              再生成
            </button>
          )}
        </div>
      </div>

      {/* ローディング */}
      {isLoading && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-gray-500 px-1 mb-6">
            <div className="loading-spinner" />
            <span>AIがインサイトを生成中です。しばらくお待ちください...</span>
          </div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* エラー */}
      {error && !isLoading && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* インサイト本体 */}
      {!isLoading && insight && (
        <div className="space-y-5 animate-fade-in">

          {/* サマリー */}
          <div className="p-5 rounded-2xl shadow-sm"
            style={{ background: 'linear-gradient(135deg, rgba(255,107,157,0.06), rgba(192,132,252,0.06))', border: '1px solid rgba(255,107,157,0.15)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #ff6b9d, #c084fc)' }}>
                <Sparkles size={12} className="text-white" />
              </div>
              <h2 className="text-sm font-bold text-gray-700">主な悩み・関心事</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{insight.summary}</p>
          </div>

          {/* 感情の変化 */}
          <div className="p-5 rounded-2xl shadow-sm bg-amber-50 border border-amber-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-amber-200 flex items-center justify-center">
                <TrendingUp size={12} className="text-amber-700" />
              </div>
              <h2 className="text-sm font-bold text-amber-700">感情・心理の流れ</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{insight.emotionTrend}</p>
            {/* ダミー感情グラフ */}
            <div className="mt-4 flex items-end gap-1.5 h-10">
              {['不安', '困惑', '情報収集', '前向き', '安心'].map((label, i) => {
                const heights = [40, 65, 75, 60, 85]
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-sm"
                      style={{
                        height: `${heights[i]}%`,
                        background: `linear-gradient(180deg, #fbbf24, #f59e0b${i > 2 ? '' : '66'})`,
                        opacity: i > 2 ? 1 : 0.5,
                      }}
                    />
                    <span className="text-[9px] text-amber-600 text-center leading-tight">{label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 2カラム: 未解決 + ヒント */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 未解決の課題 */}
            <div className="p-5 rounded-2xl shadow-sm bg-rose-50 border border-rose-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-rose-200 flex items-center justify-center">
                  <AlertCircle size={12} className="text-rose-600" />
                </div>
                <h2 className="text-sm font-bold text-rose-600">未解決の課題・潜在ニーズ</h2>
              </div>
              <ul className="space-y-2.5">
                {insight.unresolvedIssues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-rose-200 text-rose-600 text-xs flex items-center justify-center mt-0.5 font-bold">
                      {i + 1}
                    </span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>

            {/* 商品開発ヒント */}
            <div className="p-5 rounded-2xl shadow-sm bg-violet-50 border border-violet-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-violet-200 flex items-center justify-center">
                  <Lightbulb size={12} className="text-violet-600" />
                </div>
                <h2 className="text-sm font-bold text-violet-600">プロダクト改善のヒント</h2>
              </div>
              <ul className="space-y-2.5">
                {insight.productHints.map((hint, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="shrink-0 mt-0.5 text-violet-400">
                      <ChevronRight size={14} />
                    </span>
                    {hint}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* アクション */}
          <div className="p-5 rounded-2xl shadow-sm bg-white border border-pink-100">
            <div className="flex items-center gap-2 mb-3">
              <Users size={15} style={{ color: '#ff6b9d' }} />
              <h2 className="text-sm font-bold text-gray-700">次のアクション</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => router.push(`/dashboard?q=${encodeURIComponent(keyword)}`)}
                className="p-3 rounded-xl text-left text-sm transition-all hover:shadow-md"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,107,157,0.07), rgba(192,132,252,0.07))',
                  border: '1px solid rgba(255,107,157,0.2)',
                }}
              >
                <p className="font-semibold text-gray-700 mb-1">📊 キーワード分析</p>
                <p className="text-xs text-gray-500">「{keyword}」の傾向をグラフで確認する</p>
              </button>
              <button
                onClick={() => router.push(backHref)}
                className="p-3 rounded-xl text-left text-sm transition-all hover:shadow-md"
                style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}
              >
                <p className="font-semibold text-gray-700 mb-1">🔍 発話を再絞り込み</p>
                <p className="text-xs text-gray-500">グルーピングや属性で発話を絞り込む</p>
              </button>
              <button
                onClick={() => router.push('/search')}
                className="p-3 rounded-xl text-left text-sm transition-all hover:shadow-md"
                style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}
              >
                <p className="font-semibold text-gray-700 mb-1">🏠 新しい検索</p>
                <p className="text-xs text-gray-500">別のキーワードで新規検索する</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !insight && !error && (
        <div className="text-center py-20 text-gray-400">
          <Sparkles size={40} className="mx-auto mb-3 opacity-30" />
          <p>発話が選択されていません</p>
          <button
            onClick={() => router.push(backHref)}
            className="mt-4 text-sm underline hover:text-gray-600 transition-colors"
          >
            検索結果に戻る
          </button>
        </div>
      )}
    </div>
  )
}

export default function InsightsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20">
        <div className="loading-spinner" />
      </div>
    }>
      <InsightsContent />
    </Suspense>
  )
}
