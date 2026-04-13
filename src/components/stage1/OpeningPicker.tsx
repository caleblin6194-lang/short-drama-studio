'use client'

import { useProjectStore } from '@/store/useProjectStore'
import Button from '@/components/shared/Button'
import Spinner from '@/components/shared/Spinner'
import type { Opening } from '@/types'

export default function OpeningPicker() {
  const { openings, isGeneratingOpenings, generateOpenings, pickOpening } = useProjectStore()

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[#a0a0b8]">✨ 开场白</h3>
        <Button size="sm" variant="secondary" onClick={generateOpenings} loading={isGeneratingOpenings}>
          生成开场白
        </Button>
      </div>

      {isGeneratingOpenings && (
        <div className="py-8 flex justify-center">
          <Spinner label="AI 正在构思开场白..." />
        </div>
      )}

      {openings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {openings.map((o: Opening) => (
            <div key={o.title} className="card p-4 flex flex-col">
              <h4 className="text-white font-semibold mb-2">{o.title}</h4>
              <p className="text-sm text-[#a0a0b8] flex-1 mb-3 line-clamp-4">{o.body}</p>
              <p className="text-xs text-[#6c5ce7] italic mb-3">&ldquo;{o.line}&rdquo;</p>
              <Button size="sm" onClick={() => pickOpening(o)}>选这个</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
