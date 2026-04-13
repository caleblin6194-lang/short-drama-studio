'use client'

import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import Button from '@/components/shared/Button'

const HOOK_TYPES = [
  { id: 'suspense', label: '悬念钩子', emoji: '❓', desc: '留下未解之谜，吸引追看' },
  { id: 'conflict', label: '冲突爆发', emoji: '⚡', desc: '矛盾激化到顶点突然中断' },
  { id: 'twist', label: '反转冲击', emoji: '🔄', desc: '剧情突然反转，打破预期' },
  { id: 'dilemma', label: '两难抉择', emoji: '⚖️', desc: '角色面临艰难选择，无从预料' },
  { id: 'revelation', label: '惊天揭秘', emoji: '💥', desc: '隐藏真相突然曝光' },
]

export default function CliffhangerPanel() {
  const { project } = useProjectStore()
  const [selectedHook, setSelectedHook] = useState<string>('suspense')
  const [generated, setGenerated] = useState('')
  const [loading, setLoading] = useState(false)

  if (!project) return null

  const lastEpisode = project.episodes[project.episodes.length - 1]
  const lastShot = project.shots[project.shots.length - 1]
  const hasContent = project.shots.length > 0

  const handleGenerate = async () => {
    setLoading(true)
    setGenerated('')

    // Simulate AI generating a cliffhanger hook
    await new Promise(r => setTimeout(r, 1500))

    const templates: Record<string, string[]> = {
      suspense: [
        '就在所有人都以为一切尘埃落定时，男主的手机再次响起。屏幕上显示的号码，让他的脸色瞬间苍白——那是三年前已经「死去」的人。',
        '特写：一份文件落在桌上，封面印着「血脉鉴定」四个字。',
      ],
      conflict: [
        '"你真的要这样做吗？"女主含泪问道。\n\n男主沉默三秒，转身走向门口，"这是唯一的选择。"\n\n门在他身后关上的一刻，手机响了——对方已经同意签字。',
        '会议室里，所有人屏住呼吸等待最终投票结果。赞成票：51%。反对票：49%。\n\n院长缓缓站起身："那么，提议通过。"\n\n全场哗然。',
      ],
      twist: [
        '"他不可能是凶手，"侦探说，"因为——"\n\n话音未落，投影幕突然切换画面。全场陷入死寂。\n\n画面里，正在播放的正是三小时前的监控录像。',
        '养女轻轻笑了："爸，你知道我为什么选择这里吗？"她指向窗外的摩天大楼，"因为三年前，我从那栋楼跳下来的时候，就是在这个位置。"',
      ],
      dilemma: [
        '两个按钮摆在他面前。\n\n左边，是让一切回归平静的代价。\n右边，是他等待了三年的真相。\n\n"你只有十秒做出选择。"',
        '男主手里握着u盘，里面是能够洗清她罪名的证据。\n\n门外，警笛声越来越近。\n\n他看着她，她也看着他。',
      ],
      revelation: [
        '"你知道为什么他总是看向那张照片吗？"老人缓缓说道，"因为照片背面写着一个地址——而那个地址，正是你现在站的这个地方。"',
        '女主颤抖着手打开那份尘封的档案。\n\n第一页，患者姓名：陈默。\n诊断结果：妄想型精神分裂症。\n入院日期：三年前。',
      ],
    }

    const options = templates[selectedHook]
    const result = options[Math.floor(Math.random() * options.length)]
    setGenerated(result)
    setLoading(false)
  }

  return (
    <div className="card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-1">🎣 悬念结尾优化</h3>
        <p className="text-xs text-[#6a6a8e]">
          最后一集自动生成悬念钩子，提升追剧率
        </p>
      </div>

      {/* Current last episode info */}
      {lastEpisode && (
        <div className="p-3 rounded-xl bg-[#12121e] border border-[#2a2a3e]">
          <div className="text-xs text-[#6a6a8e]">当前最后剧集</div>
          <div className="text-sm text-white font-medium mt-1">
            第{lastEpisode.number}集 · {lastEpisode.title}
          </div>
          <div className="text-xs text-[#6c5ce7] mt-1">
            情绪基调：{lastEpisode.emotionalTone === 'cliffhanger' ? '❓ 悬念' : lastEpisode.emotionalTone}
          </div>
        </div>
      )}

      {/* Hook type selector */}
      <div>
        <label className="text-xs text-[#a0a0b8] mb-2 block">选择悬念类型</label>
        <div className="grid grid-cols-1 gap-2">
          {HOOK_TYPES.map(h => (
            <button
              key={h.id}
              onClick={() => setSelectedHook(h.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedHook === h.id
                  ? 'border-[#6c5ce7] bg-[#6c5ce7]/10'
                  : 'border-[#2a2a3e] bg-[#1a1a2e] hover:border-[#6c5ce7]/40'
              }`}
            >
              <span className="text-xl">{h.emoji}</span>
              <div>
                <div className={`text-sm ${selectedHook === h.id ? 'text-white' : 'text-[#a0a0b8]'}`}>
                  {h.label}
                </div>
                <div className="text-xs text-[#6a6a8e]">{h.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        loading={loading}
        disabled={!hasContent}
        variant="primary"
        className="w-full"
      >
        {loading ? 'AI 构思中...' : '✨ 生成悬念结尾'}
      </Button>

      {/* Generated result */}
      {generated && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-[#12121e] border border-[#6c5ce7]/30">
            <div className="text-xs text-[#6c5ce7] mb-2">🎬 生成的悬念结尾</div>
            <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
              {generated}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => { setGenerated('') }}
              className="flex-1"
              variant="primary"
            >
              应用到最后一集
            </Button>
            <Button
              onClick={handleGenerate}
              variant="ghost"
              className="flex-1"
            >
              换一个
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
