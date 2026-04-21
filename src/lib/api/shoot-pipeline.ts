/**
 * Real shoot pipeline (client-side orchestrator).
 * Calls server API routes under /api/shoot/* which in turn invoke Doubao/Seed.
 * This keeps API keys on the server and avoids CORS from the browser.
 */

import type { Shot, PipelineStage, AssetLibrary, CharacterAsset, SceneAsset, PropAsset, GlobalConfig } from '@/types'
import { recommendVideoModel } from '@/types'

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

const SHOT_TYPE_MAP: Record<string, string> = {
  extreme_wide: '极远景，大全景，环境主导',
  wide: '全身镜头，full body shot',
  medium: '中景，腰部以上',
  close: '近景，胸部以上，面部表情清晰',
  extreme_close: '大特写，仅面部，眼神锐利',
}

/** Build an enriched image prompt from Stage 2 assets for a given shot. */
function buildRichPrompt(shot: Shot, assets: AssetLibrary, globalConfig?: GlobalConfig): { prompt: string; referenceImageUrl?: string; seed?: number } {
  const parts: string[] = []

  // 1. Match scene asset by sceneRef name
  const scene = assets.scenes.find(
    s => s.approvedByUser && shot.sceneRef && s.name.includes(shot.sceneRef.replace(/场景\d+/, '').trim() || shot.sceneRef),
  ) ?? assets.scenes.find(s => s.approvedByUser)  // fallback: first approved scene

  if (scene?.description) {
    parts.push(`场景：${scene.description}`)
    if ((scene as SceneAsset).timeOfDay) parts.push(`时间：${(scene as SceneAsset).timeOfDay}`)
    if ((scene as SceneAsset).mood) parts.push(`氛围：${(scene as SceneAsset).mood}`)
  }

  // 2. Match characters by characterRefs names (or by searching description)
  const matchedChars: CharacterAsset[] = []
  if (shot.characterRefs?.length) {
    for (const refName of shot.characterRefs) {
      const char = assets.characters.find(
        c => c.approvedByUser && (c.name === refName || c.name.includes(refName) || refName.includes(c.name)),
      )
      if (char) matchedChars.push(char)
    }
  }
  // Fallback: search description for character names
  if (matchedChars.length === 0) {
    for (const char of assets.characters) {
      if (char.approvedByUser && shot.description.includes(char.name)) {
        matchedChars.push(char)
      }
    }
  }

  for (const char of matchedChars) {
    if (char.description) parts.push(`角色${char.name}：${char.description}`)
  }

  // 3. Match props by propRefs
  if (shot.propRefs?.length) {
    for (const refName of shot.propRefs) {
      const prop = assets.props.find(
        p => p.approvedByUser && (p.name === refName || p.name.includes(refName) || refName.includes(p.name)),
      ) as PropAsset | undefined
      if (prop?.description) parts.push(`道具${prop.name}：${prop.description}`)
    }
  }

  // 4. Core shot description + camera direction
  parts.push(shot.description)
  if (shot.cameraDirection) parts.push(`运镜：${shot.cameraDirection}`)

  // 5. shotType → composition words
  if (shot.shotType && SHOT_TYPE_MAP[shot.shotType]) parts.push(SHOT_TYPE_MAP[shot.shotType])

  // 6. Style anchor (globalConfig overrides hard-coded default)
  const anchor = globalConfig?.styleAnchor || '竖屏构图，电影感，高质量'
  parts.push(anchor)
  if (globalConfig?.lightingRule) parts.push(`光线：${globalConfig.lightingRule}`)
  if (globalConfig?.prohibitedElements) parts.push(`避免：${globalConfig.prohibitedElements}`)

  // 7. Pick best reference image: prefer locked lead character, then any locked character
  const lockedLead = matchedChars.find(c => c.isLocked && c.lockedImageUrl && c.tier === 'lead')
  const lockedAny = matchedChars.find(c => c.isLocked && c.lockedImageUrl)
  const referenceImageUrl = (lockedLead ?? lockedAny)?.lockedImageUrl

  const seed = globalConfig ? globalConfig.globalSeed + shot.order : undefined
  return { prompt: parts.join('，'), referenceImageUrl, seed }
}

