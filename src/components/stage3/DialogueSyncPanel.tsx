'use client'

import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import type { Shot } from '@/types'
import Button from '@/components/shared/Button'

interface SubtitleBlock {
  id: string
  text: string
  startSec: number
  endSec: number
}

export default function DialogueSyncPanel() {
  const { project } = useProjectStore()
  const [syncing, setSyncing] = useState(false)
  const [subtitleBlocks, setSubtitleBlocks] = useState<SubtitleBlock[]>([])
  const [applied, setApplied] = useState(false)

  if (!project) return null

  const shots = project.shots

  const handleAutoSync = async () => {
    setSyncing(true)
    // Mock: generate subtitle blocks from dialogue
    const blocks: SubtitleBlock[] = []
    let currentTime = 0
    const avgShotDuration = 5 // seconds

    shots.forEach((shot) => {
      if (shot.dialogue && shot.dialogue.trim()) {
        // Split dialogue into chunks (roughly 10 chars per second for Chinese)
        const text = shot.dialogue.trim()
        const chunks: string[] = []
        const charsPerSecond = 10
        const maxCharsPerBlock = charsPerSecond * 3 // 3 seconds per block

        for (let i = 0; i < text.length; i += maxCharsPerBlock) {
          chunks.push(text.slice(i, i + maxCharsPerBlock))
        }

        chunks.forEach((chunk, chunkIndex) => {
          const start = currentTime + chunkIndex * 3
          const end = start + 3
          blocks.push({
            id: `sub-${shot.id}-${chunkIndex}`,
            text: chunk,
            startSec: start,
            endSec: end,
          })
        })
        currentTime += chunks.length * 3 + avgShotDuration
      } else {
        currentTime += avgShotDuration
      }
    })

    setSubtitleBlocks(blocks)
    setSyncing(false)
  }

  const handleApplyToShots = () => {
    setApplied(true)
  }

  return (
    <div className="card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-1">🎙️ 对话智能对齐</h3>
        <p className="text-xs text-[#6a6a8e]">
          AI 自动分析对话内容，生成精确字幕时间轴
        </p>
      </div>

      {shots.length === 0 && (
        <div className="text-center py-4 text-[#6a6a8e] text-sm">
          暂无镜头，请先生成镜头
        </div>
      )}

      {shots.length > 0 && subtitleBlocks.length === 0 && !syncing && !applied && (
        <Button onClick={handleAutoSync} variant="primary" className="w-full">
          一键自动对齐
        </Button>
      )}

      {syncing && (
        <div className="text-center py-4 text-[#6c5ce7] text-sm">
          AI 正在分析对话内容...
        </div>
      )}

      {subtitleBlocks.length > 0 && !applied && (
        <>
          <div className="text-xs text-[#00b894]">
            ✓ 已生成 {subtitleBlocks.length} 条字幕
          </div>

          {/* Subtitle preview */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {subtitleBlocks.slice(0, 6).map((block) => (
              <div
                key={block.id}
                className="flex items-start gap-2 p-2 rounded-lg bg-[#12121e]"
              >
                <span className="text-[10px] text-[#6a6a8e] font-mono whitespace-nowrap">
                  {String(Math.floor(block.startSec / 60)).padStart(2, '0')}:
                  {String(Math.floor(block.startSec % 60)).padStart(2, '0')}
                </span>
                <span className="text-xs text-white flex-1">{block.text}</span>
              </div>
            ))}
            {subtitleBlocks.length > 6 && (
              <div className="text-xs text-[#6a6a8e] text-center">
                ...还有 {subtitleBlocks.length - 6} 条
              </div>
            )}
          </div>

          <Button onClick={handleApplyToShots} variant="primary" className="w-full">
            应用到字幕轨道
          </Button>
        </>
      )}

      {applied && (
        <div className="text-center py-4">
          <div className="text-[#00b894] text-sm mb-2">✓ 字幕时间轴已应用</div>
          <div className="text-xs text-[#6a6a8e]">
            共 {subtitleBlocks.length} 条字幕 · 时长约 {Math.ceil(subtitleBlocks[subtitleBlocks.length - 1]?.endSec || 0)} 秒
          </div>
        </div>
      )}
    </div>
  )
}
