'use client'

import type { DailyUsageStat } from '@/types'
import MiniChart from '@/components/shared/MiniChart'

interface UsageChartProps {
  data: DailyUsageStat[]
  title: string
  field: keyof DailyUsageStat
  color?: string
  type?: 'line' | 'bar'
}

export default function UsageChart({ data, title, field, color = '#6c5ce7', type = 'bar' }: UsageChartProps) {
  const values = data.map(d => d[field] as number)
  const labels = data.map(d => d.date)
  const total = values.reduce((a, b) => a + b, 0)

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[#a0a0b8]">{title}</h3>
        <span className="text-lg font-bold text-white">{total.toLocaleString()}</span>
      </div>
      <MiniChart data={values} labels={labels} type={type} color={color} height={100} />
    </div>
  )
}
