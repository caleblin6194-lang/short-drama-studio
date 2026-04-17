import { NextRequest, NextResponse } from 'next/server'
import { generateImageWithDoubao, generateCharacterWithReference } from '@/lib/api/doubao-image'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // If a reference image is provided (locked character), use character-consistent generation
    if (body.referenceImageUrl) {
      const result = await generateCharacterWithReference(
        body.prompt,
        body.referenceImageUrl,
        { seed: body.seed },
      )
      return NextResponse.json(result)
    }

    const result = await generateImageWithDoubao({
      prompt: body.prompt,
      size: body.size ?? '2K',
      watermark: body.watermark,
      seed: body.seed,
    })
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json(
      { status: 'failed', error: err?.message || 'Image route error' },
      { status: 500 },
    )
  }
}
