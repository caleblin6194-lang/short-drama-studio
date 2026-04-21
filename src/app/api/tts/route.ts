import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { v4 as uuid } from 'uuid'
import { writeFileSync, unlinkSync } from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const VOICES = [
  'zh-CN-XiaoxiaoNeural',
  'zh-CN-YunxiNeural',
  'zh-CN-XiaoyiNeural',
  'zh-CN-YunyangNeural',
  'en-US-JennyNeural',
  'en-US-GuyNeural',
  'en-GB-SoniaNeural',
  'ja-JP-NanamiNeural',
  'ja-JP-KeitaNeural',
  'es-MX-DaliaNeural',
  'es-ES-ElviraNeural',
  'ar-EG-SalmaNeural',
  'id-ID-GadisNeural',
  'ko-KR-SunHiNeural',
  'fr-FR-DeniseNeural',
  'de-DE-KatjaNeural',
]

export const REGION_DEFAULT_VOICE: Record<string, string> = {
  '国内': 'zh-CN-XiaoxiaoNeural',
  '北美': 'en-US-JennyNeural',
  '欧洲': 'en-GB-SoniaNeural',
  '东南亚': 'id-ID-GadisNeural',
  '日韩': 'ja-JP-NanamiNeural',
  '中东': 'ar-EG-SalmaNeural',
  '拉美': 'es-MX-DaliaNeural',
}

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
      { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓（女）', lang: 'zh-CN', region: '国内' },
      { id: 'zh-CN-YunxiNeural', name: '云希（男）', lang: 'zh-CN', region: '国内' },
      { id: 'zh-CN-XiaoyiNeural', name: '小艺（女）', lang: 'zh-CN', region: '国内' },
      { id: 'zh-CN-YunyangNeural', name: '云扬（男）', lang: 'zh-CN', region: '国内' },
      { id: 'en-US-JennyNeural', name: 'Jenny (Female)', lang: 'en-US', region: '北美' },
      { id: 'en-US-GuyNeural', name: 'Guy (Male)', lang: 'en-US', region: '北美' },
      { id: 'en-GB-SoniaNeural', name: 'Sonia (Female)', lang: 'en-GB', region: '欧洲' },
      { id: 'ja-JP-NanamiNeural', name: '七海（女）', lang: 'ja-JP', region: '日韩' },
      { id: 'ja-JP-KeitaNeural', name: '圭太（男）', lang: 'ja-JP', region: '日韩' },
      { id: 'es-MX-DaliaNeural', name: 'Dalia (Femenino)', lang: 'es-MX', region: '拉美' },
      { id: 'ar-EG-SalmaNeural', name: 'سلمى (أنثى)', lang: 'ar-EG', region: '中东' },
      { id: 'id-ID-GadisNeural', name: 'Gadis (Perempuan)', lang: 'id-ID', region: '东南亚' },
    ],
    regionDefaults: REGION_DEFAULT_VOICE,
  })
}