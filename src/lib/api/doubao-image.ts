/**
 * 豆包 Seedream 图像生成 API
 * Endpoint: https://ark.cn-beijing.volces.com/api/v3/images/generations
 * Model: doubao-seedream-5-0-260128
 */

interface DoubaoImageRequest {
  prompt: string
  size?: '1K' | '2K' | '4K'
  watermark?: boolean
  seed?: number
}

interface DoubaoImageResponse {
  taskId?: string
  status: 'pending' | 'done' | 'failed'
  imageUrl?: string
  error?: string
}

const API_KEY = process.env.DOUBAN_SEED_API_KEY
const ENDPOINT = process.env.DOUBAN_IMAGE_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/images/generations'
const MODEL = process.env.DOUBAN_MODEL || 'doubao-seedream-5-0-260128'

export async function generateImageWithDoubao(
  req: DoubaoImageRequest
): Promise<DoubaoImageResponse> {
  if (!API_KEY) {
    console.warn('[Doubao] Missing DOUBAN_SEED_API_KEY, using mock mode')
    return mockGenerate(req)
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
        size: req.size === '1K' ? '1K' : req.size === '4K' ? '3k' : '2k',
        watermark: req.watermark ?? false,
        stream: false,
        response_format: 'url',
        sequential_image_generation: 'disabled',
        seed: req.seed || Math.floor(Math.random() * 999999),
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { status: 'failed', error: data.error?.message || `HTTP ${response.status}` }
    }

    // Seedream returns { data: [{ url, seed, ... }] } or { task_id }
    if (data.data?.[0]?.url) {
      return { status: 'done', imageUrl: data.data[0].url }
    } else if (data.task_id) {
      return { taskId: data.task_id, status: 'pending' }
    } else if (data.error) {
      return { status: 'failed', error: data.error.message || 'Unknown error' }
    }

    return { status: 'failed', error: 'Unexpected response format' }
  } catch (err: any) {
    console.error('[Doubao] API error:', err)
    return { status: 'failed', error: err.message }
  }
}

export async function generateCharacterWithReference(
  prompt: string,
  referenceImageUrl: string,
  options?: { seed?: number }
): Promise<DoubaoImageResponse> {
  // Seedream 支持参考图 - 在 prompt 中引用
  const enhancedPrompt = `${prompt} | character consistency with reference image: ${referenceImageUrl}`
  return generateImageWithDoubao({ prompt: enhancedPrompt, seed: options?.seed })
}

async function mockGenerate(req: DoubaoImageRequest): Promise<DoubaoImageResponse> {
  await new Promise(r => setTimeout(r, 500))
  return {
    taskId: `mock-${Date.now()}`,
    status: 'done',
    imageUrl: `https://picsum.photos/seed/${req.seed || Date.now()}/1024/1792`,
  }
}
