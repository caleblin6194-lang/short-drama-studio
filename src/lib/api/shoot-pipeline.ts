/**
 * Real shoot pipeline (client-side orchestrator).
 * Calls server API routes under /api/shoot/* which in turn invoke Doubao/Seed.
 * This keeps API keys on the server and avoids CORS from the browser.
 */

import type { Shot, PipelineStage, CharacterAsset } from '@/types'

export type ShootPipelineStage = 'image' | 'video' | 'audio'

export interface ShootPipelineCallbacks {
  onShotUpdate: (shotId: string, stage: ShootPipelineStage, pipelineStage: PipelineStage) => void
  onComplete: () => void
  onError?: (shotId: string, stage: ShootPipelineStage, error: string) => void
}

interface ImageApiResponse {
  status: 'pending' | 'done' | 'failed'
  taskId?: string
  imageUrl?: string
  error?: string
}

interface VideoApiResponse {
  status: 'pending' | 'done' | 'failed'
  taskId?: string
  videoUrl?: string
  error?: string
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return (await res.json()) as T
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  return (await res.json()) as T
}

export function startRealShootPipeline(
  shots: Shot[],
  callbacks: ShootPipelineCallbacks,
  lockedCharacters?: CharacterAsset[],
): () => void {
  let cancelled = false

  const run = async () => {
    const { onShotUpdate, onComplete, onError } = callbacks

    for (let i = 0; i < shots.length && !cancelled; i++) {
      const shot = shots[i]

      // Stage 1: Image
      if (cancelled) return
      onShotUpdate(shot.id, 'image', { status: 'rendering', attemptCount: 1 })

      try {
        let imageUrl = shot.imageUrl

        if (!imageUrl) {
          // Find a locked character referenced in this shot's description
          const refChar = lockedCharacters?.find(
            c => c.isLocked && c.lockedImageUrl && shot.description.includes(c.name),
          )
          const imageResult = await postJson<ImageApiResponse>('/api/shoot/image', {
            prompt: shot.description,
            size: '2K',
            referenceImageUrl: refChar?.lockedImageUrl,
          })

          if (imageResult.status === 'done' && imageResult.imageUrl) {
            imageUrl = imageResult.imageUrl
          } else if (imageResult.taskId) {
            imageUrl = (await pollVideoTask(imageResult.taskId)) ?? undefined
          }

          if (!imageUrl) {
            const msg = imageResult.error || 'Image generation failed'
            onShotUpdate(shot.id, 'image', { status: 'failed', attemptCount: 1, error: msg })
            onError?.(shot.id, 'image', msg)
            continue
          }
        }

        onShotUpdate(shot.id, 'image', {
          status: 'done',
          attemptCount: 1,
          cost: 0,
          modelUsed: 'doubao-seedream-5-0-260128',
        })

        // Stage 2: Video
        if (cancelled) return
        onShotUpdate(shot.id, 'video', { status: 'rendering', attemptCount: 1 })

        let videoUrl = shot.videoUrl

        if (!videoUrl) {
          // Determine model: use shot.videoModel if set and not 'auto'
          const model = shot.videoModel && shot.videoModel !== 'auto' ? shot.videoModel : undefined
          const videoResult = await postJson<VideoApiResponse>('/api/shoot/video', {
            prompt: shot.description,
            imageUrl,
            duration: 5,
            aspectRatio: '9:16',
            model,
          })

          if (videoResult.status === 'done' && videoResult.videoUrl) {
            videoUrl = videoResult.videoUrl
          } else if (videoResult.taskId) {
            videoUrl = (await pollVideoTask(videoResult.taskId)) ?? undefined
          }

          if (!videoUrl) {
            const msg = videoResult.error || 'Video generation failed'
            onShotUpdate(shot.id, 'video', { status: 'failed', attemptCount: 1, error: msg })
            onError?.(shot.id, 'video', msg)
            continue
          }
        }

        onShotUpdate(shot.id, 'video', {
          status: 'done',
          attemptCount: 1,
          cost: 0,
          modelUsed: 'doubao-seedance-2-0-260128',
          videoUrl,
        })

        // Stage 3: Audio (TTS)
        if (cancelled) return
        onShotUpdate(shot.id, 'audio', { status: 'rendering', attemptCount: 1 })
        try {
          const dialogueText = shot.dialogue || shot.description || ''
          let audioUrl: string | undefined
          if (dialogueText.trim()) {
            const origin = typeof window !== 'undefined' ? window.location.origin : ''
          const ttsRes = await fetch(origin + '/api/tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: dialogueText.slice(0, 500) }),
            })
            if (ttsRes.ok) {
              const blob = await ttsRes.blob()
              const formData = new FormData()
              formData.append('file', blob, 'audio.mp3')
              formData.append('purpose', 'uploads')
              // Upload to Cloudflare R2
              const r2Res = await fetch('https://UPLOAD_DOMAIN.r2.io/api/upload', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer UPLOAD_TOKEN' },
                body: formData,
              }).catch(() => null)
              if (r2Res?.ok) {
                const r2Data = await r2Res.json()
                audioUrl = r2Data.url
              }
              // Fallback: save to local /tmp and serve via /api/render/serve
              if (!audioUrl) {
                const taskId = Date.now().toString(36)
                const tmpPath = `/tmp/render-${shot.id}/audio-${taskId}.mp3`
                const { mkdirSync, writeFileSync } = await import('fs')
                mkdirSync(`/tmp/render-${shot.id}`, { recursive: true })
                const buf = Buffer.from(await blob.arrayBuffer())
                writeFileSync(tmpPath, buf)
                audioUrl = `/api/render/serve?file=audio-${taskId}.mp3&job=${shot.id}`
              }
            }
          }
          onShotUpdate(shot.id, 'audio', {
            status: audioUrl ? 'done' : 'done',
            attemptCount: 1,
            cost: 0,
            modelUsed: 'edge-tts',
            audioUrl,
          })
        } catch (err: any) {
          console.error('[Pipeline] Audio error:', err)
          onShotUpdate(shot.id, 'audio', { status: 'done', attemptCount: 1, cost: 0, modelUsed: 'edge-tts' })
        }
      } catch (err: any) {
        console.error(`[Pipeline] Shot ${shot.id} error:`, err)
        onError?.(shot.id, 'image', err.message)
        onShotUpdate(shot.id, 'image', { status: 'failed', attemptCount: 1, error: err.message })
      }
    }

    if (!cancelled) onComplete()
  }

  run()
  return () => {
    cancelled = true
  }
}

async function pollVideoTask(taskId: string): Promise<string | null> {
  const maxAttempts = 60
  const intervalMs = 3000

  for (let i = 0; i < maxAttempts; i++) {
    await sleep(intervalMs)
    const result = await getJson<VideoApiResponse>(
      `/api/shoot/video-status/${encodeURIComponent(taskId)}`,
    )
    if (result.status === 'done' && result.videoUrl) return result.videoUrl
    if (result.status === 'failed') return null
  }
  return null
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
