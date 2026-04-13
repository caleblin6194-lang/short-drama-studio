'use client'

import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import Button from '@/components/shared/Button'

export type HookType = 'suspense_open' | 'conflict_open' | 'revelation_open' | 'emotional_open' | 'action_open' | 'comedy_open'
export type PlotTwist = 'identity_twist' | 'betrayal_twist' | 'timing_twist' | 'power_twist' | 'past_reveal' | 'false_hope'

interface HookTemplate {
  id: HookType
  label: string
  emoji: string
  useFor: 'opening' | 'middle' | 'ending'
  score: number
  templates: string[]
}

const HOOK_TEMPLATES: HookTemplate[] = [
  {
    id: 'suspense_open',
    label: '悬念开场',
    emoji: '❓',
    useFor: 'opening',
    score: 9.5,
    templates: [
      '"你知道他为什么总是看向那张照片吗？"三年后，真相终于浮出水面。',
      '所有人都在问他是谁。三年后，他带着秘密回来了。',
      '特写：一份DNA报告摆在桌上。结论：亲子关系——不符。',
    ],
  },
  {
    id: 'conflict_open',
    label: '冲突开场',
    emoji: '⚡',
    useFor: 'opening',
    score: 9.2,
    templates: [
      '"这是最后一次机会。"她把文件扔在他面前，"要么签字，要么——"',
      '总裁办公室内，气压低至冰点。所有高管都不敢出声。',
      '"你确定要这么做？"他冷笑，"三年前你也是这么说的。"',
    ],
  },
  {
    id: 'revelation_open',
    label: '揭秘开场',
    emoji: '💥',
    useFor: 'opening',
    score: 9.0,
    templates: [
      '所有人都不知道，这个看起来普通的司机，其实是集团真正的创始人。',
      '三年前死去的那个男人，此刻正站在她身后。',
      '原来所谓的"破产"，不过是他一手策划的棋局。',
    ],
  },
  {
    id: 'emotional_open',
    label: '情感开场',
    emoji: '💔',
    useFor: 'opening',
    score: 8.8,
    templates: [
      '三年了，他终于鼓起勇气，站在她家楼下。',
      '她颤抖着手打开那封信。读完的那一刻，天塌了。',
      '他们相爱十年，结婚三年，却在这一刻形同陌路。',
    ],
  },
  {
    id: 'action_open',
    label: '动作开场',
    emoji: '🏃',
    useFor: 'opening',
    score: 8.5,
    templates: [
      '雨夜，狂奔的脚步声。一辆黑色轿车紧追不舍。',
      '他从火海中走出来，身后的别墅化为灰烬。',
      '砰的一声，门被踢开。"不许动！"',
    ],
  },
  {
    id: 'comedy_open',
    label: '反转喜剧开场',
    emoji: '😂',
    useFor: 'opening',
    score: 8.3,
    templates: [
      '"老婆，我说我没钱你信吗？"他尴尬地笑了笑。',
      '所有人都以为他是窝囊废。直到那天，他亮出了真实身份。',
      '一觉醒来，她发现自己躺在陌生男人身边——是自己的老板。',
    ],
  },
]

const PLOT_TWISTS: { id: PlotTwist; label: string; emoji: string; templates: string[] }[] = [
  {
    id: 'identity_twist',
    label: '身份反转',
    emoji: '🎭',
    templates: [
      '养女其实是失散多年的亲妹妹。',
      '"爸，你知道她是谁吗？"他指着病床上的女人，"她是妈妈的亲生女儿。"',
      '一直针对她的继母，其实是生母派来的保护者。',
    ],
  },
  {
    id: 'betrayal_twist',
    label: '背叛反转',
    emoji: '🗡️',
    templates: [
      '最信任的兄弟，就是最大的内鬼。',
      '"从一开始，我就是在利用你。"',
      '她以为自己在复仇，其实不过是别人棋盘上的一颗棋子。',
    ],
  },
  {
    id: 'timing_twist',
    label: '时机反转',
    emoji: '⏰',
    templates: [
      '她来得太晚了。他已经在她来之前的三分钟，闭上了眼睛。',
      '三年前的机会，三年前的人，三年前的一切——都回不去了。',
      '就在他签字的前一秒，手机响了：手术成功了。',
    ],
  },
  {
    id: 'power_twist',
    label: '权力反转',
    emoji: '👑',
    templates: [
      '"你们以为是谁在操控这个局面？"他缓缓站起身。',
      '原来所谓的"甲方爸爸"，不过是他旗下的子公司。',
      '全场安静。他放下酒杯："既然大家这么感兴趣，我就宣布一件事——"',
    ],
  },
  {
    id: 'past_reveal',
    label: '往事揭秘',
    emoji: '📜',
    templates: [
      '"你以为你了解他？"老人冷笑，"三年前那场火灾，不是意外。"',
      '档案打开。三年前的真相，终于水落石出。',
      '照片背后写着一个地址——正是他三年前逃离的地方。',
    ],
  },
  {
    id: 'false_hope',
    label: '假希望',
    emoji: '🎈',
    templates: [
      '医生说：找到了匹配的骨髓。全场欢呼。三天后，配型失败。',
      '"我们找到他了！"一个月后，尸体被发现在郊外。',
      '"她还有救！"所有人都在庆祝。唯有他知道，这是他策划的最后一幕。',
    ],
  },
]

