'use client'

import { useProjectStore } from '@/store/useProjectStore'
import Button from '@/components/shared/Button'

export default function ScriptEditor() {
  const { project, updateScript, extendScript, isExtendingScript } = useProjectStore()
  if (!project) return null

  const script = project.script

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[#a0a0b8]">📝 剧本</h3>
        <div className="flex items-center gap-3 text-xs text-[#a0a0b8]">
          <span>{script.characterCount} 字</span>
          <span>≈ {script.estimatedDurationSec}s</span>
        </div>
      </div>

      <textarea
        value={script.rawText}
        onChange={e => updateScript(e.target.value)}
        placeholder="在此编写或粘贴你的短剧剧本..."
        className="w-full h-64 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg p-4 text-sm text-white placeholder-[#a0a0b8]/50 resize-y focus:outline-none focus:border-[#6c5ce7] transition-colors"
      />

      <div className="flex justify-end mt-3">
        <Button size="sm" variant="secondary" onClick={extendScript} loading={isExtendingScript}>
          AI 续写
        </Button>
      </div>
    </div>
  )
}
