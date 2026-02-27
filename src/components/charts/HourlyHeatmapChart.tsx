'use client'

import type { HourlyHeatmapCell } from '@/types'

const DAYS = ['月', '火', '水', '木', '金', '土', '日'] as const
const COLOR = '#3b82f6'

function getOpacity(value: number, max: number): number {
  if (max === 0) return 0
  return Math.min(0.9, 0.05 + (value / max) * 0.85)
}

export default function HourlyHeatmapChart({ data }: { data: HourlyHeatmapCell[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getCell = (hour: number, day: string) =>
    data.find(d => d.hour === hour && d.day === day) || { hour, day, count: 0 }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[360px]">
        <div className="flex mb-1 ml-10">
          {DAYS.map(day => (
            <div key={day} className="flex-1 text-center text-xs text-gray-400 font-medium">{day}</div>
          ))}
        </div>

        <div className="space-y-0.5">
          {hours.map(hour => (
            <div key={hour} className="flex items-center gap-1">
              <div className="w-8 text-right text-xs text-gray-400 shrink-0">
                {hour % 6 === 0 ? `${hour}:00` : ''}
              </div>
              <div className="flex flex-1 gap-0.5">
                {DAYS.map(day => {
                  const cell = getCell(hour, day)
                  const opacity = getOpacity(cell.count, max)
                  return (
                    <div
                      key={day}
                      className="flex-1 h-4 rounded-sm cursor-default"
                      style={{
                        background: cell.count === 0
                          ? '#f3f4f6'
                          : `${COLOR}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
                        border: '1px solid rgba(0,0,0,0.04)',
                      }}
                      title={`${hour}:00 ${day}曜日: ${cell.count}件`}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 mt-3">
          <span className="text-xs text-gray-400">少ない</span>
          {[0.05, 0.25, 0.5, 0.75, 0.95].map((op, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-sm"
              style={{
                background: `${COLOR}${Math.round(op * 255).toString(16).padStart(2, '0')}`,
                border: '1px solid rgba(0,0,0,0.04)',
              }}
            />
          ))}
          <span className="text-xs text-gray-400">多い</span>
        </div>
      </div>
    </div>
  )
}
