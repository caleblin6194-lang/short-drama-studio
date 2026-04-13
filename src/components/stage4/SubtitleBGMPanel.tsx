'use client'

interface SubtitleBGMPanelProps {
  subtitlesEnabled: boolean
  bgmEnabled: boolean
  bgmTrack?: string
  onToggleSubtitles: () => void
  onToggleBgm: () => void
}

export default function SubtitleBGMPanel({
  subtitlesEnabled, bgmEnabled, bgmTrack, onToggleSubtitles, onToggleBgm,
}: SubtitleBGMPanelProps) {
  return (
    <div className="card p-4 space-y-4">
      <h3 className="text-sm font-medium text-[#a0a0b8]">🎛 音画控制</h3>

      <div className="flex items-center justify-between">
        <span className="text-sm text-white">字幕</span>
        <button
          onClick={onToggleSubtitles}
          className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${subtitlesEnabled ? 'bg-[#6c5ce7]' : 'bg-[#2a2a3e]'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${subtitlesEnabled ? 'left-5.5' : 'left-0.5'}`} />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-white">BGM</span>
          {bgmTrack && <span className="text-xs text-[#a0a0b8] ml-2">{bgmTrack}</span>}
        </div>
        <button
          onClick={onToggleBgm}
          className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${bgmEnabled ? 'bg-[#6c5ce7]' : 'bg-[#2a2a3e]'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${bgmEnabled ? 'left-5.5' : 'left-0.5'}`} />
        </button>
      </div>
    </div>
  )
}
