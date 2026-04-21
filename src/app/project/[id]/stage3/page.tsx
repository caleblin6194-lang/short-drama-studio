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
    reshootShot, updateShotVideoModel, setStage, deleteShot, insertShot,
    toggleNarrationMode, updateShotNarration,
  } = useProjectStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('shots')

  if (!project) return null

  const shots = project.shots
  const episodes = project.episodes
  const currentScript = project.script?.rawText ?? ''
  // Show banner if: shots exist AND (script snapshot missing OR script has changed)
  const scriptChanged = shots.length > 0 && (
    !project.shotsScript || project.shotsScript !== currentScript
  )

  const totalPipelines = shots.length * 3
  const donePipelines = shots.reduce((sum, s) => {
    return sum + (s.pipeline.image.status === 'done' ? 1 : 0) + (s.pipeline.video.status === 'done' ? 1 : 0) + (s.pipeline.audio.status === 'done' ? 1 : 0)
  }, 0)
  const progress = totalPipelines > 0 ? (donePipelines / totalPipelines) * 100 : 0
  const allDone = totalPipelines > 0 && donePipelines === totalPipelines
  const anyDone = shots.some(s => s.pipeline.image.status === 'done')
  const failedCount = shots.filter(s => s.pipeline.image.status === 'failed').length

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

      {/* 剧本变更提示横幅 */}
      {scriptChanged && (
        <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 flex items-start gap-3">
          <span className="text-yellow-400 text-lg shrink-0">⚠️</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-yellow-300 font-medium">剧本已修改</p>
            <p className="text-xs text-yellow-400/80 mt-0.5">当前镜头是基于旧剧本生成的，建议重新生成以匹配最新内容。</p>
          </div>
          <Button
            size="sm"
            variant="primary"
            loading={isGeneratingShots}
            onClick={generateShots}
          >
            重新生成镜头
          </Button>
        </div>
      )}

      {/* 操作栏 */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          onClick={generateShots}
          loading={isGeneratingShots}
          disabled={shots.length > 0 && !scriptChanged}
        >
          {shots.length > 0 && !scriptChanged ? `${shots.length} 个镜头` : '生成镜头'}
        </Button>
        {shots.length > 0 && (
          <Button
            onClick={generateShots}
            loading={isGeneratingShots}
            variant="ghost"
            size="sm"
          >
            🔄 重新生成镜头
          </Button>
        )}
        {/* 旁白模式开关 */}
        <button
          onClick={toggleNarrationMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            project.narrationMode
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'bg-[#1a1a2e] text-[#a0a0b8] border border-[#2a2a3e] hover:border-[#444]'
          }`}
        >
          <span>🎙️</span>
          <span>{project.narrationMode ? '旁白模式（开）' : '旁白模式'}</span>
        </button>
        {shots.length > 0 && (
          <>
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
        <div className="space-y-3">
          {shots.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-[#a0a0b8] mb-3">暂无镜头，点击上方的「生成镜头」按钮即可生成</p>
            </div>
          )}
          {shots.map((shot, i) => (
            <ShotCard
              key={shot.id}
              shot={shot}
              index={i}
              onReshoot={reshootShot}
              onModelChange={updateShotVideoModel}
              onDelete={deleteShot}
              onInsertAfter={insertShot}
              narrationMode={project.narrationMode}
              onNarrationChange={updateShotNarration}
            />
          ))}
          {shots.length > 0 && (
            <button
              onClick={() => insertShot(shots[shots.length - 1]?.id)}
              className="w-full py-2 rounded-xl border border-dashed border-[#2a2a3e] hover:border-[#6c5ce7]/50 text-[#666] hover:text-[#6c5ce7] text-sm transition-colors"
            >
              ＋ 在末尾添加镜头
            </button>
          )}
        </div>
      ) : (
        <>
          <EpisodePanel />
          {shots.length > 0 && (
            <Timeline
              shots={shots}
              episodes={episodes}
              subtitleBlocks={project.masterCut?.subtitleBlocks}
            />
          )}
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
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2a2a3e]">
        {failedCount > 0 && (
          <span className="text-xs text-yellow-400">{failedCount} 个镜头失败，可跳过继续</span>
        )}
        <Button onClick={handleNext} disabled={!anyDone} size="lg">
          下一步：成片预览 →
        </Button>
      </div>
    </div>
  )
}
