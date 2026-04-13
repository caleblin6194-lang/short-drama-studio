import { NextRequest, NextResponse } from 'next/server'

interface SubtitleRequest {
  projectId: string
  shots: {
    id: string
    dialogue: string
    audioUrl?: string
    startTime: number
    duration: number
  }[]
}

interface SubtitleBlock {
  id: string
  shotId: string
  text: string
  startSec: number
  endSec: number
  speaker?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: SubtitleRequest = await req.json()
    const { shots } = body

    if (!shots || shots.length === 0) {
      return NextResponse.json({ error: 'No shots provided' }, { status: 400 })
    }

    // Simulate Whisper ASR processing
    await new Promise(r => setTimeout(r, 500))

    const subtitleBlocks: SubtitleBlock[] = []
    let currentTime = 0

    for (const shot of shots) {
      if (!shot.dialogue || shot.dialogue.trim().length === 0) {
        currentTime += shot.duration || 5
        continue
      }

      const text = shot.dialogue.trim()
      // Chinese: ~10 chars per second for reading pace
      // But we use the shot's duration if available
      const charsPerSecond = 8
      const maxCharsPerBlock = Math.round((shot.duration || 5) * charsPerSecond)

      // Split into chunks
      const chunks: string[] = []
      for (let i = 0; i < text.length; i += maxCharsPerBlock) {
        chunks.push(text.slice(i, i + maxCharsPerBlock))
      }

      const chunkDuration = chunks.length > 0 ? (shot.duration || 5) / chunks.length : 3

      chunks.forEach((chunk, chunkIndex) => {
        const startSec = currentTime + chunkIndex * chunkDuration
        const endSec = startSec + chunkDuration
        subtitleBlocks.push({
          id: `sub-${shot.id}-${chunkIndex}`,
          shotId: shot.id,
          text: chunk,
          startSec: Math.round(startSec * 10) / 10,
          endSec: Math.round(endSec * 10) / 10,
        })
      })

      currentTime += shot.duration || 5
    }

    // Generate SRT format
    const srtContent = generateSRT(subtitleBlocks)

    // Generate VTT format
    const vttContent = generateVTT(subtitleBlocks)

    return NextResponse.json({
      success: true,
      blocks: subtitleBlocks,
      totalDuration: currentTime,
      blockCount: subtitleBlocks.length,
      srt: srtContent,
      vtt: vttContent,
    })
  } catch (err) {
    console.error('Subtitle sync error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

function generateSRT(blocks: SubtitleBlock[]): string {
  return blocks.map((block, i) => {
    const start = formatSRTTime(block.startSec)
    const end = formatSRTTime(block.endSec)
    return `${i + 1}\n${start} --> ${end}\n${block.text}\n`
  }).join('\n')
}

function generateVTT(blocks: SubtitleBlock[]): string {
  const header = 'WEBVTT\n\n'
  const body = blocks.map((block, i) => {
    const start = formatVTTTime(block.startSec)
    const end = formatVTTTime(block.endSec)
    return `${i + 1}\n${start} --> ${end}\n${block.text}\n`
  }).join('\n')
  return header + body
}

function formatSRTTime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const ms = Math.round((sec % 1) * 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`
}

function formatVTTTime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const ms = Math.round((sec % 1) * 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
}

export async function GET() {
  return NextResponse.json({
    info: 'Subtitle sync API - POST with { projectId, shots: [{id, dialogue, audioUrl, startTime, duration}] }',
  })
}
