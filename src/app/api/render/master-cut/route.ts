/**
 * 视频渲染合成 API
 * 使用 FFmpeg 将多个镜头视频合成最终成片
 * 输出保存到持久化目录 /var/www/shotforge/renders/
 */

import { NextRequest, NextResponse } from 'next/server'
import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

const execAsync = promisify(exec)

const RENDER_DIR = '/var/www/shotforge/renders'

const TRANSITION_MAP: Record<string, string> = {
  fade: 'fade',
  dissolve: 'dissolve',
  wipe_left: 'wipeleft',
  zoom_in: 'zoomin',
  wipe_right: 'wiperight',
  slide_left: 'slideleft',
}

const COLOR_GRADING_MAP: Record<string, string> = {
  warm: "eq=brightness=0.02:contrast=1.05:saturation=0.95",
  cool: 'eq=brightness=0:contrast=1.02:saturation=0.9',
  cinematic: 'eq=brightness=0.01:contrast=1.1:saturation=0.85,unsharp=3:3:0.5',
  vivid: 'eq=brightness=0.03:contrast=1.05:saturation=1.2',
}
const DEFAULT_GRADE = 'unsharp=3:3:0.3'

const EMOTION_TTS: Record<string, { speed: string; pitch: string }> = {
  angry:     { speed: '+15%', pitch: '+5Hz' },
  sad:       { speed: '-20%', pitch: '-10Hz' },
  tense:     { speed: '+10%', pitch: '+3Hz' },
  happy:     { speed: '+5%',  pitch: '+5Hz' },
  surprised: { speed: '+8%',  pitch: '+8Hz' },
  neutral:   { speed: '+0%',  pitch: '+0Hz' },
}

/** Generate TTS audio to a local mp3 path using edge-tts. Returns path or null. */
async function generateTTS(text: string, emotionTag: string, outPath: string): Promise<boolean> {
  const em = EMOTION_TTS[emotionTag] ?? EMOTION_TTS.neutral
  const args = [
    '-m', 'edge_tts',
    '--text', text,
    '--voice', 'zh-CN-XiaoxiaoNeural',
    '--rate', em.speed,
    '--pitch', em.pitch,
    '--write-media', outPath,
  ]
  return new Promise(resolve => {
    const proc = spawn('python3', args)
    proc.on('close', code => resolve(code === 0))
    proc.on('error', () => resolve(false))
  })
}

