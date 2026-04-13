'use client'

interface ProgressBarProps {
  value: number // 0-100
  className?: string
  color?: string
  label?: string
}

export default function ProgressBar({ value, className = '', color = '#6c5ce7', label }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={className}>
      {label && <div className="flex justify-between text-xs text-[#a0a0b8] mb-1"><span>{label}</span><span>{Math.round(clamped)}%</span></div>}
      <div className="h-2 rounded-full bg-[#1e1e2e] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
