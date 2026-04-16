'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/useProjectStore'
import ShotCard from '@/components/stage3/ShotCard'
import Timeline from '@/components/stage3/Timeline'
import TalkingAvatarPanel from '@/components/stage3/TalkingAvatarPanel'
import DialogueSyncPanel from '@/components/stage3/DialogueSyncPanel'
import TransitionLibrary from '@/components/stage3/TransitionLibrary'
import ShotPromptOptimizer from '@/components/stage3/ShotPromptOptimizer'
import EpisodePanel from '@/components/stage3/EpisodePanel'
import Button from '@/components/shared/Button'
import Spinner from '@/components/shared/Spinner'
import ProgressBar from '@/components/shared/ProgressBar'
import Tabs from '@/components/shared/Tabs'
import CollapsiblePanel from '@/components/shared/CollapsiblePanel'

export default function Stage3Page() {
  const {
    project, generateShots, isGeneratingShots, startShoot, isShooting, cancelShoot,
    shootSingleShot, reshootShot, updateShotDialogue, updateShotVideoModel, setStage,
  } = useProjectStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('shots')

  if (!project) return null

  const shots = project.shots
  const episodes = project.episodes
  const totalPipelines = shots.length * 3
  const donePipelines = shots.reduce((sum, s) => {
    return sum + (s.pipeline.image.status === 'done' ? 1 : 0) + (s.pipeline.video.status === 'done' ? 1 : 0) + (s.pipeline.audio.status === 'done' ? 1 : 0)
  }, 0)
  const progress = totalPipelines > 0 ? (donePipelines / totalPipelines) * 100 : 0
  const allDone = totalPipelines > 0 && donePipelines === totalPipelines
  const ungeneratedShots = shots.filter(s => !s.imageUrl || !s.videoUrl)
  const [isShootingSingle, setIsShootingSingle] = useState(false)

  const handleShootSingle = async () => {
    if (isShootingSingle || ungeneratedShots.length === 0) return
    setIsShootingSingle(true)
    for (const shot of ungeneratedShots) {
      await shootSingleShot(shot.id)
    }
    setIsShootingSingle(false)
  }

  const handleNext = () => {
    setStage(4)
    router.push(`/project/${project.id}/stage4`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">第三步：开机拍摄</h2>
        <p className="text-sm text-[#a0a0b8]">AI 自动生成每个镜头的图像、视频和音频</p>
      </div>

      {/* 操作栏 */}
      <div className="flex items-center gap-3">
        <Button onClick={generateShots} loading={isGeneratingShots} disabled={shots.length > 0}>
          {shots.length > 0 ? `${shots.length} 个镜头` : '生成镜头'}
        </Button>
        {shots.length > 0 && (
          <>
            {!isShooting && ungeneratedShots.length > 0 && (
              <Button onClick={handleShootSingle} disabled={isShootingSingle || isShooting} variant="secondary">
                {isShootingSingle ? '单个生成中...' : `单个生成 (${ungeneratedShots.length})`}
              </Button>
            )}
            {!isShooting && !allDone && (
              <Button onClick={startShoot} variant="primary">
                全部生成
              </Button>
            )}
            {isShooting && (
              <>
                <Button onClick={() => cancelShoot?.()} variant="secondary" size="sm">⏸ 暂停</Button>
                <Spinner size={20} label="生成中..." />
              </>
            )}
            {!isShooting && shots.some(s => s.pipeline.image.status === 'done' || s.pipeline.video.status === 'done') && !allDone && (
              <Button onClick={startShoot} variant="primary" size="sm">▶️ 继续</Button>
            )}
          </>
        )}
      </div>

      {/* 进度 */}
      {shots.length > 0 && (
        <ProgressBar value={progress} label={`拍摄进度 (${donePipelines}/${totalPipelines})`} />
      )}

      {/* Tab 切换：剧集 vs 镜头 */}
      {shots.length > 0 && (
        <Tabs
          items={[
            { key: 'shots', label: '全部镜头', count: shots.length },
            { key: 'episodes', label: '剧集', count: episodes.length },
          ]}
          activeKey={activeTab}
          onChange={setActiveTab}
        />
      )}

      {activeTab === 'shots' ? (
        /* 全部镜头列表 */
        <div className="space-y-3">
          {shots.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-[#a0a0b8] mb-3">暂无镜头，请先在第一步填写剧本后点击「生成镜头」</p>
              <Button onClick={() => router.push(`/project/${project.id}/stage1`)} variant="secondary" size="sm">
                去第一步写剧本
              </Button>
            </div>
          )}
          {shots.map((shot, i) => (
            <ShotCard
              key={shot.id}
              shot={shot}
              index={i}
              onShoot={shootSingleShot}
              onReshoot={reshootShot}
              onDialogueChange={updateShotDialogue}
              onModelChange={updateShotVideoModel}
            />
          ))}
        </div>
      ) : (
        <>
          {/* 剧集面板 */}
          <EpisodePanel />

          {/* 时间线 */}
          {shots.length > 0 && <Timeline shots={shots} />}
        </>
      )}

      {/* AI 说话数字人 */}
      <CollapsiblePanel title="AI 说话数字人" icon="🎭">
        <TalkingAvatarPanel />
      </CollapsiblePanel>

      {/* 对话智能对齐 */}
      <CollapsiblePanel title="对话智能对齐" icon="🎙️">
        <DialogueSyncPanel />
      </CollapsiblePanel>

      {/* 转场特效库 */}
      <CollapsiblePanel title="转场特效库" icon="🎬">
        <TransitionLibrary />
      </CollapsiblePanel>

      {/* 镜头Prompt优化 */}
      <CollapsiblePanel title="镜头Prompt优化" icon="✨">
        <ShotPromptOptimizer />
      </CollapsiblePanel>

      {/* 下一步 */}
      <div className="flex justify-end pt-4 border-t border-[#2a2a3e]">
        <Button onClick={handleNext} disabled={!allDone} size="lg">
          下一步：成片预览 →
        </Button>
      </div>
    </div>
  )
}
