'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/shared/Button'
import Spinner from '@/components/shared/Spinner'

interface CreativeBrief {
  id: string
  title: string
  genre: string
  hooks: string[]
  keyScenes: string[]
  tone: string
  emoji: string
}

interface MoodBoard {
  id: string
  title: string
  palette: string[]
  keywords: string[]
  desc: string
}

interface SuccessfulExample {
  id: string
  title: string
  platform: string
  views: string
  likes: string
  keyFactor: string
  tags: string[]
}

interface InspirationData {
  creativeBriefs: CreativeBrief[]
  moodBoards: MoodBoard[]
  successfulExamples: SuccessfulExample[]
}

interface InspirationCenterProps {
  onApplyBrief?: (brief: CreativeBrief) => void
}

export default function InspirationCenter({ onApplyBrief }: InspirationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<InspirationData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<'briefs' | 'boards' | 'examples'>('briefs')

  useEffect(() => {
    if (isOpen && !data) {
      setIsLoading(true)
      fetch('/api/inspiration')
        .then(r => r.json())
        .then(d => { setData(d); setIsLoading(false) })
        .catch(() => setIsLoading(false))
    }
  }, [isOpen, data])

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a1a2e] border border-[#2a2a3e] text-white text-sm hover:border-[#6c5ce7]/50 transition-colors"
      >
        💡 灵感中心
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#13131f] border border-[#2a2a3e] rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#2a2a3e]">
              <div>
                <h2 className="text-lg font-bold text-white">💡 灵感中心</h2>
                <p className="text-xs text-[#a0a0b8] mt-0.5">创意简报 · 情绪板 · 成功案例</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-[#6b6b8a] hover:text-white text-xl">×</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#2a2a3e]">
              {([
                { key: 'briefs', label: '📝 创意简报' },
                { key: 'boards', label: '🎨 情绪板' },
                { key: 'examples', label: '🏆 成功案例' },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSection(tab.key)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    activeSection === tab.key
                      ? 'text-[#6c5ce7] border-b-2 border-[#6c5ce7]'
                      : 'text-[#6b6b8a] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {isLoading && (
                <div className="py-12 flex justify-center"><Spinner label="加载灵感..." /></div>
              )}

              {/* Creative Briefs */}
              {!isLoading && data && activeSection === 'briefs' && (
                <div className="space-y-3">
                  {data.creativeBriefs.map(brief => (
                    <div key={brief.id} className="p-4 bg-[#1a1a2e] rounded-xl space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{brief.emoji}</span>
                        <div>
                          <p className="text-sm text-white font-semibold">{brief.title}</p>
                          <p className="text-[10px] text-[#6b6b8a]">{brief.genre} · {brief.tone}</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-[#6c5ce7] font-medium">钩子 Hooks</p>
                        <div className="flex flex-wrap gap-1">
                          {brief.hooks.map(h => (
                            <span key={h} className="text-[10px] px-2 py-0.5 bg-[#6c5ce7]/10 text-[#6c5ce7] rounded-full">
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-[#00b894] font-medium">关键场景</p>
                        <div className="flex flex-wrap gap-1">
                          {brief.keyScenes.map(s => (
                            <span key={s} className="text-[10px] px-2 py-0.5 bg-[#00b894]/10 text-[#00b894] rounded-full">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Button
                        onClick={() => { onApplyBrief?.(brief); setIsOpen(false) }}
                        size="sm"
                        variant="primary"
                        className="w-full mt-1"
                      >
                        使用此简报创作
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Mood Boards */}
              {!isLoading && data && activeSection === 'boards' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.moodBoards.map(board => (
                    <div key={board.id} className="p-4 bg-[#1a1a2e] rounded-xl space-y-3">
                      {/* Color Palette */}
                      <div className="flex gap-1 rounded-lg overflow-hidden">
                        {board.palette.map((color, i) => (
                          <div key={i} className="flex-1 h-12" style={{ backgroundColor: color }} title={color} />
                        ))}
                      </div>
                      <p className="text-sm text-white font-semibold">{board.title}</p>
                      <p className="text-xs text-[#a0a0b8]">{board.desc}</p>
                      <div className="flex flex-wrap gap-1">
                        {board.keywords.map(k => (
                          <span key={k} className="text-[10px] px-2 py-0.5 bg-[#2a2a3e] text-[#a0a0b8] rounded-full">
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Successful Examples */}
              {!isLoading && data && activeSection === 'examples' && (
                <div className="space-y-3">
                  {data.successfulExamples.map(ex => (
                    <div key={ex.id} className="p-4 bg-[#1a1a2e] rounded-xl space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm text-white font-semibold">{ex.title}</p>
                          <p className="text-[10px] text-[#6b6b8a]">{ex.platform}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-white">👁 {ex.views}</p>
                          <p className="text-[10px] text-[#00b894]">❤️ {ex.likes}</p>
                        </div>
                      </div>
                      <p className="text-xs text-[#a0a0b8]">🔥 成功关键：{ex.keyFactor}</p>
                      <div className="flex flex-wrap gap-1">
                        {ex.tags.map(t => (
                          <span key={t} className="text-[10px] px-2 py-0.5 bg-[#6c5ce7]/10 text-[#6c5ce7] rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
