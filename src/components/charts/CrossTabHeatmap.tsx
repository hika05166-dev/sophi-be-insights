'use client'

import type { CrossTabCell } from '@/types'

interface CrossTabHeatmapProps {
  data: CrossTabCell[]
  rows: string[]
  cols: string[]
}

const ROW_COLORS: Record<string, string> = {
  '10代':   '#60a5fa',
  '20代':   '#818cf8',
  '30代':   '#c084fc',
  '40代〜': '#f472b6',
  '生理管理': '#ff6b9d',
  '妊活':     '#fb923c',
  '月経期': '#ff6b9d',
  '卵胞期': '#c084fc',
  '排卵期': '#818cf8',
  '黄体期': '#f472b6',
}
const DEFAULT_COLOR = '#94a3b8'

function pct(n: number, total: number) {
  return total === 0 ? 0 : (n / total) * 100
}

function fmt(p: number) {
  return p < 0.1 ? '< 0.1%' : `${p.toFixed(1)}%`
}

export default function CrossTabHeatmap({ data, rows, cols }: CrossTabHeatmapProps) {
  const getCell = (row: string, col: string) =>
    data.find(d => d.row === row && d.col === col)?.count ?? 0

  const rowTotals = rows.map(r => cols.reduce((s, c) => s + getCell(r, c), 0))
  const colTotals = cols.map(c => rows.reduce((s, r) => s + getCell(r, c), 0))
  const grandTotal = rowTotals.reduce((s, v) => s + v, 0)

  // 全体比の最大値（色の基準）
  const maxPct = grandTotal === 0 ? 1 : Math.max(
    ...rows.flatMap(r => cols.map(c => pct(getCell(r, c), grandTotal)))
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-separate border-spacing-1 min-w-[360px]">
        <thead>
          <tr>
            <th className="w-20" />
            {cols.map(col => (
              <th key={col} className="text-center font-medium text-muted-foreground pb-1 px-1 whitespace-nowrap">
                {col}
              </th>
            ))}
            <th className="text-center font-medium text-muted-foreground pb-1 px-1 whitespace-nowrap">合計</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => {
            const color = ROW_COLORS[row] ?? DEFAULT_COLOR
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
                  const cellPct = pct(count, grandTotal)
                  // 全体比ベースで opacity を決定
                  const opacity = count === 0 ? 0 : Math.min(0.92, 0.1 + (cellPct / maxPct) * 0.82)
                  const isLight = opacity < 0.55
                  return (
                    <td
                      key={col}
                      className="text-center rounded py-2 px-1 cursor-default transition-all"
                      style={{
                        background: count === 0
                          ? '#f3f4f6'
                          : `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
                        color: isLight ? '#374151' : 'white',
                        border: '1px solid rgba(0,0,0,0.04)',
                        minWidth: '3rem',
                      }}
                      title={`${row} × ${col}: ${count}件 (全体の${fmt(cellPct)})`}
                    >
                      {count > 0 ? (
                        <span className="flex flex-col leading-tight items-center">
                          <span className="font-bold text-sm">{fmt(cellPct)}</span>
                          <span className="text-[9px] opacity-60">{count}件</span>
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  )
                })}
                <td className="text-center pl-1 whitespace-nowrap">
                  <span className="flex flex-col items-center leading-tight">
                    <span className="font-semibold text-foreground">{fmt(pct(rowTotals[ri], grandTotal))}</span>
                    <span className="text-[9px] text-muted-foreground">{rowTotals[ri]}件</span>
                  </span>
                </td>
              </tr>
            )
          })}
          <tr className="border-t">
            <td className="text-right font-medium text-muted-foreground pr-2 py-1.5">合計</td>
            {colTotals.map((t, i) => (
              <td key={i} className="text-center py-1.5">
                <span className="flex flex-col items-center leading-tight">
                  <span className="font-semibold text-foreground">{fmt(pct(t, grandTotal))}</span>
                  <span className="text-[9px] text-muted-foreground">{t}件</span>
                </span>
              </td>
            ))}
            <td className="text-center font-bold text-foreground py-1.5">{grandTotal}件</td>
          </tr>
        </tbody>
      </table>
      <p className="text-[10px] text-muted-foreground mt-2 text-right">
        ※ セル内の数値はキーワードに関する発話全体に占める割合
      </p>
    </div>
  )
}
