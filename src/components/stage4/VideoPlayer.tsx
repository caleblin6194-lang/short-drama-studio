'use client'

import type { MasterCut } from '@/types'

export default function VideoPlayer({ masterCut }: { masterCut: MasterCut | null }) {
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

  return (
    <div className="aspect-[9/16] max-w-sm mx-auto bg-[#1a1a2e] rounded-xl overflow-hidden border border-[#2a2a3e] relative group">
      {/* 占位画面 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0f]">
        <span className="text-6xl mb-4">🎬</span>
        <p className="text-white font-semibold">成片预览</p>
        <p className="text-sm text-[#a0a0b8] mt-1">{masterCut.durationSec}s</p>
      </div>

      {/* 字幕模拟 */}
      {masterCut.subtitlesEnabled && (
        <div className="absolute bottom-16 left-4 right-4 text-center">
          <span className="bg-black/60 text-white text-sm px-3 py-1 rounded">
            "三年隐忍，今日我陈默，不再沉默。"
          </span>
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
