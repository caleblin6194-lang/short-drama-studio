'use client'

import { useState } from 'react'
import type { AssetLibrary, SceneAsset, CharacterAsset, PropAsset } from '@/types'
import AssetCard from './AssetCard'
import UploadDialog from '@/components/shared/UploadDialog'
import Button from '@/components/shared/Button'
import { useUpload } from '@/lib/useUpload'

interface AssetGridProps {
  library: AssetLibrary
  onApprove: (assetId: string) => void
  onAssetUploaded?: (asset: SceneAsset | CharacterAsset | PropAsset) => void
}

export default function AssetGrid({ library, onApprove, onAssetUploaded }: AssetGridProps) {
  const { scenes, characters, props } = library
  const [uploadType, setUploadType] = useState<'scene' | 'character' | 'prop' | null>(null)
  const { upload, uploading } = useUpload()

  const handleUpload = async (file: File) => {
    const result = await upload(file)
    if (!result || !uploadType) return

    // Call API to create asset
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'demo', // Will be connected to actual project in store
        assetType: uploadType,
        data: {
          name: file.name.replace(/\.[^.]+$/, ''),
          imageUrl: result.url,
          status: 'ready',
        },
      }),
    })

    if (!res.ok) throw new Error('Failed to create asset')
    const asset = await res.json()
    onAssetUploaded?.(asset)
  }

  return (
    <>
      <div className="space-y-8">
        {/* 场景 4:3 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[#a0a0b8]">🏞️ 场景 ({scenes.length})</h3>
            <Button size="sm" variant="secondary" onClick={() => setUploadType('scene')}>
              + 上传场景
            </Button>
          </div>
          {scenes.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {scenes.map(s => (
                <AssetCard key={s.id} asset={s} aspectRatio="4/3" onApprove={() => onApprove(s.id)} />
              ))}
            </div>
          ) : (
            <EmptyPlaceholder onUpload={() => setUploadType('scene')} label="上传场景图片" />
          )}
        </section>

        {/* 角色 3:4 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[#a0a0b8]">👤 角色 ({characters.length})</h3>
            <Button size="sm" variant="secondary" onClick={() => setUploadType('character')}>
              + 上传角色
            </Button>
          </div>
          {characters.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {characters.map(c => (
                <AssetCard key={c.id} asset={c} aspectRatio="3/4" onApprove={() => onApprove(c.id)} />
              ))}
            </div>
          ) : (
            <EmptyPlaceholder onUpload={() => setUploadType('character')} label="上传角色图片" />
          )}
        </section>

        {/* 道具 chip */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[#a0a0b8]">🎭 道具 ({props.length})</h3>
            <Button size="sm" variant="secondary" onClick={() => setUploadType('prop')}>
              + 上传道具
            </Button>
          </div>
          {props.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {props.map(p => (
                <AssetCard key={p.id} asset={p} aspectRatio="1/1" onApprove={() => onApprove(p.id)} />
              ))}
            </div>
          ) : (
            <EmptyPlaceholder onUpload={() => setUploadType('prop')} label="上传道具图片" />
          )}
        </section>
      </div>

      {/* 上传弹窗 */}
      <UploadDialog
        open={uploadType !== null}
        onClose={() => setUploadType(null)}
        onUpload={handleUpload}
        assetType={uploadType || 'scene'}
      />
    </>
  )
}

function EmptyPlaceholder({ onUpload, label }: { onUpload: () => void; label: string }) {
  return (
    <div className="border border-dashed border-[#2a2a3e] rounded-xl p-8 text-center">
      <div className="text-3xl opacity-30 mb-2">🖼️</div>
      <p className="text-[#666] text-sm mb-3">暂无{label}</p>
      <Button size="sm" variant="secondary" onClick={onUpload}>
        {label}
      </Button>
    </div>
  )
}
