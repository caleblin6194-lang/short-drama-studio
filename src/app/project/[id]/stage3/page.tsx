'use client'

import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/useProjectStore'
import ShotCard from '@/components/stage3/ShotCard'
import Timeline from '@/components/stage3/Timeline'
import Button from '@/components/shared/Button'
import Spinner from '@/components/shared/Spinner'
import ProgressBar from '@/components/shared/ProgressBar'

export default function Stage3Page() {
  const {
    project, generateShots, isGeneratingShots, startShoot, isShooting,
    reshootShot, updateShotDialogue, setStage,
  } = useProjectStore()
  const router = useRouter()

  if (!project) return null

  const shots = project.shots
  const totalPipelines = shots.length * 3
  const donePipelines = shots.reduce((sum, s) => {
    return sum + (s.pipeline.image.status === 'done' ? 1 : 0) + (s.pipeline.video.status === 'done' ? 1 : 0) + (s.pipeline.audio.status === 'done' ? 1 : 0)
  }, 0)
  const progress = totalPipelines > 0 ? (donePipelines / totalPipelines) * 100 : 0
  const allDone = totalPipelines > 0 && donePipelines === totalPipelines

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
        {shots.length > 0 && !isShooting && !allDone && (
          <Button onClick={startShoot} variant="primary">
            自动开拍
          </Button>
        )}
        {isShooting && <Spinner size={20} label="拍摄中..." />}
      </div>

      {/* 进度 */}
      {shots.length > 0 && (
        <ProgressBar value={progress} label={`拍摄进度 (${donePipelines}/${totalPipelines})`} />
      )}

      {/* 时间线 */}
      <Timeline shots={shots} />

      {/* 镜头列表 */}
      <div className="space-y-3">
        {shots.map((shot, i) => (
          <ShotCard
            key={shot.id}
            shot={shot}
            index={i}
            onReshoot={reshootShot}
            onDialogueChange={updateShotDialogue}
          />
        ))}
      </div>

      {/* 下一步 */}
      <div className="flex justify-end pt-4 border-t border-[#2a2a3e]">
        <Button onClick={handleNext} disabled={!allDone} size="lg">
          下一步：成片预览 →
        </Button>
      </div>
    </div>
  )
}
