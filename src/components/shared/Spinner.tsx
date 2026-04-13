'use client'

interface SpinnerProps {
  size?: number
  className?: string
  label?: string
}

export default function Spinner({ size = 24, className = '', label }: SpinnerProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg className="animate-spin text-[#6c5ce7]" width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {label && <span className="text-sm text-[#a0a0b8]">{label}</span>}
    </div>
  )
}
