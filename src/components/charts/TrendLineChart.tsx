'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import type { MonthlyTrend } from '@/types'

interface TrendLineChartProps {
  data: MonthlyTrend[]
}

function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  return `${year}年${parseInt(m)}月`
}

export default function TrendLineChart({ data }: TrendLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        データがありません
      </div>
    )
  }

  const chartData = data.map(d => ({
    month: formatMonth(d.month),
    count: d.count,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ff6b9d" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#ff6b9d" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f9fafb" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          formatter={(value: number) => [`${value}件`, '発話数']}
          contentStyle={{
            borderRadius: '12px',
            border: '1px solid #ffc2d8',
            fontSize: '12px',
            boxShadow: '0 4px 15px rgba(255, 107, 157, 0.1)',
          }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#ff6b9d"
          strokeWidth={2.5}
          fill="url(#trendGradient)"
          dot={{ fill: '#ff6b9d', strokeWidth: 2, r: 4, stroke: 'white' }}
          activeDot={{ r: 6, fill: '#ff6b9d', stroke: 'white', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
