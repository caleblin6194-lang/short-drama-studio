import { NextRequest, NextResponse } from 'next/server'
import { generateVideoWithSeed, generateVideoFast, generateVideoModel } from '@/lib/api/seed-video'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { model, fast, prompt, imageUrl, duration, aspectRatio } = body

    let result
    if (fast) {
      result = await generateVideoFast({ prompt, imageUrl, duration, aspectRatio })
    } else if (model && model !== 'auto') {
      result = await generateVideoModel(model, { prompt, imageUrl, duration, aspectRatio })
    } else {
      result = await generateVideoWithSeed({ prompt, imageUrl, duration, aspectRatio })
    }
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json(
      { status: 'failed', error: err?.message || 'Video route error' },
      { status: 500 },
    )
  }
}