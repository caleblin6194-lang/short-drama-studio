import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/api/doubao-text'
import { v4 as uuid } from 'uuid'
import * as fs from 'fs'
import * as path from 'path'

interface Shot {
  id: string
  number: string
  order: number
  sceneRef: string
  characterRefs: string[]
  propRefs: string[]
  description: string
  dialogue: string
  narration?: string
  cameraDirection?: string
  emotionTag?: string
  shotType?: string
  cameraMove?: string
  durationSec: number
  pipeline: {
    image: { status: 'pending' | 'rendering' | 'done' | 'failed'; attemptCount: number }
    video: { status: 'pending' | 'rendering' | 'done' | 'failed'; attemptCount: number }
    audio: { status: 'pending' | 'rendering' | 'done' | 'failed'; attemptCount: number }
  }
}

const KNOWLEDGE_PATH = process.env.KNOWLEDGE_DIR
  ? path.join(process.env.KNOWLEDGE_DIR, 'cinematography.json')
  : path.join(process.cwd(), 'knowledge', 'cinematography.json')

function loadKnowledge(): string {
  try {
    if (fs.existsSync(KNOWLEDGE_PATH)) {
      const k = JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, 'utf-8'))
      const lines: string[] = []
      if (k.paceRules) lines.push(`剪辑节奏：对白镜头${k.paceRules.dialogue || ''}，动作镜头${k.paceRules.action || ''}，情感镜头${k.paceRules.emotional || ''}`)
      if (k.hookTechniques?.length) lines.push(`钩子技法：${k.hookTechniques.slice(0, 3).join('；')}`)
      if (k.emotionalTonePatterns?.climax?.cameraPatterns?.length) {
        lines.push(`高潮运镜范例：${k.emotionalTonePatterns.climax.cameraPatterns.slice(0, 2).join('；')}`)
      }
      if (k.emotionalTonePatterns?.setup?.cameraPatterns?.length) {
        lines.push(`铺垫运镜范例：${k.emotionalTonePatterns.setup.cameraPatterns.slice(0, 2).join('；')}`)
      }
      return lines.length ? '\n\n【学习知识库（最新运镜规律）】\n' + lines.join('\n') : ''
    }
  } catch {}
  return ''
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { scriptText, narrationMode = false } = body

    if (!scriptText || scriptText.length < 20) {
      return NextResponse.json({ error: '剧本内容太少' }, { status: 400 })
    }

    const estimatedCount = Math.min(60, Math.max(3, Math.round(scriptText.length / 100)))
    const knowledgeHint = loadKnowledge()

    const narrationField = narrationMode
      ? '\n- narration: 旁白文案（第三人称叙事，描述画面内容与情感，配合镜头播放，如无需旁白则为空字符串）'
      : ''

    const prompt = `你是一个专业的短剧分镜师。请根据以下剧本，智能拆分镜头。

分镜要求：
- 镜头数量由你根据剧情节奏自行决定，参考：每句对白/每个动作/每次场景切换约1个镜头，整体约${estimatedCount}个（可多可少）
- 情节高潮/冲突适当增加镜头强化张力；平铺叙事时可合并镜头
- 台词精炼有张力，场景切换注意逻辑连续性${knowledgeHint}

每个镜头时长根据以下规则智能判断（禁止所有镜头相同）：
- 纯动作/环境镜头（无台词）：2-4秒
- 短台词（10字以内）：3-5秒
- 中等台词（10-30字）：5-8秒
- 长台词或情绪爆发：8-12秒
- 高潮冲突/打斗：每个动作片段2-3秒
- 悬念结尾：4-6秒

运镜方式要丰富多样，参考：推镜头、拉镜头、摇镜头、跟镜头、特写、大特写、全景、俯拍、仰拍、过肩镜头、甩镜头、升降镜头，根据情绪选择最合适的。

返回JSON数组，每项字段：
- sceneRef: 场景名称
- characterRefs: 出场角色名列表（数组）
- description: 镜头画面描述（人物动作、表情、环境）
- dialogue: 对白（格式"角色名：台词"，无则为空字符串）${narrationField}
- durationSec: 时长（整数秒）
- cameraDirection: 运镜方式（具体描述，如"低角度仰拍主角入场"）
- emotionTag: 情绪标签（neutral/angry/sad/surprised/happy/tense，根据台词和场景选择）
- shotType: 景别（extreme_wide/wide/medium/close/extreme_close，根据场景选择）
- cameraMove: 运镜类型（static/push/pull/pan/track/orbit/crane）

只返回JSON数组，不要其他任何内容。

剧本：
${scriptText}`

    const result = await generateText({
      messages: [
        { role: 'system', content: '你是一个专业的短剧分镜师，擅长根据剧情节奏智能拆分镜头，运镜丰富多样，镜头数量灵活，忠实还原剧本每个情节点。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    })

    function repairJson(raw: string): string {
      // Remove non-printable control chars (keep \t \n \r)
      let s = raw.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
      // Escape bare newlines inside JSON string values
      s = s.replace(/"([^"\\]*)"/g, (_m, inner) => `"${inner.replace(/\n/g, '\\n').replace(/\r/g, '\\r')}"`)
      // Remove trailing commas before ] or }
      s = s.replace(/,(\s*[}\]])/g, '$1')
      return s
    }

    let shotsData: any[] = []
    try {
      const normalized = repairJson(
        result.replace(/["\u201c\u201d]/g, '"').replace(/['']/g, "'")
      )
      const jsonMatch = normalized.match(/\[[\s\S]*\]/)
      if (jsonMatch) shotsData = JSON.parse(jsonMatch[0])
    } catch (e) {
      console.error('Failed to parse shots JSON:', e, 'Raw:', result.slice(0, 200))
    }

    if (!shotsData || shotsData.length === 0) {
      const lines = scriptText.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 5)
      shotsData = lines.map((line: string, i: number) => {
        const isDialogue = line.includes('：') || line.includes(':')
        const charCount = line.replace(/[，。！？,.!?]/g, '').length
        const dur = isDialogue ? (charCount <= 10 ? 4 : charCount <= 30 ? 6 : 10) : 3
        return {
          sceneRef: `场景${Math.floor(i / 3) + 1}`,
          characterRefs: [],
          description: line.slice(0, 80),
          dialogue: isDialogue ? line : '',
          narration: narrationMode ? line.slice(0, 60) : '',
          durationSec: dur,
          cameraDirection: ['固定镜头', '推镜头', '拉镜头', '摇镜头'][i % 4],
        }
      })
    }

    const shots: Shot[] = shotsData.map((s: any, i: number) => {
      const dialogue: string = s.dialogue || ''
      const description: string = s.description || ''
      // Infer emotionTag if LLM didn't return it
      const inferEmotion = (): string => {
        if (dialogue.includes('！') || dialogue.includes('!')) return 'angry'
        if (dialogue.includes('…') || dialogue.includes('...')) return 'sad'
        if (!dialogue) return 'neutral'
        return 'neutral'
      }
      // Infer shotType if LLM didn't return it
      const inferShotType = (): string => {
        if (i === 0 || description.includes('大场景') || description.includes('环境') || description.includes('全景')) return 'wide'
        if (dialogue) return 'close'
        return 'medium'
      }
      // Map cameraMove from cameraDirection
      const inferCameraMove = (dir: string): string => {
        if (!dir) return 'static'
        if (dir.includes('推')) return 'push'
        if (dir.includes('拉')) return 'pull'
        if (dir.includes('摇') || dir.includes('横')) return 'pan'
        if (dir.includes('跟')) return 'track'
        if (dir.includes('升') || dir.includes('降')) return 'crane'
        return 'static'
      }
      return {
        id: uuid(),
        number: String(i + 1),
        order: i,
        sceneRef: s.sceneRef || s.scene || '默认场景',
        characterRefs: Array.isArray(s.characterRefs) ? s.characterRefs : (s.character ? [s.character] : []),
        propRefs: Array.isArray(s.propRefs) ? s.propRefs : [],
        description,
        dialogue,
        narration: narrationMode ? (s.narration || '') : undefined,
        cameraDirection: s.cameraDirection || '固定镜头',
        emotionTag: s.emotionTag || inferEmotion(),
        shotType: s.shotType || inferShotType(),
        cameraMove: s.cameraMove || inferCameraMove(s.cameraDirection || ''),
        durationSec: s.durationSec || (() => {
          const dl = dialogue.replace(/[，。！？,.!?]/g, '').length
          return dl === 0 ? 3 : dl <= 10 ? 4 : dl <= 30 ? 6 : 10
        })(),
        pipeline: {
          image: { status: 'pending' as const, attemptCount: 0 },
          video: { status: 'pending' as const, attemptCount: 0 },
          audio: { status: 'pending' as const, attemptCount: 0 },
        },
      }
    })

    return NextResponse.json({ shots })
  } catch (err: any) {
    console.error('Shots generate error:', err)
    return NextResponse.json({ error: err.message || '生成失败' }, { status: 500 })
  }
}
