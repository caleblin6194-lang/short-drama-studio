'use client'

import { useState, useEffect, useCallback } from 'react'
import Modal from '@/components/shared/Modal'
import Button from '@/components/shared/Button'
import Spinner from '@/components/shared/Spinner'

interface TrendingTag {
  tag: string
  count: number
  trend: string
  platform: string
}

interface PopularStyle {
  style: string
  desc: string
  emoji: string
  usage: number
}

interface ViralTemplate {
  id: string
  title: string
  desc: string
  tags: string[]
  successRate: string
  emoji: string
}

interface TrendsData {
  trendingTags: TrendingTag[]
  popularStyles: PopularStyle[]
  viralTemplates: ViralTemplate[]
}

interface ViralPanelProps {
  onApplyTemplate?: (template: ViralTemplate) => void
  onApplyStyle?: (style: PopularStyle) => void
}

export default function ViralPanel({ onApplyTemplate, onApplyStyle }: ViralPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<TrendsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<'tags' | 'styles' | 'templates'>('tags')

  useEffect(() => {
    if (isOpen && !data) {
      setIsLoading(true)
      fetch('/api/trends')
        .then(r => r.json())
        .then(d => { setData(d); setIsLoading(false) })
        .catch(() => setIsLoading(false))
    }
  }, [isOpen, data])

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6c5ce7] to-[#a855f7] text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        🔥 Viral+ 工作室
      </button>

      {/* Panel Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#13131f] border border-[#2a2a3e] rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#2a2a3e]">
              <div>
                <h2 className="text-lg font-bold text-white">🔥 Viral+ 工作室</h2>
                <p className="text-xs text-[#a0a0b8] mt-0.5">热点趋势 · 爆款模板 · 流量密码</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-[#6b6b8a] hover:text-white text-xl">×</button>
            </div>

            {/* Section Tabs */}
            <div className="flex border-b border-[#2a2a3e]">
              {([
                { key: 'tags', label: '🔥 热门话题' },
                { key: 'styles', label: '🎨 流行风格' },
                { key: 'templates', label: '📋 爆款模板' },
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
                <div className="py-12 flex justify-center"><Spinner label="加载趋势数据..." /></div>
              )}

              {!isLoading && data && activeSection === 'tags' && (
                <div className="space-y-2">
                  {data.trendingTags.map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-[#1a1a2e] rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold ${i < 3 ? 'text-[#6c5ce7]' : 'text-[#6b6b8a]'}`}>
                          #{i + 1}
                        </span>
                        <div>
                          <p className="text-sm text-white font-medium">{t.tag}</p>
                          <p className="text-[10px] text-[#6b6b8a]">{t.platform} · {t.count.toLocaleString()} 播放</p>
                        </div>
                      </div>
                      <span className={`text-xs font-medium ${t.trend.startsWith('+') ? 'text-[#00b894]' : 'text-red-400'}`}>
                        {t.trend}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && data && activeSection === 'styles' && (
                <div className="space-y-2">
                  {data.popularStyles.map((s, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-[#1a1a2e] rounded-xl">
                      <span className="text-xl mt-0.5">{s.emoji}</span>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{s.style}</p>
                        <p className="text-xs text-[#a0a0b8] mt-0.5">{s.desc}</p>
                        <p className="text-[10px] text-[#6b6b8a] mt-1">使用量: {s.usage.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => onApplyStyle?.(s)}
                        className="text-xs text-[#6c5ce7] hover:underline whitespace-nowrap mt-0.5"
                      >
                        应用
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && data && activeSection === 'templates' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.viralTemplates.map(t => (
                    <div key={t.id} className="p-4 bg-[#1a1a2e] rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{t.emoji}</span>
                        <p className="text-sm text-white font-semibold">{t.title}</p>
                      </div>
                      <p className="text-xs text-[#a0a0b8]">{t.desc}</p>
                      <div className="flex flex-wrap gap-1">
                        {t.tags.map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 bg-[#6c5ce7]/20 text-[#6c5ce7] rounded-full">
                            {tag}
                          </span>
                        ))}
                        <span className="text-[10px] px-2 py-0.5 bg-[#00b894]/20 text-[#00b894] rounded-full">
                          成功率 {t.successRate}
                        </span>
                      </div>
                      <Button
                        onClick={() => onApplyTemplate?.(t)}
                        size="sm"
                        className="w-full mt-2"
                        variant="primary"
                      >
                        使用此模板
                      </Button>
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
