'use client'

import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/useProjectStore'
import TagSelector from '@/components/stage1/TagSelector'
import InferredConfigPanel from '@/components/stage1/InferredConfigPanel'
import SmartPick from '@/components/shared/SmartPick'
import EmotionalArcPanel from '@/components/stage1/EmotionalArcPanel'
import OpeningPicker from '@/components/stage1/OpeningPicker'
import ScriptEditor from '@/components/stage1/ScriptEditor'
import ScriptContinuePanel from '@/components/stage1/ScriptContinuePanel'
import Button from '@/components/shared/Button'

export default function Stage1Page() {
  const { project, setStage } = useProjectStore()
  const router = useRouter()

  if (!project) return null

  const canProceed = !!project.tagSet.type && project.script.rawText.length > 10

  const handleNext = () => {
    setStage(2)
    router.push(`/project/${project.id}/stage2`)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">第一步：故事</h2>
        <p className="text-sm text-[#a0a0b8]">选择标签定义你的短剧，AI 自动推导拍摄参数</p>
      </div>

      {/* 标签选择 */}
      <TagSelector />

      {/* 自动推导配置 */}
      <InferredConfigPanel />

      {/* Smart Pick */}
      <SmartPick />

      {/* 情绪曲线 */}
      <EmotionalArcPanel />

      {/* 开场白 */}
      <OpeningPicker />

      {/* 剧本编辑器 */}
      <ScriptEditor />

      {/* AI 剧本助手 */}
      <ScriptContinuePanel />

      {/* 下一步 */}
      <div className="flex justify-end pt-4 border-t border-[#2a2a3e]">
        <Button onClick={handleNext} disabled={!canProceed} size="lg">
          下一步：剧组筹备 →
        </Button>
      </div>
    </div>
  )
}
