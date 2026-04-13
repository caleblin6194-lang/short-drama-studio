'use client'

import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import Button from '@/components/shared/Button'

type ContinueMode = 'continue' | 'optimize' | 'expand'

export default function ScriptContinuePanel() {
  const { project, updateScript } = useProjectStore()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<ContinueMode>('continue')
  const [result, setResult] = useState<string | null>(null)
  const [tip, setTip] = useState<string | null>(null)

  if (!project) return null

  const handleContinue = async () => {
    setLoading(true)
    setResult(null)
    setTip(null)

    try {
      const res = await fetch('/api/script-continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptText: project.script.rawText,
          mode,
        }),
      })
      const data = await res.json()
      setResult(data.continuation)
      setTip(data.tip)
    } catch {
      setTip('请求失败，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (result) {
      updateScript(project.script.rawText + '\n\n' + result)
      setResult(null)
      setTip(null)
    }
  }

  return (
    <div className="card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-1">✍️ AI 剧本助手</h3>
        <p className="text-xs text-[#6a6a8e]">
          AI 续写、优化或扩展你的剧本内容
        </p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2">
        {([
          ['continue', '续写'],
          ['optimize', '优化对白'],
          ['expand', '扩展细节'],
        ] as [ContinueMode, string][]).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
              mode === m
                ? 'border-[#6c5ce7] bg-[#6c5ce7]/20 text-white'
                : 'border-[#2a2a3e] text-[#a0a6a8e] hover:border-[#6c5ce7]/40'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Button
        onClick={handleContinue}
        loading={loading}
        disabled={!project.script.rawText || project.script.rawText.length < 10}
        className="w-full"
        variant="primary"
      >
        {mode === 'continue' ? 'AI 续写剧本' : mode === 'optimize' ? 'AI 优化对白' : 'AI 扩展细节'}
      </Button>

      {result && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-[#12121e] border border-[#2a2a3e]">
            <div className="text-xs text-[#6c5ce7] mb-2">✨ {tip}</div>
            <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
              {result}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleApply} className="flex-1" variant="primary">
              应用到剧本
            </Button>
            <Button
              onClick={() => { setResult(null); setTip(null) }}
              variant="ghost"
              className="flex-1"
            >
              取消
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
