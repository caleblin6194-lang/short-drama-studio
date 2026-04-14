import { NextRequest, NextResponse } from 'next/server'
import { getSupabase, hasSupabaseConfig } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import type { RegionTag } from '@/types'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const REGION_LANGUAGES: Record<RegionTag, { label: string; system: string; example: string }> = {
  '国内': { label: '简体中文', system: '你是一个短剧编剧，保持原文风格。', example: '三年后' },
  '北美': { label: 'English', system: 'You are a short drama screenwriter. Adapt for North American audience preferences.', example: 'Three years later' },
  '欧洲': { label: 'English (European style)', system: 'You are a short drama screenwriter. Adapt for European audience preferences.', example: 'Three years on' },
  '东南亚': { label: 'Bahasa Indonesia', system: 'You are a short drama screenwriter. Adapt for Southeast Asian audience preferences.', example: 'Tiga tahun kemudian' },
  '日韩': { label: '日本語', system: 'あなたは短編ドラマの脚本家です。日本観客の好みに合わせて adapt.', example: '三年後' },
  '中东': { label: 'العربية', system: 'You are a short drama screenwriter. Adapt for Middle Eastern audience preferences.', example: 'بعد ثلاث سنوات' },
  '拉美': { label: 'Español', system: 'You are a short drama screenwriter. Adapt for Latin American audience preferences.', example: 'Tres años después' },
}

function withAuth(handler: (req: NextRequest, supabase: any, userId: string) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    const supabase = getSupabase()
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return handler(req, supabase, user.id)
  }
}

// POST /api/variants — Create a region variant from existing project
export const POST = withAuth(async (req: NextRequest, supabase: any, userId: string) => {
  const body = await req.json()
  const { projectId, region } = body as { projectId: string; region: RegionTag }

  if (!projectId || !region) {
    return NextResponse.json({ error: 'projectId and region required' }, { status: 400 })
  }

  const validRegions: RegionTag[] = ['国内', '北美', '欧洲', '东南亚', '日韩', '中东', '拉美']
  if (!validRegions.includes(region)) {
    return NextResponse.json({ error: 'Invalid region' }, { status: 400 })
  }

  // Fetch project
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single()

  if (error || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const variantId = uuidv4()
  const regionConfig = REGION_LANGUAGES[region]

  // Get original script
  const script = project.script as any
  const originalText = script?.rawText || ''

  let adaptedScript = originalText
  let adaptationNote = ''

  // If OpenAI key available and text is long enough, use real translation
  if (OPENAI_API_KEY && originalText.length > 50) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `${regionConfig.system}\n\n你是一个短剧创作工具。请将以下剧本翻译/改编为适合${region}市场的版本。保持剧情结构和情感节奏，但调整：\n1. 角色姓名（改为当地化姓名）\n2. 文化背景细节\n3. 某些梗和表达方式\n4. 适当的时长节奏（${region === '北美' || region === '拉美' ? '90秒' : region === '东南亚' || region === '日韩' ? '60秒' : '75秒'}每集）\n\n直接输出改编后的剧本，不要添加解释。` },
            { role: 'user', content: originalText.slice(0, 3000) },
          ],
          max_tokens: 1500,
          temperature: 0.8,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        adaptedScript = data.choices?.[0]?.message?.content || originalText
        adaptationNote = `AI 改编 · ${regionConfig.label}`
      } else {
        adaptationNote = '翻译 API 失败，使用原文'
      }
    } catch {
      adaptationNote = '翻译服务不可用，使用原文'
    }
  } else {
    adaptationNote = region === '国内' ? '同版' : `简化改编版 · ${regionConfig.label}`
    if (region !== '国内') {
      adaptedScript = `[${regionConfig.label}版]\n${originalText}`
    }
  }

  // Build variant object
  const variant = {
    id: variantId,
    parentProjectId: projectId,
    region,
    status: 'done' as const,
    estimatedCost: 510,
    actualCost: 510,
    adaptedScript,
    adaptationNote,
    createdAt: new Date().toISOString(),
  }

  // Append variant to project
  const existingVariants = (project.variants || []) as any[]
  const { error: updateError } = await supabase
    .from('projects')
    .update({ variants: [...existingVariants, variant] })
    .eq('id', projectId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Record credit consumption
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    type: 'consumption',
    amount: -510,
    balance: 0, // Will be updated by trigger or client
    project_id: projectId,
    operation: 'create_variant',
    note: `创建地域变体: ${region}`,
  })

  return NextResponse.json({ variant })
})

// GET /api/variants?projectId=xxx
export const GET = withAuth(async (req: NextRequest, supabase: any, userId: string) => {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const { data: project } = await supabase
    .from('projects')
    .select('variants')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  return NextResponse.json({ variants: project.variants || [] })
})
