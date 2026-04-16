import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import { readFile } from 'fs/promises'

const RENDER_DIR = '/var/www/shotforge/renders'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const file = searchParams.get('file')
  const job = searchParams.get('job')
  const exportType = searchParams.get('export')

  let filePath: string

  if (job && file) {
    // Legacy: temp file path
    const tmpDir = process.env.TMPDIR || '/tmp'
    filePath = path.join(tmpDir, `render-${job}`, file)
  } else if (exportType) {
    // Export output: /renders/render-{job}/output.mp4
    // URL: /api/render/serve?file=output.mp4&job={jobId}&export={type}
    filePath = path.join(RENDER_DIR, `render-${job}`, file || 'output.mp4')
  } else {
    return new NextResponse('Missing parameters', { status: 400 })
  }

  // Security: ensure file is within allowed dirs
  const allowedDirs = [RENDER_DIR, '/tmp', process.env.TMPDIR || '/tmp']
  const isAllowed = allowedDirs.some(d => filePath.startsWith(d))
  if (!isAllowed) {
    return new NextResponse('Invalid path', { status: 403 })
  }

  if (!fs.existsSync(filePath)) {
    return new NextResponse('File not found', { status: 404 })
  }

  const buffer = await readFile(filePath)
  const ext = path.extname(filePath).toLowerCase()
  const isAudio = ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)
  const contentType = isAudio ? 'audio/mpeg' : 'video/mp4'

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(buffer.length),
      'Content-Disposition': `inline; filename="${path.basename(filePath)}"`,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}