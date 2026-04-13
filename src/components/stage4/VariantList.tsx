'use client'

import { REGION_TAGS } from '@/lib/constants'
import type { RegionVariant } from '@/types'
import Button from '@/components/shared/Button'

const STATUS_LABEL: Record<string, string> = {
  pending: '等待中',
  translating: '翻译中',
  casting: '选角中',
  shooting: '拍摄中',
  mastering: '合成中',
  done: '完成',
  failed: '失败',
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'text-gray-400',
  translating: 'text-blue-400',
  casting: 'text-purple-400',
  shooting: 'text-amber-400',
  mastering: 'text-emerald-400',
  done: 'text-green-400',
  failed: 'text-red-400',
}

interface VariantListProps {
  variants: RegionVariant[]
  onCreateVariant: (region: string) => void
}

export default function VariantList({ variants, onCreateVariant }: VariantListProps) {
  return (
    <div className="card p-4">
      <h3 className="text-sm font-medium text-[#a0a0b8] mb-3">🌍 一稿多投 — 地域变体</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {REGION_TAGS.map(region => {
          const variant = variants.find(v => v.region === region)
          const isCreating = variant && variant.status !== 'done' && variant.status !== 'pending' && variant.status !== 'failed'

          return (
            <div key={region} className="flex items-center justify-between bg-[#1a1a2e] rounded-lg px-4 py-3">
              <div>
                <span className="text-sm text-white font-medium">{region}</span>
                {variant && (
                  <span className={`text-xs ml-2 ${STATUS_COLOR[variant.status] || ''}`}>
                    {isCreating && '⏳ '}{STATUS_LABEL[variant.status] || variant.status}
                  </span>
                )}
              </div>
              {!variant ? (
                <Button size="sm" variant="secondary" onClick={() => onCreateVariant(region)}>
                  生成
                </Button>
              ) : variant.status === 'done' ? (
                <span className="text-xs text-green-400">✓</span>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
