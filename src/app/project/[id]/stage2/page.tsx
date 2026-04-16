'use client'

import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/useProjectStore'
import AssetGrid from '@/components/stage2/AssetGrid'
import CharacterConsistencyPanel from '@/components/stage2/CharacterConsistencyPanel'
import Button from '@/components/shared/Button'
import Spinner from '@/components/shared/Spinner'
import CollapsiblePanel from '@/components/shared/CollapsiblePanel'

export default function Stage2Page() {
  const { project, parseScript, isParsingScript, imageGenProgress, approveAsset, approveAllAssets, resetAssetApprovals, reshootAsset, addAsset, setStage } = useProjectStore()
  const router = useRouter()

  if (!project) return null

  const lib = project.assetLibrary
  const totalAssets = lib.scenes.length + lib.characters.length + lib.props.length
  const approvedCount = [...lib.scenes, ...lib.characters, ...lib.props].filter(a => a.approvedByUser).length
  const allApproved = totalAssets > 0 && approvedCount === totalAssets

  const handleNext = () => {
    setStage(3)
    router.push(`/project/${project.id}/stage3`)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">第二步：剧组筹备会</h2>
        <p className="text-sm text-[#a0a0b8]">AI 解析剧本，生成场景、角色和道具</p>
      </div>

      {/* 操作栏 */}
      <div className="flex items-center gap-3">
        <Button onClick={parseScript} loading={isParsingScript} disabled={totalAssets > 0}>
          {totalAssets > 0 ? '已解析' : '解析剧本'}
        </Button>
        {totalAssets > 0 && !allApproved && (
          <Button variant="secondary" onClick={approveAllAssets}>
            全部通过 ({approvedCount}/{totalAssets})
          </Button>
        )}
        {allApproved && (
          <Button variant="ghost" onClick={resetAssetApprovals}>
            重置修改
          </Button>
        )}
      </div>

      {isParsingScript && (
        <div className="py-8 flex justify-center">
          <Spinner label={
            imageGenProgress
              ? `正在生成图片 (${imageGenProgress.done}/${imageGenProgress.total})...`
              : 'AI 正在解析剧本，生成资产...'
          } />
        </div>
      )}

      {/* 剧情预览区 */}
      {project.script?.rawText && (
        <CollapsiblePanel title="📖 剧情内容" icon="📖">
          <div className="space-y-3">
            <div className="bg-[#12121e] rounded-xl p-4">
              <div className="text-xs text-[#6a6a8e] mb-1">剧本内容</div>
              <p className="text-sm text-white leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {project.script.rawText}
              </p>
            </div>
            {project.episodes.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {project.episodes.map(ep => (
                  <div key={ep.id} className="bg-[#12121e] rounded-lg p-3 border border-[#2a2a3e]">
                    <div className="text-xs text-[#6c5ce7] mb-1">第{ep.number}集 · {ep.emotionalTone}</div>
                    <div className="text-sm text-white font-medium">{ep.title}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsiblePanel>
      )}

      {/* 资产网格 */}
      <AssetGrid
        library={lib}
        onApprove={approveAsset}
        onReshoot={reshootAsset}
        onAssetUploaded={(asset) => {
          const kind = 'kind' in asset ? (asset.kind === 'scene' ? 'scene' : asset.kind === 'character' ? 'character' : 'prop') : 'prop'
          addAsset(asset, kind)
        }}
      />

      {/* 角色一致性面板 */}
      {lib.characters.length > 0 && (
        <CollapsiblePanel title="角色一致性" icon="👤">
          <CharacterConsistencyPanel />
        </CollapsiblePanel>
      )}

      {/* 下一步 */}
      <div className="flex justify-end pt-4 border-t border-[#2a2a3e]">
        <Button onClick={handleNext} disabled={!allApproved} size="lg">
          下一步：开机拍摄 →
        </Button>
      </div>
    </div>
  )
}
