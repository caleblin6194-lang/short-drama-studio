'use client'

import { useMemo } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import type { StoryBeatId } from '@/types'
import Button from '@/components/shared/Button'

const BEAT_BADGE: Record<StoryBeatId, string> = {
  opening: 'text-yellow-300 bg-yellow-900/20 border-yellow-700/40',
  buildup: 'text-blue-300 bg-blue-900/20 border-blue-700/40',
  climax: 'text-orange-300 bg-orange-900/20 border-orange-700/40',
  twist: 'text-purple-300 bg-purple-900/20 border-purple-700/40',
  suspense: 'text-pink-300 bg-pink-900/20 border-pink-700/40',
}

export default function StoryStructurePanel() {
  const {
    project,
    generateStoryStructure,
    updateStoryBeat,
    updateStoryHook,
    updateStoryHookCharacters,
    updateStoryHookDialogues,
    applyStoryStructureToScript,
  } = useProjectStore()

  const plan = project?.storyStructure ?? null

  const characterLine = useMemo(() => {
    if (!plan) return ''
    return plan.hookScene.characters.join('、')
  }, [plan])

  const dialogueText = useMemo(() => {
    if (!plan) return ''
    return plan.hookScene.dialogueLines.join('\n')
  }, [plan])

  if (!project) return null

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-[#a0a0b8]">⚡ 结构设计与钩子</h3>
        <Button size="sm" variant="secondary" onClick={generateStoryStructure}>
          AI 生成结构
        </Button>
      </div>

      {!plan && (
        <div className="rounded-lg border border-dashed border-[#33406a] bg-[#0f172f] px-4 py-4 text-sm text-[#95a3ce]">
          先点击“AI 生成结构”，系统会给出 2 分钟节奏设计（开场/铺垫/高潮/反转/悬念）和钩子场景模板，可继续手动微调。
        </div>
      )}

      {plan && (
        <>
          <div className="rounded-xl border border-[#2b3964] bg-[#0c142c] px-4 py-3">
            <div className="text-sm text-[#c5d1ff] mb-3">{plan.durationLabel}</div>
            <div className="space-y-3">
              {plan.beats.map((beat) => (
                <div key={beat.id} className="rounded-lg border border-[#2a345a] bg-[#121b34] px-3 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg leading-none">{beat.icon}</span>
                    <span className={`text-xs border rounded-md px-2 py-0.5 ${BEAT_BADGE[beat.id]}`}>
                      {beat.label}
                    </span>
                    <span className="text-xs text-[#91a2d0]">{beat.timeRange}</span>
                  </div>
                  <textarea
                    value={beat.text}
                    onChange={(e) => updateStoryBeat(beat.id, e.target.value)}
                    className="w-full min-h-[70px] bg-[#0f172f] border border-[#29365f] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8292bf] resize-y focus:outline-none focus:border-[#6c5ce7]"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#2b3964] bg-[#0c142c] px-4 py-3 space-y-3">
            <div className="text-sm font-medium text-[#c5d1ff]">场景详情 · {plan.hookScene.label}</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-xs text-[#9eb0de]">
                钩子时段
                <input
                  value={plan.hookScene.timeRange}
                  onChange={(e) => updateStoryHook({ timeRange: e.target.value })}
                  className="mt-1 w-full bg-[#0f172f] border border-[#29365f] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6c5ce7]"
                />
              </label>

              <label className="text-xs text-[#9eb0de]">
                场景地点
                <input
                  value={plan.hookScene.location}
                  onChange={(e) => updateStoryHook({ location: e.target.value })}
                  className="mt-1 w-full bg-[#0f172f] border border-[#29365f] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6c5ce7]"
                />
              </label>
            </div>

            <label className="text-xs text-[#9eb0de] block">
              人物（用顿号/逗号分隔）
              <input
                value={characterLine}
                onChange={(e) => updateStoryHookCharacters(e.target.value)}
                className="mt-1 w-full bg-[#0f172f] border border-[#29365f] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6c5ce7]"
              />
            </label>

            <label className="text-xs text-[#9eb0de] block">
              特写描述
              <textarea
                value={plan.hookScene.visualCue}
                onChange={(e) => updateStoryHook({ visualCue: e.target.value })}
                className="mt-1 w-full min-h-[74px] bg-[#0f172f] border border-[#29365f] rounded-lg px-3 py-2 text-sm text-white resize-y focus:outline-none focus:border-[#6c5ce7]"
              />
            </label>

            <label className="text-xs text-[#9eb0de] block">
              钩子对白（每行一句）
              <textarea
                value={dialogueText}
                onChange={(e) => updateStoryHookDialogues(e.target.value)}
                className="mt-1 w-full min-h-[96px] bg-[#0f172f] border border-[#29365f] rounded-lg px-3 py-2 text-sm text-white resize-y focus:outline-none focus:border-[#6c5ce7]"
              />
            </label>

            <div className="flex justify-end">
              <Button size="sm" onClick={applyStoryStructureToScript}>
                插入到剧本
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
