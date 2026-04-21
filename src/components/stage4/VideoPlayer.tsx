'use client'

import { useRef, useState, useEffect } from 'react'
import type { MasterCut, Shot } from '@/types'

interface VideoPlayerProps {
  masterCut: MasterCut | null
  shots?: Shot[]
}

export default function VideoPlayer({ masterCut, shots = [] }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Reset error when renderedUrl changes
  useEffect(() => {
    setError(null)
    setPlaying(false)
    setCurrentTime(0)
  }, [masterCut?.renderedUrl])

  if (!masterCut) {
    return (
      <div className="aspect-[9/16] max-w-sm mx-auto bg-[#1a1a2e] rounded-xl flex items-center justify-center border border-[#2a2a3e]">
        <div className="text-center text-[#a0a0b8]">
          <span className="text-4xl block mb-2 opacity-30">▶</span>
          <p className="text-sm">尚未渲染成片</p>
          <p className="text-xs mt-1 opacity-50">点击上方「渲染成片」按钮生成</p>
        </div>
      </div>
    )
  }

  const togglePlay = () => {
    if (!videoRef.current) return
    if (playing) {
      videoRef.current.pause()
    } else {
      videoRef.current.play().catch(e => setError(e.message))
    }
  }

  // Current subtitle based on playback position
  const currentSubtitle = (() => {
    if (!masterCut.subtitlesEnabled) return null
    if (masterCut.subtitleBlocks?.length) {
      const block = masterCut.subtitleBlocks.find(
        b => currentTime >= b.startSec && currentTime < b.endSec
      )
      return block?.text ?? null
    }
    // Fallback: derive from shots (approximate timing)
    let t = 0
    for (const s of shots) {
      if (s.dialogue && currentTime >= t && currentTime < t + s.durationSec) {
        return s.dialogue.replace(/^[^：:]+[：:]/, '').trim()
      }
      t += s.durationSec
    }
    return null
  })()

  const subtitleFontSize = masterCut.subtitleStyle?.fontSize === 'lg' ? '15px'
    : masterCut.subtitleStyle?.fontSize === 'sm' ? '11px' : '13px'

  return (
    <div className="aspect-[9/16] max-w-sm mx-auto bg-[#000] rounded-xl overflow-hidden border border-[#2a2a3e] relative group">
      {/* Actual video element */}
      <video
        ref={videoRef}
        src={masterCut.renderedUrl}
        className="w-full h-full object-contain"
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
        onError={() => setError('视频加载失败，请重新渲染')}
      />

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <p className="text-red-400 text-sm text-center px-4">{error}</p>
        </div>
      )}

      {/* Subtitle overlay */}
      {currentSubtitle && (
        <div className="absolute bottom-14 left-3 right-3 text-center pointer-events-none">
          <span
            className="text-white inline-block px-2 py-0.5 rounded"
            style={{
              fontSize: subtitleFontSize,
              backgroundColor: masterCut.subtitleStyle?.backgroundEnabled
                ? (masterCut.subtitleStyle.backgroundColor || 'rgba(0,0,0,0.65)')
                : 'transparent',
            }}
          >
            {currentSubtitle}
          </span>
        </div>
      )}

      {/* Play/pause button overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onClick={togglePlay}
      >
        {!playing && (
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center group-hover:bg-[#6c5ce7]/70 transition-colors">
            <span className="text-white text-2xl ml-1">▶</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {duration > 0 && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 cursor-pointer"
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            const ratio = (e.clientX - rect.left) / rect.width
            if (videoRef.current) videoRef.current.currentTime = ratio * duration
          }}
        >
          <div
            className="h-full bg-[#6c5ce7] transition-all"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
      )}

      {/* BGM indicator */}
      {masterCut.bgmEnabled && masterCut.bgmTrack && (
        <div className="absolute top-3 right-3 bg-[#6c5ce7]/20 text-[#6c5ce7] text-xs px-2 py-1 rounded-full pointer-events-none">
          🎵 {masterCut.bgmTrack}
        </div>
      )}

      {/* Duration */}
      <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded pointer-events-none">
        {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}
        {duration > 0 && ` / ${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`}
      </div>
    </div>
  )
}
