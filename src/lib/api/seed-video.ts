/**
 * Seed 2.0 视频生成 API
 * Endpoint: https://ark.cn-beijing.volces.com/api/v3/video/generations
 * Model: doubao-seedance-2-0-260128
 */

interface SeedVideoRequest {
  prompt: string
  imageUrl?: string
  duration?: number // 秒，5或10
  aspectRatio?: '16:9' | '9:16' | '1:1'
}

interface SeedVideoResponse {
  taskId?: string
  status: 'pending' | 'done' | 'failed'
  videoUrl?: string
  error?: string
}

const API_KEY = process.env.DOUBAN_SEED_API_KEY
const ENDPOINT = process.env.SEED_API_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/video/generations'
const MODEL = 'doubao-seedance-2-0-260128'
const MODEL_FAST = 'doubao-seedance-2-0-fast-260128'

export async function generateVideoWithSeed(
  req: SeedVideoRequest
): Promise<SeedVideoResponse> {
  if (!API_KEY) {
    console.warn('[Seed] Missing DOUBAN_SEED_API_KEY, using mock mode')
    return mockGenerateVideo(req)
  }

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: req.prompt,
        input_image: req.imageUrl,
        duration: req.duration || 5,
        aspect_ratio: req.aspectRatio || '9:16',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { status: 'failed', error: data.error?.message || `HTTP ${response.status}` }
    }

    if (data.task_id) {
      return { taskId: data.task_id, status: 'pending' }
    } else if (data.data?.[0]?.video_url) {
      return { status: 'done', videoUrl: data.data[0].video_url }
    }

    return { status: 'failed', error: 'Unexpected response' }
  } catch (err: any) {
    console.error('[Seed] API error:', err)
    return { status: 'failed', error: err.message }
  }
}

export async function generateVideoFast(
  req: SeedVideoRequest
): Promise<SeedVideoResponse> {
  if (!API_KEY) {
    return mockGenerateVideo(req)
  }

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_FAST,
        prompt: req.prompt,
        input_image: req.imageUrl,
        duration: req.duration || 5,
        aspect_ratio: req.aspectRatio || '9:16',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { status: 'failed', error: data.error?.message || `HTTP ${response.status}` }
    }

    if (data.task_id) {
      return { taskId: data.task_id, status: 'pending' }
    } else if (data.data?.[0]?.video_url) {
      return { status: 'done', videoUrl: data.data[0].video_url }
    }

    return { status: 'failed', error: 'Unexpected response' }
  } catch (err: any) {
    console.error('[Seed] Fast API error:', err)
    return { status: 'failed', error: err.message }
  }
}

export async function getSeedVideoStatus(taskId: string): Promise<SeedVideoResponse> {
  if (!API_KEY) {
    return { taskId, status: 'done', videoUrl: '' }
  }

  try {
    const response = await fetch(`${ENDPOINT}?task_id=${taskId}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    })

    const data = await response.json()

    if (data.data?.[0]?.video_url) {
      return { taskId, status: 'done', videoUrl: data.data[0].video_url }
    } else if (data.error) {
      return { taskId, status: 'failed', error: data.error.message }
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
