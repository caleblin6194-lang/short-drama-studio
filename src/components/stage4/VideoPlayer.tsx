'use client'

import type { MasterCut, Shot } from '@/types'

interface VideoPlayerProps {
  masterCut: MasterCut | null
  shots?: Shot[]
}

export default function VideoPlayer({ masterCut, shots = [] }: VideoPlayerProps) {
  if (!masterCut) {
    return (
      <div className="aspect-[9/16] max-w-sm mx-auto bg-[#1a1a2e] rounded-xl flex items-center justify-center border border-[#2a2a3e]">
        <div className="text-center text-[#a0a0b8]">
          <span className="text-4xl block mb-2 opacity-30">▶</span>
          <p className="text-sm">尚未渲染成片</p>
        </div>
      </div>
    )
  }

  // Extract dialogue lines from shots for real subtitles
  const dialogues = shots
    .filter(s => s.dialogue && s.dialogue.trim())
    .map(s => s.dialogue.trim())

  return (
    <div className="aspect-[9/16] max-w-sm mx-auto bg-[#1a1a2e] rounded-xl overflow-hidden border border-[#2a2a3e] relative group">
      {/* 占位画面 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0f]">
        <span className="text-6xl mb-4">🎬</span>
        <p className="text-white font-semibold">成片预览</p>
        <p className="text-sm text-[#a0a0b8] mt-1">{masterCut.durationSec}s</p>
      </div>

      {/* 真实字幕：从镜头对白提取 */}
      {masterCut.subtitlesEnabled && dialogues.length > 0 && (
        <div className="absolute bottom-16 left-4 right-4 space-y-1">
          {dialogues.map((text, i) => {
            const fontSize = masterCut.subtitleStyle.fontSize === 'lg' ? '14px'
              : masterCut.subtitleStyle.fontSize === 'sm' ? '10px' : '12px'
            return (
              <div key={i} className="text-center">
                <span
                  className="text-white px-2 py-0.5 rounded inline-block"
                  style={{
                    backgroundColor: masterCut.subtitleStyle.backgroundEnabled
                      ? (masterCut.subtitleStyle.backgroundColor || 'rgba(0,0,0,0.6)')
                      : 'transparent',
                    fontSize,
                  }}
                >
                  &ldquo;{text}&rdquo;
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* 播放按钮 */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-16 h-16 rounded-full bg-[#6c5ce7]/80 flex items-center justify-center">
          <span className="text-white text-2xl ml-1">▶</span>
        </div>
      </div>

      {/* BGM 标签 */}
      {masterCut.bgmEnabled && (
        <div className="absolute top-3 right-3 bg-[#6c5ce7]/20 text-[#6c5ce7] text-xs px-2 py-1 rounded-full">
          🎵 {masterCut.bgmTrack}
        </div>
      )}
    </div>
  )
}