'use client'

import type { CrossTabCell } from '@/types'

interface CrossTabHeatmapProps {
  data: CrossTabCell[]
  rows: string[]
  cols: string[]
}

const ROW_COLORS: Record<string, string> = {
  // 年代
  '10代':   '#60a5fa',
  '20代':   '#818cf8',
  '30代':   '#c084fc',
  '40代〜': '#f472b6',
  // モード
  '生理管理': '#ff6b9d',
  '妊活':     '#fb923c',
  // 生理周期
  '月経期': '#ff6b9d',
  '卵胞期': '#c084fc',
  '排卵期': '#818cf8',
  '黄体期': '#f472b6',
}
const DEFAULT_COLOR = '#94a3b8'

function getOpacity(value: number, rowMax: number): number {
  if (rowMax === 0 || value === 0) return 0
  return Math.min(0.9, 0.12 + (value / rowMax) * 0.78)
}

export default function CrossTabHeatmap({ data, rows, cols }: CrossTabHeatmapProps) {
  const getCell = (row: string, col: string) =>
    data.find(d => d.row === row && d.col === col)?.count ?? 0

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
          {rows.map((row, ri) => {
            const color = ROW_COLORS[row] ?? DEFAULT_COLOR
            const rowMax = rowTotals[ri]
            return (
              <tr key={row}>
                <td className="text-right font-medium text-muted-foreground pr-2 py-0.5 whitespace-nowrap">
                  <span className="flex items-center justify-end gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    {row}
                  </span>
                </td>
                {cols.map(col => {
                  const count = getCell(row, col)
                  const opacity = getOpacity(count, rowMax)
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
            )
          })}
          <tr className="border-t">
            <td className="text-right font-medium text-muted-foreground pr-2 py-1">合計</td>
            {colTotals.map((t, i) => (
              <td key={i} className="text-center font-semibold text-foreground">{t}</td>
            ))}
            <td className="text-center font-bold text-foreground">{grandTotal}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
