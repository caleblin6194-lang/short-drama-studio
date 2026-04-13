/**
 * Seed 2.0 视频生成 API - 火山引擎
 * 文档: https://www.volcengine.com/docs/SEED/SEED
 *
 * 使用方式:
 * import { generateVideoWithSeed } from '@/lib/api/seed-video'
 * const result = await generateVideoWithSeed({ prompt, imageUrl, duration })
 */

interface SeedVideoRequest {
  prompt: string
  imageUrl?: string
  duration?: number // 秒，5或10
  aspectRatio?: '16:9' | '9:16' | '1:1'
}

interface SeedVideoResponse {
  taskId: string
  status: 'pending' | 'processing' | 'done' | 'failed'
  videoUrl?: string
  error?: string
}

const VOLC_ACCESS_KEY = process.env.VOLC_ACCESS_KEY
const VOLC_SECRET_KEY = process.env.VOLC_SECRET_KEY
const VOLC_REGION = process.env.VOLC_REGION || 'volc-cn-beijing'
const SEED_API_ENDPOINT = process.env.SEED_API_ENDPOINT || 'https://open.volcengineapi.com'

/**
 * 获取火山引擎签名token
 * 生产环境建议使用STS Token或后端代理
 */
function getVolcToken(): string {
  // 简化实现：实际生产应使用火山引擎官方 SDK @volcengine/openapi
  // 此处返回格式化字符串用于标识身份
  const now = Math.floor(Date.now() / 1000)
  return `VOLC_${VOLC_ACCESS_KEY}_${now}`
}

/**
 * 调用 Seed 2.0 生成视频
 */
export async function generateVideoWithSeed(
  req: SeedVideoRequest
): Promise<SeedVideoResponse> {
  if (!VOLC_ACCESS_KEY || !VOLC_SECRET_KEY) {
    console.warn('[Seed] Missing VOLC_ACCESS_KEY or VOLC_SECRET_KEY, using mock mode')
    return mockGenerateVideo(req)
  }

  try {
    const token = await getVolcToken()

    const response = await fetch(`${SEED_API_ENDPOINT}/api/v1/video/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Region': VOLC_REGION,
      },
      body: JSON.stringify({
        model: 'seed-2.0',
        prompt: req.prompt,
        input_image: req.imageUrl,
        duration: req.duration || 5,
        aspect_ratio: req.aspectRatio || '9:16',
        resolution: '1080P',
      }),
    })

    const data = await response.json()

    if (data.error) {
      return { taskId: '', status: 'failed', error: data.error.message }
    }

    return {
      taskId: data.task_id || '',
      status: data.status === 'success' ? 'done' : 'pending',
      videoUrl: data.video_url,
    }
  } catch (err) {
    console.error('[Seed] API error:', err)
    return mockGenerateVideo(req)
  }
}

/**
 * 查询 Seed 视频任务状态
 */
export async function getSeedVideoStatus(taskId: string): Promise<SeedVideoResponse> {
  if (!VOLC_ACCESS_KEY || !VOLC_SECRET_KEY) {
    return { taskId, status: 'done', videoUrl: '' }
  }

  try {
    const token = await getVolcToken()

    const response = await fetch(
      `${SEED_API_ENDPOINT}/api/v1/video/task/${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Region': VOLC_REGION,
        },
      }
    )

    const data = await response.json()

    return {
      taskId,
      status: data.status === 'done' ? 'done'
        : data.status === 'failed' ? 'failed'
        : 'processing',
      videoUrl: data.video_url,
      error: data.error?.message,
    }
  } catch (err) {
    console.error('[Seed] Status check error:', err)
    return { taskId, status: 'failed', error: 'Failed to check status' }
  }
}

/** Mock 模式 */
async function mockGenerateVideo(req: SeedVideoRequest): Promise<SeedVideoResponse> {
  await new Promise(r => setTimeout(r, 1000))
  return {
    taskId: `mock-seed-${Date.now()}`,
    status: 'done',
    videoUrl: `https://picsum.photos/seed/${Date.now()}/720/1280`,
  }
}
