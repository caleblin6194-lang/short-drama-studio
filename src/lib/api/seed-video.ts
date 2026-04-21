/**
 * Doubao 视频生成 API (Volc ARK)
 * Model priority: 2.0 > 1.5-pro > 1.0-pro (fallback chain for cost efficiency)
 * Create task: POST https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks
 * Query task:  GET  https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/{task_id}
 * 
 * Available models (price est.):
 *   doubao-seedance-2-0-260128        - Seedance 2.0 (expensive, ~¥1-2/video)
 *   doubao-seedance-1-5-pro-251215   - Seedance 1.5 Pro (medium, ~¥0.5/video)
 *   doubao-seedance-1-0-pro-250528   - Seedance 1.0 Pro (cheap, ~¥0.2/video)
 *   doubao-seedance-2-0-fast-260128   - Seedance 2.0 fast (similar price to 2.0)
 *   doubao-seedance-1-0-pro-fast-251015 - Seedance 1.0 fast (cheap, ~¥0.15/video)
 */

interface SeedVideoRequest {
  prompt: string
  imageUrl?: string
  duration?: number
  aspectRatio?: '16:9' | '9:16' | '1:1'
}

interface SeedVideoResponse {
  taskId?: string
  status: 'pending' | 'done' | 'failed'
  videoUrl?: string
  error?: string
}

const API_KEY = process.env.DOUBAN_SEED_API_KEY?.trim()
// Prefer the contents/generations/tasks endpoint. If the user configured the
// legacy video/generations URL, transparently rewrite it.
const RAW_ENDPOINT =
  process.env.SEED_API_ENDPOINT ||
  'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks'
const TASKS_ENDPOINT = RAW_ENDPOINT.replace(/\/video\/generations\/?$/, '/contents/generations/tasks')
// Model chain: highest quality first, fall back to fast as guaranteed fallback
// 1.5-pro ≈ ¥0.4-0.6/video | 2.0 ≈ ¥1-2/video | fast ≈ ¥0.15/video (always available)
const MODELS = [
  'doubao-seedance-1-5-pro-251215',
  'doubao-seedance-2-0-260128',
  'doubao-seedance-1-0-pro-fast-251015',  // guaranteed fallback
]
const MODEL_FAST = 'doubao-seedance-1-0-pro-fast-251015'

async function safeJson(response: Response): Promise<any> {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { _raw: text }
  }
}

async function createTask(model: string, req: SeedVideoRequest): Promise<SeedVideoResponse> {
  if (!API_KEY) {
    console.warn('[Seed] Missing DOUBAN_SEED_API_KEY, using mock mode')
    return mockGenerateVideo(req)
  }

  const tryModel = async (modelName: string): Promise<SeedVideoResponse> => {
    try {
      // Seedance 2.0 only accepts 5/10/15s; 1.x accepts arbitrary durations
      const rawDur = req.duration || 5
      const dur = modelName.includes('seedance-2-0')
        ? (rawDur <= 5 ? 5 : rawDur <= 10 ? 10 : 15)
        : Math.max(3, Math.min(15, rawDur))
      const content: any[] = [
        { type: 'text', text: `${req.prompt} --rt ${req.aspectRatio || '9:16'} --rs 1080p --dur ${dur}` },
      ]
      if (req.imageUrl) {
        content.push({ type: 'image_url', image_url: { url: req.imageUrl } })
      }

      const response = await fetch(TASKS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({ model: modelName, content }),
      })

      const data = await safeJson(response)
      console.log(`[Seed] createTask ${modelName} status=${response.status} body=`, JSON.stringify(data).slice(0, 300))

      if (!response.ok) {
        // Try next model in chain
        const idx = MODELS.indexOf(modelName)
        if (idx < MODELS.length - 1) {
          console.warn(`[Seed] Model ${modelName} failed (${response.status}), trying next...`)
          return tryModel(MODELS[idx + 1])
        }
        return {
          status: 'failed',
          error: data.error?.message || data._raw || `HTTP ${response.status}`,
        }
      }

      if (data.id) return { taskId: data.id, status: 'pending' }
      if (data.task_id) return { taskId: data.task_id, status: 'pending' }
      // content can be an array or object depending on API version
      const contentVideoUrl = Array.isArray(data.content) ? data.content[0]?.video_url : data.content?.video_url
      if (contentVideoUrl) return { status: 'done', videoUrl: contentVideoUrl }

      // Unexpected response, try next
      const idx = MODELS.indexOf(modelName)
      if (idx < MODELS.length - 1) {
        console.warn(`[Seed] Model ${modelName} unexpected response, trying next...`)
        return tryModel(MODELS[idx + 1])
      }
      return { status: 'failed', error: 'Unexpected response: ' + JSON.stringify(data).slice(0, 200) }
    } catch (err: any) {
      const idx = MODELS.indexOf(modelName)
      if (idx < MODELS.length - 1) {
        console.warn(`[Seed] Model ${modelName} exception: ${err.message}, trying next...`)
        return tryModel(MODELS[idx + 1])
      }
      console.error('[Seed] API error:', err)
      return { status: 'failed', error: err.message }
    }
  }

  return tryModel(model)
}

