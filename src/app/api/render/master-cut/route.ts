/**
 * 视频渲染合成 API
 * 使用 FFmpeg 将多个镜头视频合成最终成片
 * 输出保存到持久化目录 /var/www/shotforge/renders/
 */

import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

const execAsync = promisify(exec)

const RENDER_DIR = '/var/www/shotforge/renders'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { projectId, shots, subtitleStyle, bgmUrl, subtitles } = body

    if (!shots || shots.length === 0) {
      return NextResponse.json({ error: 'No shots provided' }, { status: 400 })
    }

    // Ensure render dir exists
    if (!fs.existsSync(RENDER_DIR)) {
      fs.mkdirSync(RENDER_DIR, { recursive: true })
    }

    const jobId = crypto.randomBytes(8).toString('hex')
    const workDir = path.join(RENDER_DIR, `render-${jobId}`)
    fs.mkdirSync(workDir, { recursive: true })

    // Download all shot videos
    const videoPaths: string[] = []
    for (let i = 0; i < shots.length; i++) {
      const shot = shots[i]
      if (!shot.videoUrl || shot.videoUrl === '#') continue
      const ext = path.extname(new URL(shot.videoUrl).pathname) || '.mp4'
      const outPath = path.join(workDir, `shot_${String(i).padStart(3, '0')}${ext}`)
      try {
        const response = await fetch(shot.videoUrl)
        if (response.ok) {
          const buffer = await response.arrayBuffer()
          fs.writeFileSync(outPath, Buffer.from(buffer))
          videoPaths.push(outPath)
        }
      } catch (e) {
        console.error(`Failed to download shot ${i}:`, e)
      }
    }

    if (videoPaths.length === 0) {
      fs.rmSync(workDir, { recursive: true, force: true })
      return NextResponse.json({ error: 'No valid videos downloaded' }, { status: 500 })
    }

    // Create concat list
    const concatListPath = path.join(workDir, 'concat.txt')
    const concatContent = videoPaths.map(p => `file '${p}'`).join('\n')
    fs.writeFileSync(concatListPath, concatContent)

    const outputPath = path.join(workDir, 'output.mp4')

    // FFmpeg concat
    await execAsync(
      `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c:v libx264 -preset fast -crf 23 "${outputPath}" 2>&1`,
      { timeout: 300000 }
    )

    // Check if output exists and has content
    const stats = fs.statSync(outputPath)
    if (stats.size < 1000) {
      fs.rmSync(workDir, { recursive: true, force: true })
      return NextResponse.json({ error: 'Render output too small' }, { status: 500 })
    }

    // Persistent URL (accessible without auth)
    const renderedUrl = `https://verixa.online/renders/render-${jobId}/output.mp4`

    return NextResponse.json({
      renderedUrl,
      durationSec: Math.round(stats.size / 1000000),
      jobId,
    })
  } catch (err: any) {
    console.error('Render error:', err)
    return NextResponse.json({ error: err.message || 'Render failed' }, { status: 500 })
  }
}