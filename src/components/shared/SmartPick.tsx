'use client'

import { useState, useCallback } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import type { TypeTag, SettingTag, WorldTag, ArtStyle } from '@/types'

interface SmartPickProps {
  compact?: boolean
}

interface Recommendation {
  type: 'tag' | 'style' | 'script'
  label: string
  value: string
  reason: string
  emoji: string
  confidence: number // 0-1
}

export default function SmartPick({ compact = false }: SmartPickProps) {
  const { project, setTag } = useProjectStore()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const generatePicks = useCallback(async () => {
    if (!project) return
    setIsLoading(true)

    // Simulate AI analysis — in production this calls an AI API
    await new Promise(r => setTimeout(r, 1500))

    const tagSet = project.tagSet
    const picks: Recommendation[] = []

    // Type tag recommendations
    if (tagSet.type === '穿越') {
      picks.push(
        { type: 'tag', label: '推荐类型', value: '玄幻', reason: '穿越+玄幻组合播放量高27%', emoji: '✨', confidence: 0.85 },
        { type: 'style', label: '推荐风格', value: 'fantasy_concept', reason: '仙侠/古风玄幻最适合', emoji: '🎨', confidence: 0.90 },
      )
    } else if (tagSet.type === '逆袭' || tagSet.type === '复仇') {
      picks.push(
        { type: 'tag', label: '推荐类型', value: '总裁', reason: '逆袭+总裁组合完播率高', emoji: '💼', confidence: 0.80 },
        { type: 'style', label: '推荐风格', value: 'modern_realism', reason: '都市写实更有代入感', emoji: '🏙', confidence: 0.88 },
      )
    } else if (tagSet.type === '甜宠' || tagSet.type === '爱情') {
      picks.push(
        { type: 'tag', label: '推荐类型', value: '先婚后爱', reason: '先婚后爱是近30天热搜词', emoji: '💕', confidence: 0.82 },
        { type: 'style', label: '推荐风格', value: 'urban_realism', reason: '现代场景更易产生共鸣', emoji: '🌆', confidence: 0.75 },
      )
    } else if (tagSet.type === '神豪') {
      picks.push(
        { type: 'tag', label: '推荐设定', value: '马甲', reason: '神豪+马甲打脸效果翻倍', emoji: '🎭', confidence: 0.87 },
        { type: 'style', label: '推荐风格', value: 'cyberpunk_neon', reason: '霓虹风格提升视觉冲击力', emoji: '🌃', confidence: 0.78 },
      )
    } else if (tagSet.type === '重生') {
      picks.push(
        { type: 'tag', label: '推荐设定', value: '打脸虐渣', reason: '重生+打脸是爆款公式', emoji: '🔥', confidence: 0.92 },
        { type: 'tag', label: '推荐世界观', value: '现代', reason: '都市重生代入感最强', emoji: '🏙', confidence: 0.85 },
      )
    } else {
      picks.push(
        { type: 'tag', label: '推荐类型', value: '女性成长', reason: '女性成长类内容评论互动率高', emoji: '👩', confidence: 0.76 },
        { type: 'style', label: '推荐风格', value: 'vintage_sepia', reason: '复古色调增加质感', emoji: '📺', confidence: 0.70 },
      )
    }

    // Setting recommendations based on type
    if (tagSet.world === '现代' || !tagSet.world) {
      picks.push(
        { type: 'tag', label: '推荐设定', value: '草根', reason: '草根逆袭永远有市场', emoji: '🌱', confidence: 0.83 },
      )
    } else if (tagSet.world === '古风' || tagSet.world === '架空') {
      picks.push(
        { type: 'tag', label: '推荐设定', value: '权谋', reason: '宫斗/权谋古风完播率高', emoji: '🏯', confidence: 0.79 },
      )
    }

    // Audience-based recommendations
    if (tagSet.audience === 'female') {
      picks.push(
        { type: 'script', label: '脚本建议', value: '强调情感冲突', reason: '女性用户对情感戏份更敏感', emoji: '💔', confidence: 0.81 },
      )
    } else if (tagSet.audience === 'male') {
      picks.push(
        { type: 'script', label: '脚本建议', value: '增强打脸爽感', reason: '男性用户更偏好爽文节奏', emoji: '💥', confidence: 0.78 },
      )
    }

    // Add script hook suggestion
    picks.push({
      type: 'script',
      label: '开场建议',
      value: getScriptHookSuggestion(tagSet.type),
      reason: '根据当前类型生成的开场钩子模板',
      emoji: '🎬',
      confidence: 0.88,
    })

    setRecommendations(picks)
    setIsLoading(false)
  }, [project])

  if (!project) return null

  return (
    <div className={`${compact ? 'space-y-3' : 'card p-5 space-y-4'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`font-semibold text-white ${compact ? 'text-sm' : ''}`}>🎯 Smart Pick</h3>
          <p className="text-xs text-[#a0a0b8]">AI 智能推荐标签、风格和脚本</p>
        </div>
        <button
          onClick={generatePicks}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-lg bg-[#6c5ce7] text-white text-xs font-medium hover:bg-[#5a4bd1] transition-colors disabled:opacity-50"
        >
          {isLoading ? '分析中...' : '🧠 智能分析'}
        </button>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          {recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 bg-[#1a1a2e] rounded-lg">
              <span className="text-sm mt-0.5">{rec.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#6c5ce7] font-medium">{rec.label}</span>
                  <span className="text-xs text-white font-semibold">{rec.value}</span>
                  <span className="ml-auto text-[10px] text-[#6b6b8a]">{Math.round(rec.confidence * 100)}% 置信</span>
                </div>
                <p className="text-[10px] text-[#a0a0b8] mt-0.5">{rec.reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!compact && recommendations.length === 0 && !isLoading && (
        <p className="text-xs text-[#6b6b8a] text-center py-4">
          点击"智能分析"，AI 将根据你的项目内容推荐最佳标签和风格组合
        </p>
      )}
    </div>
  )
}

function getScriptHookSuggestion(type: TypeTag | undefined): string {
  if (type === '穿越') return '开场即穿越，面对古代世界观冲突，立刻制造身份落差'
  if (type === '逆袭' || type === '复仇') return '开场即绝境，主角被压制，用30秒建立观众对反击的期待'
  if (type === '重生') return '开场闪回前世遗憾，立刻让观众共情，然后重生反转'
  if (type === '甜宠') return '开场甜蜜互动，建立CP感，让观众想嗑糖'
  if (type === '神豪') return '开场被看不起/被嫌弃，立刻建立打脸预期'
  if (type === '总裁') return '开场误会或偶遇，建立豪门关系张力'
  return '开场抛出冲突或悬念，在前3秒抓住观众注意力'
}
