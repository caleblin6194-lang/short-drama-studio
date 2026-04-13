'use client'

import type { Shot } from '@/types'

export default function Timeline({ shots }: { shots: Shot[] }) {
  if (shots.length === 0) return null

  return (
    <div className="card p-4 overflow-x-auto">
      <h3 className="text-sm font-medium text-[#a0a0b8] mb-3">⏱ 时间线</h3>
      <div className="flex gap-1 min-w-max">
        {shots.map((shot, i) => {
          const stages = [shot.pipeline.image, shot.pipeline.video, shot.pipeline.audio]
          const doneCount = stages.filter(s => s.status === 'done').length
          const isRendering = stages.some(s => s.status === 'rendering')

          return (
            <div key={shot.id} className="flex flex-col items-center gap-1" style={{ minWidth: 48 }}>
              {/* 三段进度 */}
              <div className="flex gap-px">
                <div className={`w-3 h-6 rounded-sm ${shot.pipeline.image.status === 'done' ? 'bg-[#0984e3]' : shot.pipeline.image.status === 'rendering' ? 'bg-[#0984e3]/40 animate-pulse' : 'bg-[#2a2a3e]'}`} />
                <div className={`w-3 h-6 rounded-sm ${shot.pipeline.video.status === 'done' ? 'bg-[#6c5ce7]' : shot.pipeline.video.status === 'rendering' ? 'bg-[#6c5ce7]/40 animate-pulse' : 'bg-[#2a2a3e]'}`} />
                <div className={`w-3 h-6 rounded-sm ${shot.pipeline.audio.status === 'done' ? 'bg-[#00b894]' : shot.pipeline.audio.status === 'rendering' ? 'bg-[#00b894]/40 animate-pulse' : 'bg-[#2a2a3e]'}`} />
              </div>
              <span className="text-[10px] text-[#a0a0b8]">{i + 1}</span>
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 mt-2 text-[10px] text-[#a0a0b8]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#0984e3]" />图</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#6c5ce7]" />视</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#00b894]" />音</span>
      </div>
    </div>
  )
}
