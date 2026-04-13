'use client'

import { useState, useCallback, useRef } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import Button from '@/components/shared/Button'
import Spinner from '@/components/shared/Spinner'

type BgmMood = 'epic' | 'tender' | 'comic' | 'horror' | 'romantic' | 'tension' | 'sad' | 'uplifting' | 'mysterious' | 'action'

const MOOD_OPTIONS: { key: BgmMood; label: string; emoji: string; desc: string }[] = [
  { key: 'epic', label: '史诗', emoji: '🎺', desc: '大气磅礴' },
  { key: 'tender', label: '温馨', emoji: '🎻', desc: '温暖柔和' },
  { key: 'comic', label: '喜剧', emoji: '🃏', desc: '轻松搞笑' },
  { key: 'horror', label: '恐怖', emoji: '👻', desc: '惊悚悬疑' },
  { key: 'romantic', label: '浪漫', emoji: '💕', desc: '甜蜜爱情' },
  { key: 'tension', label: '紧张', emoji: '⏱', desc: '悬疑紧张' },
  { key: 'sad', label: '悲伤', emoji: '😢', desc: '情感低沉' },
  { key: 'uplifting', label: '励志', emoji: '☀️', desc: '振奋人心' },
  { key: 'mysterious', label: '神秘', emoji: '🔮', desc: '奇幻未知' },
  { key: 'action', label: '动作', emoji: '💥', desc: '激烈打斗' },
]

interface GeneratedTrack {
  trackId: string
  mood: BgmMood
  name: string
  url: string
}

interface SmartAudioPanelProps {
  currentBgmEnabled?: boolean
  currentBgmTrack?: string
  onBgmGenerated?: (track: GeneratedTrack) => void
}

export default function SmartAudioPanel({
  currentBgmEnabled,
  currentBgmTrack,
  onBgmGenerated,
}: SmartAudioPanelProps) {
  const { project } = useProjectStore()
  const [selectedMood, setSelectedMood] = useState<BgmMood | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<GeneratedTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handleGenerate = useCallback(async () => {
    if (!selectedMood) { setError('请选择一个情绪风格'); return }
    if (!project) return

    setError('')
    setIsGenerating(true)

    try {
      const res = await fetch('/api/bgm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          mood: selectedMood,
          duration: project.script?.estimatedDurationSec ?? 60,
          userId: 'demo-user',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      const track: GeneratedTrack = {
        trackId: data.trackId,
        mood: data.mood,
        name: data.name,
        url: data.url,
      }
      setCurrentTrack(track)
      onBgmGenerated?.(track)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }, [selectedMood, project])

  const handlePlayPause = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => {})
    }
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-white">🎵 AI 智能配乐</h3>
        <p className="text-xs text-[#a0a0b8] mt-0.5">根据剧情情绪自动生成 BGM</p>
      </div>

      {/* Mood Grid */}
      <div>
        <label className="text-xs text-[#a0a0b8] mb-2 block">选择情绪风格</label>
        <div className="grid grid-cols-5 gap-1.5">
          {MOOD_OPTIONS.map(mood => (
            <button
              key={mood.key}
              onClick={() => setSelectedMood(mood.key)}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border text-xs transition-all ${
                selectedMood === mood.key
                  ? 'border-[#6c5ce7] bg-[#6c5ce7]/10 text-white'
                  : 'border-[#2a2a3e] bg-[#1a1a2e] text-[#a0a0b8] hover:border-[#6c5ce7]/50'
              }`}
              title={mood.desc}
            >
              <span className="text-base">{mood.emoji}</span>
              <span className="text-[10px]">{mood.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        loading={isGenerating}
        disabled={!selectedMood || isGenerating}
        variant="primary"
        className="w-full"
      >
        {isGenerating ? '生成中...' : `✨ 根据 "${selectedMood ? MOOD_OPTIONS.find(m => m.key === selectedMood)?.label : ''}" 情绪生成 BGM`}
      </Button>

      {/* Current Track Preview */}
      {currentTrack && (
        <div className="bg-[#1a1a2e] rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {MOOD_OPTIONS.find(m => m.key === currentTrack.mood)?.emoji}
              </span>
              <div>
                <p className="text-sm text-white font-medium">{currentTrack.name}</p>
                <p className="text-[10px] text-[#6b6b8a]">{MOOD_OPTIONS.find(m => m.key === currentTrack.mood)?.desc}</p>
              </div>
            </div>
            <button
              onClick={handlePlayPause}
              className="w-8 h-8 rounded-full bg-[#6c5ce7] flex items-center justify-center text-white text-sm hover:bg-[#5a4bd1] transition-colors"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
          </div>
          <div className="h-1 bg-[#2a2a3e] rounded-full overflow-hidden">
            <div className="h-full bg-[#6c5ce7] rounded-full w-0 transition-all" id="bgm-progress" />
          </div>
          <audio
            ref={audioRef}
            src={currentTrack.url}
            onEnded={() => setIsPlaying(false)}
            onTimeUpdate={() => {
              const audio = audioRef.current
              if (!audio) return
              const progress = (audio.currentTime / audio.duration) * 100
              const bar = document.getElementById('bgm-progress')
              if (bar) bar.style.width = `${progress}%`
            }}
          />
          <p className="text-[10px] text-[#6b6b8a] text-center">预览模式 · 实际成品将自动适配视频时长</p>
        </div>
      )}


    </div>
  )
}
