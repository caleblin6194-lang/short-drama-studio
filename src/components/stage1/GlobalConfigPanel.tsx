'use client'

import { useProjectStore } from '@/store/useProjectStore'
import { DEFAULT_GLOBAL_CONFIG } from '@/types'

const COLOR_GRADING_PRESETS = [
  { value: '', label: '默认（轻微锐化）' },
  { value: 'warm', label: '暖色调' },
  { value: 'cool', label: '冷色调' },
  { value: 'cinematic', label: '电影感（高对比低饱）' },
  { value: 'vivid', label: '鲜艳' },
]

export function GlobalConfigPanel() {
  const project = useProjectStore(s => s.project)
  const updateGlobalConfig = useProjectStore(s => s.updateGlobalConfig)

  const cfg = project?.globalConfig ?? DEFAULT_GLOBAL_CONFIG

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
      <h3 className="text-sm font-semibold text-gray-700">全局风格锁定</h3>

      <div className="space-y-1">
        <label className="text-xs text-gray-500">风格锚词（注入所有图像/视频 prompt）</label>
        <input
          className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
          value={cfg.styleAnchor}
          onChange={e => updateGlobalConfig({ styleAnchor: e.target.value })}
          placeholder="如：赛博朋克风格，霓虹灯光，写实电影感"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-gray-500">光线规则（注入 prompt）</label>
        <input
          className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
          value={cfg.lightingRule}
          onChange={e => updateGlobalConfig({ lightingRule: e.target.value })}
          placeholder="如：左侧柔光，自然光，蓝色冷调灯光"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">色调预设（后期渲染）</label>
          <select
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={cfg.colorGrading}
            onChange={e => updateGlobalConfig({ colorGrading: e.target.value })}
          >
            {COLOR_GRADING_PRESETS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-500">基准随机种子</label>
          <input
            type="number"
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={cfg.globalSeed}
            onChange={e => updateGlobalConfig({ globalSeed: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-gray-500">禁止元素（negative prompt）</label>
        <input
          className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
          value={cfg.prohibitedElements}
          onChange={e => updateGlobalConfig({ prohibitedElements: e.target.value })}
          placeholder="如：模糊，低质量，变形，文字"
        />
      </div>
    </div>
  )
}
