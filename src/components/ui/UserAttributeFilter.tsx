'use client'

import { Filter } from 'lucide-react'

type FilterType = 'all' | 'detailed' | 'self_solving'

interface UserAttributeFilterProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
}

const FILTERS: { value: FilterType; label: string; description: string; emoji: string }[] = [
  {
    value: 'all',
    label: 'すべて',
    description: '全ての発話を表示',
    emoji: '📋',
  },
  {
    value: 'detailed',
    label: '大きな不を持ち詳細を話している',
    description: '長文で深刻な悩みを相談しているユーザーの発話',
    emoji: '💬',
  },
  {
    value: 'self_solving',
    label: '独自に不を解消している',
    description: '自分なりの対処法や解決策を共有しているユーザーの発話',
    emoji: '💡',
  },
]

export default function UserAttributeFilter({
  activeFilter,
  onFilterChange,
}: UserAttributeFilterProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter size={16} style={{ color: '#ff6b9d' }} />
        <h2 className="font-semibold text-gray-700 text-sm">ユーザー属性フィルター</h2>
      </div>

      <div className="space-y-2">
        {FILTERS.map(filter => {
          const isActive = activeFilter === filter.value
          return (
            <button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              className="w-full text-left p-3 rounded-xl transition-all"
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, rgba(255, 107, 157, 0.1), rgba(192, 132, 252, 0.1))'
                  : 'white',
                border: isActive
                  ? '1.5px solid rgba(255, 107, 157, 0.4)'
                  : '1px solid #f3f4f6',
              }}
            >
              <div className="flex items-start gap-2">
                <span className="text-base shrink-0">{filter.emoji}</span>
                <div>
                  <p className="text-xs font-semibold text-gray-700">{filter.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{filter.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        ※ AI + ヒューリスティックで自動判定
      </p>
    </div>
  )
}
