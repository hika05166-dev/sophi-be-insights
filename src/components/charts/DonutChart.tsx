'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface DonutChartProps {
  data: { name: string; value: number }[]
  colors: string[]
}

const RADIAN = Math.PI / 180

function renderCustomizedLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
}) {
  if (percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function DonutChart({ data, colors }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        データがありません
      </div>
    )
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={renderCustomizedLabel}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value}件`, '']}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #ffc2d8',
              fontSize: '12px',
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ fontSize: '12px', color: '#4b5563' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* 中央に合計 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center" style={{ marginTop: '-16px' }}>
          <p className="text-xl font-bold text-gray-700">{total}</p>
          <p className="text-xs text-gray-400">件</p>
        </div>
      </div>
    </div>
  )
}
