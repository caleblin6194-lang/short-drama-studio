import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { RENDER_DIR, resolveRenderedUrlToPath } from '@/lib/render-files'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    const { projectId, format, renderedUrl } = await req.json()

    if (!renderedUrl) {
      return NextResponse.json({ error: '没有可用的成片' }, { status: 400 })
    }

    // Try to find the source file directly on disk (avoids self-HTTP-fetch)
    const diskPath = resolveRenderedUrlToPath(renderedUrl, { allowTmp: true })
    if (!diskPath) {
      return NextResponse.json({ error: '找不到成片文件，请重新渲染后再导出' }, { status: 404 })
    }

    const jobId = Math.random().toString(36).slice(2)
    const workDir = path.join(RENDER_DIR, `export-${jobId}`)
    fs.mkdirSync(workDir, { recursive: true })

    const inputPath = diskPath
    const outputPath = path.join(workDir, 'output.mp4')
    let url = ''

    if (format === 'vertical') {
      await execAsync(
        `ffmpeg -y -i "${inputPath}" -vf "crop=in_h*9/16:in_h" -c:v libx264 -preset fast -crf 22 -c:a aac "${outputPath}" 2>&1`,
        { timeout: 120000 }
      )
      url = `/api/render/serve?file=output.mp4&job=export-${jobId}`
    } else if (format === 'horizontal') {
      await execAsync(
        `ffmpeg -y -i "${inputPath}" -vf "pad=iw:iw*16/9:(ow-iw)/2:0:color=black" -c:v libx264 -preset fast -crf 22 -c:a aac "${outputPath}" 2>&1`,
        { timeout: 120000 }
      )
      url = `/api/render/serve?file=output.mp4&job=export-${jobId}`
    } else if (format === 'cover') {
      const coverPath = path.join(workDir, 'cover.jpg')
      await execAsync(
        `ffmpeg -y -i "${inputPath}" -vf "select=eq(n\\,0)" -vframes 1 -q:v 2 "${coverPath}" 2>&1`,
        { timeout: 60000 }
      )
      url = `/api/render/serve?file=cover.jpg&job=export-${jobId}`
    }

    // Clean up after 5 minutes
    setTimeout(() => { try { fs.rmSync(workDir, { recursive: true, force: true }) } catch {} }, 300000)

    if (!url) return NextResponse.json({ error: '导出失败' }, { status: 500 })

    return NextResponse.json({ url })
  } catch (err: any) {
    console.error('Export error:', err)
    return NextResponse.json({ error: err.message || '导出失败' }, { status: 500 })
  }
}
