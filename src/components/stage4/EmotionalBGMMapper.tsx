'use client'

import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import Button from '@/components/shared/Button'

const STORY_BEAT_MOOD_MAP: Record<string, { bgmMood: string; emoji: string; label: string }> = {
  opening: { bgmMood: 'mysterious', emoji: '🔮', label: '悬念开场' },
  buildup: { bgmMood: 'tension', emoji: '⏱', label: '冲突铺垫' },
  climax: { bgmMood: 'epic', emoji: '🔥', label: '高潮爆发' },
  twist: { bgmMood: 'mysterious', emoji: '⚡', label: '反转震撼' },
  suspense: { bgmMood: 'horror', emoji: '👻', label: '悬念留存' },
}

export default function EmotionalBGMMapper() {
  const { project } = useProjectStore()
  const [generating, setGenerating] = useState(false)
  const [segments, setSegments] = useState<{ beat: string; mood: string; emoji: string; label: string; duration: string }[]>([])
  const [generated, setGenerated] = useState(false)

  if (!project) return null

  const storyBeats = project.storyStructure?.beats || []

  const handleAutoMap = async () => {
    setGenerating(true)
    setSegments([])
    setGenerated(false)

    await new Promise(r => setTimeout(r, 2000))

    // Map story beats to BGM moods
    const mapped = storyBeats.length > 0 ? storyBeats.map(beat => {
      const mapping = STORY_BEAT_MOOD_MAP[beat.id] || STORY_BEAT_MOOD_MAP['buildup']
      const duration = beat.timeRange || '~0:30'
      return {
        beat: beat.label,
        mood: mapping.bgmMood,
        emoji: mapping.emoji,
        label: mapping.label,
        duration,
      }
    }) : [
      { beat: '开场悬念', mood: 'mysterious', emoji: '🔮', label: '悬念开场', duration: '~0:15' },
      { beat: '冲突铺垫', mood: 'tension', emoji: '⏱', label: '冲突铺垫', duration: '~1:00' },
      { beat: '高潮爆发', mood: 'epic', emoji: '🔥', label: '高潮爆发', duration: '~0:30' },
      { beat: '悬念留存', mood: 'horror', emoji: '👻', label: '悬念留存', duration: '~0:15' },
    ]

    setSegments(mapped)
    setGenerating(false)
    setGenerated(true)
  }

  return (
    <div className="card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-1">🎼 情绪BGM编排</h3>
        <p className="text-xs text-[#6a6a8e]">
          根据剧情节奏自动编排BGM情绪段落
        </p>
      </div>

      {/* Episode emotional arc preview */}
      {project.episodes && project.episodes.length > 0 && (
        <div className="p-3 rounded-xl bg-[#12121e] border border-[#2a2a3e]">
          <div className="text-xs text-[#6a6a8e] mb-2">当前剧集情绪走向</div>
          <div className="flex gap-1 items-end h-12">
            {project.episodes.map((ep, i) => {
              const heights: Record<string, string> = {
                setup: 'h-4',
                conflict: 'h-7',
                climax: 'h-12',
                resolution: 'h-5',
                cliffhanger: 'h-9',
              }
              const colors: Record<string, string> = {
                setup: 'bg-blue-500',
                conflict: 'bg-orange-500',
                climax: 'bg-red-500',
                resolution: 'bg-green-500',
                cliffhanger: 'bg-purple-500',
              }
              return (
                <div key={ep.id} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full rounded-t ${heights[ep.emotionalTone]} ${colors[ep.emotionalTone]} opacity-80`} />
                  <span className="text-[10px] text-[#6a6a8e]">{ep.number}集</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!generated && (
        <Button
          onClick={handleAutoMap}
          loading={generating}
          disabled={generating}
          variant="primary"
          className="w-full"
        >
          {generating ? '编排中...' : '✨ 一键生成情绪BGM编排'}
        </Button>
      )}

      {generating && (
        <div className="space-y-1">
          <div className="text-xs text-[#6c5ce7] animate-pulse">分析剧情节奏...</div>
          <div className="text-xs text-[#6c5ce7] animate-pulse">匹配BGM情绪段落...</div>
          <div className="text-xs text-[#6c5ce7] animate-pulse">生成BGM时序...</div>
        </div>
      )}

      {generated && segments.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs text-[#00b894]">
            ✓ 已编排 {segments.length} 个BGM情绪段落
          </div>

          {/* Segment timeline */}
          <div className="relative">
            <div className="flex h-16 rounded-xl overflow-hidden bg-[#12121e] border border-[#2a2a3e]">
              {segments.map((seg, i) => {
                const colors: Record<string, string> = {
                  epic: 'bg-red-500/80',
                  tender: 'bg-yellow-500/80',
                  tension: 'bg-orange-500/80',
                  mysterious: 'bg-purple-500/80',
                  horror: 'bg-gray-700/80',
                  romantic: 'bg-pink-500/80',
                  uplifting: 'bg-green-500/80',
                  comic: 'bg-amber-500/80',
                }
                const bg = colors[seg.mood] || 'bg-[#6c5ce7]/80'
                return (
                  <div
                    key={i}
                    className={`flex-1 flex flex-col items-center justify-center ${bg} border-r border-[#1a1a2e] last:border-r-0`}
                    title={`${seg.beat} - ${seg.label}`}
                  >
                    <span className="text-sm">{seg.emoji}</span>
                    <span className="text-[9px] text-white/80">{seg.duration}</span>
                  </div>
                )
              })}
            </div>
            {/* Timeline labels */}
            <div className="flex mt-1 px-1">
              {segments.map((seg, i) => (
                <div key={i} className="flex-1 text-center">
                  <span className="text-[9px] text-[#6a6a8e]">{seg.beat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Segment details */}
          <div className="space-y-2">
            {segments.map((seg, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2 rounded-lg bg-[#1a1a2e] border border-[#2a2a3e]"
              >
                <span className="text-lg">{seg.emoji}</span>
                <div className="flex-1">
                  <div className="text-xs text-white">{seg.beat}</div>
                  <div className="text-[10px] text-[#6a6a8e]">{seg.label}</div>
                </div>
                <div className="text-xs text-[#6a6a8e]">{seg.duration}</div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#2a2a3e] text-xs text-[#6a6a8e] text-center">
            实际BGM将在渲染时自动拼接生成
          </div>

          <Button
            onClick={() => setGenerated(false)}
            variant="ghost"
            className="w-full"
          >
            重新编排
          </Button>
        </div>
      )}
    </div>
  )
}
