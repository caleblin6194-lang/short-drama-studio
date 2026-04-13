'use client'

import type { ShotPipeline } from '@/types'

const STAGES = [
  { key: 'image' as const, label: '图', color: '#0984e3' },
  { key: 'video' as const, label: '视', color: '#6c5ce7' },
  { key: 'audio' as const, label: '音', color: '#00b894' },
]

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-[#2a2a3e] text-[#a0a0b8]/50',
  rendering: 'animate-pulse',
  done: '',
  failed: 'bg-red-500/20 text-red-400',
}

export default function PipelineIndicator({ pipeline }: { pipeline: ShotPipeline }) {
  return (
    <div className="flex items-center gap-1.5">
      {STAGES.map(s => {
        const stage = pipeline[s.key]
        const isDone = stage.status === 'done'
        const isRendering = stage.status === 'rendering'

        return (
          <div
            key={s.key}
            className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold transition-all ${STATUS_STYLE[stage.status]}`}
            style={isDone ? { backgroundColor: s.color + '33', color: s.color } : isRendering ? { backgroundColor: s.color + '20', color: s.color } : undefined}
            title={`${s.label}: ${stage.status}${stage.modelUsed ? ` (${stage.modelUsed})` : ''}`}
          >
            {s.label}
          </div>
        )
      })}
    </div>
  )
}
