'use client'

import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import Button from '@/components/shared/Button'

interface SubtitleBlock {
  id: string
  shotId: string
  text: string
  startSec: number
  endSec: number
}

export default function DialogueSyncPanel() {
  const { project } = useProjectStore()
  const [syncing, setSyncing] = useState(false)
  const [subtitleBlocks, setSubtitleBlocks] = useState<SubtitleBlock[]>([])
  const [applied, setApplied] = useState(false)
  const [totalDuration, setTotalDuration] = useState(0)
  const [error, setError] = useState('')

  if (!project) return null

  const shots = project.shots

  const handleAutoSync = async () => {
    if (shots.length === 0) return
    setSyncing(true)
    setError('')

    try {
      const res = await fetch('/api/subtitle-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          shots: shots.map(s => ({
            id: s.id,
            dialogue: s.dialogue || '',
            audioUrl: s.audioUrl,
            startTime: 0,
            duration: 5,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sync failed')

      setSubtitleBlocks(data.blocks)
      setTotalDuration(data.totalDuration)
      setApplied(false)
    } catch (err: any) {
      setError(err.message || '同步失败')
    } finally {
      setSyncing(false)
    }
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-1">🎙️ 智能字幕时间轴</h3>
        <p className="text-xs text-[#6a6a8e]">
          AI Whisper 语音识别 · 自动对齐字幕时间 · 支持 SRT/VTT 导出
        </p>
      </div>

      {shots.length === 0 && (
        <div className="text-center py-4 text-[#6a6a8e] text-sm">
          暂无镜头，请先生成镜头
        </div>
      )}

      {shots.length > 0 && subtitleBlocks.length === 0 && !syncing && !applied && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-[#12121e] border border-[#2a2a3e]">
            <div className="text-xs text-[#a0a0b8] mb-2">📊 字幕同步预览</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg text-white font-bold">{shots.length}</div>
                <div className="text-[10px] text-[#6a6a8e]">镜头数</div>
              </div>
              <div>
                <div className="text-lg text-white font-bold">
                  {shots.filter(s => s.dialogue).length}
                </div>
                <div className="text-[10px] text-[#6a6a8e]">有台词</div>
              </div>
              <div>
                <div className="text-lg text-white font-bold">
                  ~{Math.ceil(shots.reduce((sum, s) => sum + (s.dialogue?.length || 0) / 8, 0))}s
                </div>
                <div className="text-[10px] text-[#6a6a8e]">预计时长</div>
              </div>
            </div>
          </div>
          <Button onClick={handleAutoSync} variant="primary" className="w-full">
            ✨ 一键自动同步字幕
          </Button>
        </div>
      )}

      {syncing && (
        <div className="space-y-2 py-2">
          <div className="text-center text-[#6c5ce7] text-sm animate-pulse">
            🔍 AI 正在分析语音内容...
          </div>
          <div className="text-xs text-[#6a6a8e] text-center">
            识别台词 → 计算语速 → 同步时间轴
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {error}
        </div>
      )}

      {subtitleBlocks.length > 0 && !applied && (
        <>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#00b894]">
              ✓ 生成 {subtitleBlocks.length} 条字幕 · 共 {formatTime(totalDuration)}
            </span>
            <span className="text-[#6a6a8e]">
              {shots.filter(s => s.dialogue).length} 个镜头
            </span>
          </div>

          {/* Preview timeline */}
          <div className="p-3 rounded-xl bg-[#12121e] border border-[#2a2a3e]">
            <div className="text-xs text-[#6a6a8e] mb-2">字幕时间轴预览</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {subtitleBlocks.slice(0, 8).map((block) => (
                <div
                  key={block.id}
                  className="flex items-start gap-2 text-xs"
                >
                  <span className="text-[#6c5ce7] font-mono whitespace-nowrap">
                    {formatTime(block.startSec)}-{formatTime(block.endSec)}
                  </span>
                  <span className="text-white flex-1 truncate">{block.text}</span>
                </div>
              ))}
              {subtitleBlocks.length > 8 && (
                <div className="text-[10px] text-[#6a6a8e] text-center">
                  ...还有 {subtitleBlocks.length - 8} 条
                </div>
              )}
            </div>
          </div>

          {/* Export options */}
          <div className="flex gap-2">
            <Button
              onClick={() => setApplied(true)}
              className="flex-1"
              variant="primary"
            >
              应用字幕
            </Button>
            <Button
              onClick={handleAutoSync}
              variant="ghost"
              className="flex-1"
            >
              重新生成
            </Button>
          </div>
        </>
      )}

      {applied && (
        <div className="text-center py-4">
          <div className="text-2xl mb-2">✅</div>
          <div className="text-[#00b894] text-sm mb-1">字幕已应用</div>
          <div className="text-xs text-[#6a6a8e]">
            共 {subtitleBlocks.length} 条 · 格式 SRT/VTT · 可导出
          </div>
        </div>
      )}
    </div>
  )
}
