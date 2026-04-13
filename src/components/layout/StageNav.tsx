'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const STAGES = [
  { num: 1, label: '故事', icon: '📖' },
  { num: 2, label: '筹备', icon: '🎨' },
  { num: 3, label: '拍摄', icon: '🎬' },
  { num: 4, label: '成片', icon: '✂️' },
]

interface StageNavProps {
  projectId: string
  lastEnteredStage: number
}

export default function StageNav({ projectId, lastEnteredStage }: StageNavProps) {
  const pathname = usePathname()
  const currentStage = parseInt(pathname.match(/stage(\d)/)?.[1] || '1')

  return (
    <nav className="flex items-center gap-1 bg-[#12121e] rounded-xl p-1 border border-[#2a2a3e]">
      {STAGES.map((s, i) => {
        const isActive = s.num === currentStage
        const isCompleted = s.num < lastEnteredStage
        const isLocked = s.num > lastEnteredStage + 1

        return (
          <div key={s.num} className="flex items-center">
            {i > 0 && <div className={`w-6 h-px mx-1 ${isCompleted ? 'bg-[#6c5ce7]' : 'bg-[#2a2a3e]'}`} />}
            <Link
              href={isLocked ? '#' : `/project/${projectId}/stage${s.num}`}
              onClick={e => isLocked && e.preventDefault()}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#6c5ce7] text-white shadow-lg shadow-[#6c5ce7]/20'
                  : isLocked
                    ? 'text-[#a0a0b8]/40 cursor-not-allowed'
                    : 'text-[#a0a0b8] hover:bg-[#1a1a2e] hover:text-white'
              }`}
            >
              <span>{s.icon}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </Link>
          </div>
        )
      })}
    </nav>
  )
}
