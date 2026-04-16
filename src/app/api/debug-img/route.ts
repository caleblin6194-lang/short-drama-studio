import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const key = process.env.DOUBAN_SEED_API_KEY ?? ''
  const endpoint = process.env.DOUBAN_IMAGE_ENDPOINT ?? ''
  const model = process.env.DOUBAN_MODEL ?? ''

  // Test the Doubao image API with a simple request
  if (!key) {
    return NextResponse.json({ error: 'No API key', hasKey: false })
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        prompt: 'a simple test image',
        size: '1K',
        response_format: 'url',
      }),
    })
    const data = await res.json()
    return NextResponse.json({
      status: res.status,
      ok: res.ok,
      data,
      endpoint,
      model,
      keyPrefix: key.substring(0, 6),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, endpoint, model })
  }
}
