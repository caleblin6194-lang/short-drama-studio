'use client'

import { useState } from 'react'
import type { SceneAsset, CharacterAsset, PropAsset } from '@/types'
import AssetStatusBadge from './AssetStatusBadge'
import Button from '@/components/shared/Button'

type AnyAsset = SceneAsset | CharacterAsset | PropAsset

interface AssetCardProps {
  asset: AnyAsset
  aspectRatio?: string
  onApprove?: () => void
  onReshoot?: (instruction?: string) => void
}

export default function AssetCard({ asset, aspectRatio = '4/3', onApprove, onReshoot }: AssetCardProps) {
  const [instruction, setInstruction] = useState('')
  const [sending, setSending] = useState(false)
  const isReady = asset.status === 'ready'
  const isGenerating = asset.status === 'generating'

  const handleSend = async () => {
    if (sending) return
    setSending(true)
    await onReshoot?.(instruction.trim() || undefined)
    setInstruction('')
    setSending(false)
  }

  return (
    <div className="card overflow-hidden group flex flex-col">
      {/* 图片区 */}
      <div
        className="bg-[#1a1a2e] flex items-center justify-center relative"
        style={{ aspectRatio }}
      >
        {asset.imageUrl ? (
          <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl opacity-20">
            {asset.kind === 'scene' ? '🏞️' : asset.kind === 'character' ? '👤' : '🎭'}
          </span>
        )}
        <div className="absolute top-2 right-2">
          <AssetStatusBadge status={asset.status} />
        </div>
        {isGenerating && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#6c5ce7] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* 信息 + 操作 */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <h4 className="text-sm font-medium text-white truncate">{asset.name}</h4>
        {'tier' in asset && (
          <p className="text-xs text-[#a0a0b8]">{(asset as CharacterAsset).tier}</p>
        )}

        {isReady && !asset.approvedByUser && (
          <div className="flex gap-1.5">
            <Button size="sm" onClick={onApprove} className="flex-1">通过</Button>
            <Button size="sm" variant="ghost" className="flex-1" onClick={() => onReshoot?.()}>换一张</Button>
          </div>
        )}
        {asset.approvedByUser && (
          <div className="text-xs text-emerald-400 text-center">✓ 已通过</div>
        )}

        {/* 对话输入框 */}
        {(isReady || asset.approvedByUser) && (
          <div className="flex gap-1 mt-1">
            <input
              type="text"
              value={instruction}
              onChange={e => setInstruction(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !sending) handleSend() }}
              placeholder="描述修改意图…"
              className="flex-1 min-w-0 bg-[#12121e] border border-[#2a2a3e] rounded px-2 py-1 text-[11px] text-white placeholder-[#555] focus:border-[#6c5ce7] focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={sending || isGenerating}
              className="px-2 py-1 bg-[#6c5ce7] text-white text-[11px] rounded hover:bg-[#5a4bc7] disabled:opacity-40 transition-colors shrink-0"
            >
              {sending || isGenerating ? '…' : '改'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
