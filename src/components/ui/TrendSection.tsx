'use client'

import { TrendingUp, Search } from 'lucide-react'
import type { TrendTopic } from '@/types'

interface TrendSectionProps {
  userTrends: TrendTopic[]
  searchTrends: TrendTopic[]
  onKeywordClick: (keyword: string) => void
}

const BADGE_COLORS = [
  { bg: 'rgba(255, 107, 157, 0.12)', text: '#e8005a', border: 'rgba(255, 107, 157, 0.3)' },
  { bg: 'rgba(192, 132, 252, 0.12)', text: '#7700e8', border: 'rgba(192, 132, 252, 0.3)' },
  { bg: 'rgba(129, 140, 248, 0.12)', text: '#4338ca', border: 'rgba(129, 140, 248, 0.3)' },
  { bg: 'rgba(56, 189, 248, 0.12)', text: '#0284c7', border: 'rgba(56, 189, 248, 0.3)' },
]

function getBadgeColor(index: number) {
  return BADGE_COLORS[index % BADGE_COLORS.length]
}

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

      {/* タグクラウド風 */}
      <div className="flex flex-wrap gap-2">
        {topics.map((topic, i) => {
          const color = getBadgeColor(i)
          const size = i < 3 ? 'text-sm px-3 py-1.5' : i < 6 ? 'text-xs px-2.5 py-1' : 'text-xs px-2 py-0.5'
          return (
            <button
              key={topic.keyword}
              onClick={() => onKeywordClick(topic.keyword)}
              className={`rounded-full font-medium transition-all hover:shadow-sm hover:scale-105 ${size}`}
              style={{
                background: color.bg,
                color: color.text,
                border: `1px solid ${color.border}`,
              }}
              title={`${topic.count}件`}
            >
              {topic.keyword}
              <span className="ml-1 opacity-60 text-xs">{topic.count}</span>
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
