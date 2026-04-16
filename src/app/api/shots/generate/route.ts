import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/api/doubao-text'
import { v4 as uuid } from 'uuid'

interface Shot {
  id: string
  number: string
  order: number
  sceneRef: string
  characterRefs: string[]
  propRefs: string[]
  description: string
  dialogue: string
  cameraDirection?: string
  durationSec: number
  pipeline: {
    image: { status: 'pending' | 'rendering' | 'done' | 'failed'; attemptCount: number; cost?: number; modelUsed?: string }
    video: { status: 'pending' | 'rendering' | 'done' | 'failed'; attemptCount: number; cost?: number; modelUsed?: string }
    audio: { status: 'pending' | 'rendering' | 'done' | 'failed'; attemptCount: number; cost?: number; modelUsed?: string }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { scriptText, count = 10 } = body

    if (!scriptText || scriptText.length < 20) {
      return NextResponse.json({ error: '剧本内容太少' }, { status: 400 })
    }

    const prompt = `你是一个专业的短剧分镜师。请根据以下剧本，生成${count}个镜头列表。

要求：
- 每个镜头包含：场景描述、角色、镜头内容、对白、镜头时长（秒）、运镜方式
- 保持短剧节奏，每句对白要有张力
- 用JSON数组格式返回，每项包含字段：sceneRef（场景引用）, characterRefs（角色列表）, description（镜头描述）, dialogue（对白，格式"角色：对白"）, durationSec（时长秒）, cameraDirection（运镜如"推镜头"、"拉镜头"、"摇镜头"）

只返回JSON数组，不要其他内容。剧本如下：

${scriptText}`

    const result = await generateText({
      messages: [
        { role: 'system', content: '你是一个专业的短剧分镜师，擅长将剧本转化为精准的分镜列表。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })

    // Parse JSON from response
    let shotsData: any[] = []
    try {
      // Normalize Chinese quotation marks to ASCII before parsing
      const normalized = result.replace(/["\u201c\u201d]/g, '"').replace(/['']/g, "'")
      const jsonMatch = normalized.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        shotsData = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('Failed to parse shots JSON:', e, 'Raw:', result.slice(0, 200))
    }

    // If parsing failed or returned empty, return mock with parsed content
    if (!shotsData || shotsData.length === 0) {
      // Fallback: split by dialogue lines or generate basic structure
      return NextResponse.json({ error: 'AI返回格式异常' }, { status: 500 })
    }

    const shots: Shot[] = shotsData.slice(0, count).map((s: any, i: number) => ({
      id: uuid(),
      number: String(i + 1),
      order: i,
      sceneRef: s.sceneRef || s.scene || '默认场景',
      characterRefs: Array.isArray(s.characterRefs) ? s.characterRefs : (s.character ? [s.character] : []),
      propRefs: Array.isArray(s.propRefs) ? s.propRefs : [],
      description: s.description || '',
      dialogue: s.dialogue || '',
      cameraDirection: s.cameraDirection || '固定镜头',
      durationSec: s.durationSec || 5,
      pipeline: {
        image: { status: 'pending' as const, attemptCount: 0 },
        video: { status: 'pending' as const, attemptCount: 0 },
        audio: { status: 'pending' as const, attemptCount: 0 },
      },
    }))

    return NextResponse.json({ shots })
  } catch (err: any) {
    console.error('Shots generate error:', err)
    return NextResponse.json({ error: err.message || '生成失败' }, { status: 500 })
  }
}
