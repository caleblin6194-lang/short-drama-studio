'use client'

import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import type { Episode, EmotionalTone } from '@/types'
import Button from '@/components/shared/Button'

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
  const { project, addEpisode, removeEpisode, updateEpisode, isShooting } = useProjectStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  if (!project) return null

  const episodes = project.episodes

  const handleEditTitle = (ep: Episode) => {
    setEditingId(ep.id)
    setEditTitle(ep.title)
  }

  const handleSaveTitle = (epId: string) => {
    updateEpisode(epId, { title: editTitle })
    setEditingId(null)
  }

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#a0a0b8]">📺 剧集管理</h3>
        <Button size="sm" variant="ghost" onClick={addEpisode}>
          + 新增集
        </Button>
      </div>

      {episodes.length === 0 && !isShooting && (
        <div className="text-center py-6 text-[#6a6a8e] text-sm">
          暂无剧集，点击「新增集」开始
        </div>
      )}

      {isShooting && episodes.every(e => e.shots.length === 0) && (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 rounded-xl bg-[#1a1a2e] border border-[#2a2a3e]" />
          ))}
        </div>
      )}

      <div className="space-y-3">
        {episodes.map((ep) => (
          <div
            key={ep.id}
            className="rounded-xl border border-[#2a2a3e] bg-[#12121e] overflow-hidden"
          >
            {/* Episode Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1a2e]">
              <span className="text-xs font-medium text-[#a0a0b8]">
                第{ep.number}集
              </span>

              {editingId === ep.id ? (
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => handleSaveTitle(ep.id)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(ep.id)}
                  className="flex-1 bg-[#0f0f18] border border-[#6c5ce7] rounded px-2 py-0.5 text-sm text-white outline-none"
                  autoFocus
                />
              ) : (
                <span
                  className="flex-1 text-sm text-white cursor-pointer hover:text-[#6c5ce7]"
                  onClick={() => handleEditTitle(ep)}
                >
                  {ep.title}
                </span>
              )}

              <span className={`text-xs px-2 py-0.5 rounded border ${EMOTIONAL_COLORS[ep.emotionalTone]}`}>
                {EMOTIONAL_LABELS[ep.emotionalTone]}
              </span>

              <span className="text-xs text-[#6a6a8e]">
                {ep.shots.length}镜
              </span>

              {episodes.length > 1 && (
                <button
                  onClick={() => removeEpisode(ep.id)}
                  className="text-xs text-red-400 hover:text-red-300 ml-1"
                >
                  ×
                </button>
              )}
            </div>

            {/* Emotional tone selector */}
            <div className="px-4 py-2 flex gap-1.5 border-t border-[#2a2a3e]">
              {(Object.keys(EMOTIONAL_LABELS) as EmotionalTone[]).map((tone) => (
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

            {/* Shot count bar */}
            <div className="px-4 py-2 border-t border-[#2a2a3e]">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[#2a2a3e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#6c5ce7] rounded-full transition-all"
                    style={{ width: `${Math.min(100, (ep.shots.length / 10) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-[#6a6a8e]">
                  {ep.shots.length} / 10 镜
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {episodes.length > 0 && (
        <div className="pt-2 border-t border-[#2a2a3e] flex items-center justify-between text-xs text-[#6a6a8e]">
          <span>共 {episodes.length} 集</span>
          <span>总 {episodes.reduce((sum, e) => sum + e.shots.length, 0)} 镜头</span>
        </div>
      )}
    </div>
  )
}
