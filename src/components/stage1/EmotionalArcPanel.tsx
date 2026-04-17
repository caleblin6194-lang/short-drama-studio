'use client'

import { useProjectStore } from '@/store/useProjectStore'
import type { Episode, EmotionalTone } from '@/types'

const EMOTIONAL_MAP: Record<EmotionalTone, { label: string; emoji: string; color: string; bgColor: string }> = {
  setup: { label: '铺垫', emoji: '🌅', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  conflict: { label: '冲突', emoji: '⚡', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  climax: { label: '高潮', emoji: '🔥', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  resolution: { label: '结局', emoji: '🌟', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  cliffhanger: { label: '悬念', emoji: '❓', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
}

export default function EmotionalArcPanel() {
  const { project, updateEpisode } = useProjectStore()

  if (!project) return null

  const episodes = project.episodes

  if (episodes.length === 0) {
    return (
      <div className="card p-4 space-y-3">
        <div>
          <h3 className="text-sm font-medium text-[#a0a0b8] mb-1">📊 情绪曲线</h3>
          <p className="text-xs text-[#6a6a8e]">
            生成镜头后自动追踪剧情情绪变化
          </p>
        </div>
        <div className="text-center py-4 text-[#6a6a8e] text-sm">
          暂无剧集数据
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-1">📊 情绪曲线</h3>
        <p className="text-xs text-[#6a6a8e]">
          点击集数切换情绪类型，优化BGM和节奏
        </p>
      </div>

      {/* Visual arc */}
      <div className="relative">
        <div className="flex items-end justify-between gap-1 h-24 px-2">
          {episodes.map((ep) => {
            const emo = EMOTIONAL_MAP[ep.emotionalTone]
            const heights: Record<EmotionalTone, string> = {
              setup: 'h-6',
              conflict: 'h-10',
              climax: 'h-full',
              resolution: 'h-8',
              cliffhanger: 'h-14',
            }
            return (
              <div key={ep.id} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t-lg ${emo.bgColor} ${heights[ep.emotionalTone]} flex items-end justify-center pb-1 transition-all hover:brightness-125 cursor-pointer`}
                  title={`${ep.title} - ${emo.label}`}
                >
                  <span className="text-sm">{emo.emoji}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-1 px-2">
          {episodes.map((ep) => (
            <span key={ep.id} className="text-[10px] text-[#6a6a8e]">
              {ep.number}集
            </span>
          ))}
        </div>
      </div>

      {/* Arc line — uses viewBox coordinates so % is not needed */}
      <div className="relative -mt-2">
        <svg
          viewBox={`0 0 100 40`}
          className="w-full h-10 pointer-events-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6c5ce7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#a29bfe" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          {episodes.length > 1 && (
            <polyline
              fill="none"
              stroke="url(#arcGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={episodes.map((ep, i) => {
                const x = (i / (episodes.length - 1)) * 96 + 2
                const yMap: Record<string, number> = {
                  setup: 32, conflict: 18, climax: 4, resolution: 26, cliffhanger: 10,
                }
                return `${x},${yMap[ep.emotionalTone] ?? 20}`
              }).join(' ')}
            />
          )}
          {episodes.map((ep, i) => {
            const x = episodes.length > 1 ? (i / (episodes.length - 1)) * 96 + 2 : 50
            const yMap: Record<string, number> = {
              setup: 32, conflict: 18, climax: 4, resolution: 26, cliffhanger: 10,
            }
            const y = yMap[ep.emotionalTone] ?? 20
            return <circle key={ep.id} cx={x} cy={y} r="2.5" fill="#6c5ce7" />
          })}
        </svg>
      </div>

      {/* Episode emotional tags */}
      <div className="space-y-2">
        {episodes.map((ep) => {
          const emo = EMOTIONAL_MAP[ep.emotionalTone]
          return (
            <div
              key={ep.id}
              className={`flex items-center gap-3 p-2 rounded-lg ${emo.bgColor} transition-all`}
            >
              <span className={`text-xs font-medium ${emo.color}`}>
                第{ep.number}集
              </span>
              <span className="text-sm">{emo.emoji}</span>
              <span className={`text-xs font-medium ${emo.color}`}>{emo.label}</span>
              <span className="text-xs text-[#6a6a8e] ml-auto">
                {ep.shots.length}镜头
              </span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-[#2a2a3e]">
        {(Object.keys(EMOTIONAL_MAP) as EmotionalTone[]).map((tone) => {
          const emo = EMOTIONAL_MAP[tone]
          return (
            <div key={tone} className="flex items-center gap-1.5">
              <span>{emo.emoji}</span>
              <span className={`text-xs ${emo.color}`}>{emo.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
