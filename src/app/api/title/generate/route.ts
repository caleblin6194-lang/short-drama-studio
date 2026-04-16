import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/api/doubao-text'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { scriptText, genre } = body

    if (!scriptText || scriptText.length < 20) {
      return NextResponse.json({ error: '剧本内容太少' }, { status: 400 })
    }

    const prompt = `根据以下短剧剧本，生成一个吸引人的短剧名称。要求：
- 简洁有力，6-15个字
- 能体现剧情核心冲突或悬念
- 有爆款潜力，让人有点击欲望
- 直接返回名称，不要解释

剧本摘要：${scriptText.slice(0, 500)}${genre ? `\n类型：${genre}` : ''}`

    const result = await generateText({
      messages: [
        { role: 'system', content: '你是一个专业的短剧策划师，擅长给短剧起吸引人的名字。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 50,
    })

    const title = result.trim().replace(/^["""]|["""]$/g, '').slice(0, 30)

    return NextResponse.json({ title })
  } catch (err: any) {
    console.error('Title generate error:', err)
    return NextResponse.json({ error: err.message || '生成失败' }, { status: 500 })
  }
}
