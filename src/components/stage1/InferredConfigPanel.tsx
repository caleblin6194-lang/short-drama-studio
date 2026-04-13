'use client'

import { useProjectStore } from '@/store/useProjectStore'
import { ART_STYLE_LABELS, ETHNICITY_LABELS } from '@/lib/constants'

export default function InferredConfigPanel() {
  const project = useProjectStore(s => s.project)
  if (!project) return null

  const c = project.inferredConfig
  const rows: [string, string][] = [
    ['画幅', c.aspectRatio],
    ['画风', ART_STYLE_LABELS[c.artStyle] || c.artStyle],
    ['模型策略', c.modelStrategy],
    ['演员族裔', ETHNICITY_LABELS[c.castEthnicity] || c.castEthnicity],
    ['语言', c.language],
    ['发布平台', c.targetPlatforms.join(', ')],
    ['单集时长', `${c.episodeLengthSec}s`],
    ['推荐镜头数', `${c.recommendedShotCount}`],
  ]

  return (
    <div className="card p-4">
      <h3 className="text-sm font-medium text-[#a0a0b8] mb-3">🔧 自动推导配置</h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm py-1">
            <span className="text-[#a0a0b8]">{label}</span>
            <span className="text-white font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
