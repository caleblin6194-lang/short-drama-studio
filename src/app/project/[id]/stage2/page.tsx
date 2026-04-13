'use client'

import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/useProjectStore'
import AssetGrid from '@/components/stage2/AssetGrid'
import Button from '@/components/shared/Button'
import Spinner from '@/components/shared/Spinner'

export default function Stage2Page() {
  const { project, parseScript, isParsingScript, approveAsset, approveAllAssets, setStage } = useProjectStore()
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
      </div>

      {isParsingScript && (
        <div className="py-8 flex justify-center">
          <Spinner label="AI 正在解析剧本，生成资产..." />
        </div>
      )}

      {/* 资产网格 */}
      <AssetGrid library={lib} onApprove={approveAsset} />

      {/* 下一步 */}
      <div className="flex justify-end pt-4 border-t border-[#2a2a3e]">
        <Button onClick={handleNext} disabled={!allApproved} size="lg">
          下一步：开机拍摄 →
        </Button>
      </div>
    </div>
  )
}
