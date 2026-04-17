'use client'

import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import Button from '@/components/shared/Button'
import type { EmotionalTone } from '@/types'

const HOOK_TYPES = [
  { id: 'suspense', label: '悬念钩子', emoji: '❓', desc: '留下未解之谜，吸引追看' },
  { id: 'conflict', label: '冲突爆发', emoji: '⚡', desc: '矛盾激化到顶点突然中断' },
  { id: 'twist', label: '反转冲击', emoji: '🔄', desc: '剧情突然反转，打破预期' },
  { id: 'dilemma', label: '两难抉择', emoji: '⚖️', desc: '角色面临艰难选择，无从预料' },
  { id: 'revelation', label: '惊天揭秘', emoji: '💥', desc: '隐藏真相突然曝光' },
]

export default function CliffhangerPanel() {
  const { project, updateShotDialogue, updateEpisode } = useProjectStore()
  const [selectedHook, setSelectedHook] = useState<string>('suspense')
  const [generated, setGenerated] = useState('')
  const [loading, setLoading] = useState(false)

  if (!project) return null

  const lastEpisode = project.episodes[project.episodes.length - 1]
  const lastShot = project.shots[project.shots.length - 1]
  const hasContent = project.shots.length > 0

  // Build context from real project data
  const dramaTitle = project.title || ''
  const lastShotDesc = lastShot?.description || ''
  const lastShotDialogue = lastShot?.dialogue || ''
  const totalShots = project.shots.length
  const totalEpisodes = project.episodes.length

  const handleGenerate = async () => {
    setLoading(true)

    try {
      const prompt = `你是一个短剧编剧。根据以下信息，生成一个第${totalEpisodes}集结尾的悬念钩子。

短剧名称：${dramaTitle}
当前集数：第${totalEpisodes}集
上一集结尾镜头描述：${lastShotDesc || '无'}
上一集最后一句台词：${lastShotDialogue || '无'}
总镜头数：${totalShots}个

悬念类型：${HOOK_TYPES.find(h => h.id === selectedHook)?.label}
要求：生成一段30-60字的高质量悬念结尾，直接用于短剧最后一集的收尾。风格要符合中国短剧节奏，结尾要有冲击力。不要加引号，直接输出正文。`

      const res = await fetch('/api/ai/cliffhanger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: dramaTitle,
          hookType: selectedHook,
          lastShotDesc,
          lastShotDialogue,
          totalEpisodes,
          totalShots,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setGenerated(data.cliffhanger || '')
      } else {
        setGenerated('生成失败，请重试')
      }
    } catch {
      setGenerated('生成失败，请重试')
    }

    setLoading(false)
  }

  const [applied, setApplied] = useState(false)

  const handleApply = () => {
    if (!generated) return
    // Update last shot's dialogue with cliffhanger text
    if (lastShot) {
      updateShotDialogue(lastShot.id, generated)
    }
    // Set last episode to cliffhanger tone
    if (lastEpisode) {
      updateEpisode(lastEpisode.id, { emotionalTone: 'cliffhanger' as EmotionalTone })
    }
    setApplied(true)
  }

  return (
    <div className="card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-1">🎣 悬念结尾优化</h3>
        <p className="text-xs text-[#6a6a8e]">
          基于短剧真实内容生成悬念钩子，提升追剧率
        </p>
      </div>

      {/* Current last episode info */}
      {lastEpisode && (
        <div className="p-3 rounded-xl bg-[#12121e] border border-[#2a2a3e]">
          <div className="text-xs text-[#6a6a8e]">当前最后剧集</div>
          <div className="text-sm text-white font-medium mt-1">
            第{lastEpisode.number}集 · {lastEpisode.title}
          </div>
          <div className="text-xs text-[#6c5ce7] mt-1">
            情绪基调：{lastEpisode.emotionalTone === 'cliffhanger' ? '❓ 悬念' : lastEpisode.emotionalTone}
          </div>
        </div>
      )}

      {/* Real content reference */}
      {lastShot && (
        <div className="p-3 rounded-xl bg-[#12121e] border border-[#2a2a3e]">
          <div className="text-xs text-[#6a6a8e] mb-1">最后一镜头</div>
          <div className="text-xs text-white leading-relaxed">
            {lastShot.description || '（无描述）'}
          </div>
          {lastShot.dialogue && (
            <div className="text-xs text-[#6c5ce7] mt-1 italic">
              &ldquo;{lastShot.dialogue}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* Hook type selector */}
      <div>
        <label className="text-xs text-[#a0a0b8] mb-2 block">选择悬念类型</label>
        <div className="grid grid-cols-1 gap-2">
          {HOOK_TYPES.map(h => (
            <button
              key={h.id}
              onClick={() => setSelectedHook(h.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedHook === h.id
                  ? 'border-[#6c5ce7] bg-[#6c5ce7]/10'
                  : 'border-[#2a2a3e] bg-[#1a1a2e] hover:border-[#6c5ce7]/40'
              }`}
            >
              <span className="text-xl">{h.emoji}</span>
              <div>
                <div className={`text-sm ${selectedHook === h.id ? 'text-white' : 'text-[#a0a0b8]'}`}>
                  {h.label}
                </div>
                <div className="text-xs text-[#6a6a8e]">{h.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        loading={loading}
        disabled={!hasContent}
        variant="primary"
        className="w-full"
      >
        {loading ? 'AI 构思中...' : '✨ 生成悬念结尾'}
      </Button>

      {/* Generated result */}
      {generated && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-[#12121e] border border-[#6c5ce7]/30">
            <div className="text-xs text-[#6c5ce7] mb-2">🎬 生成的悬念结尾</div>
            <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
              {generated}
            </p>
          </div>
          <div className="flex gap-2">
            {!applied ? (
              <Button onClick={handleApply} className="flex-1" variant="primary">
                应用到最后一集
              </Button>
            ) : (
              <div className="flex-1 text-center py-2 text-sm text-[#00b894]">
                ✅ 已应用到最后一集
              </div>
            )}
            <Button onClick={() => { setGenerated(''); setApplied(false) }} variant="ghost" className="flex-1">
              换一个
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}