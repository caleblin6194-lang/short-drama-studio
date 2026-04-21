import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import * as path from 'path'
import { getContentType, resolveRenderAssetPath } from '@/lib/render-files'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const file = searchParams.get('file')
  const job = searchParams.get('job')

  if (!job || !file) {
    return new NextResponse('Missing parameters', { status: 400 })
  }

  const filePath = resolveRenderAssetPath(job, file, { allowTmp: true })
  if (!filePath) {
    return new NextResponse('File not found', { status: 404 })
  }

  const buffer = await readFile(filePath)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': getContentType(filePath),
      'Content-Length': String(buffer.length),
      'Content-Disposition': `inline; filename="${path.basename(filePath)}"`,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
