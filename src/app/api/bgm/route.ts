import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export type BgmMood =
  | 'epic'
  | 'tender'
  | 'comic'
  | 'horror'
  | 'romantic'
  | 'tension'
  | 'sad'
  | 'uplifting'
  | 'mysterious'
  | 'action'

export interface BgmRequest {
  projectId: string
  mood: BgmMood
  duration?: number // seconds
  userId: string
}

// Mock BGM generation — in production, integrate with:
// - Epidemic Sound API
// - Artlist API
// - Or generate via Suno/Audiobox
const MOCK_BGM_TRACKS: Record<BgmMood, { name: string; url: string }> = {
  epic: { name: '🎺 史诗大片 BGM', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  tender: { name: '🎻 温馨小品 BGM', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  comic: { name: '🃏 喜剧搞笑 BGM', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  horror: { name: '👻 恐怖悬疑 BGM', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  romantic: { name: '💕 浪漫爱情 BGM', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  tension: { name: '⏱ 紧张悬疑 BGM', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
  sad: { name: '😢 悲伤情感 BGM', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
  uplifting: { name: '☀️ 励志振奋 BGM', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  mysterious: { name: '🔮 神秘奇幻 BGM', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' },
  action: { name: '💥 动作打斗 BGM', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-10.mp3' },
}

export async function POST(request: NextRequest) {
  try {
    const body: BgmRequest = await request.json()
    const { projectId, mood, duration = 60, userId } = body

    if (!projectId || !mood || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const track = MOCK_BGM_TRACKS[mood]
    if (!track) {
      return NextResponse.json({ error: 'Invalid mood' }, { status: 400 })
    }

    // In production: submit job to BGM generation service
    // For MVP: return mock track immediately
    return NextResponse.json({
      trackId: uuidv4(),
      projectId,
      mood,
      name: track.name,
      url: track.url,
      duration,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('BGM generation error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mood = searchParams.get('mood') as BgmMood | null

  if (mood && MOCK_BGM_TRACKS[mood]) {
    return NextResponse.json({ track: MOCK_BGM_TRACKS[mood], mood })
  }

  // Return all available moods
  return NextResponse.json({
    moods: Object.entries(MOCK_BGM_TRACKS).map(([key, value]) => ({
      key,
      name: value.name,
    })),
  })
}
