/**
 * Real shoot pipeline - generates images, videos, and audio for shots
 * Uses Doubao Seed for images/videos with polling
 */

import type { Shot, PipelineStage } from '@/types'
import { generateImageWithDoubao } from './doubao-image'
import { generateVideoWithSeed } from './seed-video'
import { getSeedVideoStatus } from './seed-video'

export type ShootPipelineStage = 'image' | 'video' | 'audio'

export interface ShootPipelineCallbacks {
  onShotUpdate: (shotId: string, stage: ShootPipelineStage, pipelineStage: PipelineStage) => void
  onComplete: () => void
  onError?: (shotId: string, stage: ShootPipelineStage, error: string) => void
}

/**
 * Start the real shoot pipeline with async polling
 * Returns a cancel function
 */
export function startRealShootPipeline(
  shots: Shot[],
  callbacks: ShootPipelineCallbacks,
): () => void {
  let cancelled = false

  const run = async () => {
    const { onShotUpdate, onComplete, onError } = callbacks

    // Process shots: image → video → audio (sequential within each shot)
    for (let i = 0; i < shots.length && !cancelled; i++) {
      const shot = shots[i]

      // Stage 1: Image generation
      if (cancelled) return
      onShotUpdate(shot.id, 'image', { status: 'rendering', attemptCount: 1 })

      try {
        let imageUrl = shot.imageUrl

        if (!imageUrl) {
          const imageResult = await generateImageWithDoubao({
            prompt: shot.description,
            size: '2K',
          })

          if (imageResult.status === 'done' && imageResult.imageUrl) {
            imageUrl = imageResult.imageUrl
          } else if (imageResult.taskId) {
            // Poll for image completion
            imageUrl = await pollImageJob(imageResult.taskId!) ?? undefined
          }

          if (!imageUrl) {
            onShotUpdate(shot.id, 'image', { status: 'failed', attemptCount: 1, error: 'Image generation failed' })
            onError?.(shot.id, 'image', 'Image generation failed')
            continue
          }
        }

        onShotUpdate(shot.id, 'image', {
          status: 'done',
          attemptCount: 1,
          cost: 0,
          modelUsed: 'doubao-seedream-5-0-260128',
        })

        // Stage 2: Video generation (requires image)
        if (cancelled) return
        onShotUpdate(shot.id, 'video', { status: 'rendering', attemptCount: 1 })

        let videoUrl = shot.videoUrl

        if (!videoUrl) {
          const videoResult = await generateVideoWithSeed({
            prompt: shot.description,
            imageUrl,
            duration: 5,
            aspectRatio: '9:16',
          })

          if (videoResult.status === 'done' && videoResult.videoUrl) {
            videoUrl = videoResult.videoUrl
          } else if (videoResult.taskId != null) {
            // Poll for video completion
            videoUrl = await pollVideoJob(videoResult.taskId ?? '') || undefined
          }

          if (!videoUrl) {
            onShotUpdate(shot.id, 'video', { status: 'failed', attemptCount: 1, error: 'Video generation failed' })
            onError?.(shot.id, 'video', 'Video generation failed')
            continue
          }
        }

        onShotUpdate(shot.id, 'video', {
          status: 'done',
          attemptCount: 1,
          cost: 0,
          modelUsed: 'doubao-seedance-2-0-260128',
        })

        // Stage 3: Audio (dialogue/TTS) - placeholder for now
        if (cancelled) return
        onShotUpdate(shot.id, 'audio', { status: 'rendering', attemptCount: 1 })

        // TODO: Integrate real TTS/talking avatar API
        // For now, mark as done (mock audio)
        await sleep(500)
        onShotUpdate(shot.id, 'audio', {
          status: 'done',
          attemptCount: 1,
          cost: 0,
          modelUsed: 'mock-tts',
        })

      } catch (err: any) {
        console.error(`[Pipeline] Shot ${shot.id} error:`, err)
        onError?.(shot.id, 'image', err.message)
        // Mark current stage as failed and continue
        onShotUpdate(shot.id, 'image', { status: 'failed', attemptCount: 1, error: err.message })
      }
    }

    if (!cancelled) onComplete()
  }

  run()
  return () => { cancelled = true }
}

async function pollImageJob(taskId: string): Promise<string | null> {
  const maxAttempts = 60
  const intervalMs = 3000

  for (let i = 0; i < maxAttempts; i++) {
    await sleep(intervalMs)
    const result = await getSeedVideoStatus(taskId)
    // Note: image tasks may use a different polling endpoint
    // For Seedream, we poll the same endpoint
    if (result.status === 'done' && result.videoUrl) {
      return result.videoUrl
    }
    if (result.status === 'failed') return null
  }
  return null
}

async function pollVideoJob(taskId: string): Promise<string | null> {
  const maxAttempts = 60
  const intervalMs = 3000

  for (let i = 0; i < maxAttempts; i++) {
    await sleep(intervalMs)
    const result = await getSeedVideoStatus(taskId)
    if (result.status === 'done' && result.videoUrl) {
      return result.videoUrl
    }
    if (result.status === 'failed') return null
  }
  return null
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
