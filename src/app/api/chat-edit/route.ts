import { NextRequest, NextResponse } from 'next/server'

interface EditAction {
  type: 'update_dialogue' | 'update_description' | 'add_transition' | 'change_bgm' | 'toggle_subtitles' | 'generic'
  description: string
  shotIndex?: number   // 0-based shot index the action targets
  value?: string       // new value (text for dialogue/description, transition type for add_transition, mood for change_bgm)
  status: 'pending' | 'applied'
}

const TRANSITION_TYPES = ['fade', 'flash', 'cross_dissolve', 'slow_zoom', 'shake', 'blur', 'slide_left', 'slide_right', 'wipe', 'bw_flash']
const BGM_MOODS = ['epic', 'tender', 'tension', 'mysterious', 'romantic', 'horror', 'uplifting', 'action', 'comic', 'sad']

function detectEditActions(message: string, shotCount = 0): EditAction[] {
  const actions: EditAction[] = []

  // Dialogue change: "把第N段台词改为..."
  const dialogueMatch = message.match(/(?:把|将)?第(\d+)(?:段|个|条)?(?:台词|对白|对话)(?:改为|换成|修改为|变为)(.+)/)
  if (dialogueMatch) {
    const idx = parseInt(dialogueMatch[1]) - 1
    actions.push({
      type: 'update_dialogue',
      description: `将第${dialogueMatch[1]}段台词改为：${dialogueMatch[2].slice(0, 20)}...`,
      shotIndex: Math.max(0, Math.min(idx, shotCount - 1)),
      value: dialogueMatch[2].trim(),
      status: 'pending',
    })
  }

  // BGM change: "加上/换成xxx配乐"
  const bgmMatch = message.match(/(?:加上|换成|改为|调整为)?(.+?)(?:配乐|背景音乐|BGM|音乐)/)
  if (bgmMatch) {
    const moodHint = bgmMatch[1].trim()
    const mood = BGM_MOODS.find(m => moodHint.includes(m)) ||
      (moodHint.includes('紧张') ? 'tension' : moodHint.includes('史诗') ? 'epic' : moodHint.includes('温柔') ? 'tender' : 'epic')
    actions.push({
      type: 'change_bgm',
      description: `将BGM调整为 ${mood} 风格`,
      value: mood,
      status: 'pending',
    })
  }

  // Transition: "加转场" / "加闪白转场"
  const transitionMatch = message.match(/(?:加上?|使用|换上?)(?:(.+?))?转场/)
  if (transitionMatch && !dialogueMatch) {
    const hint = transitionMatch[1]?.trim() || ''
    const type = TRANSITION_TYPES.find(t => hint.includes(t)) ||
      (hint.includes('闪') ? 'flash' : hint.includes('淡') ? 'fade' : hint.includes('模糊') ? 'blur' : 'fade')
    // Target last shot if no index specified
    const shotIndexMatch = message.match(/第(\d+)/)
    const shotIdx = shotIndexMatch ? parseInt(shotIndexMatch[1]) - 1 : Math.max(0, shotCount - 1)
    actions.push({
      type: 'add_transition',
      description: `为第${shotIdx + 1}镜头添加 ${type} 转场`,
      shotIndex: Math.max(0, Math.min(shotIdx, shotCount - 1)),
      value: type,
      status: 'pending',
    })
  }

  // Subtitles: "加字幕" / "开启字幕"
  if (/加字幕|开启字幕|打开字幕/.test(message)) {
    actions.push({ type: 'toggle_subtitles', description: '开启字幕显示', value: 'true', status: 'pending' })
  }
  if (/关闭字幕|去掉字幕|隐藏字幕/.test(message)) {
    actions.push({ type: 'toggle_subtitles', description: '关闭字幕显示', value: 'false', status: 'pending' })
  }

  // Generic fallback
  if (actions.length === 0) {
    actions.push({ type: 'generic', description: `处理请求：${message.slice(0, 30)}`, status: 'pending' })
  }

  return actions
}

function generateReply(message: string, actions: EditAction[]): string {
  const hasReal = actions.some(a => a.type !== 'generic')
  if (!hasReal) {
    return `明白了！我来帮你处理：「${message}」\n\n你可以尝试更具体的指令，例如：\n• 「把第2段台词改为你好世界」\n• 「给第3镜头加淡入转场」\n• 「加上紧张配乐」\n• 「开启字幕」`
  }
  const descriptions = actions.filter(a => a.type !== 'generic').map(a => `• ${a.description}`).join('\n')
  return `好的，检测到以下编辑操作：\n\n${descriptions}\n\n点击「执行」按钮即可应用。`
}

export async function POST(req: NextRequest) {
  try {
    const { message, projectId, shotCount = 0 } = await req.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const actions = detectEditActions(message, shotCount)
    const reply = generateReply(message, actions)

    return NextResponse.json({ reply, actions, projectId })
  } catch (error) {
    console.error('chat-edit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
