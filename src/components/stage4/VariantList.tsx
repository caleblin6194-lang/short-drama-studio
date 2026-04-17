'use client'

import { REGION_TAGS } from '@/lib/constants'
import type { RegionVariant } from '@/types'
import { useProjectStore } from '@/store/useProjectStore'
import Button from '@/components/shared/Button'

const STATUS_LABEL: Record<string, string> = {
  pending: '等待中',
  translating: '翻译中 ⏳',
  casting: '选角中 ⏳',
  shooting: '拍摄中 ⏳',
  mastering: '合成中 ⏳',
  done: '已完成 ✓',
  failed: '失败 ✗',
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'text-gray-400',
  translating: 'text-blue-400 animate-pulse',
  casting: 'text-purple-400 animate-pulse',
  shooting: 'text-amber-400 animate-pulse',
  mastering: 'text-emerald-400 animate-pulse',
  done: 'text-green-400',
  failed: 'text-red-400',
}

interface VariantListProps {
  variants: RegionVariant[]
  onCreateVariant: (region: string) => void
}

export default function VariantList({ variants, onCreateVariant }: VariantListProps) {
  const { project } = useProjectStore()
  const scriptExcerpt = project?.script.rawText?.slice(0, 60)?.replace(/\n/g, ' ') || ''

  return (
    <div className="card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-1">🌍 一稿多投 — 地域变体</h3>
        <p className="text-xs text-[#6a6a8e]">
          AI 自动翻译剧本并适配各地区文化习惯
        </p>
      </div>

      {scriptExcerpt && (
        <div className="p-2 rounded-lg bg-[#12121e] border border-[#2a2a3e]">
          <div className="text-[10px] text-[#6a6a8e] mb-1">原始剧本（前60字）</div>
          <div className="text-xs text-[#a0a0b8] truncate">{scriptExcerpt}…</div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {REGION_TAGS.map(region => {
          const variant = variants.find(v => v.region === region)
          const isInProgress = variant && !['done', 'pending', 'failed'].includes(variant.status)

          return (
            <div
              key={region}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 border transition-colors ${
                variant?.status === 'done'
                  ? 'bg-[#0f1f1a] border-green-500/30'
                  : variant?.status === 'failed'
                  ? 'bg-[#1f0f0f] border-red-500/30'
                  : 'bg-[#1a1a2e] border-[#2a2a3e]'
              }`}
            >
              <div>
                <span className="text-sm text-white font-medium">{region}</span>
                {variant && (
                  <span className={`text-xs ml-2 ${STATUS_COLOR[variant.status] || ''}`}>
                    {STATUS_LABEL[variant.status] || variant.status}
                  </span>
                )}
              </div>
              {!variant ? (
                <Button size="sm" variant="secondary" onClick={() => onCreateVariant(region)}>
                  生成
                </Button>
              ) : variant.status === 'failed' ? (
                <Button size="sm" variant="ghost" onClick={() => onCreateVariant(region)}>
                  重试
                </Button>
              ) : variant.status === 'done' ? (
                <span className="text-xs text-green-400 font-medium">✓</span>
              ) : isInProgress ? (
                <span className="text-xs text-[#6a6a8e]">处理中</span>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="text-[10px] text-[#6a6a8e] text-center">
        每个地域变体将重新选角、翻译台词并适配文化细节
      </div>
    </div>
  )
}