/** Get video duration in seconds using ffprobe. */
async function getVideoDuration(filePath: string): Promise<number> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 "${filePath}" 2>&1`
    )
    const d = parseFloat(stdout.trim())
    return isNaN(d) ? 5 : d
  } catch {
    return 5
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { projectId, shots, colorGrading, bgmUrl, narrationMode } = body

    if (!shots || shots.length === 0) {
      return NextResponse.json({ error: 'No shots provided' }, { status: 400 })
    }

    if (!fs.existsSync(RENDER_DIR)) {
      fs.mkdirSync(RENDER_DIR, { recursive: true })
    }

    const jobId = crypto.randomBytes(8).toString('hex')
    const workDir = path.join(RENDER_DIR, `render-${jobId}`)
    fs.mkdirSync(workDir, { recursive: true })

    const gradeFilter = COLOR_GRADING_MAP[colorGrading as string] ?? DEFAULT_GRADE

    // ── Step 1: Download videos + generate TTS audio per shot ──────────────
    interface ShotFile {
      videoPath: string
      audioPath: string | null
      transitionIn?: string
      durationSec: number
    }
    const shotFiles: ShotFile[] = []

    for (let i = 0; i < shots.length; i++) {
      const shot = shots[i]
      if (!shot.videoUrl || shot.videoUrl === '#') continue

      // Download video
      const ext = (() => {
        try { return path.extname(new URL(shot.videoUrl).pathname) || '.mp4' } catch { return '.mp4' }
      })()
      const videoPath = path.join(workDir, `shot_${String(i).padStart(3, '0')}${ext}`)
      try {
        const response = await fetch(shot.videoUrl)
        if (!response.ok) continue
        fs.writeFileSync(videoPath, Buffer.from(await response.arrayBuffer()))
      } catch (e) {
        console.error(`[Render] Download shot ${i} failed:`, e)
        continue
      }

      // Generate TTS if dialogue/narration exists
      const dialogueText = (narrationMode && shot.narration)
        ? shot.narration
        : (shot.dialogue || '')
      let audioPath: string | null = null
      if (dialogueText.trim()) {
        const ttsPath = path.join(workDir, `tts_${String(i).padStart(3, '0')}.mp3`)
        const ok = await generateTTS(dialogueText.slice(0, 500), shot.emotionTag || 'neutral', ttsPath)
        if (ok && fs.existsSync(ttsPath)) audioPath = ttsPath
      }

      shotFiles.push({
        videoPath,
        audioPath,
        transitionIn: shot.transitionIn,
        durationSec: shot.durationSec || 5,
      })
    }

    if (shotFiles.length === 0) {
      fs.rmSync(workDir, { recursive: true, force: true })
      return NextResponse.json({ error: 'No valid videos downloaded' }, { status: 500 })
    }

    // ── Step 2: Mux TTS audio into each shot video ─────────────────────────
    const muxedPaths: Array<{ path: string; transitionIn?: string }> = []
    for (let i = 0; i < shotFiles.length; i++) {
      const { videoPath, audioPath, transitionIn } = shotFiles[i]
      const muxedPath = path.join(workDir, `muxed_${String(i).padStart(3, '0')}.mp4`)

      if (audioPath) {
        // Mux video + TTS audio; -shortest truncates to shorter stream
        try {
          await execAsync(
            `ffmpeg -y -i "${videoPath}" -i "${audioPath}" -map 0:v -map 1:a -shortest -c:v copy -c:a aac -strict experimental "${muxedPath}" 2>&1`,
            { timeout: 60000 }
          )
          muxedPaths.push({ path: muxedPath, transitionIn })
        } catch {
          // Fallback: use video as-is (add silent audio)
          await execAsync(
            `ffmpeg -y -i "${videoPath}" -f lavfi -i anullsrc=r=44100:cl=mono -map 0:v -map 1:a -shortest -c:v copy -c:a aac "${muxedPath}" 2>&1`,
            { timeout: 60000 }
          ).catch(() => {})
          muxedPaths.push({ path: fs.existsSync(muxedPath) ? muxedPath : videoPath, transitionIn })
        }
      } else {
        // No dialogue: ensure video has a silent audio track so concat works uniformly
        try {
          await execAsync(
            `ffmpeg -y -i "${videoPath}" -f lavfi -i anullsrc=r=44100:cl=mono -map 0:v -map 1:a -shortest -c:v copy -c:a aac "${muxedPath}" 2>&1`,
            { timeout: 60000 }
          )
          muxedPaths.push({ path: muxedPath, transitionIn })
        } catch {
          muxedPaths.push({ path: videoPath, transitionIn })
        }
      }
    }

    // ── Step 3: Normalize all clips to uniform res/fps ────────────────────
    const normPaths: Array<{ path: string; transitionIn?: string }> = []
    for (let i = 0; i < muxedPaths.length; i++) {
      const normPath = path.join(workDir, `norm_${String(i).padStart(3, '0')}.mp4`)
      try {
        await execAsync(
          `ffmpeg -y -i "${muxedPaths[i].path}" -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:-1:-1,fps=24,${gradeFilter}" -c:v libx264 -preset fast -crf 23 -c:a aac -ar 44100 "${normPath}" 2>&1`,
          { timeout: 120000 }
        )
        normPaths.push({ path: normPath, transitionIn: muxedPaths[i].transitionIn })
      } catch (e) {
        console.error(`[Render] Normalize ${i} failed:`, e)
        normPaths.push({ path: muxedPaths[i].path, transitionIn: muxedPaths[i].transitionIn })
      }
    }

    const outputPath = path.join(workDir, 'output.mp4')
    const hasTransitions = normPaths.length > 1 && normPaths.some(s => s.transitionIn && TRANSITION_MAP[s.transitionIn])

    if (!hasTransitions || normPaths.length === 1) {
      // ── Simple concat ──────────────────────────────────────────────────
      const concatListPath = path.join(workDir, 'concat.txt')
      fs.writeFileSync(concatListPath, normPaths.map(p => `file '${p.path}'`).join('\n'))
      await execAsync(
        `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c:v libx264 -preset fast -crf 23 -c:a aac "${outputPath}" 2>&1`,
        { timeout: 300000 }
      )
    } else {
      // ── xfade concat with audio concat ────────────────────────────────
      const TRANSITION_DURATION = 0.5
      const durations: number[] = []
      for (const { path: p } of normPaths) {
        durations.push(await getVideoDuration(p))
      }

      const inputs = normPaths.map(p => `-i "${p.path}"`).join(' ')
      const n = normPaths.length
      const vFilterParts: string[] = []
      const aFilterParts: string[] = []
      let vLabel = '[0:v]'
      let aLabel = '[0:a]'
      let offsetAcc = 0

      for (let i = 1; i < n; i++) {
        const transName = TRANSITION_MAP[normPaths[i].transitionIn ?? ''] || 'fade'
        offsetAcc += Math.max(0.1, durations[i - 1] - TRANSITION_DURATION)
        const vOut = i === n - 1 ? '[vout]' : `[v${i}]`
        const aOut = i === n - 1 ? '[aout]' : `[a${i}]`
        vFilterParts.push(`${vLabel}[${i}:v]xfade=transition=${transName}:duration=${TRANSITION_DURATION}:offset=${offsetAcc.toFixed(3)}${vOut}`)
        aFilterParts.push(`${aLabel}[${i}:a]acrossfade=d=${TRANSITION_DURATION}${aOut}`)
        vLabel = vOut
        aLabel = aOut
      }

      const filterComplex = [...vFilterParts, ...aFilterParts].join(';')
      await execAsync(
        `ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map "[vout]" -map "[aout]" -c:v libx264 -preset fast -crf 23 -c:a aac "${outputPath}" 2>&1`,
        { timeout: 300000 }
      )
    }

    // ── Step 4: BGM mixing (optional) ─────────────────────────────────────
    if (bgmUrl && bgmUrl.startsWith('http')) {
      try {
        const bgmPath = path.join(workDir, 'bgm.mp3')
        const bgmRes = await fetch(bgmUrl)
        if (bgmRes.ok) {
          fs.writeFileSync(bgmPath, Buffer.from(await bgmRes.arrayBuffer()))
          const bgmOutputPath = path.join(workDir, 'output_bgm.mp4')
          // Mix BGM at -15dB under dialogue, loop BGM if shorter than video
          await execAsync(
            `ffmpeg -y -i "${outputPath}" -stream_loop -1 -i "${bgmPath}" -filter_complex "[0:a]volume=1.0[dialogue];[1:a]volume=0.15[bgm];[dialogue][bgm]amix=inputs=2:duration=first[aout]" -map 0:v -map "[aout]" -c:v copy -c:a aac -shortest "${bgmOutputPath}" 2>&1`,
            { timeout: 180000 }
          )
          if (fs.existsSync(bgmOutputPath) && fs.statSync(bgmOutputPath).size > 1000) {
            fs.renameSync(bgmOutputPath, outputPath)
          }
        }
      } catch (e) {
        console.error('[Render] BGM mixing failed (non-fatal):', e)
      }
    }

    // ── Step 5: Verify output ─────────────────────────────────────────────
    const stats = fs.statSync(outputPath)
    if (stats.size < 1000) {
      fs.rmSync(workDir, { recursive: true, force: true })
      return NextResponse.json({ error: 'Render output too small' }, { status: 500 })
    }

    // Get actual duration via ffprobe
    const durationSec = await getVideoDuration(outputPath)

    const renderedUrl = `/api/render/serve?file=output.mp4&job=${jobId}`
    return NextResponse.json({ renderedUrl, durationSec: Math.round(durationSec), jobId })
  } catch (err: any) {
    console.error('Render error:', err)
    return NextResponse.json({ error: err.message || 'Render failed' }, { status: 500 })
  }
}
