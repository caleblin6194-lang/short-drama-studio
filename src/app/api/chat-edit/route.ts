import { NextRequest, NextResponse } from 'next/server'

interface EditAction {
  type: string
  description: string
  status: 'pending' | 'applied'
}

function detectEditActions(message: string): EditAction[] {
  const lower = message.toLowerCase()
  const actions: EditAction[] = []

  if (lower.includes('加快') || lower.includes('加速') || lower.includes('快一点')) {
    actions.push({
      type: 'pace',
      description: '加快片段节奏',
      status: 'pending',
    })
  }

  if (lower.includes('减慢') || lower.includes('放慢') || lower.includes('慢一点')) {
    actions.push({
      type: 'pace',
      description: '减慢片段节奏',
      status: 'pending',
    })
  }

  if (lower.includes('配乐') || lower.includes('音乐') || lower.includes('BGM') || lower.includes('背景音乐')) {
    actions.push({
      type: 'audio',
      description: '添加/调整背景音乐',
      status: 'pending',
    })
  }

  if (lower.includes('字幕') || lower.includes('配上字幕')) {
    actions.push({
      type: 'subtitle',
      description: '添加字幕',
      status: 'pending',
    })
  }

  if (lower.includes('裁剪') || lower.includes('剪掉') || lower.includes('删除') || lower.includes('去掉')) {
    actions.push({
      type: 'cut',
      description: '裁剪指定片段',
      status: 'pending',
    })
  }

  if (lower.includes('转场') || lower.includes('过渡')) {
    actions.push({
      type: 'transition',
      description: '添加转场效果',
      status: 'pending',
    })
  }

  if (lower.includes('调色') || lower.includes('颜色') || lower.includes('滤镜')) {
    actions.push({
      type: 'color',
      description: '调整色彩/滤镜',
      status: 'pending',
    })
  }

  if (lower.includes('特效') || lower.includes('效果')) {
    actions.push({
      type: 'effect',
      description: '添加视觉效果',
      status: 'pending',
    })
  }

  if (lower.includes('配音') || lower.includes('对白') || lower.includes('台词')) {
    actions.push({
      type: 'dialogue',
      description: '调整配音/对白',
      status: 'pending',
    })
  }

  if (lower.includes('字幕') || lower.includes('特效文字')) {
    actions.push({
      type: 'text',
      description: '添加文字特效',
      status: 'pending',
    })
  }

  return actions
}

function generateReply(message: string, actions: EditAction[]): string {
  if (actions.length === 0) {
    return `明白了，我会帮你处理这个需求：「${message}」。\n\n目前这个功能正在初始化中，编辑操作将逐步支持。你可以告诉我更具体的编辑指令，比如：\n- 「加快第二段的节奏」\n- 「给高潮部分加上配乐」\n- 「给开头加字幕」`
  }

  const actionDescriptions = actions.map(a => `• **${a.description}**`).join('\n')
  return `好的，我已经理解你的需求！\n\n我将执行以下操作：\n${actionDescriptions}\n\n点击「执行」按钮来应用这些更改，或者继续描述其他编辑需求。`
}

export async function POST(req: NextRequest) {
  try {
    const { message, projectId } = await req.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Detect intended edit actions from the message
    const actions = detectEditActions(message)

    // Generate a contextual reply
    const reply = generateReply(message, actions)

    return NextResponse.json({
      reply,
      actions,
      projectId,
    })
  } catch (error) {
    console.error('chat-edit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
