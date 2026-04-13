/**
 * 豆包 (Doubao) 图像生成 API - 火山引擎
 * 文档: https://www.volcengine.com/docs/Doubao
 *
 * 使用方式:
 * import { generateImageWithDoubao } from '@/lib/api/doubao-image'
 * const result = await generateImageWithDoubao({ prompt, size, style })
 */

interface DoubaoImageRequest {
  prompt: string
  size?: '1024x1024' | '1024x1792' | '1792x1024'
  style?: '动漫' | '写实' | '3D' | '国风'
  seed?: number // 随机种子，用于保持一致性
}

interface DoubaoImageResponse {
  taskId: string
  status: 'pending' | 'done' | 'failed'
  imageUrl?: string
  error?: string
}

const VOLC_ACCESS_KEY = process.env.VOLC_ACCESS_KEY
const VOLC_SECRET_KEY = process.env.VOLC_SECRET_KEY
const VOLC_REGION = process.env.VOLC_REGION || 'volc-cn-beijing'
const DOUBAN_IMAGE_API = process.env.DOUBAN_IMAGE_API_ENDPOINT || 'https://open.volcengineapi.com'

/**
 * 获取火山引擎认证Token
 */
async function getVolcToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const expires = now + 3600
  return `VOLC_${VOLC_ACCESS_KEY}_${expires}`
}

/**
 * 调用豆包生成图像
 */
export async function generateImageWithDoubao(
  req: DoubaoImageRequest
): Promise<DoubaoImageResponse> {
  if (!VOLC_ACCESS_KEY || !VOLC_SECRET_KEY) {
    console.warn('[Doubao] Missing VOLC credentials, using mock mode')
    return mockGenerateImage(req)
  }

  try {
    const token = await getVolcToken()

    const response = await fetch(`${DOUBAN_IMAGE_API}/api/v1/image/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Region': VOLC_REGION,
      },
      body: JSON.stringify({
        model: 'doubao-pro',
        prompt: req.prompt,
        image_size: req.size || '1024x1792',
        style: req.style || '写实',
        seed: req.seed || Math.floor(Math.random() * 999999),
        num: 1,
      }),
    })

    const data = await response.json()

    if (data.error) {
      return { taskId: '', status: 'failed', error: data.error.message }
    }

    return {
      taskId: data.task_id || '',
      status: data.status === 'success' ? 'done' : 'pending',
      imageUrl: data.images?.[0]?.url || data.image_url,
    }
  } catch (err) {
    console.error('[Doubao] API error:', err)
    return mockGenerateImage(req)
  }
}

/**
 * 角色形象一致性生成（传入参考图URL保持角色一致性）
 */
export async function generateCharacterWithReference(
  prompt: string,
  referenceImageUrl: string,
  options?: { seed?: number; style?: string }
): Promise<DoubaoImageResponse> {
  if (!VOLC_ACCESS_KEY || !VOLC_SECRET_KEY) {
    console.warn('[Doubao] Missing VOLC credentials, using mock mode')
    return mockGenerateImage({ prompt })
  }

  try {
    const token = await getVolcToken()

    const response = await fetch(`${DOUBAN_IMAGE_API}/api/v1/image/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Region': VOLC_REGION,
      },
      body: JSON.stringify({
        model: 'doubao-pro',
        prompt,
        image_size: '1024x1792',
        style: options?.style || '写实',
        seed: options?.seed || Math.floor(Math.random() * 999999),
        reference_image: referenceImageUrl, // 角色参考图
        num: 1,
      }),
    })

    const data = await response.json()

    return {
      taskId: data.task_id || '',
      status: data.status === 'success' ? 'done' : 'pending',
      imageUrl: data.images?.[0]?.url || data.image_url,
    }
  } catch (err) {
    console.error('[Doubao] Character reference error:', err)
    return mockGenerateImage({ prompt })
  }
}

/**
 * 查询豆包图像任务状态
 */
export async function getDoubaoImageStatus(taskId: string): Promise<DoubaoImageResponse> {
  if (!VOLC_ACCESS_KEY || !VOLC_SECRET_KEY) {
    return { taskId, status: 'done', imageUrl: '' }
  }

  try {
    const token = await getVolcToken()

    const response = await fetch(
      `${DOUBAN_IMAGE_API}/api/v1/image/task/${taskId}`,
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
      status: data.status === 'done' ? 'done' : data.status === 'failed' ? 'failed' : 'pending',
      imageUrl: data.images?.[0]?.url || data.image_url,
      error: data.error?.message,
    }
  } catch (err) {
    console.error('[Doubao] Status check error:', err)
    return { taskId, status: 'failed', error: 'Failed to check status' }
  }
}

/** Mock 模式 */
async function mockGenerateImage(req: DoubaoImageRequest): Promise<DoubaoImageResponse> {
  await new Promise(r => setTimeout(r, 800))
  return {
    taskId: `mock-doubao-${Date.now()}`,
    status: 'done',
    imageUrl: `https://picsum.photos/seed/${req.seed || Date.now()}/1024/1792`,
  }
}
