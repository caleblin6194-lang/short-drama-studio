'use client'

import { useState, useEffect, useCallback } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import Button from '@/components/shared/Button'
import Spinner from '@/components/shared/Spinner'
import type { CharacterAsset } from '@/types'

interface TalkingAvatarJob {
  jobId: string
  characterId: string
  dialogue: string
  targetShotId?: string
  status: 'generating' | 'done' | 'failed'
  videoUrl?: string
  createdAt: number
}

interface TalkingAvatarPanelProps {
  onVideoCreated?: (videoUrl: string, shotId?: string) => void
}

export default function TalkingAvatarPanel({ onVideoCreated }: TalkingAvatarPanelProps) {
  const { project } = useProjectStore()
  const characters = project?.assetLibrary.characters.filter(c => c.approvedByUser) ?? []

  const [selectedCharacter, setSelectedCharacter] = useState<CharacterAsset | null>(null)
  const [dialogue, setDialogue] = useState('')
  const [targetShotId, setTargetShotId] = useState<string>('')
  const [jobs, setJobs] = useState<TalkingAvatarJob[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  // Poll for job status
  useEffect(() => {
    const generatingJobs = jobs.filter(j => j.status === 'generating')
    if (generatingJobs.length === 0) return

    const interval = setInterval(async () => {
      const updated = await Promise.all(
        generatingJobs.map(async (job) => {
          try {
            const res = await fetch(`/api/talking-avatar?jobId=${job.jobId}`)
            const data = await res.json()
            if (data.status === 'done') {
              onVideoCreated?.(data.videoUrl, job.targetShotId)
              return { ...job, status: 'done' as const, videoUrl: data.videoUrl }
            }
          } catch {}
          return job
        }),
      )
      setJobs(prev => {
        const notGenerating = prev.filter(j => j.status !== 'generating')
        return [...notGenerating, ...updated]
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [jobs, onVideoCreated])

  const handleGenerate = useCallback(async () => {
    if (!selectedCharacter) { setError('请选择一个角色'); return }
    if (!dialogue.trim()) { setError('请输入对话内容'); return }

    setError('')
    setIsGenerating(true)

    try {
      const res = await fetch('/api/talking-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project!.id,
          characterId: selectedCharacter.id,
          characterName: selectedCharacter.name,
          characterImageUrl: selectedCharacter.imageUrl,
          dialogue: dialogue.trim(),
          userId: 'demo-user', // TODO: get from auth
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      const newJob: TalkingAvatarJob = {
        jobId: data.jobId,
        characterId: selectedCharacter.id,
        dialogue: dialogue.trim(),
        targetShotId: targetShotId || undefined,
        status: 'generating',
        createdAt: Date.now(),
      }
      setJobs(prev => [...prev, newJob])
      setDialogue('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }, [selectedCharacter, dialogue, project])

  const generatingCount = jobs.filter(j => j.status === 'generating').length

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">🎭 AI 说话数字人</h3>
          <p className="text-xs text-[#a0a0b8] mt-0.5">让角色开口说话</p>
        </div>
        {generatingCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-[#6c5ce7]">
            <Spinner size={14} />
            <span>生成中 {generatingCount} 个</span>
          </div>
        )}
      </div>

      {/* Character Selection */}
      <div>
        <label className="text-xs text-[#a0a0b8] mb-1.5 block">选择角色</label>
        {characters.length === 0 ? (
          <p className="text-xs text-[#a0a0b8] py-3 text-center border border-dashed border-[#2a2a3e] rounded-lg">
            Stage 2 还没有已通过的角色，请先完成角色选择
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {characters.map(char => (
              <button
                key={char.id}
                onClick={() => setSelectedCharacter(char)}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs transition-all ${
                  selectedCharacter?.id === char.id
                    ? 'border-[#6c5ce7] bg-[#6c5ce7]/10 text-white'
                    : 'border-[#2a2a3e] bg-[#1a1a2e] text-[#a0a0b8] hover:border-[#6c5ce7]/50'
                }`}
              >
                {char.imageUrl ? (
                  <img src={char.imageUrl} alt={char.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#2a2a3e] flex items-center justify-center text-lg">
                    👤
                  </div>
                )}
                <span className="text-[10px] text-center leading-tight">{char.name}</span>
                <span className="text-[9px] opacity-60">{char.tier}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dialogue Input */}
      <div>
        <label className="text-xs text-[#a0a0b8] mb-1.5 block">输入对话</label>
        <textarea
          value={dialogue}
          onChange={e => setDialogue(e.target.value)}
          placeholder="让角色说点什么..."
          rows={3}
          className="w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b6b8a] focus:outline-none focus:border-[#6c5ce7] resize-none"
          maxLength={200}
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-[10px] text-[#6b6b8a]">支持最长 200 字</span>
          <span className="text-[10px] text-[#6b6b8a]">{dialogue.length}/200</span>
        </div>
      </div>

      {/* Target Shot (optional) */}
      {project && project.shots.length > 0 && (
        <div>
          <label className="text-xs text-[#a0a0b8] mb-1.5 block">关联镜头（可选）</label>
          <select
            value={targetShotId}
            onChange={e => setTargetShotId(e.target.value)}
            className="w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6c5ce7]">
            <option value="">不关联镜头</option>
            {project.shots.map((shot, i) => (
              <option key={shot.id} value={shot.id}>
                镜头 {i + 1}: {shot.description?.slice(0, 30) || '无描述'}...
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        loading={isGenerating}
        disabled={!selectedCharacter || !dialogue.trim() || generatingCount > 0}
        variant="primary"
        className="w-full"
      >
        {isGenerating ? '生成中...' : '🎬 生成说话数字人'}
      </Button>

      {/* Recent Jobs */}
      {jobs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs text-[#a0a0b8] font-medium">最近生成</h4>
          {jobs.slice(-3).reverse().map(job => (
            <div key={job.jobId} className="flex items-center gap-2 p-2 bg-[#1a1a2e] rounded-lg">
              <div className={`w-1.5 h-1.5 rounded-full ${job.status === 'done' ? 'bg-[#00b894]' : job.status === 'failed' ? 'bg-red-500' : 'bg-[#6c5ce7] animate-pulse'}`} />
              <span className="text-xs text-[#a0a0b8] flex-1 truncate">
                {job.dialogue.slice(0, 25)}{job.dialogue.length > 25 ? '...' : ''}
              </span>
              {job.status === 'generating' && <Spinner size={12} />}
              {job.status === 'done' && job.videoUrl && (
                <a href={job.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#6c5ce7] hover:underline">
                  预览
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
