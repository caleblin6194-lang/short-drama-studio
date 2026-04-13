import type { Project, StoryBeat, StoryBeatId, StoryStructurePlan } from '@/types'

const WORLD_LOCATION: Record<string, string> = {
  古风: '古道驿站与城门夜市',
  架空: '禁区矿洞与废弃祭坛',
  民国: '旧码头与报馆后巷',
  乡村: '荒山矿坑与村口祠堂',
  现代: '城郊工地与地下停车场',
  星际: '殖民站外环与失重通道',
  都市: '高架桥下与写字楼天台',
}

const TYPE_CONFLICT: Record<string, string> = {
  穿越: '身份暴露风险逐步抬升',
  逆袭: '底层反击触发阶层正面对撞',
  重生: '旧局重开后因果开始反噬',
  爱情: '关系拉扯与利益冲突并行',
  玄幻: '规则压制与禁术代价同步升级',
  现代言情: '情感误判与现实阻力叠加',
  总裁: '资本博弈与情感对赌同场',
  虐恋: '误会加深后情绪快速失控',
  甜宠: '高密互动后出现关键试探',
  神豪: '财富反差引爆舆论',
  女性成长: '主角突破旧标签并重建边界',
  古风权谋: '明线交易掩护暗线夺权',
  家庭伦理: '亲缘冲突与真相揭露连锁发生',
  复仇: '报复推进触发反侦测',
  悬疑推理: '线索拼接后出现反证',
  古风言情: '礼法压力与情感选择对冲',
  生活: '日常平衡被突发事件打破',
  刑侦: '关键证据出现同时埋下误导',
  恐怖: '未知威胁由远及近逼近镜头',
}

const TYPE_TWIST: Record<string, string> = {
  穿越: '主角确认身边盟友里有“伪装者”',
  逆袭: '被压制者突然掌握核心筹码',
  重生: '上一世信任对象在本轮先手背刺',
  爱情: '看似离开的角色其实在反向保护',
  玄幻: '力量来源并非天赋而是代偿契约',
  现代言情: '误会来源不是第三者而是旧案',
  总裁: '并购目标真实控制人浮出水面',
  虐恋: '伤害最深的人同时是唯一证人',
  甜宠: '高甜桥段后抛出真实身份反差',
  神豪: '财富来源被对手误导成陷阱',
  女性成长: '主角主动放弃“被期待的人设”',
  古风权谋: '朝堂明争背后另有军权交易',
  家庭伦理: '亲属关系被一份旧档案彻底改写',
  复仇: '目标并非幕后黑手而只是挡箭牌',
  悬疑推理: '凶手动机和案发顺序被整体反转',
  古风言情: '婚约对象与救命恩人身份互换',
  生活: '平静表象下隐藏长期操控',
  刑侦: '真凶借警方节奏制造二次现场',
  恐怖: '怪物面孔对应的是失踪者身份',
}

const BEAT_META: Array<{ id: StoryBeatId; icon: string; label: string; timeRange: string }> = [
  { id: 'opening', icon: '🪝', label: '开场', timeRange: '0-15s' },
  { id: 'buildup', icon: '📝', label: '铺垫', timeRange: '15-45s' },
  { id: 'climax', icon: '⚡', label: '高潮', timeRange: '45-80s' },
  { id: 'twist', icon: '🔁', label: '反转', timeRange: '80-105s' },
  { id: 'suspense', icon: '❓', label: '悬念', timeRange: '105-120s' },
]

