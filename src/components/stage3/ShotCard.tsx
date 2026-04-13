'use client'

import { useState } from 'react'
import type { Shot } from '@/types'
import PipelineIndicator from './PipelineIndicator'
import OneLineEdit from './OneLineEdit'

interface ShotCardProps {
  shot: Shot
  index: number
  onReshoot: (shotId: string, instruction: string) => Promise<void>
  onDialogueChange: (shotId: string, dialogue: string) => void
}

export default function ShotCard({ shot, index, onReshoot, onDialogueChange }: ShotCardProps) {
  const [isReshooting, setIsReshooting] = useState(false)
  const allDone = shot.pipeline.image.status === 'done' && shot.pipeline.video.status === 'done' && shot.pipeline.audio.status === 'done'

  const handleReshoot = async (instruction: string) => {
    setIsReshooting(true)
    await onReshoot(shot.id, instruction)
    setIsReshooting(false)
  }

  return (
    <div className={`card p-4 transition-all ${allDone ? 'border-emerald-500/30' : ''}`}>
      <div className="flex items-start gap-4">
        {/* 镜号 */}
        <div className="w-10 h-10 rounded-lg bg-[#1a1a2e] flex items-center justify-center text-sm font-bold text-[#6c5ce7] shrink-0">
          {index + 1}
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#a0a0b8]">{shot.sceneRef} · {shot.durationSec}s</span>
            <PipelineIndicator pipeline={shot.pipeline} />
          </div>

          <p className="text-sm text-white mb-1">{shot.description}</p>

          {shot.dialogue && (
            <p className="text-xs text-[#a0a0b8] italic mb-2">&ldquo;{shot.dialogue}&rdquo;</p>
          )}

          {/* 一句话改镜 */}
          {allDone && (
            <OneLineEdit onSubmit={handleReshoot} loading={isReshooting} />
          )}
        </div>
      </div>
    </div>
  )
}
