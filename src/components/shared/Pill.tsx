'use client'

interface PillProps {
  label: string
  active?: boolean
  color?: 'purple' | 'green' | 'blue' | 'red' | 'yellow' | 'gray'
  onClick?: () => void
  size?: 'sm' | 'md'
}

const colorMap: Record<string, { active: string; inactive: string }> = {
  purple: { active: 'bg-[#6c5ce7] text-white', inactive: 'bg-[#6c5ce7]/10 text-[#6c5ce7] hover:bg-[#6c5ce7]/20' },
  green: { active: 'bg-emerald-500 text-white', inactive: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' },
  blue: { active: 'bg-blue-500 text-white', inactive: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' },
  red: { active: 'bg-red-500 text-white', inactive: 'bg-red-500/10 text-red-400 hover:bg-red-500/20' },
  yellow: { active: 'bg-amber-500 text-white', inactive: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' },
  gray: { active: 'bg-gray-500 text-white', inactive: 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20' },
}

export default function Pill({ label, active = false, color = 'purple', onClick, size = 'md' }: PillProps) {
  const c = colorMap[color]
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full font-medium transition-all duration-200 cursor-pointer ${sizeClass} ${active ? c.active : c.inactive}`}
    >
      {label}
    </button>
  )
}
