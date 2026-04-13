'use client'

import { SubtitleStyle, SUBTITLE_PRESETS, SubtitleAnimation } from '@/types'

interface SubtitleStylePanelProps {
  style: SubtitleStyle
  onChange: (style: SubtitleStyle) => void
}

const ANIMATION_LABELS: Record<SubtitleAnimation, string> = {
  none: '无',
  fade: '淡入淡出',
  typewriter: '打字机',
  bounce: '弹跳',
  karaoke: '卡拉OK',
  slide: '滑入',
}

export default function SubtitleStylePanel({ style, onChange }: SubtitleStylePanelProps) {
  return (
    <div className="card p-4 space-y-5">
      <h3 className="text-sm font-medium text-[#a0a0b8]">✏️ 字幕样式</h3>

      {/* 预设 */}
      <div>
        <label className="text-xs text-[#6a6a8e] mb-2 block">预设模板</label>
        <div className="grid grid-cols-2 gap-2">
          {SUBTITLE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => onChange(preset.value)}
              className={`px-3 py-2 rounded-lg text-xs text-left transition-all cursor-pointer border ${
                style.animation === preset.value.animation &&
                style.position === preset.value.position &&
                style.fontColor === preset.value.fontColor
                  ? 'border-[#6c5ce7] bg-[#6c5ce7]/10 text-white'
                  : 'border-[#2a2a3e] bg-[#1a1a2e] text-[#a0a0b8] hover:border-[#6c5ce7]/50'
              }`}
            >
              <div className="font-medium">{preset.label}</div>
              <div className="text-[10px] mt-0.5 opacity-60">
                {ANIMATION_LABELS[preset.value.animation]} · {preset.value.position === 'bottom' ? '底部' : preset.value.position === 'top' ? '顶部' : '居中'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 动画类型 */}
      <div>
        <label className="text-xs text-[#6a6a8e] mb-2 block">动画效果</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ANIMATION_LABELS) as SubtitleAnimation[]).map((anim) => (
            <button
              key={anim}
              onClick={() => onChange({ ...style, animation: anim })}
              className={`px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer border ${
                style.animation === anim
                  ? 'border-[#6c5ce7] bg-[#6c5ce7]/20 text-white'
                  : 'border-[#2a2a3e] text-[#a0a0b8] hover:border-[#6c5ce7]/40'
              }`}
            >
              {ANIMATION_LABELS[anim]}
            </button>
          ))}
        </div>
      </div>

      {/* 位置 */}
      <div>
        <label className="text-xs text-[#6a6a8e] mb-2 block">显示位置</label>
        <div className="flex gap-2">
          {(['bottom', 'top', 'center'] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => onChange({ ...style, position: pos })}
              className={`flex-1 py-1.5 rounded-lg text-xs transition-all cursor-pointer border ${
                style.position === pos
                  ? 'border-[#6c5ce7] bg-[#6c5ce7]/20 text-white'
                  : 'border-[#2a2a3e] text-[#a0a0b8] hover:border-[#6c5ce7]/40'
              }`}
            >
              {pos === 'bottom' ? '底部' : pos === 'top' ? '顶部' : '居中'}
            </button>
          ))}
        </div>
      </div>

      {/* 字号 */}
      <div>
        <label className="text-xs text-[#6a6a8e] mb-2 block">字号</label>
        <div className="flex gap-2">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <button
              key={size}
              onClick={() => onChange({ ...style, fontSize: size })}
              className={`flex-1 py-1.5 rounded-lg text-xs transition-all cursor-pointer border ${
                style.fontSize === size
                  ? 'border-[#6c5ce7] bg-[#6c5ce7]/20 text-white'
                  : 'border-[#2a2a3e] text-[#a0a0b8] hover:border-[#6c5ce7]/40'
              }`}
            >
              {size === 'sm' ? '小' : size === 'md' ? '中' : '大'}
            </button>
          ))}
        </div>
      </div>

      {/* 背景开关 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-white">字幕背景</span>
        <button
          onClick={() => onChange({ ...style, backgroundEnabled: !style.backgroundEnabled })}
          className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${style.backgroundEnabled ? 'bg-[#6c5ce7]' : 'bg-[#2a2a3e]'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${style.backgroundEnabled ? 'left-5.5' : 'left-0.5'}`} />
        </button>
      </div>

      {/* 颜色预览 */}
      {style.backgroundEnabled && (
        <div>
          <label className="text-xs text-[#6a6a8e] mb-2 block">背景透明度</label>
          <div className="flex gap-2">
            {['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.85)'].map((bg) => (
              <button
                key={bg}
                onClick={() => onChange({ ...style, backgroundColor: bg })}
                className={`flex-1 h-8 rounded-lg transition-all cursor-pointer border ${
                  style.backgroundColor === bg
                    ? 'border-[#6c5ce7] ring-1 ring-[#6c5ce7]'
                    : 'border-[#2a2a3e]'
                }`}
                style={{ backgroundColor: bg }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
