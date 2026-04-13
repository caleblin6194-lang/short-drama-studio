'use client'

import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import Button from '@/components/shared/Button'

type PolishMode = 'dialogue' | 'narrative' | 'emotion'

export default function DialoguePolishPanel() {
  const { project, updateScript } = useProjectStore()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<PolishMode>('dialogue')
  const [result, setResult] = useState<{ original: string; polished: string } | null>(null)

  if (!project) return null

  const scriptText = project.script.rawText

  const handlePolish = async () => {
    if (!scriptText || scriptText.length < 10) return
    setLoading(true)
    setResult(null)

    await new Promise(r => setTimeout(r, 1500))

    const modeConfig = {
      dialogue: {
        desc: '口语化台词',
        transform: (text: string) => {
          // Convert narrative to dialogue
          return text
            .replace(/他/gi, '男主')
            .replace(/她/gi, '女主')
        },
      },
      narrative: {
        desc: '叙述性文字',
        transform: (text: string) => {
          return text + '\n\n（叙述：这段剧情展现了人物内心的矛盾与挣扎，为后续冲突埋下伏笔。）'
        },
      },
      emotion: {
        desc: '情绪强化',
        transform: (text: string) => {
          return text
            .replace(/说/gi, '颤抖着说')
            .replace(/道/gi, '哽咽道')
        },
      },
    }

    const config = modeConfig[mode]
    const polished = config.transform(scriptText)

    setResult({ original: scriptText, polished })
    setLoading(false)
  }

  const handleApply = () => {
    if (result) {
      updateScript(result.polished)
      setResult(null)
    }
  }

  return (
    <div className="card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-1">💬 对话智能润色</h3>
        <p className="text-xs text-[#6a6a8e]">
          将叙述性文字转为角色对话，强化情绪表达
        </p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2">
        {([
          ['dialogue', '口语化'],
          ['emotion', '情绪强化'],
          ['narrative', '补充旁白'],
        ] as [PolishMode, string][]).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
              mode === m
                ? 'border-[#6c5ce7] bg-[#6c5ce7]/20 text-white'
                : 'border-[#2a2a3e] text-[#6a6a8e] hover:border-[#6c5ce7]/40'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Button
        onClick={handlePolish}
        loading={loading}
        disabled={!scriptText || scriptText.length < 10}
        className="w-full"
        variant="primary"
      >
        {loading ? '润色中...' : '✨ 一键润色'}
      </Button>

      {result && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-[#12121e] border border-[#2a2a3e]">
            <div className="text-xs text-[#6a6a8e] mb-2">原文</div>
            <p className="text-sm text-[#a0a0b8] leading-relaxed line-clamp-3">
              {result.original}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#12121e] border border-[#6c5ce7]/30">
            <div className="text-xs text-[#6c5ce7] mb-2">✨ 润色后</div>
            <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
              {result.polished}
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleApply} className="flex-1" variant="primary">
              应用到剧本
            </Button>
            <Button
              onClick={() => setResult(null)}
              variant="ghost"
              className="flex-1"
            >
              取消
            </Button>
          </div>
        </div>
      )}

      {!scriptText && (
        <div className="text-center py-2 text-xs text-[#6a6a8e]">
          请先输入剧本内容
        </div>
      )}
    </div>
  )
}
