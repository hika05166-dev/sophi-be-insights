'use client'

import { TrendingUp, Search } from 'lucide-react'
import type { TrendTopic } from '@/types'

interface TrendSectionProps {
  userTrends: TrendTopic[]
  searchTrends: TrendTopic[]
  onKeywordClick: (keyword: string) => void
}

const RANK_COLORS = ['#ff6b9d', '#c084fc', '#818cf8', '#9ca3af', '#9ca3af']

const KEYWORD_COLORS = [
  { bg: 'rgba(255, 107, 157, 0.12)', text: '#e8005a', border: 'rgba(255, 107, 157, 0.3)' },
  { bg: 'rgba(192, 132, 252, 0.12)', text: '#7700e8', border: 'rgba(192, 132, 252, 0.3)' },
  { bg: 'rgba(129, 140, 248, 0.12)', text: '#4338ca', border: 'rgba(129, 140, 248, 0.3)' },
  { bg: 'rgba(56, 189, 248, 0.12)', text: '#0284c7', border: 'rgba(56, 189, 248, 0.3)' },
]

function TrendList({
  topics,
  onKeywordClick,
  icon: Icon,
  title,
  description,
}: {
  topics: TrendTopic[]
  onKeywordClick: (keyword: string) => void
  icon: typeof TrendingUp
  title: string
  description: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={18} style={{ color: '#ff6b9d' }} />
        <h2 className="font-semibold text-gray-800">{title}</h2>
      </div>
      <p className="text-xs text-gray-400 mb-4">{description}</p>

      <div className="space-y-1">
        {topics.map((topic, i) => {
          const rankColor = RANK_COLORS[Math.min(i, RANK_COLORS.length - 1)]
          const kwColor = KEYWORD_COLORS[i % KEYWORD_COLORS.length]
          return (
            <button
              key={topic.keyword}
              onClick={() => onKeywordClick(topic.keyword)}
              className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-pink-50 transition-all group"
            >
              <span
                className="text-xs font-bold w-5 shrink-0 mt-0.5 text-center"
                style={{ color: rankColor }}
              >
                {i + 1}
              </span>
              <span className="flex-1 min-w-0">
                {topic.sample ? (
                  <span className="text-sm text-gray-700 group-hover:text-pink-700 transition-colors leading-snug line-clamp-2">
                    {topic.sample}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-gray-700 group-hover:text-pink-700 transition-colors">
                    {topic.keyword}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2 shrink-0 mt-0.5">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: kwColor.bg, color: kwColor.text, border: `1px solid ${kwColor.border}` }}
                >
                  {topic.keyword}
                </span>
                <span className="text-xs text-gray-400 w-8 text-right">{topic.count}件</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function TrendSection({ userTrends, searchTrends, onKeywordClick }: TrendSectionProps) {
  return (
    <div>
      <h2 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">トレンド</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <TrendList
          topics={userTrends}
          onKeywordClick={onKeywordClick}
          icon={TrendingUp}
          title="ユーザーのトレンド"
          description="よく話されているトピックTOP10"
        />
        <TrendList
          topics={searchTrends}
          onKeywordClick={onKeywordClick}
          icon={Search}
          title="検索トレンド"
          description="社内でよく検索されているキーワードTOP10"
        />
      </div>
    </div>
  )
}