function normalize(text: string): string {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

function firstSentence(text: string, fallback: string): string {
  const cleaned = normalize(text)
  if (!cleaned) return fallback
  const chunks = cleaned.split(/[。！？\n]/).map((x) => normalize(x)).filter(Boolean)
  const pick = chunks[0] || fallback
  if (pick.length <= 46) return pick
  return `${pick.slice(0, 46)}...`
}

function extractCharacterNames(text: string): string[] {
  const found = new Set<string>()
  const regex = /([\u4e00-\u9fa5]{2,4})[：:]/g
  let m: RegExpExecArray | null = null
  while ((m = regex.exec(text)) !== null) {
    const name = m[1]
    if (!name || name === '旁白' || name === '系统') continue
    found.add(name)
    if (found.size >= 3) break
  }
  const arr = Array.from(found)
  if (arr.length >= 2) return arr
  if (arr.length === 1) return [arr[0], '关键对手', '第三目击者']
  return ['主角', '关键对手', '第三目击者']
}

function buildBeatText(project: Project, openingSeed: string, cast: string[], location: string): Record<StoryBeatId, string> {
  const type = project.tagSet.type
  const setting = project.tagSet.setting
  const conflict = TYPE_CONFLICT[type] || '冲突持续加压并驱动动作升级'
  const twist = TYPE_TWIST[type] || '揭示隐藏关系，重置观众预期'

  return {
    opening: `${openingSeed}，观众在第一镜头即感知风险。`,
    buildup: `围绕「${setting}」做两轮信息铺垫，${cast[0]}被推入不可回避的抉择。`,
    climax: `在${location}触发正面冲突，${conflict}。`,
    twist: `${twist}，节奏从“解释”切到“追击”。`,
    suspense: `${cast[0]}看清真相后只说半句，镜头贴脸截止在最危险的一秒。`,
  }
}

function pickDialogueLines(scriptText: string, cast: string[]): string[] {
  const lines: string[] = []
  for (const raw of scriptText.split('\n')) {
    const line = normalize(raw)
    if (!line) continue
    if (/^[\u4e00-\u9fa5]{2,4}[：:]/.test(line)) {
      lines.push(`「${line}」`)
    }
    if (lines.length >= 3) break
  }

  if (lines.length > 0) return lines

  return [
    `${cast[0]}（压低声音）：「别下去，下面不对劲。」`,
    `${cast[1]}（狠声）：「来都来了，直接把它拖上来。」`,
  ]
}

export function createStoryStructurePlan(project: Project): StoryStructurePlan {
  const scriptText = project.script.rawText || ''
  const openingSeed = firstSentence(scriptText, `${project.title || '未命名短剧'}在危险边缘开局`)
  const cast = extractCharacterNames(scriptText)
  const location = WORLD_LOCATION[project.tagSet.world] || '废弃区域与主战场交界处'

  const beatText = buildBeatText(project, openingSeed, cast, location)
  const beats: StoryBeat[] = BEAT_META.map((meta) => ({
    ...meta,
    text: beatText[meta.id],
  }))

  return {
    durationLabel: '2分钟结构设计',
    beats,
    hookScene: {
      label: '钩子',
      timeRange: '0-10s',
      location,
      characters: cast,
      visualCue: `特写：${openingSeed}，画面在高压动作点完成第一次“信息暴击”。`,
      dialogueLines: pickDialogueLines(scriptText, cast),
    },
    generatedAt: new Date().toISOString(),
  }
}

export function formatStoryStructureToScript(plan: StoryStructurePlan): string {
  const beatLines = plan.beats.map((beat) => `- ${beat.icon} ${beat.label}（${beat.timeRange}）：${beat.text}`)
  const charLine = plan.hookScene.characters.join('、') || '主角、对手'
  const dialogueLines = plan.hookScene.dialogueLines.length > 0
    ? plan.hookScene.dialogueLines.map((line) => `  ${line}`).join('\n')
    : '  （留白，现场即兴）'

  return [
    `【${plan.durationLabel}】`,
    ...beatLines,
    '',
    `【场景详情｜${plan.hookScene.label} ${plan.hookScene.timeRange}】`,
    `地点：${plan.hookScene.location}`,
    `人物：${charLine}`,
    `${plan.hookScene.visualCue}`,
    '对白：',
    dialogueLines,
  ].join('\n')
}
