import { NextRequest, NextResponse } from 'next/server'
import { getSupabase, hasSupabaseConfig } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import type { AssetLibrary, AssetStatus } from '@/types'

// Middleware: require Supabase config
function withAuth(handler: (req: NextRequest, supabase: any) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    return handler(req, getSupabase())
  }
}

// GET /api/assets?projectId=xxx&userId=xxx
export const GET = withAuth(async (request: NextRequest, supabase: any) => {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const userId = searchParams.get('userId')

  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 401 })

  const { data: project } = await supabase
    .from('projects').select('user_id').eq('id', projectId).single()

  if (!project || project.user_id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { data: assets, error } = await supabase
    .from('assets').select('*').eq('project_id', projectId).order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const library: AssetLibrary = {
    scenes: (assets || []).filter((a: any) => a.kind === 'scene').map(mapAsset),
    characters: (assets || []).filter((a: any) => a.kind === 'character').map(mapAsset),
    props: (assets || []).filter((a: any) => a.kind === 'prop').map(mapAsset),
  }

  return NextResponse.json(library)
})

// POST /api/assets
export const POST = withAuth(async (request: NextRequest, supabase: any) => {
  const body = await request.json()
  const { projectId, assetType, data, userId } = body

  if (!projectId || !assetType || !userId) {
    return NextResponse.json({ error: 'projectId, assetType, userId required' }, { status: 400 })
  }

  const { data: project } = await supabase
    .from('projects').select('user_id').eq('id', projectId).single()

  if (!project || project.user_id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const assetData: any = {
    id: uuidv4(), project_id: projectId, kind: assetType,
    name: data.name || `新${assetType === 'scene' ? '场景' : assetType === 'character' ? '角色' : '道具'}`,
    description: data.description || '', image_url: data.imageUrl || null,
    public_id: data.publicId || null, status: data.status || 'ready',
    approved_by_user: false,
    metadata: {
      timeOfDay: data.timeOfDay, mood: data.mood,
      tier: data.tier, age: data.age, gender: data.gender,
    },
  }

  const { data: asset, error } = await supabase
    .from('assets').insert(assetData).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(asset)
})

// PATCH /api/assets
export const PATCH = withAuth(async (request: NextRequest, supabase: any) => {
  const body = await request.json()
  const { projectId, assetId, updates, userId } = body

  if (!projectId || !assetId || !userId) {
    return NextResponse.json({ error: 'projectId, assetId, userId required' }, { status: 400 })
  }

  const { data: project } = await supabase
    .from('projects').select('user_id').eq('id', projectId).single()

  if (!project || project.user_id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const updateData: any = {}
  if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl
  if (updates.status !== undefined) updateData.status = updates.status
  if (updates.approvedByUser !== undefined) updateData.approved_by_user = updates.approvedByUser
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.publicId !== undefined) updateData.public_id = updates.publicId
  if (updates.metadata !== undefined) updateData.metadata = updates.metadata

  const { data: asset, error } = await supabase
    .from('assets').update(updateData).eq('id', assetId).eq('project_id', projectId).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  return NextResponse.json(asset)
})

// DELETE /api/assets?projectId=xxx&assetId=xxx&userId=xxx
export const DELETE = withAuth(async (request: NextRequest, supabase: any) => {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const assetId = searchParams.get('assetId')
  const userId = searchParams.get('userId')

  if (!projectId || !assetId || !userId) {
    return NextResponse.json({ error: 'projectId, assetId, userId required' }, { status: 400 })
  }

  const { data: project } = await supabase
    .from('projects').select('user_id').eq('id', projectId).single()

  if (!project || project.user_id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { error } = await supabase
    .from('assets').delete().eq('id', assetId).eq('project_id', projectId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
})

function mapAsset(a: any) {
  return {
    id: a.id, name: a.name, description: a.description,
    imageUrl: a.image_url, status: a.status as AssetStatus,
    approvedByUser: a.approved_by_user, kind: a.kind,
    ...(a.metadata || {}),
  }
}
