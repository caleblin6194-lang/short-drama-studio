'use client'

import { useState } from 'react'
import type { Shot, VideoModelOption } from '@/types'
import { VIDEO_MODEL_META, recommendVideoModel } from '@/types'
import PipelineIndicator from './PipelineIndicator'

interface ShotCardProps {
  shot: Shot
  index: number
  onReshoot: (shotId: string, instruction: string, model?: VideoModelOption) => Promise<void>
  onDialogueChange: (shotId: string, dialogue: string) => void
  onModelChange: (shotId: string, model: VideoModelOption) => void
}

const MODEL_OPTIONS: VideoModelOption[] = ['auto', 'seedance-1-0-fast', 'seedance-1-0-pro', 'seedance-1-5-pro', 'seedance-2-0']

type PreviewType = 'image' | 'video' | 'audio' | null

export default function ShotCard({ shot, index, onReshoot, onDialogueChange, onModelChange }: ShotCardProps) {
  const [isReshooting, setIsReshooting] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [previewType, setPreviewType] = useState<PreviewType>(null)
  const allDone = shot.pipeline.image.status === 'done' && shot.pipeline.video.status === 'done' && shot.pipeline.audio.status === 'done'
  const isRendering = shot.pipeline.image.status === 'rendering' || shot.pipeline.video.status === 'rendering' || shot.pipeline.audio.status === 'rendering'

  const recommended = recommendVideoModel(shot)
  const currentModel = shot.videoModel || 'auto'

  const handleReshoot = async () => {
    if (!customPrompt.trim()) return
    setIsReshooting(true)
    await onReshoot(shot.id, customPrompt, currentModel !== 'auto' ? currentModel : undefined)
    setIsReshooting(false)
    setCustomPrompt('')
  }

  return (
    <>
      <div className={`card p-4 transition-all ${allDone ? 'border-emerald-500/30' : ''} ${isRendering ? 'border-yellow-500/30' : ''}`}>
        <div className="flex items-start gap-4">
          {/* 镜号 */}
          <div className="w-10 h-10 rounded-lg bg-[#1a1a2e] flex items-center justify-center text-sm font-bold text-[#6c5ce7] shrink-0">
            {index + 1}
          </div>

          {/* 内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#a0a0b8]">{shot.sceneRef} · {shot.durationSec}s</span>
              <div className="flex items-center gap-2">
                {recommended !== 'auto' && currentModel === 'auto' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#6c5ce7]/20 text-[#6c5ce7]">推荐 {VIDEO_MODEL_META[recommended].label}</span>
                )}
                <select
                  value={currentModel}
                  onChange={e => onModelChange(shot.id, e.target.value as VideoModelOption)}
                  disabled={isRendering}
                  className="bg-[#1a1a2e] border border-[#2a2a3e] text-[10px] text-[#a0a0b8] rounded px-1 py-0.5 cursor-pointer"
                >
                  {MODEL_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>
                      {VIDEO_MODEL_META[opt].label} {opt === recommended ? '(推荐)' : ''}
                    </option>
                  ))}
                </select>
                <PipelineIndicator pipeline={shot.pipeline} />
              </div>
            </div>

            <p className="text-sm text-white mb-1">{shot.description}</p>

            {shot.dialogue && (
              <p className="text-xs text-[#a0a0b8] italic mb-2">&ldquo;{shot.dialogue}&rdquo;</p>
            )}

            {/* 预览区 — 点击直接预览，不跳下载 */}
            <div className="flex gap-2 mt-2">
              {shot.imageUrl && (
                <button
                  onClick={() => setPreviewType('image')}
                  className="relative group hover:ring-1 hover:ring-[#6c5ce7] rounded transition-all"
                >
                  <img src={shot.imageUrl} alt="预览" className="w-16 h-9 rounded border border-[#2a2a3e] object-cover pointer-events-none" />
                  <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] bg-black/60 text-white py-0.5 rounded-b pointer-events-none">图</span>
                </button>
              )}
              {shot.videoUrl && (
                <button
                  onClick={() => setPreviewType('video')}
                  className="relative group hover:ring-1 hover:ring-[#6c5ce7] rounded transition-all"
                >
                  <video src={shot.videoUrl} className="w-16 h-9 rounded border border-[#2a2a3e] object-cover pointer-events-none" />
                  <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] bg-black/60 text-white py-0.5 rounded-b pointer-events-none">视</span>
                </button>
              )}
              {shot.pipeline.audio.audioUrl && (
                <button
                  onClick={() => setPreviewType('audio')}
                  className="relative group flex items-center gap-1 px-2 py-1 rounded border border-[#2a2a3e] hover:border-[#6c5ce7] transition-colors"
                >
                  <span className="text-xs text-[#a0a0b8]">🎵</span>
                  <audio src={shot.pipeline.audio.audioUrl} controls className="h-5 w-20" />
                </button>
              )}
            </div>

            {/* 一句话改镜 + 重新生成 */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="输入提示词，重新生成这个镜头..."
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !isReshooting) handleReshoot() }}
                className="flex-1 bg-[#1a1a2e] border border-[#2a2a3e] rounded px-3 py-1.5 text-xs text-white placeholder-[#666] focus:border-[#6c5ce7] focus:outline-none"
              />
              <button
                onClick={handleReshoot}
                disabled={isReshooting || !customPrompt.trim()}
                className="px-3 py-1.5 bg-[#6c5ce7] text-white text-xs rounded disabled:opacity-40 hover:bg-[#5a4bc7] transition-colors"
              >
                {isReshooting ? '生成中...' : '重新生成'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 预览弹窗 */}
      {previewType && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewType(null)}
        >
          <div
            className="relative max-w-md w-full bg-[#1a1a2e] rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setPreviewType(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
            >
              ✕
            </button>

            {previewType === 'image' && shot.imageUrl && (
              <img src={shot.imageUrl} alt="预览" className="w-full" />
            )}
            {previewType === 'video' && shot.videoUrl && (
              <video src={shot.videoUrl} controls autoPlay className="w-full" />
            )}
            {previewType === 'audio' && shot.pipeline.audio.audioUrl && (
              <div className="p-6 flex flex-col items-center gap-4">
                <span className="text-4xl">🎵</span>
                <audio src={shot.pipeline.audio.audioUrl} controls autoPlay className="w-full" />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}