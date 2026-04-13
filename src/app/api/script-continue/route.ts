import { NextRequest, NextResponse } from 'next/server'

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

    // Mock AI response for script continuation
    // In production, this would call OpenAI/Claude API
    const continuationTemplates = {
      continue: [
        '就在这时，意外发生了。原本应该离开的反派突然折返，手里还拿着一份文件。"等等，"他冷笑一声，"你们以为事情就这么简单？"',
        '三年后，城市CBD。一辆黑色迈巴赫停在楼下，车门打开，走下一个穿西装的男人。他的眼神里带着几分玩味，"好久不见。"',
        '宴会厅里灯火辉煌，所有人都屏住呼吸。主持人宣布："现在，有请今晚的神秘颁奖嘉宾——"',
      ],
      optimize: [
        '（优化后的对话更有张力）"你以为你是谁？"男主冷笑，"三年了，你以为我还会在原地等你？"女主眼眶泛红，"我没得选。"',
        '（节奏更紧凑）镜头快速切换：酒杯落地的声音、惊讶的表情、窃窃私语的人群。陈默不紧不慢地站起身，"既然大家这么好奇，我就满足你们。"',
      ],
      expand: [
        '【第一幕扩展】交代更多背景：\n陈默独自走在回家的路上，霓虹灯映照在他疲惫的脸上。手机响了，是一个陌生号码。\n\n"陈少，您父亲让我转告您..."电话那头的声音突然中断。\n\n陈默的眼神瞬间变得锐利。三年了，他们终于还是找来了。',
        '【情感深化】增加内心独白：\n陈默看着林婉清离去的背影，心里像是被什么东西狠狠揪住。三年前的选择，他从未后悔。但此刻，胸口的疼痛提醒着他，有些东西他以为已经放下，其实一直都在。\n\n"三年了，"他喃喃自语，"够了。"',
      ],
    }

    const templates = continuationTemplates[mode || 'continue']
    const suggestion = templates[Math.floor(Math.random() * templates.length)]

    const result = {
      original: scriptText,
      continuation: suggestion,
      mode,
      genre: genre || '默认',
      tip: mode === 'continue' ? '续写完成，可直接使用或继续编辑'
        : mode === 'optimize' ? '优化完成，对白更有张力'
        : '扩展完成，增加了更多细节和情感',
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Script continue error:', err)
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    )
  }
}
