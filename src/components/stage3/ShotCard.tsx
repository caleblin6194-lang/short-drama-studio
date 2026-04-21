'use client'

import { useState } from 'react'
import type { Shot, VideoModelOption } from '@/types'
import { VIDEO_MODEL_META, recommendVideoModel } from '@/types'
import PipelineIndicator from './PipelineIndicator'

interface ShotCardProps {
  shot: Shot
  index: number
  onShoot?: (shotId: string) => Promise<void>
  onReshoot: (shotId: string, instruction: string, model?: VideoModelOption) => Promise<void>
  onModelChange: (shotId: string, model: VideoModelOption) => void
  onDelete?: (shotId: string) => void
  onInsertAfter?: (shotId: string) => void
  narrationMode?: boolean
  onNarrationChange?: (shotId: string, text: string) => void
}

const MODEL_OPTIONS: VideoModelOption[] = ['auto', 'seedance-1-0-fast', 'seedance-1-0-pro', 'seedance-1-5-pro', 'seedance-2-0']

type PreviewType = 'image' | 'video' | 'audio' | null

export default function ShotCard({ shot, index, onShoot, onReshoot, onModelChange, onDelete, onInsertAfter, narrationMode, onNarrationChange }: ShotCardProps) {
  const [isReshooting, setIsReshooting] = useState(false)
  const [isShooting, setIsShooting] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [previewType, setPreviewType] = useState<PreviewType>(null)
  const allDone = shot.pipeline.image.status === 'done' && shot.pipeline.video.status === 'done' && shot.pipeline.audio.status === 'done'
  const isRendering = shot.pipeline.image.status === 'rendering' || shot.pipeline.video.status === 'rendering' || shot.pipeline.audio.status === 'rendering'

  const recommended = recommendVideoModel(shot)
  const currentModel = shot.videoModel || 'auto'
  const needsShoot = !shot.imageUrl && shot.pipeline.image.status === 'pending'

  const handleShoot = async () => {
    if (!onShoot || isShooting || allDone) return
    setIsShooting(true)
    await onShoot(shot.id)
    setIsShooting(false)
  }

  const handleReshoot = async (prompt?: string) => {
    setIsReshooting(true)
    await onReshoot(shot.id, prompt ?? customPrompt ?? shot.description, currentModel !== 'auto' ? currentModel : undefined)
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
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-[#a0a0b8]">{shot.sceneRef} · {shot.durationSec}s</span>
                {shot.shotType && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#2a2a3e] text-[#a0a0b8]">
                    {({ extreme_wide: '极远', wide: '全', medium: '中', close: '近', extreme_close: '特写' } as Record<string,string>)[shot.shotType] ?? shot.shotType}
                  </span>
                )}
                {shot.emotionTag && shot.emotionTag !== 'neutral' && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${{
                    angry: 'bg-red-500/20 text-red-400',
                    sad: 'bg-blue-500/20 text-blue-400',
                    happy: 'bg-green-500/20 text-green-400',
                    tense: 'bg-yellow-500/20 text-yellow-400',
                    surprised: 'bg-purple-500/20 text-purple-400',
                  }[shot.emotionTag] ?? 'bg-gray-500/20 text-gray-400'}`}>
                    {({ angry: '愤怒', sad: '悲伤', happy: '欢快', tense: '紧张', surprised: '惊讶' } as Record<string,string>)[shot.emotionTag]}
                  </span>
                )}
                {shot.episodeId && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#2a2a3e] text-[#a0a0b8]">
                    E{shot.episodeId.slice(-1)}
                  </span>
                )}
                {shot.transitionIn && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#6c5ce7]/20 text-[#6c5ce7]" title={`转场: ${shot.transitionIn}`}>
                    ⟩ {shot.transitionIn}
                  </span>
                )}
              </div>
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
                {needsShoot && onShoot && (
                  <button
                    onClick={handleShoot}
                    disabled={isShooting}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded disabled:opacity-40 transition-colors"
                  >
                    {isShooting ? '生成中...' : '生成'}
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => { if (confirm(`删除第 ${index + 1} 个镜头？`)) onDelete(shot.id) }}
                    title="删除镜头"
                    className="w-6 h-6 flex items-center justify-center rounded text-[#666] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    🗑
                  </button>
                )}
              </div>
            </div>

            <p className="text-sm text-white mb-1">{shot.description}</p>

            {shot.dialogue && !narrationMode && (
              <p className="text-xs text-[#a0a0b8] italic mb-2">&ldquo;{shot.dialogue}&rdquo;</p>
            )}

            {narrationMode && (
              <div className="mt-1 mb-2">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">旁白</span>
                </div>
                <textarea
                  rows={2}
                  value={shot.narration ?? ''}
                  onChange={e => onNarrationChange?.(shot.id, e.target.value)}
                  placeholder="输入旁白文案（第三人称叙述，将用于配音）..."
                  className="w-full bg-[#12121e] border border-amber-500/30 rounded px-2 py-1.5 text-xs text-white placeholder-[#555] focus:border-amber-400/60 focus:outline-none resize-none"
                />
              </div>
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
                placeholder="可选：输入修改意图，留空则直接重拍..."
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !isReshooting) handleReshoot() }}
                className="flex-1 bg-[#1a1a2e] border border-[#2a2a3e] rounded px-3 py-1.5 text-xs text-white placeholder-[#666] focus:border-[#6c5ce7] focus:outline-none"
              />
              <button
                onClick={() => handleReshoot()}
                disabled={isReshooting}
                className="px-3 py-1.5 bg-[#6c5ce7] text-white text-xs rounded disabled:opacity-40 hover:bg-[#5a4bc7] transition-colors whitespace-nowrap"
              >
                {isReshooting ? '生成中...' : allDone ? '不满意，重拍' : '重新生成'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 在此镜头后插入 */}
      {onInsertAfter && (
        <div className="group flex items-center gap-2 py-1 cursor-pointer" onClick={() => onInsertAfter(shot.id)}>
          <div className="flex-1 h-px bg-[#2a2a3e] group-hover:bg-[#6c5ce7]/40 transition-colors" />
          <span className="text-[11px] text-[#444] group-hover:text-[#6c5ce7] transition-colors select-none whitespace-nowrap">＋ 插入镜头</span>
          <div className="flex-1 h-px bg-[#2a2a3e] group-hover:bg-[#6c5ce7]/40 transition-colors" />
        </div>
      )}

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