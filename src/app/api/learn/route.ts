/**
 * 每日运镜学习 API
 * 调用 LLM 生成最新短剧运镜、分镜、剪辑知识，写入知识库文件。
 * 由 PM2 cron 每天零点触发：curl -X POST http://localhost:3000/api/learn
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/api/doubao-text'
import * as fs from 'fs'
import * as path from 'path'

const KNOWLEDGE_PATH = process.env.KNOWLEDGE_DIR
  ? path.join(process.env.KNOWLEDGE_DIR, 'cinematography.json')
  : path.join(process.cwd(), 'knowledge', 'cinematography.json')

function readKnowledge(): any {
  try {
    if (fs.existsSync(KNOWLEDGE_PATH)) {
      return JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, 'utf-8'))
    }
  } catch {}
  return {}
}

function writeKnowledge(data: any) {
  const dir = path.dirname(KNOWLEDGE_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(KNOWLEDGE_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

export async function POST(req: NextRequest) {
  try {
    const existing = readKnowledge()

    const prompt = `你是一位资深短剧导演，专注研究抖音、快手等平台热门短剧的运镜规律。

请总结当下最流行的短剧运镜与剪辑技法，以JSON格式输出，结构如下：

{
  "emotionalTonePatterns": {
    "setup": { "cameraPatterns": ["..."], "editingRhythm": "...", "composition": "..." },
    "conflict": { "cameraPatterns": ["..."], "editingRhythm": "...", "composition": "..." },
    "climax": { "cameraPatterns": ["..."], "editingRhythm": "...", "composition": "..." },
    "resolution": { "cameraPatterns": ["..."], "editingRhythm": "...", "composition": "..." },
    "cliffhanger": { "cameraPatterns": ["..."], "editingRhythm": "...", "composition": "..." }
  },
  "genrePatterns": {
    "逆袭": { "signature": "...", "cameraStyle": "..." },
    "爱情": { "signature": "...", "cameraStyle": "..." },
    "悬疑": { "signature": "...", "cameraStyle": "..." },
    "甜宠": { "signature": "...", "cameraStyle": "..." },
    "复仇": { "signature": "...", "cameraStyle": "..." }
  },
  "hookTechniques": ["..."],
  "paceRules": { "dialogue": "...", "action": "...", "emotional": "..." },
  "cameraDirectionVocab": ["推镜头", "拉镜头", "摇镜头", "跟镜头", "升降镜头", "特写", "大特写", "全景", "中景", "近景", "俯拍", "仰拍", "侧拍", "过肩镜头", "空镜头", "甩镜头", "旋转镜头"]
}

cameraPatterns 每个情绪至少5条具体技法，例如："低角度仰拍主角入场，配合慢动作强化气势"。
只返回JSON，不要其他内容。`

    const result = await generateText({
      messages: [
        { role: 'system', content: '你是一位资深短剧导演兼剪辑师，熟悉当前平台最流行的内容规律。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
    })

    let learned: any = null
    try {
      const normalized = result.replace(/["\u201c\u201d]/g, '"').replace(/['']/g, "'")
      const jsonMatch = normalized.match(/\{[\s\S]*\}/)
      if (jsonMatch) learned = JSON.parse(jsonMatch[0])
    } catch (e) {
      console.error('[Learn] JSON parse error:', e)
    }

    if (!learned) {
      return NextResponse.json({ error: 'LLM returned no valid JSON', raw: result.slice(0, 200) }, { status: 500 })
    }

    const knowledge = {
      ...existing,
      ...learned,
      updatedAt: new Date().toISOString(),
      version: (existing.version ?? 0) + 1,
    }

    writeKnowledge(knowledge)

    return NextResponse.json({ ok: true, version: knowledge.version, updatedAt: knowledge.updatedAt })
  } catch (err: any) {
    console.error('[Learn] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  const knowledge = readKnowledge()
  return NextResponse.json(knowledge)
}
