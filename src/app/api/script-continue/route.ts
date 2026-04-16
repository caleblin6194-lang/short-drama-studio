import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/api/doubao-text'

interface ContinueRequest {
  scriptText: string
  mode: 'continue' | 'optimize' | 'expand'
  genre?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: ContinueRequest = await req.json()
    const { scriptText, mode, genre } = body

    if (!scriptText || scriptText.length < 10) {
      return NextResponse.json(
        { error: '剧本内容太少，无法续写' },
        { status: 400 }
      )
    }

    const systemPrompt = `你是一个专业的短剧剧本创作助手，擅长创作爆款短剧。用户会给你一段剧本内容，请根据要求进行续写、优化或扩展。保持短剧的节奏感和戏剧冲突，语言简洁有力，对话有张力。`

    let userPrompt = ''
    switch (mode) {
      case 'continue':
        userPrompt = `请续写以下剧本，保持同样的风格和节奏：\n\n${scriptText}`
        break
      case 'optimize':
        userPrompt = `请优化以下剧本对话，增强戏剧张力和节奏感，让对白更有冲击力：\n\n${scriptText}`
        break
      case 'expand':
        userPrompt = `请扩展以下剧本，增加更多细节、内心独白和情感层次：\n\n${scriptText}`
        break
      default:
        userPrompt = `请续写以下剧本：\n\n${scriptText}`
    }

    if (genre) {
      userPrompt += `\n\n（类型：${genre}）`
    }

    const result = await generateText({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 1500,
    })

    return NextResponse.json({
      original: scriptText,
      continuation: result,
      mode,
      genre: genre || '默认',
      tip: mode === 'continue' ? '续写完成，可直接使用或继续编辑'
        : mode === 'optimize' ? '优化完成，对白更有张力'
        : '扩展完成，增加了更多细节和情感',
    })
  } catch (err: any) {
    console.error('Script continue error:', err)
    return NextResponse.json(
      { error: err.message || '服务器错误，请稍后再试' },
      { status: 500 }
    )
  }
}