const CAMERA_MOVE_VIDEO_SUFFIX: Record<string, string> = {
  push: 'slow push in, camera moving forward',
  pull: 'slow pull out, camera moving backward',
  pan: 'horizontal pan, smooth camera movement',
  track: 'tracking shot, follows subject',
  orbit: '360 orbit around subject',
  crane: 'crane shot, camera rising upward',
  static: 'static camera, no movement',
}

const EMOTION_TTS_MAP: Record<string, { speed: string; pitch: string }> = {
  angry:     { speed: '+15%', pitch: '+5Hz' },
  sad:       { speed: '-20%', pitch: '-10Hz' },
  tense:     { speed: '+10%', pitch: '+3Hz' },
  happy:     { speed: '+5%',  pitch: '+5Hz' },
  surprised: { speed: '+8%',  pitch: '+8Hz' },
  neutral:   { speed: '+0%',  pitch: '+0Hz' },
}

export function startRealShootPipeline(
  shots: Shot[],
  callbacks: ShootPipelineCallbacks,
  assetLibrary?: AssetLibrary,
  narrationMode?: boolean,
  globalConfig?: GlobalConfig,
): () => void {
  let cancelled = false

  const run = async () => {
    const { onShotUpdate, onComplete, onError } = callbacks

    for (let i = 0; i < shots.length && !cancelled; i++) {
      const shot = shots[i]

      // Stage 1: Image
      if (cancelled) return

      try {
        let imageUrl = shot.imageUrl

        if (!imageUrl) {
          onShotUpdate(shot.id, 'image', { status: 'rendering', attemptCount: 1 })
          const { prompt, referenceImageUrl, seed } = assetLibrary
            ? buildRichPrompt(shot, assetLibrary, globalConfig)
            : { prompt: shot.description, referenceImageUrl: undefined, seed: undefined }

          const imageResult = await postJson<ImageApiResponse>('/api/shoot/image', {
            prompt,
            size: '2K',
            referenceImageUrl,
            seed,
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
          imageUrl,
        })

        // Stage 2: Video
        if (cancelled) return

        let videoUrl = shot.videoUrl

        if (!videoUrl) {
          onShotUpdate(shot.id, 'video', { status: 'rendering', attemptCount: 1 })
          // Use rich prompt (same context as image) + cinematic quality suffix + cameraMove
          const baseAnchor = globalConfig?.styleAnchor || '竖屏构图，电影感，高质量'
          const richPrompt = assetLibrary
            ? buildRichPrompt(shot, assetLibrary, globalConfig).prompt
            : shot.description
          const cameraMoveSuffix = shot.cameraMove ? (CAMERA_MOVE_VIDEO_SUFFIX[shot.cameraMove] || '') : ''
          const videoPrompt = richPrompt
            .replace(new RegExp(baseAnchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), '')
            + '，写实人物，动作连贯，电影级画质，高清'
            + (cameraMoveSuffix ? `，${cameraMoveSuffix}` : '')

          // Pick model: respect manual override, otherwise use recommendVideoModel
          const model = (shot.videoModel && shot.videoModel !== 'auto')
            ? shot.videoModel
            : recommendVideoModel(shot)

          const videoResult = await postJson<VideoApiResponse>('/api/shoot/video', {
            prompt: videoPrompt,
            imageUrl,
            duration: shot.durationSec || 5,
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
          // Narration mode: prefer narration text for TTS; fall back to dialogue then description
          const dialogueText = (narrationMode && shot.narration)
            ? shot.narration
            : (shot.dialogue || shot.description || '')
          let audioUrl: string | undefined
          if (dialogueText.trim()) {
            const origin = typeof window !== 'undefined' ? window.location.origin : ''
            const emotionParams = EMOTION_TTS_MAP[shot.emotionTag ?? 'neutral'] ?? EMOTION_TTS_MAP.neutral
            const ttsRes = await fetch(origin + '/api/tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: dialogueText.slice(0, 500),
                speed: emotionParams.speed,
                pitch: emotionParams.pitch,
              }),
            })
            if (ttsRes.ok) {
              const blob = await ttsRes.blob()
              audioUrl = URL.createObjectURL(blob)
            }
          }
          onShotUpdate(shot.id, 'audio', {
            status: 'done',
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
