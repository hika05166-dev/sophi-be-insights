'use client'

import type { HeatmapCell } from '@/types'

interface HeatmapChartProps {
  data: HeatmapCell[]
}

const PHASES = ['月経期', '卵胞期', '排卵期', '黄体期'] as const
const DAYS = ['月', '火', '水', '木', '金', '土', '日'] as const

const PHASE_COLORS: Record<string, string> = {
  '月経期': '#ff6b9d',
  '卵胞期': '#c084fc',
  '排卵期': '#818cf8',
  '黄体期': '#f472b6',
}

function getOpacity(value: number, max: number): number {
  if (max === 0) return 0
  return Math.min(0.9, 0.05 + (value / max) * 0.85)
}

export default function HeatmapChart({ data }: HeatmapChartProps) {
  const max = Math.max(...data.map(d => d.count), 1)

  const getCell = (phase: string, day: string): HeatmapCell => {
    return data.find(d => d.phase === phase && d.day === day) || { phase: phase as typeof PHASES[number], day, count: 0 }
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[480px]">
        {/* ヘッダー: 曜日 */}
        <div className="flex mb-1 ml-20">
          {DAYS.map(day => (
            <div key={day} className="flex-1 text-center text-xs text-gray-400 font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* ヒートマップ本体 */}
        <div className="space-y-1.5">
          {PHASES.map(phase => (
            <div key={phase} className="flex items-center gap-2">
              {/* フェーズラベル */}
              <div className="w-16 text-right text-xs text-gray-500 font-medium shrink-0">
                <span className="flex items-center justify-end gap-1">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: PHASE_COLORS[phase] }}
                  />
                  {phase}
                </span>
              </div>

              {/* セル */}
              <div className="flex flex-1 gap-1">
                {DAYS.map(day => {
                  const cell = getCell(phase, day)
                  const opacity = getOpacity(cell.count, max)
                  const color = PHASE_COLORS[phase]

                  return (
                    <div
                      key={day}
                      className="flex-1 aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all cursor-default"
                      style={{
                        background: cell.count === 0
                          ? '#f9fafb'
                          : `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
                        color: opacity > 0.5 ? 'white' : '#6b7280',
                        border: '1px solid rgba(0,0,0,0.04)',
                      }}
                      title={`${phase} × ${day}曜日: ${cell.count}件`}
                    >
                      {cell.count > 0 ? cell.count : ''}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 凡例 */}
        <div className="flex items-center justify-end gap-2 mt-3">
          <span className="text-xs text-gray-400">少ない</span>
          {[0.05, 0.25, 0.5, 0.75, 0.95].map((op, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded"
              style={{
                background: `#ff6b9d${Math.round(op * 255).toString(16).padStart(2, '0')}`,
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
