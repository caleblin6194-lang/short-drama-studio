'use client'

import type { SceneAsset, CharacterAsset, PropAsset } from '@/types'
import AssetStatusBadge from './AssetStatusBadge'
import Button from '@/components/shared/Button'

type AnyAsset = SceneAsset | CharacterAsset | PropAsset

interface AssetCardProps {
  asset: AnyAsset
  aspectRatio?: string // e.g. "4/3" or "3/4"
  onApprove?: () => void
  onReshoot?: () => void
}

export default function AssetCard({ asset, aspectRatio = '4/3', onApprove, onReshoot }: AssetCardProps) {
  const isReady = asset.status === 'ready'

  return (
    <div className="card overflow-hidden group">
      {/* 图片占位 */}
      <div
        className="bg-[#1a1a2e] flex items-center justify-center relative"
        style={{ aspectRatio }}
      >
        {asset.imageUrl ? (
          <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl opacity-20">
            {'sceneType' in asset ? '🏞️' : 'role' in asset ? '👤' : '🎭'}
          </span>
        )}

        {/* 状态角标 */}
        <div className="absolute top-2 right-2">
          <AssetStatusBadge status={asset.status} />
        </div>
      </div>

      {/* 信息 */}
      <div className="p-3">
        <h4 className="text-sm font-medium text-white truncate">{asset.name}</h4>
        {'tier' in asset && (
          <p className="text-xs text-[#a0a0b8] mt-0.5">{(asset as CharacterAsset).tier}</p>
        )}

        {/* 操作按钮 */}
        {isReady && !asset.approvedByUser && (
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={onApprove} className="flex-1">通过</Button>
            <Button size="sm" variant="ghost" className="flex-1" onClick={onReshoot}>换一张</Button>
          </div>
        )}
        {asset.approvedByUser && (
          <div className="text-xs text-emerald-400 mt-2 text-center">✓ 已通过</div>
        )}
      </div>
    </div>
  )
}
