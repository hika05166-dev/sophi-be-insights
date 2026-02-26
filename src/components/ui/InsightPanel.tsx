'use client'

import { Sparkles, AlertCircle, Lightbulb, TrendingUp } from 'lucide-react'
import type { Insight } from '@/types'

interface InsightPanelProps {
  insight: Insight | null
  isLoading: boolean
  isAiGenerated: boolean
  onGenerate: () => void
}

export default function InsightPanel({
  insight,
  isLoading,
  isAiGenerated,
  onGenerate,
}: InsightPanelProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} style={{ color: '#ff6b9d' }} />
          <h2 className="font-semibold text-gray-700 text-sm">インサイト生成中...</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!insight) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} style={{ color: '#ff6b9d' }} />
          <h2 className="font-semibold text-gray-700 text-sm">インサイト</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(255, 107, 157, 0.1), rgba(192, 132, 252, 0.1))' }}>
            <Sparkles size={28} style={{ color: '#c084fc' }} />
          </div>
          <p className="text-sm text-gray-500 mb-4">
            このユーザーの会話から<br />
            インサイトを自動生成できます
          </p>
          <button
            onClick={onGenerate}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
            style={{
              background: 'linear-gradient(135deg, #ff6b9d, #c084fc)',
              boxShadow: '0 4px 15px rgba(255, 107, 157, 0.25)',
            }}
          >
            インサイトを生成する
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-5 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: '#ff6b9d' }} />
          <h2 className="font-semibold text-gray-700 text-sm">インサイト</h2>
        </div>
        {isAiGenerated ? (
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(192, 132, 252, 0.12)', color: '#7700e8' }}>
            AI生成
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            サンプル
          </span>
        )}
      </div>

      {/* サマリー */}
      <div className="p-3 rounded-xl"
        style={{ background: 'linear-gradient(135deg, rgba(255, 107, 157, 0.06), rgba(192, 132, 252, 0.06))' }}>
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">主な悩み・関心事</h3>
        <p className="text-sm text-gray-700 leading-relaxed">{insight.summary}</p>
      </div>

      {/* 感情の変化 */}
      <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp size={13} className="text-amber-500" />
          <h3 className="text-xs font-semibold text-amber-600">感情の変化</h3>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{insight.emotionTrend}</p>
      </div>

      {/* 未解決の課題 */}
      <div className="p-3 rounded-xl bg-red-50 border border-red-100">
        <div className="flex items-center gap-1.5 mb-2">
          <AlertCircle size={13} className="text-red-400" />
          <h3 className="text-xs font-semibold text-red-500">未解決の課題・潜在ニーズ</h3>
        </div>
        <ul className="space-y-1">
          {insight.unresolvedIssues.map((issue, i) => (
            <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
              <span className="text-red-300 shrink-0 mt-0.5">•</span>
              {issue}
            </li>
          ))}
        </ul>
      </div>

      {/* 商品開発ヒント */}
      <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
        <div className="flex items-center gap-1.5 mb-2">
          <Lightbulb size={13} className="text-purple-400" />
          <h3 className="text-xs font-semibold text-purple-600">商品開発へのヒント</h3>
        </div>
        <ul className="space-y-1">
          {insight.productHints.map((hint, i) => (
            <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
              <span className="text-purple-300 shrink-0 mt-0.5">•</span>
              {hint}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onGenerate}
        className="w-full text-xs text-gray-400 hover:text-pink-500 transition-colors text-center py-1"
      >
        再生成する
      </button>
    </div>
  )
}
