'use client'

import { Layers, ChevronRight } from 'lucide-react'
import type { Group } from '@/types'

interface GroupingSummaryProps {
  groups: Group[]
  isLoading: boolean
  activeGroupIds: number[]
  onGroupSelect: (ids: number[]) => void
}

const GROUP_COLORS = [
  { bg: '#fff0f5', border: '#ffc2d8', dot: '#ff6b9d', text: '#e8005a' },
  { bg: '#f5f0ff', border: '#d8c2ff', dot: '#c084fc', text: '#7700e8' },
  { bg: '#f0f4ff', border: '#c7d2fe', dot: '#818cf8', text: '#4338ca' },
  { bg: '#f0fdff', border: '#a5f3fc', dot: '#38bdf8', text: '#0284c7' },
  { bg: '#f0fdf4', border: '#bbf7d0', dot: '#4ade80', text: '#15803d' },
]

export default function GroupingSummary({
  groups,
  isLoading,
  activeGroupIds,
  onGroupSelect,
}: GroupingSummaryProps) {
  const handleClick = (group: Group) => {
    const ids = group.utterance_ids
    const isActive = activeGroupIds.length > 0 &&
      ids.every(id => activeGroupIds.includes(id))

    if (isActive) {
      onGroupSelect([])
    } else {
      onGroupSelect(ids)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Layers size={16} style={{ color: '#ff6b9d' }} />
        <h2 className="font-semibold text-gray-700 text-sm">グルーピングサマリー</h2>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">
          グループを生成できませんでした
        </p>
      ) : (
        <div className="space-y-2">
          {groups.map((group, i) => {
            const color = GROUP_COLORS[i % GROUP_COLORS.length]
            const isActive = activeGroupIds.length > 0 &&
              group.utterance_ids.some(id => activeGroupIds.includes(id))

            return (
              <button
                key={group.id}
                onClick={() => handleClick(group)}
                className="w-full text-left p-3 rounded-xl transition-all hover:shadow-sm"
                style={{
                  background: isActive ? color.bg : 'white',
                  border: `1px solid ${isActive ? color.border : '#f3f4f6'}`,
                  transform: isActive ? 'scale(1.01)' : 'scale(1)',
                }}
              >
                <div className="flex items-start gap-2">
                  <div
                    className="w-2 h-2 rounded-full mt-1 shrink-0"
                    style={{ background: color.dot }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-snug line-clamp-3">
                      {group.label}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-medium"
                        style={{ color: color.text }}>
                        {group.count}件
                      </span>
                      {isActive && (
                        <span className="text-xs text-gray-400">フィルター中</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 shrink-0 mt-0.5" />
                </div>
              </button>
            )
          })}

          {activeGroupIds.length > 0 && (
            <button
              onClick={() => onGroupSelect([])}
              className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors"
            >
              フィルターを解除
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3">
        ※ Claude AIによる自動分類（精度は参考程度）
      </p>
    </div>
  )
}
