'use client'

import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import type { Episode, EmotionalTone } from '@/types'
import ShotCard from './ShotCard'
import Button from '@/components/shared/Button'
import Spinner from '@/components/shared/Spinner'

const EMOTIONAL_LABELS: Record<EmotionalTone, string> = {
  setup: '铺垫',
  conflict: '冲突',
  climax: '高潮',
  resolution: '结局',
  cliffhanger: '悬念',
}

const EMOTIONAL_COLORS: Record<EmotionalTone, string> = {
  setup: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  conflict: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  climax: 'bg-red-500/20 text-red-400 border-red-500/30',
  resolution: 'bg-green-500/20 text-green-400 border-green-500/30',
  cliffhanger: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

export default function EpisodePanel() {
  const {
    project,
    addEpisode,
    removeEpisode,
    updateEpisode,
    isShooting,
    shootEpisode,
    cancelShoot,
    reshootShot,
    updateShotVideoModel,
    deleteShot,
    insertShot,
    updateShotNarration,
  } = useProjectStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  if (!project) return null

  const { episodes, shots: allShots, narrationMode } = project

  const toggleExpand = (epId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(epId)) next.delete(epId)
      else next.add(epId)
      return next
    })
  }

  const handleEditTitle = (ep: Episode) => {
    setEditingId(ep.id)
    setEditTitle(ep.title)
  }

  const handleSaveTitle = (epId: string) => {
    updateEpisode(epId, { title: editTitle })
    setEditingId(null)
  }

  const getEpisodeShots = (ep: Episode) =>
    allShots.filter(s => s.episodeId === ep.id)

  const getEpisodeProgress = (ep: Episode) => {
    const shots = getEpisodeShots(ep)
    if (shots.length === 0) return { done: 0, total: 0, pct: 0 }
    const done = shots.reduce((sum, s) =>
      sum + (s.pipeline.image.status === 'done' ? 1 : 0)
          + (s.pipeline.video.status === 'done' ? 1 : 0)
          + (s.pipeline.audio.status === 'done' ? 1 : 0), 0)
    const total = shots.length * 3
    return { done, total, pct: Math.round((done / total) * 100) }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#a0a0b8]">📺 剧集管理</span>
        <Button size="sm" variant="ghost" onClick={addEpisode}>
          + 新增集
        </Button>
      </div>

      {episodes.length === 0 && (
        <div className="card p-8 text-center text-[#6a6a8e] text-sm">
          暂无剧集，点击「新增集」开始
        </div>
      )}

      {episodes.map((ep) => {
        const epShots = getEpisodeShots(ep)
        const { done, total, pct } = getEpisodeProgress(ep)
        const expanded = expandedIds.has(ep.id)
        const allEpDone = total > 0 && done === total
        const anyEpDone = epShots.some(s => s.pipeline.image.status === 'done')

        return (
          <div
            key={ep.id}
            className="rounded-xl border border-[#2a2a3e] bg-[#12121e] overflow-hidden"
          >
            {/* Episode Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1a2e]">
              {/* Expand toggle */}
              <button
                onClick={() => toggleExpand(ep.id)}
                className="text-[#6a6a8e] hover:text-white transition-colors w-5 shrink-0 text-center"
              >
                {expanded ? '▾' : '▸'}
              </button>

              <span className="text-xs font-medium text-[#a0a0b8] shrink-0">
                第{ep.number}集
              </span>

              {editingId === ep.id ? (
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onBlur={() => handleSaveTitle(ep.id)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveTitle(ep.id)}
                  className="flex-1 bg-[#0f0f18] border border-[#6c5ce7] rounded px-2 py-0.5 text-sm text-white outline-none"
                  autoFocus
                />
              ) : (
                <span
                  className="flex-1 text-sm text-white cursor-pointer hover:text-[#6c5ce7] truncate"
                  onClick={() => handleEditTitle(ep)}
                >
                  {ep.title}
                </span>
              )}

              <span className={`text-xs px-2 py-0.5 rounded border shrink-0 ${EMOTIONAL_COLORS[ep.emotionalTone]}`}>
                {EMOTIONAL_LABELS[ep.emotionalTone]}
              </span>

              <span className="text-xs text-[#6a6a8e] shrink-0">
                {epShots.length}镜
              </span>

              {/* Shoot episode button */}
              {epShots.length > 0 && !allEpDone && (
                isShooting ? (
                  <button
                    onClick={() => cancelShoot?.()}
                    className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 shrink-0"
                  >
                    ⏸
                  </button>
                ) : (
                  <button
                    onClick={() => shootEpisode(ep.id)}
                    className="text-xs px-2 py-0.5 rounded bg-[#6c5ce7]/20 text-[#6c5ce7] hover:bg-[#6c5ce7]/30 border border-[#6c5ce7]/30 shrink-0"
                  >
                    {anyEpDone ? '▶ 继续' : '▶ 拍摄'}
                  </button>
                )
              )}

              {episodes.length > 1 && (
                <button
                  onClick={() => removeEpisode(ep.id)}
                  className="text-xs text-red-400 hover:text-red-300 shrink-0 ml-1"
                >
                  ×
                </button>
              )}
            </div>

            {/* Emotional tone selector */}
            <div className="px-4 py-2 flex gap-1.5 border-t border-[#2a2a3e] flex-wrap">
              {(Object.keys(EMOTIONAL_LABELS) as EmotionalTone[]).map(tone => (
                <button
                  key={tone}
                  onClick={() => updateEpisode(ep.id, { emotionalTone: tone })}
                  className={`text-xs px-2 py-1 rounded transition-all cursor-pointer border ${
                    ep.emotionalTone === tone
                      ? EMOTIONAL_COLORS[tone]
                      : 'border-[#2a2a3e] text-[#6a6a8e] hover:border-[#6c5ce7]/40'
                  }`}
                >
                  {EMOTIONAL_LABELS[tone]}
                </button>
              ))}
            </div>

            {/* Progress bar */}
            {total > 0 && (
              <div className="px-4 py-2 border-t border-[#2a2a3e]">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[#2a2a3e] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#6c5ce7] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#6a6a8e]">{done}/{total}</span>
                </div>
              </div>
            )}

            {/* Expanded: shot list */}
            {expanded && (
              <div className="border-t border-[#2a2a3e] p-3 space-y-2">
                {epShots.length === 0 ? (
                  <p className="text-xs text-[#6a6a8e] text-center py-3">
                    本集暂无镜头
                  </p>
                ) : (
                  epShots.map((shot, i) => (
                    <ShotCard
                      key={shot.id}
                      shot={shot}
                      index={allShots.findIndex(s => s.id === shot.id)}
                      onReshoot={reshootShot}
                      onModelChange={updateShotVideoModel}
                      onDelete={deleteShot}
                      onInsertAfter={(afterId) => insertShot(afterId, ep.id)}
                      narrationMode={narrationMode}
                      onNarrationChange={updateShotNarration}
                    />
                  ))
                )}

                {/* Add shot at end of episode */}
                <button
                  onClick={() => {
                    const lastShot = epShots[epShots.length - 1]
                    insertShot(lastShot?.id, ep.id)
                  }}
                  className="w-full py-2 rounded-xl border border-dashed border-[#2a2a3e] hover:border-[#6c5ce7]/50 text-[#666] hover:text-[#6c5ce7] text-xs transition-colors"
                >
                  ＋ 在本集末尾添加镜头
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Summary */}
      {episodes.length > 0 && (
        <div className="pt-2 border-t border-[#2a2a3e] flex items-center justify-between text-xs text-[#6a6a8e]">
          <span>共 {episodes.length} 集</span>
          <span>总 {allShots.length} 镜头</span>
        </div>
      )}
    </div>
  )
}
