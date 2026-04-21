'use client'

import { useState } from 'react'
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

function VariantDetail({ variant }: { variant: RegionVariant }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-2 space-y-2">
      {variant.platformSpecs && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e2a3a] text-blue-300 border border-blue-500/20">
            {variant.platformSpecs.platformName}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1e2a] text-purple-300 border border-purple-500/20">
            {variant.platformSpecs.aspectRatio} · ≤{variant.platformSpecs.maxDurationSec}s
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a2a1e] text-emerald-300 border border-emerald-500/20">
            字幕: {variant.platformSpecs.captionStyle}
          </span>
        </div>
      )}

      {variant.adaptedScript && (
        <div>
          <button
            className="text-[10px] text-[#6a6a8e] hover:text-[#a0a0b8] transition-colors"
            onClick={() => setOpen(v => !v)}
          >
            {open ? '▲ 收起剧本' : '▼ 查看本地化剧本'}
          </button>
          {open && (
            <div className="mt-1.5 p-2 rounded-lg bg-[#0d0d1a] border border-[#2a2a3e] max-h-40 overflow-y-auto">
              <p className="text-[11px] text-[#a0a0b8] whitespace-pre-wrap leading-relaxed">
                {variant.adaptedScript}
              </p>
            </div>
          )}
        </div>
      )}

      {variant.audioPreviewDataUrl && (
        <div>
          <div className="text-[10px] text-[#6a6a8e] mb-1">语音预览（前400字）</div>
          <audio
            controls
            src={variant.audioPreviewDataUrl}
            className="w-full h-7"
            style={{ filter: 'invert(0.85) hue-rotate(200deg)' }}
          />
        </div>
      )}

      {variant.adaptationNote && (
        <p className="text-[10px] text-[#6a6a8e] italic">{variant.adaptationNote}</p>
      )}
    </div>
  )
}

export default function VariantList({ variants, onCreateVariant }: VariantListProps) {
  const { project } = useProjectStore()
  const scriptExcerpt = project?.script.rawText?.slice(0, 60)?.replace(/\n/g, ' ') || ''

  return (
    <div className="card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-1">🌍 一稿多投 — 地域变体</h3>
        <p className="text-xs text-[#6a6a8e]">
          AI 自动翻译剧本、适配文化习惯，并生成目标语言语音预览
        </p>
      </div>

      {scriptExcerpt && (
        <div className="p-2 rounded-lg bg-[#12121e] border border-[#2a2a3e]">
          <div className="text-[10px] text-[#6a6a8e] mb-1">原始剧本（前60字）</div>
          <div className="text-xs text-[#a0a0b8] truncate">{scriptExcerpt}…</div>
        </div>
      )}

      <div className="space-y-2">
        {REGION_TAGS.map(region => {
          const variant = variants.find(v => v.region === region)
          const isInProgress = variant && !['done', 'pending', 'failed'].includes(variant.status)

          return (
            <div
              key={region}
              className={`rounded-lg px-3 py-2.5 border transition-colors ${
                variant?.status === 'done'
                  ? 'bg-[#0f1f1a] border-green-500/30'
                  : variant?.status === 'failed'
                  ? 'bg-[#1f0f0f] border-red-500/30'
                  : 'bg-[#1a1a2e] border-[#2a2a3e]'
              }`}
            >
              <div className="flex items-center justify-between">
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

              {variant?.status === 'done' && <VariantDetail variant={variant} />}
            </div>
          )
        })}
      </div>

      <div className="text-[10px] text-[#6a6a8e] text-center">
        每个地域变体包含本地化剧本、目标平台规格及语音预览
      </div>
    </div>
  )
}
