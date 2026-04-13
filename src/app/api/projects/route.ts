import { NextRequest, NextResponse } from 'next/server'
import { getSupabase, hasSupabaseConfig } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

function withAuth(handler: (req: NextRequest, supabase: any) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    return handler(req, getSupabase())
  }
}

// GET /api/projects?userId=xxx
export const GET = withAuth(async (request: NextRequest, supabase: any) => {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 401 })

  const { data, error } = await supabase
    .from('projects').select('*').eq('user_id', userId).order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
})

// POST /api/projects
export const POST = withAuth(async (request: NextRequest, supabase: any) => {
  const body = await request.json()
  const { userId, title, tagSet } = body
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 401 })

  const { data, error } = await supabase
    .from('projects').insert({
      id: uuidv4(), user_id: userId,
      title: title || '未命名项目',
      tag_set: tagSet || {},
    }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
})

// PATCH /api/projects
export const PATCH = withAuth(async (request: NextRequest, supabase: any) => {
  const body = await request.json()
  const { projectId, userId, updates } = body
  if (!projectId || !userId) return NextResponse.json({ error: 'projectId and userId required' }, { status: 400 })

  const { data: project } = await supabase
    .from('projects').select('user_id').eq('id', projectId).single()

  if (!project || project.user_id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const updateData: any = {}
  if (updates.title !== undefined) updateData.title = updates.title
  if (updates.status !== undefined) updateData.status = updates.status
  if (updates.tagSet !== undefined) updateData.tag_set = updates.tagSet
  if (updates.inferredConfig !== undefined) updateData.inferred_config = updates.inferredConfig
  if (updates.script !== undefined) updateData.script = updates.script
  if (updates.shots !== undefined) updateData.shots = updates.shots
  if (updates.masterCut !== undefined) updateData.master_cut = updates.masterCut
  if (updates.variants !== undefined) updateData.variants = updates.variants
  if (updates.storyStructure !== undefined) updateData.story_structure = updates.storyStructure
  if (updates.costSpent !== undefined) updateData.cost_spent = updates.costSpent
  if (updates.lastEnteredStage !== undefined) updateData.last_entered_stage = updates.lastEnteredStage

  const { data: updated, error } = await supabase
    .from('projects').update(updateData).eq('id', projectId).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(updated)
})

// DELETE /api/projects?projectId=xxx&userId=xxx
export const DELETE = withAuth(async (request: NextRequest, supabase: any) => {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const userId = searchParams.get('userId')
  if (!projectId || !userId) return NextResponse.json({ error: 'projectId and userId required' }, { status: 400 })

  const { data: project } = await supabase
    .from('projects').select('user_id').eq('id', projectId).single()

  if (!project || project.user_id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { error } = await supabase.from('projects').delete().eq('id', projectId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
})
