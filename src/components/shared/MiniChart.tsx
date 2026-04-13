'use client'

interface MiniChartProps {
  data: number[]
  labels?: string[]
  type?: 'line' | 'bar'
  color?: string
  height?: number
  showTooltip?: boolean
}

export default function MiniChart({ data, labels, type = 'line', color = '#6c5ce7', height = 120, showTooltip = true }: MiniChartProps) {
  if (data.length === 0) return null

  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const w = 100
  const h = 100
  const padY = 5

  if (type === 'bar') {
    const barW = w / data.length * 0.7
    const gap = w / data.length * 0.3
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        {data.map((v, i) => {
          const barH = ((v - min) / range) * (h - padY * 2)
          const x = (i / data.length) * w + gap / 2
          return (
            <g key={i}>
              <rect x={x} y={h - padY - barH} width={barW} height={barH} fill={color} opacity={0.7} rx={1}>
                {showTooltip && <title>{labels?.[i] || i}: {v.toLocaleString()}</title>}
              </rect>
            </g>
          )
        })}
      </svg>
    )
  }

  // Line chart
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - padY - ((v - min) / range) * (h - padY * 2)
    return `${x},${y}`
  }).join(' ')

  const areaPoints = `0,${h} ${points} ${w},${h}`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {showTooltip && data.map((v, i) => {
        const x = (i / (data.length - 1)) * w
        const y = h - padY - ((v - min) / range) * (h - padY * 2)
        return (
          <circle key={i} cx={x} cy={y} r="2" fill={color} opacity="0">
            <title>{labels?.[i] || i}: {v.toLocaleString()}</title>
          </circle>
        )
      })}
    </svg>
  )
}