export default function HookLibraryPanel() {
  const { project } = useProjectStore()
  const [selectedHook, setSelectedHook] = useState<HookType | null>(null)
  const [selectedTwist, setSelectedTwist] = useState<PlotTwist | null>(null)
  const [appliedHook, setAppliedHook] = useState('')
  const [appliedTwist, setAppliedTwist] = useState('')
  const [mode, setMode] = useState<'hook' | 'twist'>('hook')

  if (!project) return null

  const scriptText = project.script.rawText

  const handleGenerateHook = () => {
    if (!selectedHook) return
    const hook = HOOK_TEMPLATES.find(h => h.id === selectedHook)
    if (!hook) return
    const randomTemplate = hook.templates[Math.floor(Math.random() * hook.templates.length)]
    setAppliedHook(randomTemplate)
  }

  const handleGenerateTwist = () => {
    if (!selectedTwist) return
    const twist = PLOT_TWISTS.find(t => t.id === selectedTwist)
    if (!twist) return
    const randomTemplate = twist.templates[Math.floor(Math.random() * twist.templates.length)]
    setAppliedTwist(randomTemplate)
  }

  return (
    <div className="card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-1">🪝 爆款桥段库</h3>
        <p className="text-xs text-[#6a6a8e]">
          基于抖音/快手爆款短剧数据提炼，涵盖开场钩子 + 中段反转
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('hook')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
            mode === 'hook'
              ? 'border-[#6c5ce7] bg-[#6c5ce7]/20 text-white'
              : 'border-[#2a2a3e] text-[#6a6a8e] hover:border-[#6c5ce7]/40'
          }`}
        >
          🎬 开场钩子
        </button>
        <button
          onClick={() => setMode('twist')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
            mode === 'twist'
              ? 'border-[#6c5ce7] bg-[#6c5ce7]/20 text-white'
              : 'border-[#2a2a3e] text-[#6a6a8e] hover:border-[#6c5ce7]/40'
          }`}
        >
          ⚡ 剧情反转
        </button>
      </div>

      {mode === 'hook' && (
        <>
          {/* Hook type selector */}
          <div className="grid grid-cols-2 gap-2">
            {HOOK_TEMPLATES.map(hook => (
              <button
                key={hook.id}
                onClick={() => setSelectedHook(hook.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedHook === hook.id
                    ? 'border-[#6c5ce7] bg-[#6c5ce7]/10'
                    : 'border-[#2a2a3e] bg-[#1a1a2e] hover:border-[#6c5ce7]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">{hook.emoji}</span>
                  <span className="text-[10px] text-[#6c5ce7]">⭐{hook.score}</span>
                </div>
                <div className={`text-xs ${selectedHook === hook.id ? 'text-white' : 'text-[#a0a0b8]'}`}>
                  {hook.label}
                </div>
              </button>
            ))}
          </div>

          <Button
            onClick={handleGenerateHook}
            disabled={!selectedHook || !scriptText}
            variant="primary"
            className="w-full"
          >
            ✨ 生成爆款开场
          </Button>

          {appliedHook && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-[#12121e] border border-[#6c5ce7]/30">
                <div className="text-xs text-[#6c5ce7] mb-2">🎬 开场钩子</div>
                <p className="text-sm text-white leading-relaxed">{appliedHook}</p>
              </div>
              <Button
                onClick={() => {
                  // Would update the script opening
                  setAppliedHook('')
                }}
                className="w-full"
                variant="primary"
              >
                应用到剧本开头
              </Button>
            </div>
          )}
        </>
      )}

      {mode === 'twist' && (
        <>
          {/* Twist type selector */}
          <div className="grid grid-cols-2 gap-2">
            {PLOT_TWISTS.map(twist => (
              <button
                key={twist.id}
                onClick={() => setSelectedTwist(twist.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedTwist === twist.id
                    ? 'border-[#6c5ce7] bg-[#6c5ce7]/10'
                    : 'border-[#2a2a3e] bg-[#1a1a2e] hover:border-[#6c5ce7]/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{twist.emoji}</span>
                  <span className={`text-xs ${selectedTwist === twist.id ? 'text-white' : 'text-[#a0a0b8]'}`}>
                    {twist.label}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <Button
            onClick={handleGenerateTwist}
            disabled={!selectedTwist || !scriptText}
            variant="primary"
            className="w-full"
          >
            ✨ 生成剧情反转
          </Button>

          {appliedTwist && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-[#12121e] border border-[#6c5ce7]/30">
                <div className="text-xs text-[#6c5ce7] mb-2">⚡ 剧情反转</div>
                <p className="text-sm text-white leading-relaxed">{appliedTwist}</p>
              </div>
              <Button
                onClick={() => {
                  setAppliedTwist('')
                }}
                className="w-full"
                variant="primary"
              >
                插入到剧本中段
              </Button>
            </div>
          )}
        </>
      )}

      {!scriptText && (
        <div className="text-center py-2 text-xs text-[#6a6a8e]">
          请先在剧本编辑器中输入剧本内容
        </div>
      )}
    </div>
  )
}
