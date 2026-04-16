'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import TagSelector from '@/components/stage1/TagSelector'
import InferredConfigPanel from '@/components/stage1/InferredConfigPanel'
import SmartPick from '@/components/shared/SmartPick'
import EmotionalArcPanel from '@/components/stage1/EmotionalArcPanel'
import OpeningPicker from '@/components/stage1/OpeningPicker'
import ScriptEditor from '@/components/stage1/ScriptEditor'
import ScriptContinuePanel from '@/components/stage1/ScriptContinuePanel'
import HookLibraryPanel from '@/components/stage1/HookLibraryPanel'
import RetentionAdvisor from '@/components/stage1/RetentionAdvisor'
import DialoguePolishPanel from '@/components/stage1/DialoguePolishPanel'
import Button from '@/components/shared/Button'
import CollapsiblePanel from '@/components/shared/CollapsiblePanel'

export default function Stage1Page() {
  const { project, setStage, setTitle } = useProjectStore()
  const router = useRouter()
  const [titleInput, setTitleInput] = useState(project?.title ?? '')
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false)

  if (!project) return null

  const canProceed = !!project.tagSet.type && project.script.rawText.length > 10

  const handleTitleChange = (v: string) => {
    setTitleInput(v)
    setTitle(v)
  }

  const handleAIGenerateTitle = async () => {
    if (!project.script.rawText) return
    setIsGeneratingTitle(true)
    try {
      const res = await fetch('/api/title/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptText: project.script.rawText, genre: project.tagSet.type }),
      })
      const data = await res.json()
      if (data.title) {
        setTitleInput(data.title)
        setTitle(data.title)
      }
    } catch {}
    setIsGeneratingTitle(false)
  }

  const handleNext = () => {
    if (titleInput) setTitle(titleInput)
    setStage(2)
    router.push(`/project/${project.id}/stage2`)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">第一步：故事</h2>
        <p className="text-sm text-[#a0a0b8]">选择标签定义你的短剧，AI 自动推导拍摄参数</p>
      </div>

      {/* 短剧名称 */}
      <div className="card p-4">
        <label className="block text-sm font-medium text-[#a0a0b8] mb-2">短剧名称</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={titleInput}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="给你的短剧起个吸引人的名字..."
            className="flex-1 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-[#4a4a6e] focus:outline-none focus:border-[#6366f1] transition-colors"
            maxLength={30}
          />
          <Button
            variant="secondary"
            size="md"
            onClick={handleAIGenerateTitle}
            loading={isGeneratingTitle}
            disabled={!project.script.rawText}
            title={!project.script.rawText ? '请先填写剧本' : 'AI 根据剧本自动生成名称'}
          >
            ✨ AI 生成
          </Button>
        </div>
      </div>

      {/* 标签选择 */}
      <TagSelector />

      {/* Smart Pick */}
      <SmartPick />

      {/* 剧本编辑器 - 核心功能保持展开 */}
      <ScriptEditor />

      {/* 自动推导配置 */}
      <CollapsiblePanel title="自动推导配置" icon="🔧">
        <InferredConfigPanel />
      </CollapsiblePanel>

      {/* 情绪曲线 */}
      <CollapsiblePanel title="情绪曲线" icon="📈">
        <EmotionalArcPanel />
      </CollapsiblePanel>

      {/* 开场白 */}
      <CollapsiblePanel title="开场白" icon="🎬">
        <OpeningPicker />
      </CollapsiblePanel>

      {/* AI 剧本助手 */}
      <CollapsiblePanel title="AI 剧本助手" icon="✍️">
        <ScriptContinuePanel />
      </CollapsiblePanel>

      {/* 爆款桥段库 */}
      <CollapsiblePanel title="爆款桥段库" icon="💥">
        <HookLibraryPanel />
      </CollapsiblePanel>

      {/* 完播率优化分析 */}
      <CollapsiblePanel title="完播率优化分析" icon="📊">
        <RetentionAdvisor />
      </CollapsiblePanel>

      {/* 对话智能润色 */}
      <CollapsiblePanel title="对话智能润色" icon="💬">
        <DialoguePolishPanel />
      </CollapsiblePanel>

      {/* 下一步 */}
      <div className="flex justify-end pt-4 border-t border-[#2a2a3e]">
        <Button onClick={handleNext} disabled={!canProceed} size="lg">
          下一步：剧组筹备 →
        </Button>
      </div>
    </div>
  )
}
