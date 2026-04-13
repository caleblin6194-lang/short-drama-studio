'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/shared/Button'
import Spinner from '@/components/shared/Spinner'
import { useProjectStore } from '@/store/useProjectStore'

interface StoryTemplate {
  id: string
  name: string
  category: string
  description: string
  scriptTemplate: string
  emoji: string
  estimatedDuration: string
  tags: string[]
  popularity: number
}

interface StylePreset {
  id: string
  name: string
  artStyle: string
  aspectRatio: string
  castEthnicity: string
  language: string
  mood: string
  palette: string[]
}

interface TemplatesData {
  storyTemplates: StoryTemplate[]
  stylePresets: StylePreset[]
}

interface TemplateLibraryProps {
  onApplyTemplate?: (template: StoryTemplate) => void
  onApplyPreset?: (preset: StylePreset) => void
}

export default function TemplateLibrary({ onApplyTemplate, onApplyPreset }: TemplateLibraryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<TemplatesData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<'templates' | 'presets'>('templates')
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const { project, updateScript } = useProjectStore()

  useEffect(() => {
    if (isOpen && !data) {
      setIsLoading(true)
      fetch('/api/templates')
        .then(r => r.json())
        .then(d => { setData(d); setIsLoading(false) })
        .catch(() => setIsLoading(false))
    }
  }, [isOpen, data])

  const handleUseTemplate = (template: StoryTemplate) => {
    if (project) {
      updateScript(`【${template.name}】\n\n${template.scriptTemplate}`)
    }
    onApplyTemplate?.(template)
    setIsOpen(false)
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a1a2e] border border-[#2a2a3e] text-white text-sm hover:border-[#6c5ce7]/50 transition-colors"
      >
        📚 模板库
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#13131f] border border-[#2a2a3e] rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#2a2a3e]">
              <div>
                <h2 className="text-lg font-bold text-white">📚 模板库</h2>
                <p className="text-xs text-[#a0a0b8] mt-0.5">预制故事模板 · 风格预设 · 快速启动创作</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-[#6b6b8a] hover:text-white text-xl">×</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#2a2a3e]">
              {([
                { key: 'templates', label: '📝 故事模板' },
                { key: 'presets', label: '🎨 风格预设' },
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
                <div className="py-12 flex justify-center"><Spinner label="加载模板..." /></div>
              )}

              {/* Story Templates */}
              {!isLoading && data && activeSection === 'templates' && (
                <div className="space-y-3">
                  {data.storyTemplates.map(t => (
                    <div key={t.id} className="bg-[#1a1a2e] rounded-xl overflow-hidden">
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedTemplate(expandedTemplate === t.id ? null : t.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{t.emoji}</span>
                            <div>
                              <p className="text-sm text-white font-semibold">{t.name}</p>
                              <p className="text-[10px] text-[#6b6b8a]">{t.category} · {t.estimatedDuration}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#6c5ce7]">🔥 {t.popularity}%</span>
                            <span className="text-[#6b6b8a] text-sm">{expandedTemplate === t.id ? '▲' : '▼'}</span>
                          </div>
                        </div>
                        <p className="text-xs text-[#a0a0b8] mt-2">{t.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {t.tags.map(tag => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 bg-[#2a2a3e] text-[#a0a0b8] rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Expanded content */}
                      {expandedTemplate === t.id && (
                        <div className="border-t border-[#2a2a3e] p-4 space-y-3">
                          <div>
                            <p className="text-[10px] text-[#6c5ce7] font-medium mb-1.5">脚本模板</p>
                            <pre className="text-xs text-[#a0a0b8] whitespace-pre-wrap bg-[#13131f] rounded-lg p-3 font-sans leading-relaxed">
                              {t.scriptTemplate}
                            </pre>
                          </div>
                          <Button
                            onClick={() => handleUseTemplate(t)}
                            variant="primary"
                            size="sm"
                            className="w-full"
                          >
                            使用此模板
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Style Presets */}
              {!isLoading && data && activeSection === 'presets' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.stylePresets.map(p => (
                    <div key={p.id} className="bg-[#1a1a2e] rounded-xl p-4 space-y-3">
                      {/* Palette preview */}
                      <div className="flex rounded-lg overflow-hidden h-16">
                        {p.palette.map((color, i) => (
                          <div key={i} className="flex-1" style={{ backgroundColor: color }} title={color} />
                        ))}
                      </div>
                      <div>
                        <p className="text-sm text-white font-semibold">{p.name}</p>
                        <p className="text-[10px] text-[#6b6b8a]">风格: {p.artStyle}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="bg-[#13131f] rounded p-1.5">
                          <span className="text-[#6b6b8a]">比例</span>
                          <p className="text-white mt-0.5">{p.aspectRatio}</p>
                        </div>
                        <div className="bg-[#13131f] rounded p-1.5">
                          <span className="text-[#6b6b8a]">调性</span>
                          <p className="text-white mt-0.5">{p.mood}</p>
                        </div>
                        <div className="bg-[#13131f] rounded p-1.5">
                          <span className="text-[#6b6b8a]">语言</span>
                          <p className="text-white mt-0.5">{p.language}</p>
                        </div>
                        <div className="bg-[#13131f] rounded p-1.5">
                          <span className="text-[#6b6b8a]">演员</span>
                          <p className="text-white mt-0.5">{p.castEthnicity}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => { onApplyPreset?.(p); setIsOpen(false) }}
                        size="sm"
                        className="w-full"
                      >
                        应用预设
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
