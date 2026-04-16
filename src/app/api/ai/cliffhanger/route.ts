import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { title, hookType, lastShotDesc, lastShotDialogue, totalEpisodes, totalShots } = await req.json()

    if (!title) {
      return NextResponse.json({ error: '缺少短剧名称' }, { status: 400 })
    }

    const prompt = `你是一个中国短剧资深编剧，擅长写悬念结尾。

请根据以下信息，为短剧生成第${totalEpisodes}集结尾的悬念钩子。

短剧名称：${title}
悬念类型：${hookType}
上一集最后镜头描述：${lastShotDesc || '无'}
上一集最后台词：${lastShotDialogue || '无'}

要求：
- 30-60字
- 直接用于短剧最后一集收尾
- 中国短剧节奏，结尾要有冲击力
- 不要加引号，不要加"..."或"未完待续"等提示语
- 只输出悬念钩子正文`

    const res = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.DOUBAO_API_KEY,
      },
      body: JSON.stringify({
        model: 'doubao-seedance-2.1-thinking-pro',
        messages: [
          {
            role: 'user',
            content: prompt,
          }
        ],
        max_tokens: 200,
        temperature: 0.8,
      }),
    })

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content?.trim() || ''

    return NextResponse.json({ cliffhanger: content })
  } catch (err: any) {
    console.error('Cliffhanger generation error:', err)
    return NextResponse.json({ error: err.message || '生成失败' }, { status: 500 })
  }
}