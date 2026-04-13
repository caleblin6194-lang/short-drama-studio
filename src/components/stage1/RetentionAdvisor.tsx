'use client'

import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import Button from '@/components/shared/Button'

interface RetentionIssue {
  type: 'pacing' | 'hook' | 'conflict' | 'suspense' | 'emotion'
  severity: 'high' | 'medium' | 'low'
  location: string
  description: string
  suggestion: string
  emoji: string
}

export default function RetentionAdvisor() {
  const { project } = useProjectStore()
  const [analyzing, setAnalyzing] = useState(false)
  const [issues, setIssues] = useState<RetentionIssue[]>([])
  const [analyzed, setAnalyzed] = useState(false)
  const [overallScore, setOverallScore] = useState<number | null>(null)

  if (!project) return null

  const scriptText = project.script.rawText
  const wordCount = scriptText.length

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setIssues([])
    setAnalyzed(false)

    // Simulate AI analysis
    await new Promise(r => setTimeout(r, 2000))

    const foundIssues: RetentionIssue[] = []
    let score = 85

    // Analyze hook (opening)
    if (scriptText.length > 0) {
      const firstLine = scriptText.split('\n')[0] || ''
      const hasQuestion = firstLine.includes('？') || firstLine.includes('?')
      const hasExclamation = firstLine.includes('！')
      const hasQuote = firstLine.includes('"') || firstLine.includes('"')

      if (!hasQuestion && !hasExclamation && !hasQuote) {
        foundIssues.push({
          type: 'hook',
          severity: 'high',
          location: '开头第一句',
          description: '开场缺少冲突元素，可能导致前3秒流失',
          suggestion: '建议以对话冲突或悬念提问开场，如："你以为你是谁？"',
          emoji: '🪝',
        })
        score -= 15
      }

      if (wordCount < 100) {
        foundIssues.push({
          type: 'pacing',
          severity: 'high',
          location: '整体剧本',
          description: '剧本内容过少（少于100字），无法撑起完整短剧',
          suggestion: '建议扩充至500-1000字，确保有足够的剧情起承转合',
          emoji: '📏',
        })
        score -= 20
      } else if (wordCount > 50 && wordCount < 300) {
        foundIssues.push({
          type: 'pacing',
          severity: 'medium',
          location: '整体剧本',
          description: '剧本偏短，建议增加更多场景细节和对话',
          suggestion: '每集建议500-800字，确保节奏充实',
          emoji: '📏',
        })
        score -= 8
      }
    }

    // Analyze conflict density
    const conflictMarkers = ['但是', '然而', '没想到', '突然', '其实', '原来', '不料']
    const conflictCount = conflictMarkers.filter(m => scriptText.includes(m)).length

    if (conflictCount === 0) {
      foundIssues.push({
        type: 'conflict',
        severity: 'high',
        location: '整体剧本',
        description: '剧本缺少情绪转折点，观众容易感到平淡',
        suggestion: '建议每200字安排一个反转或冲突，如"没想到..."、"但是..."',
        emoji: '⚡',
      })
      score -= 15
    } else if (conflictCount < 2) {
      foundIssues.push({
        type: 'conflict',
        severity: 'medium',
        location: '整体剧本',
        description: `情绪转折点偏少（${conflictCount}处），节奏可能偏慢`,
        suggestion: '短剧建议每集至少3-5个情绪转折，保持观众注意力',
        emoji: '⚡',
      })
      score -= 8
    }

    // Analyze suspense/cliffhanger
    if (!scriptText.includes('？') && !scriptText.includes('?')) {
      foundIssues.push({
        type: 'suspense',
        severity: 'medium',
        location: '结尾',
        description: '剧本结尾缺少悬念钩子，可能降低追看欲',
        suggestion: '建议结尾留有悬念，如"三年后..."、"直到那天..."',
        emoji: '❓',
      })
      score -= 10
    }

    // Analyze emotional density
    const emotionalWords = ['哭', '泪', '心痛', '愤怒', '颤抖', '绝望', '激动']
    const emotionalCount = emotionalWords.filter(w => scriptText.includes(w)).length

    if (emotionalCount === 0) {
      foundIssues.push({
        type: 'emotion',
        severity: 'medium',
        location: '整体剧本',
        description: '剧本缺少情绪描写，可能让观众难以代入',
        suggestion: '增加角色内心描写和情绪反应，如：她眼眶泛红、声音颤抖',
        emoji: '💔',
      })
      score -= 8
    }

    setOverallScore(Math.max(30, Math.min(100, score)))
    setIssues(foundIssues.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 }
      return order[a.severity] - order[b.severity]
    }))
    setAnalyzed(true)
    setAnalyzing(false)
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-[#00b894]'
    if (score >= 70) return 'text-[#fdcb6e]'
    return 'text-[#ff7675]'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 85) return '优秀 ⭐⭐⭐'
    if (score >= 70) return '良好 ⭐⭐'
    return '需优化 ⭐'
  }

  return (
    <div className="card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-1">📊 完播率优化分析</h3>
        <p className="text-xs text-[#6a6a8e]">
          AI 分析剧本潜在流失点，给出针对性优化建议
        </p>
      </div>

      <Button
        onClick={handleAnalyze}
        loading={analyzing}
        disabled={!scriptText || scriptText.length < 10}
        variant="primary"
        className="w-full"
      >
        {analyzing ? 'AI 分析中...' : '✨ 一键分析剧本'}
      </Button>

      {analyzing && (
        <div className="space-y-2">
          <div className="text-xs text-[#6c5ce7] animate-pulse">正在分析开篇钩子...</div>
          <div className="text-xs text-[#6c5ce7] animate-pulse">正在分析情绪节奏...</div>
          <div className="text-xs text-[#6c5ce7] animate-pulse">正在分析冲突密度...</div>
          <div className="text-xs text-[#6c5ce7] animate-pulse">正在计算完播率预测...</div>
        </div>
      )}

      {analyzed && overallScore !== null && (
        <>
          {/* Overall score */}
          <div className="p-4 rounded-xl bg-[#12121e] border border-[#2a2a3e] text-center">
            <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
            </div>
            <div className={`text-sm mt-1 ${getScoreColor(overallScore)}`}>
              {getScoreLabel(overallScore)}
            </div>
            <div className="text-xs text-[#6a6a8e] mt-2">
              完播率预测（基于剧本结构分析）
            </div>
          </div>

          {/* Issues */}
          {issues.length > 0 ? (
            <div className="space-y-3">
              <div className="text-xs text-[#6a6a8e]">
                发现 {issues.filter(i => i.severity === 'high').length} 个高优先级问题，{issues.filter(i => i.severity === 'medium').length} 个中优先级问题
              </div>
              {issues.map((issue, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border ${
                    issue.severity === 'high'
                      ? 'border-red-500/30 bg-red-500/5'
                      : issue.severity === 'medium'
                      ? 'border-yellow-500/30 bg-yellow-500/5'
                      : 'border-[#2a2a3e] bg-[#1a1a2e]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>{issue.emoji}</span>
                    <span className={`text-xs font-medium ${
                      issue.severity === 'high' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {issue.severity === 'high' ? '⚠️ 高' : '⚡ 中'}
                    </span>
                    <span className="text-xs text-[#6a6a8e] ml-auto">{issue.location}</span>
                  </div>
                  <p className="text-xs text-white mb-2">{issue.description}</p>
                  <div className="flex items-start gap-1.5">
                    <span className="text-[#00b894] text-xs mt-0.5">💡</span>
                    <p className="text-xs text-[#00b894]">{issue.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-2xl mb-2">🎉</div>
              <div className="text-sm text-[#00b894]">剧本结构优秀！暂未发现明显流失风险点</div>
            </div>
          )}
        </>
      )}

      {!scriptText && (
        <div className="text-center py-4 text-xs text-[#6a6a8e]">
          请先输入剧本内容再分析
        </div>
      )}
    </div>
  )
}
