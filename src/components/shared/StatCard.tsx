'use client'

interface StatCardProps {
  icon: string
  label: string
  value: string | number
  trend?: { value: number; label: string }
  color?: string
}

export default function StatCard({ icon, label, value, trend, color = '#6c5ce7' }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#a0a0b8] mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: color + '20' }}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className={trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-[#a0a0b8]">{trend.label}</span>
        </div>
      )}
    </div>
  )
}
