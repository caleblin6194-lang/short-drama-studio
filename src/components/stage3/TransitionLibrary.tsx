'use client'

import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'

type TransitionType =
  | 'fade'
  | 'cross_dissolve'
  | 'flash'
  | 'slow_zoom'
  | 'shake'
  | 'blur'
  | 'bw_flash'
  | 'slide_left'
  | 'slide_right'
  | 'wipe'

interface Transition {
  id: TransitionType
  name: string
  emoji: string
  desc: string
  useCase: string
}

const TRANSITIONS: Transition[] = [
  { id: 'fade', name: '淡入淡出', emoji: '🌫', desc: '经典渐变', useCase: '适合情绪转换、时光流逝' },
  { id: 'cross_dissolve', name: '叠化', emoji: '💫', desc: '前后画面重叠', useCase: '适合梦境、回忆、联想' },
  { id: 'flash', name: '闪白', emoji: '⚡', desc: '快速闪白', useCase: '适合震惊、高潮瞬间' },
  { id: 'slow_zoom', name: '慢速变焦', emoji: '🔍', desc: '画面快速放大', useCase: '适合强调、聚焦细节' },
  { id: 'shake', name: '抖动', emoji: '📳', desc: '画面轻微抖动', useCase: '适合紧张、危险、意外' },
  { id: 'blur', name: '模糊转场', emoji: '🌁', desc: '画面模糊过渡', useCase: '适合晕倒、入睡、恍惚' },
  { id: 'bw_flash', name: '黑白闪回', emoji: '🖤', desc: '黑白与彩色切换', useCase: '适合回忆、倒叙' },
  { id: 'slide_left', name: '左滑', emoji: '👈', desc: '向左滑入', useCase: '适合时间推进、地点切换' },
  { id: 'slide_right', name: '右滑', emoji: '👉', desc: '向右滑入', useCase: '适合回溯、对比' },
  { id: 'wipe', name: '擦除', emoji: '🧹', desc: '从边缘擦除', useCase: '适合场景明确切换' },
]

export default function TransitionLibrary() {
  const { project } = useProjectStore()
  const [selected, setSelected] = useState<TransitionType>('fade')

  if (!project) return null

  return (
    <div className="card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-1">🎬 转场特效库</h3>
        <p className="text-xs text-[#6a6a8e]">
          短剧专用转场，选择适合情绪场景的效果
        </p>
      </div>

      {/* Category hints */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['情绪类', ['fade', 'cross_dissolve', 'flash']],
            ['强调类', ['slow_zoom', 'shake']],
            ['叙事类', ['blur', 'bw_flash', 'slide_left', 'slide_right', 'wipe']],
          ] as [string, string[]][]
        ).map(([category, ids]) => (
          <div key={category} className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#6a6a8e]">{category}:</span>
            {ids.map(id => {
              const t = TRANSITIONS.find(tr => tr.id === id)
              return t ? (
                <button
                  key={id}
                  onClick={() => setSelected(id as TransitionType)}
                  className={`text-xs px-1.5 py-0.5 rounded transition-all cursor-pointer border ${
                    selected === id
                      ? 'border-[#6c5ce7] bg-[#6c5ce7]/20 text-white'
                      : 'border-[#2a2a3e] text-[#6a6a8e] hover:border-[#6c5ce7]/40'
                  }`}
                >
                  {t.emoji}
                </button>
              ) : null
            })}
          </div>
        ))}
      </div>

      {/* Selected transition details */}
      <div className="p-3 rounded-xl bg-[#12121e] border border-[#2a2a3e]">
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {TRANSITIONS.find(t => t.id === selected)?.emoji}
          </span>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">
              {TRANSITIONS.find(t => t.id === selected)?.name}
            </div>
            <div className="text-xs text-[#6a6a8e]">
              {TRANSITIONS.find(t => t.id === selected)?.desc}
            </div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-[#2a2a3e]">
          <span className="text-xs text-[#6c5ce7]">
            适用场景: {TRANSITIONS.find(t => t.id === selected)?.useCase}
          </span>
        </div>
      </div>

      {/* All transitions grid */}
      <div className="grid grid-cols-2 gap-2">
        {TRANSITIONS.map(t => (
          <button
            key={t.id}
            onClick={() => setSelected(t.id)}
            className={`p-3 rounded-xl border text-left transition-all ${
              selected === t.id
                ? 'border-[#6c5ce7] bg-[#6c5ce7]/10'
                : 'border-[#2a2a3e] bg-[#1a1a2e] hover:border-[#6c5ce7]/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{t.emoji}</span>
              <span className={`text-sm ${selected === t.id ? 'text-white' : 'text-[#a0a0b8]'}`}>
                {t.name}
              </span>
            </div>
            <div className="text-[10px] text-[#6a6a8e] mt-1">{t.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
