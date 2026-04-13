'use client'

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: '等待中', className: 'bg-gray-500/20 text-gray-400' },
  generating: { label: '生成中', className: 'bg-amber-500/20 text-amber-400 animate-pulse' },
  ready: { label: '就绪', className: 'bg-emerald-500/20 text-emerald-400' },
  failed: { label: '失败', className: 'bg-red-500/20 text-red-400' },
}

export default function AssetStatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || STATUS_MAP.pending
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.className}`}>
      {s.label}
    </span>
  )
}
