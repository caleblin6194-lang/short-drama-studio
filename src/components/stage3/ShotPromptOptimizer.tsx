'use client'

import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import type { Shot } from '@/types'
import Button from '@/components/shared/Button'

interface PromptEnhancement {
  originalDesc: string
  enhancedPrompt: string
  shotType: string
  lighting: string
  mood: string
  composition: string
}

export default function ShotPromptOptimizer() {
  const { project } = useProjectStore()
  const [optimizing, setOptimizing] = useState(false)
  const [enhanced, setEnhanced] = useState<PromptEnhancement[]>([])

  if (!project) return null

  const shots = project.shots

  const handleOptimizeAll = async () => {
    if (shots.length === 0) return
    setOptimizing(true)

    await new Promise(r => setTimeout(r, 2000))

    const tagType = project.tagSet.type || '都市言情'
    const genrePrompts: Record<string, { shotTypes: string[]; lighting: string[]; moods: string[] }> = {
      '都市言情': {
        shotTypes: ['特写', '双人对话镜头', '过肩镜头', '移动跟拍'],
        lighting: ['自然光', '城市夜景霓虹', '暖色调室内光'],
        moods: ['浪漫', '紧张', '压抑', '怀旧'],
      },
      '豪门总裁': {
        shotTypes: ['航拍大全景', '特写', '慢镜头', '对称构图'],
        lighting: ['戏剧性侧光', '冷色调办公光', '金色暖光'],
        moods: ['奢华', '压迫感', '神秘', '紧张'],
      },
      '穿越玄幻': {
        shotTypes: ['特效大全景', '特写', 'POV镜头', '快速剪辑'],
        lighting: ['奇幻光效', '烟雾感', '冷暖对比'],
        moods: ['奇幻', '神秘', '紧张', '壮观'],
      },
      '都市爽文': {
        shotTypes: ['慢镜头', '特写', '快速剪辑', '航拍'],
        lighting: ['高对比度', '城市天际线光', '戏剧性背光'],
        moods: ['燃', '爽', '逆袭感', '爆发'],
      },
    }

    const genreConfig = genrePrompts[tagType] || genrePrompts['都市言情']

    const enhancements: PromptEnhancement[] = shots.map(shot => {
      const randomShotType = genreConfig.shotTypes[Math.floor(Math.random() * genreConfig.shotTypes.length)]
      const randomLighting = genreConfig.lighting[Math.floor(Math.random() * genreConfig.lighting.length)]
      const randomMood = genreConfig.moods[Math.floor(Math.random() * genreConfig.moods.length)]
      const composition = ['中心构图', '三分法', '对角线构图', '框架构图'][Math.floor(Math.random() * 4)]

      const enhancedPrompt = `${randomShotType}，${shot.description}，${randomLighting}，${randomMood}氛围，${composition}，电影感，高质量，8K`

      return {
        originalDesc: shot.description,
        enhancedPrompt,
        shotType: randomShotType,
        lighting: randomLighting,
        mood: randomMood,
        composition,
      }
    })

    setEnhanced(enhancements)
    setOptimizing(false)
  }

  return (
    <div className="card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-1">🎬 镜头Prompt优化</h3>
        <p className="text-xs text-[#6a6a8e]">
          AI 自动将简单描述扩展为专业级镜头生成Prompt
        </p>
      </div>

      {shots.length === 0 && (
        <div className="text-center py-4 text-xs text-[#6a6a8e]">
          暂无镜头，请先生成镜头后再优化
        </div>
      )}

      {shots.length > 0 && enhanced.length === 0 && (
        <Button
          onClick={handleOptimizeAll}
          loading={optimizing}
          variant="primary"
          className="w-full"
        >
          {optimizing ? '优化中...' : `✨ 优化全部 ${shots.length} 个镜头`}
        </Button>
      )}

      {optimizing && (
        <div className="text-center py-2">
          <div className="text-xs text-[#6c5ce7] animate-pulse">
            正在为 {shots.length} 个镜头生成专业Prompt...
          </div>
        </div>
      )}

      {enhanced.length > 0 && (
        <>
          <div className="text-xs text-[#00b894]">
            ✓ 已优化 {enhanced.length} 个镜头Prompt
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {enhanced.map((e, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-[#12121e] border border-[#2a2a3e] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6a6a8e]">镜头 {i + 1}</span>
                  <div className="flex gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#6c5ce7]/20 text-[#6c5ce7]">
                      {e.shotType}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f39c12]/20 text-[#f39c12]">
                      {e.mood}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-[#6a6a8e]">
                  原文：{e.originalDesc}
                </div>

                <div className="text-xs text-white bg-[#1a1a2e] p-2 rounded-lg">
                  <span className="text-[#00b894]">→ </span>
                  {e.enhancedPrompt}
                </div>

                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a2a3e] text-[#6a6a8e]">
                    💡 {e.lighting}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a2a3e] text-[#6a6a8e]">
                    🎞️ {e.composition}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={() => setEnhanced([])}
            variant="ghost"
            className="w-full"
          >
            重新优化
          </Button>
        </>
      )}
    </div>
  )
}