export function generateVideoWithSeed(req: SeedVideoRequest): Promise<SeedVideoResponse> {
  return createTask(MODELS[0], req)
}

export function generateVideoFast(req: SeedVideoRequest): Promise<SeedVideoResponse> {
  return createTask(MODEL_FAST, req)
}

export function generateVideoModel(modelKey: string, req: SeedVideoRequest): Promise<SeedVideoResponse> {
  // Map user-facing key to actual model ID
  const modelMap: Record<string, string> = {
    'seedance-1-0-fast': 'doubao-seedance-1-0-pro-fast-251015',
    'seedance-1-0-pro': 'doubao-seedance-1-0-pro-250528',
    'seedance-1-5-pro': 'doubao-seedance-1-5-pro-251215',
    'seedance-2-0': 'doubao-seedance-2-0-260128',
  }
  const actualModel = modelMap[modelKey] || MODELS[0]
  return createTask(actualModel, req)
}

export async function getSeedVideoStatus(taskId: string): Promise<SeedVideoResponse> {
  if (!API_KEY) {
    return { taskId, status: 'done', videoUrl: '' }
  }

  try {
    const response = await fetch(`${TASKS_ENDPOINT}/${encodeURIComponent(taskId)}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    })

    const data = await safeJson(response)

    if (!response.ok) {
      return {
        taskId,
        status: 'failed',
        error: data.error?.message || data._raw || `HTTP ${response.status}`,
      }
    }

    const s = data.status as string | undefined
    console.log('[Seed] task status raw:', JSON.stringify(data).slice(0, 400))
    // content can be an array (new API) or object (legacy)
    const contentItem = Array.isArray(data.content) ? data.content[0] : data.content
    const contentVideoUrl = contentItem?.video_url || contentItem?.url
    const doneStatuses = ['succeeded', 'success', 'completed', 'done']
    if (doneStatuses.includes(s ?? '') || contentVideoUrl) {
      const url = contentVideoUrl || data.video_url || data.output?.video_url
      return { taskId, status: 'done', videoUrl: url }
    }
    if (s === 'failed' || s === 'cancelled' || s === 'error') {
      return { taskId, status: 'failed', error: data.error?.message || data.message || s }
    }

    return { taskId, status: 'pending' }
  } catch (err: any) {
    return { taskId, status: 'failed', error: err.message }
  }
}

async function mockGenerateVideo(req: SeedVideoRequest): Promise<SeedVideoResponse> {
  await new Promise(r => setTimeout(r, 1000))
  return {
    taskId: `mock-seed-${Date.now()}`,
    status: 'done',
    videoUrl: `https://picsum.photos/seed/${Date.now()}/720/1280`,
  }
}
