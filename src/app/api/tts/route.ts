import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { v4 as uuid } from 'uuid'
import { writeFileSync, unlinkSync } from 'fs'
import path from 'path'

export const runtime = 'nodejs'

// Voice options for Chinese TTS
const VOICES = [
  'zh-CN-XiaoxiaoNeural', // 晓晓 - friendly female
  'zh-CN-YunxiNeural',    // 云希 - young male
  'zh-CN-XiaoyiNeural',   // 小艺 - female
  'zh-CN-YunyangNeural',  // 云扬 - professional male
]

export async function POST(req: NextRequest) {
  try {
    const { text, voice, speed = '+0%', pitch = '+0Hz', outputFormat = 'audio-24khz-96kbitrate-mono-mp3' } = await req.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const voiceName = VOICES.includes(voice) ? voice : VOICES[0]
    const taskId = uuid()
    const mp3Path = `/tmp/tts-${taskId}.mp3`

    // Use edge-tts via subprocess
    const args = [
      '--text', text,
      '--voice', voiceName,
      '--rate', speed,
      '--pitch', pitch,
      '--write-media', mp3Path,
    ]

    await new Promise<void>((resolve, reject) => {
      const proc = spawn('python3', ['-m', 'edge_tts', ...args])
      let stderr = ''
      proc.stderr?.on('data', (d) => { stderr += d.toString() })
      proc.on('close', (code) => {
        if (code === 0) resolve()
        else reject(new Error(`edge-tts exited ${code}: ${stderr}`))
      })
      proc.on('error', reject)
    })

    // Read the generated file
    const { readFileSync } = await import('fs')
    const buffer = readFileSync(mp3Path)
    unlinkSync(mp3Path)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="tts-${taskId}.mp3"`,
        'X-Task-Id': taskId,
      },
    })
  } catch (err: any) {
    console.error('[TTS API]', err)
    return NextResponse.json({ error: err.message || 'TTS failed' }, { status: 500 })
  }
}

// GET: list available voices
export async function GET() {
  return NextResponse.json({
    voices: [
      { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓（女）', lang: 'zh-CN' },
      { id: 'zh-CN-YunxiNeural', name: '云希（男）', lang: 'zh-CN' },
      { id: 'zh-CN-XiaoyiNeural', name: '小艺（女）', lang: 'zh-CN' },
      { id: 'zh-CN-YunyangNeural', name: '云扬（男）', lang: 'zh-CN' },
    ]
  })
}