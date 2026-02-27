'use client'

import type { CrossTabCell } from '@/types'

interface CrossTabHeatmapProps {
  data: CrossTabCell[]
  rows: string[]
  cols: string[]
  color?: string
}

function getOpacity(value: number, max: number): number {
  if (max === 0 || value === 0) return 0
  return Math.min(0.92, 0.12 + (value / max) * 0.8)
}

export default function CrossTabHeatmap({ data, rows, cols, color = '#18181b' }: CrossTabHeatmapProps) {
  const getCell = (row: string, col: string) =>
    data.find(d => d.row === row && d.col === col)?.count ?? 0

  const max = Math.max(...data.map(d => d.count), 1)

  // 行合計・列合計
  const rowTotals = rows.map(r => cols.reduce((s, c) => s + getCell(r, c), 0))
  const colTotals = cols.map(c => rows.reduce((s, r) => s + getCell(r, c), 0))
  const grandTotal = rowTotals.reduce((s, v) => s + v, 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-separate border-spacing-1 min-w-[360px]">
        <thead>
          <tr>
            <th className="w-20" />
            {cols.map(col => (
              <th key={col} className="text-center font-medium text-muted-foreground pb-1 px-1">
                {col}
              </th>
            ))}
            <th className="text-center font-medium text-muted-foreground pb-1 px-1">合計</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row}>
              <td className="text-right font-medium text-muted-foreground pr-2 py-0.5 whitespace-nowrap">
                {row}
              </td>
              {cols.map(col => {
                const count = getCell(row, col)
                const opacity = getOpacity(count, max)
                return (
                  <td
                    key={col}
                    className="text-center rounded py-1.5 px-1 cursor-default transition-all"
                    style={{
                      background: count === 0
                        ? '#f3f4f6'
                        : `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
                      color: opacity > 0.55 ? 'white' : '#374151',
                      border: '1px solid rgba(0,0,0,0.04)',
                      minWidth: '2.5rem',
                    }}
                    title={`${row} × ${col}: ${count}件`}
                  >
                    {count > 0 ? count : ''}
                  </td>
                )
              })}
              <td className="text-center font-semibold text-foreground pl-1">
                {rowTotals[ri]}
              </td>
            </tr>
          ))}
          <tr className="border-t">
            <td className="text-right font-medium text-muted-foreground pr-2 py-1">合計</td>
            {colTotals.map((t, i) => (
              <td key={i} className="text-center font-semibold text-foreground">{t}</td>
            ))}
            <td className="text-center font-bold text-foreground">{grandTotal}</td>
          </tr>
        </tbody>
      </table>

      <div className="flex items-center justify-end gap-2 mt-3">
        <span className="text-xs text-gray-400">少ない</span>
        {[0.12, 0.35, 0.55, 0.75, 0.92].map((op, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-sm"
            style={{
              background: `${color}${Math.round(op * 255).toString(16).padStart(2, '0')}`,
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          />
        ))}
        <span className="text-xs text-gray-400">多い</span>
      </div>
    </div>
  )
}
