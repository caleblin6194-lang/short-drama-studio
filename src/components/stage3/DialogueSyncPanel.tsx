'use client'

import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import type { SubtitleBlock } from '@/types'
import Button from '@/components/shared/Button'

export default function DialogueSyncPanel() {
  const { project, applySubtitleBlocks } = useProjectStore()
  const [syncing, setSyncing] = useState(false)
  const [subtitleBlocks, setSubtitleBlocks] = useState<SubtitleBlock[]>([])
  const [srtContent, setSrtContent] = useState('')
  const [vttContent, setVttContent] = useState('')
  const [applied, setApplied] = useState(false)
  const [totalDuration, setTotalDuration] = useState(0)
  const [error, setError] = useState('')

  if (!project) return null

  const shots = project.shots

  const handleAutoSync = async () => {
    if (shots.length === 0) return
    setSyncing(true)
    setError('')
    setApplied(false)

    try {
      const res = await fetch('/api/subtitle-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          shots: shots.reduce<{ id: string; dialogue: string; audioUrl?: string; startTime: number; duration: number }[]>((acc, s) => {
            const prev = acc[acc.length - 1]
            const startTime = prev ? prev.startTime + prev.duration : 0
            acc.push({ id: s.id, dialogue: s.dialogue || '', audioUrl: s.audioUrl, startTime, duration: s.durationSec || 5 })
            return acc
          }, []),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sync failed')

      setSubtitleBlocks(data.blocks)
      setSrtContent(data.srt || '')
      setVttContent(data.vtt || '')
      setTotalDuration(data.totalDuration)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '同步失败')
    } finally {
      setSyncing(false)
    }
  }

  const handleApply = () => {
    applySubtitleBlocks(subtitleBlocks)
    setApplied(true)
  }

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const projectName = project.title || 'subtitle'

  return (
    <div className="card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-1">🎙️ 智能字幕时间轴</h3>
        <p className="text-xs text-[#6a6a8e]">
          Whisper ASR 语音识别 · 自动对齐字幕时间 · 支持 SRT/VTT 导出
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
                  ~{Math.ceil(shots.reduce((sum, s) => sum + (s.durationSec || 5), 0))}s
                </div>
                <div className="text-[10px] text-[#6a6a8e]">总时长</div>
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
                <div key={block.id} className="flex items-start gap-2 text-xs">
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

          {/* Apply + export */}
          <div className="flex gap-2">
            <Button onClick={handleApply} className="flex-1" variant="primary">
              应用字幕
            </Button>
            <Button onClick={handleAutoSync} variant="ghost" className="flex-1">
              重新生成
            </Button>
          </div>

          {/* Download buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => downloadFile(srtContent, `${projectName}.srt`, 'text/plain')}
              className="flex-1 py-2 rounded-lg text-xs border border-[#2a2a3e] text-[#a0a0b8] hover:border-[#6c5ce7] hover:text-white transition-all"
            >
              ⬇ 下载 SRT
            </button>
            <button
              onClick={() => downloadFile(vttContent, `${projectName}.vtt`, 'text/vtt')}
              className="flex-1 py-2 rounded-lg text-xs border border-[#2a2a3e] text-[#a0a0b8] hover:border-[#6c5ce7] hover:text-white transition-all"
            >
              ⬇ 下载 VTT
            </button>
          </div>
        </>
      )}

      {applied && (
        <div className="space-y-3">
          <div className="text-center py-3">
            <div className="text-2xl mb-2">✅</div>
            <div className="text-[#00b894] text-sm mb-1">字幕已应用到成片</div>
            <div className="text-xs text-[#6a6a8e]">
              共 {subtitleBlocks.length} 条 · 可在第四步字幕样式中调整
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => downloadFile(srtContent, `${projectName}.srt`, 'text/plain')}
              className="flex-1 py-2 rounded-lg text-xs border border-[#2a2a3e] text-[#a0a0b8] hover:border-[#6c5ce7] hover:text-white transition-all"
            >
              ⬇ 下载 SRT
            </button>
            <button
              onClick={() => downloadFile(vttContent, `${projectName}.vtt`, 'text/vtt')}
              className="flex-1 py-2 rounded-lg text-xs border border-[#2a2a3e] text-[#a0a0b8] hover:border-[#6c5ce7] hover:text-white transition-all"
            >
              ⬇ 下载 VTT
            </button>
          </div>
          <Button onClick={() => { setApplied(false); setSubtitleBlocks([]) }} variant="ghost" className="w-full">
            重新同步
          </Button>
        </div>
      )}
    </div>
  )
}
