'use client'

import type { Shot, Episode, SubtitleBlock } from '@/types'

const TONE_COLORS: Record<string, string> = {
  setup: 'bg-blue-500/30 text-blue-400 border-blue-500/40',
  conflict: 'bg-orange-500/30 text-orange-400 border-orange-500/40',
  climax: 'bg-red-500/30 text-red-400 border-red-500/40',
  resolution: 'bg-green-500/30 text-green-400 border-green-500/40',
  cliffhanger: 'bg-purple-500/30 text-purple-400 border-purple-500/40',
}

const TONE_LABELS: Record<string, string> = {
  setup: '铺垫', conflict: '冲突', climax: '高潮', resolution: '结局', cliffhanger: '悬念',
}

function ShotBlock({ shot, index, subtitleBlocks }: { shot: Shot; index: number; subtitleBlocks?: SubtitleBlock[] }) {
  const stages = [shot.pipeline.image, shot.pipeline.video, shot.pipeline.audio]
  const hasSubs = subtitleBlocks?.some(b => b.shotId === shot.id) ?? false

  return (
    <div className="flex flex-col items-center gap-0.5" style={{ minWidth: 44 }}>
      {/* Pipeline bars */}
      <div className="flex gap-px">
        <div className={`w-3 h-5 rounded-sm ${shot.pipeline.image.status === 'done' ? 'bg-[#0984e3]' : shot.pipeline.image.status === 'rendering' ? 'bg-[#0984e3]/40 animate-pulse' : 'bg-[#2a2a3e]'}`} title="图像" />
        <div className={`w-3 h-5 rounded-sm ${shot.pipeline.video.status === 'done' ? 'bg-[#6c5ce7]' : shot.pipeline.video.status === 'rendering' ? 'bg-[#6c5ce7]/40 animate-pulse' : 'bg-[#2a2a3e]'}`} title="视频" />
        <div className={`w-3 h-5 rounded-sm ${shot.pipeline.audio.status === 'done' ? 'bg-[#00b894]' : shot.pipeline.audio.status === 'rendering' ? 'bg-[#00b894]/40 animate-pulse' : 'bg-[#2a2a3e]'}`} title="音频" />
      </div>
      {/* Shot number */}
      <span className="text-[9px] text-[#6a6a8e]">{index + 1}</span>
      {/* Subtitle indicator */}
      {hasSubs && <span className="text-[8px] text-[#6c5ce7]" title="有字幕">▬</span>}
      {/* Transition indicator */}
      {shot.transitionIn && (
        <span className="text-[8px] text-[#fdcb6e]" title={`转场: ${shot.transitionIn}`}>⟩</span>
      )}
    </div>
  )
}

interface TimelineProps {
  shots: Shot[]
  episodes?: Episode[]
  subtitleBlocks?: SubtitleBlock[]
}

export default function Timeline({ shots, episodes, subtitleBlocks }: TimelineProps) {
  if (shots.length === 0) {
    return (
      <div className="card p-4 text-center text-[#6a6a8e] text-sm">
        先生成镜头再查看时间轴
      </div>
    )
  }

  // Build episode groups
  const groups: Array<{ episode?: Episode; shots: Shot[] }> = []

  if (episodes && episodes.length > 0) {
    for (const ep of episodes) {
      const epShots = shots.filter(s => s.episodeId === ep.id)
      if (epShots.length > 0) {
        groups.push({ episode: ep, shots: epShots })
      }
    }
    // Shots not assigned to any episode
    const unassigned = shots.filter(s => !s.episodeId || !episodes.find(e => e.id === s.episodeId))
    if (unassigned.length > 0) {
      groups.push({ episode: undefined, shots: unassigned })
    }
    // If no groups were built (all shots have no matching episodeId), fall back
    if (groups.length === 0) {
      groups.push({ episode: undefined, shots })
    }
  } else {
    groups.push({ episode: undefined, shots })
  }

  const allShotIndices = new Map(shots.map((s, i) => [s.id, i]))

  return (
    <div className="card p-4 space-y-4">
      <h3 className="text-sm font-medium text-[#a0a0b8]">⏱ 时间线</h3>

      {groups.map((group, gi) => (
        <div key={gi} className="space-y-2">
          {/* Episode header */}
          {group.episode && (
            <div className={`flex items-center gap-2 px-2 py-1 rounded-lg border text-xs ${TONE_COLORS[group.episode.emotionalTone] || 'bg-[#1a1a2e] border-[#2a2a3e] text-[#a0a0b8]'}`}>
              <span className="font-medium">第{group.episode.number}集</span>
              <span className="flex-1 truncate">{group.episode.title}</span>
              <span className="opacity-70">{TONE_LABELS[group.episode.emotionalTone]}</span>
              <span className="opacity-50">{group.shots.length}镜</span>
            </div>
          )}
          {!group.episode && (
            <div className="text-xs text-[#6a6a8e] px-1">未分集镜头</div>
          )}

          {/* Shot blocks */}
          <div className="overflow-x-auto">
            <div className="flex gap-1 min-w-max px-1 pb-1">
              {group.shots.map((shot) => (
                <ShotBlock
                  key={shot.id}
                  shot={shot}
                  index={allShotIndices.get(shot.id) ?? 0}
                  subtitleBlocks={subtitleBlocks}
                />
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="flex gap-4 pt-2 border-t border-[#2a2a3e] text-[10px] text-[#a0a0b8] flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#0984e3]" />图</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#6c5ce7]" />视</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#00b894]" />音</span>
        <span className="flex items-center gap-1"><span className="text-[#6c5ce7]">▬</span> 有字幕</span>
        <span className="flex items-center gap-1"><span className="text-[#fdcb6e]">⟩</span> 有转场</span>
      </div>
    </div>
  )
}
