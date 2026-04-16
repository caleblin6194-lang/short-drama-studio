import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { scriptText } = await req.json()

    if (!scriptText || scriptText.trim().length < 20) {
      return NextResponse.json({ error: '剧本内容太少' }, { status: 400 })
    }

    // Read key and clean any non-printable characters
    const rawKey = process.env.DOUBAN_SEED_API_KEY ?? ''
    // Keep only safe ASCII characters for header value
    const apiKey = rawKey.split('').filter(c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) < 127).join('').trim()
    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json({ error: 'API Key 无效或未配置' }, { status: 500 })
    }

    const prompt = `你是一个专业的短剧剧本分析助手。剧本：\n${scriptText}\n\n以JSON返回，包含scenes/characters/props三个数组，每个元素有name和description。`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 60000)

    let fetchResult: Response
    try {
      fetchResult = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'doubao-seed-1-6-flash-250828',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2048,
          temperature: 0.3,
        }),
        signal: controller.signal as any,
      })
    } catch (e: any) {
      clearTimeout(timer)
      if (e.name === 'AbortError' || e.message.includes('aborted')) {
        return NextResponse.json({ error: 'LLM API 调用超时' }, { status: 504 })
      }
      throw e
    }

    clearTimeout(timer)

    if (!fetchResult.ok) {
      const errText = await fetchResult.text()
      console.error('Doubao API error:', fetchResult.status, errText)
      return NextResponse.json({ error: `LLM API 错误: ${fetchResult.status}` }, { status: 500 })
    }

    const data = await fetchResult.json()
    const content = data.choices?.[0]?.message?.content ?? ''
    const jsonMatch = content.trim().match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : content

    try {
      const parsed = JSON.parse(jsonStr)
      return NextResponse.json({
        scenes: parsed.scenes ?? [],
        characters: parsed.characters ?? [],
        props: parsed.props ?? [],
      })
    } catch {
      return NextResponse.json({ error: 'JSON解析失败', raw: content.substring(0, 200) }, { status: 500 })
    }
  } catch (err: any) {
    console.error('Script parse error:', err)
    return NextResponse.json({ error: '服务器错误：' + err.message }, { status: 500 })
  }
}
