/**
 * 豆包文本生成 API
 */

const API_KEY = (process.env.DOUBAN_SEED_API_KEY || process.env.DOUBAN_TEXT_API_KEY)?.trim()
const ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const MODEL = (process.env.DOUBAN_TEXT_MODEL || 'doubao-seed-character-251128').trim()

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface DoubaoTextRequest {
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
}

export async function generateText(req: DoubaoTextRequest): Promise<string> {
  if (!API_KEY) {
    return ''
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
        messages: req.messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.max_tokens ?? 2000,
      }),
      signal: AbortSignal.timeout(25_000),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.warn('doubao-text API error:', error.error?.message || `HTTP ${response.status}`)
      return ''
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  } catch (err: unknown) {
    if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      console.warn('doubao-text: request timed out after 25s, falling back to mock')
      return ''
    }
    throw err
  }
}
