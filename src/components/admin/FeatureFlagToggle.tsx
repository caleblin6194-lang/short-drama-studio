'use client'

import type { FeatureFlag } from '@/types'

interface FeatureFlagToggleProps {
  flags: FeatureFlag[]
  onToggle: (key: string) => void
}

export default function FeatureFlagToggle({ flags, onToggle }: FeatureFlagToggleProps) {
  return (
    <div className="space-y-2">
      {flags.map(flag => (
        <div key={flag.key} className="flex items-center justify-between bg-[#1a1a2e] rounded-lg px-4 py-3">
          <div>
            <p className="text-sm text-white font-medium">{flag.label}</p>
            <p className="text-xs text-[#a0a0b8]">{flag.description}</p>
          </div>
          <button
            onClick={() => onToggle(flag.key)}
            className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${flag.enabled ? 'bg-emerald-500' : 'bg-[#2a2a3e]'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${flag.enabled ? 'left-5.5' : 'left-0.5'}`} />
          </button>
        </div>
      ))}
    </div>
  )
}
