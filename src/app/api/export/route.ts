import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    const { projectId, format, renderedUrl } = await req.json()

    if (!renderedUrl) {
      return NextResponse.json({ error: '没有可用的成片' }, { status: 400 })
    }

    // Extract filename from /api/render/serve?file=xxx
    const fileName = renderedUrl.includes('file=')
      ? renderedUrl.split('file=')[1].split('&')[0]
      : ''

    if (!fileName) {
      return NextResponse.json({ error: '无法解析文件名' }, { status: 400 })
    }

    const tmpDir = os.tmpdir()
    const jobId = Math.random().toString(36).slice(2)
    const workDir = path.join(tmpDir, `export-${jobId}`)
    fs.mkdirSync(workDir, { recursive: true })

    // Download original video
    const inputPath = path.join(workDir, 'input.mp4')
    try {
      const response = await fetch(renderedUrl.includes('http') ? renderedUrl : `https://verixa.online${renderedUrl}`)
      if (!response.ok) throw new Error('下载失败')
      const buffer = await response.arrayBuffer()
      fs.writeFileSync(inputPath, Buffer.from(buffer))
    } catch {
      return NextResponse.json({ error: '无法下载原始视频' }, { status: 500 })
    }

    const outputPath = path.join(workDir, `output.mp4`)
    let url = ''

    if (format === 'vertical') {
      // 9:16 竖版 - letterbox crop to 9:16 from center
      // input is likely 16:9, crop to center for 9:16
      await execAsync(
        `ffmpeg -y -i "${inputPath}" -vf "crop=in_h*9/16:in_h" -c:v libx264 -preset fast -crf 22 "${outputPath}" 2>&1`,
        { timeout: 120000 }
      )
      url = `/api/render/serve?file=${path.basename(outputPath)}&job=${jobId}&export=vertical`
    } else if (format === 'horizontal') {
      // 16:9 横版 - add letterbox bars top/bottom if needed
      await execAsync(
        `ffmpeg -y -i "${inputPath}" -vf "pad=iw:iw*16/9:x:(ow-ih)/2:color=black" -c:v libx264 -preset fast -crf 22 "${outputPath}" 2>&1`,
        { timeout: 120000 }
      )
      url = `/api/render/serve?file=${path.basename(outputPath)}&job=${jobId}&export=horizontal`
    } else if (format === 'cover') {
      // 封面图 - extract first frame
      const coverPath = path.join(workDir, 'cover.jpg')
      await execAsync(
        `ffmpeg -y -i "${inputPath}" -vf "select=eq(n\,0)" -vframes 1 -q:v 2 "${coverPath}" 2>&1`,
        { timeout: 60000 }
      )
      url = `/api/render/serve?file=cover.jpg&job=${jobId}&export=cover`
    }

    // Clean up after delay
    setTimeout(() => { try { fs.rmSync(workDir, { recursive: true, force: true }) } catch {} }, 300000)

    if (!url) return NextResponse.json({ error: '导出失败' }, { status: 500 })

    return NextResponse.json({ url: `https://verixa.online${url}` })
  } catch (err: any) {
    console.error('Export error:', err)
    return NextResponse.json({ error: err.message || '导出失败' }, { status: 500 })
  }
}