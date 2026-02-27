'use client'

import type { HourlyHeatmapCell } from '@/types'

const COLOR = '#3b82f6'

export default function HourlyHeatmapChart({ data }: { data: HourlyHeatmapCell[] }) {
  // 時間ごとに集計（曜日を無視して合算）
  const hourCounts: Record<number, number> = {}
  for (const d of data) {
    hourCounts[d.hour] = (hourCounts[d.hour] || 0) + d.count
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const max = Math.max(...hours.map(h => hourCounts[h] || 0), 1)

  return (
    <div className="space-y-0.5">
      {hours.map(hour => {
        const count = hourCounts[hour] || 0
        const pct = (count / max) * 100
        return (
          <div key={hour} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-10 text-right shrink-0">
              {hour % 3 === 0 ? `${String(hour).padStart(2, '0')}:00` : ''}
            </span>
            <div className="flex-1 h-4 bg-gray-100 rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm transition-all"
                style={{
                  width: `${pct}%`,
                  background: `${COLOR}cc`,
                }}
              />
            </div>
            <span className="text-xs text-gray-400 w-6 text-right shrink-0">
              {count > 0 ? count : ''}
            </span>
          </div>
        )
      })}

      <div className="flex items-center justify-end gap-2 mt-3">
        <span className="text-xs text-gray-400">発話数</span>
        <div className="w-16 h-3 rounded-sm" style={{ background: `linear-gradient(to right, ${COLOR}22, ${COLOR}cc)` }} />
        <span className="text-xs text-gray-400">多い</span>
      </div>
    </div>
  )
}
