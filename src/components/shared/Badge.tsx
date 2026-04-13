'use client'

const VARIANTS: Record<string, string> = {
  green: 'bg-emerald-500/20 text-emerald-400',
  red: 'bg-red-500/20 text-red-400',
  yellow: 'bg-amber-500/20 text-amber-400',
  blue: 'bg-blue-500/20 text-blue-400',
  purple: 'bg-purple-500/20 text-purple-400',
  gray: 'bg-gray-500/20 text-gray-400',
}

export default function Badge({ children, variant = 'gray' }: { children: React.ReactNode; variant?: keyof typeof VARIANTS }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${VARIANTS[variant] || VARIANTS.gray}`}>
      {children}
    </span>
  )
}
