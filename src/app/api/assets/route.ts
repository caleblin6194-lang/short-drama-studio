import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import type { AssetLibrary, SceneAsset, CharacterAsset, PropAsset, AssetStatus } from '@/types'

// In-memory store for demo (replace with DB in production)
const assetLibraries: Record<string, AssetLibrary> = {}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 })
  }

  const library = assetLibraries[projectId] || { scenes: [], characters: [], props: [] }

  return NextResponse.json(library)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, assetType, data } = body

    if (!projectId || !assetType) {
      return NextResponse.json({ error: 'projectId and assetType required' }, { status: 400 })
    }

    // Initialize library if not exists
    if (!assetLibraries[projectId]) {
      assetLibraries[projectId] = { scenes: [], characters: [], props: [] }
    }

    const library = assetLibraries[projectId]

    if (assetType === 'scene') {
      const scene: SceneAsset = {
        id: uuidv4(),
        name: data.name || '新场景',
        description: data.description || '',
        imageUrl: data.imageUrl,
        status: (data.status as AssetStatus) || 'ready',
        approvedByUser: false,
        timeOfDay: data.timeOfDay,
        mood: data.mood,
        kind: 'scene',
      }
      library.scenes.push(scene)
      return NextResponse.json(scene)
    }

    if (assetType === 'character') {
      const character: CharacterAsset = {
        id: uuidv4(),
        name: data.name || '新角色',
        description: data.description || '',
        imageUrl: data.imageUrl,
        status: (data.status as AssetStatus) || 'ready',
        approvedByUser: false,
        tier: data.tier || 'support',
        age: data.age,
        gender: data.gender,
        kind: 'character',
      }
      library.characters.push(character)
      return NextResponse.json(character)
    }

    if (assetType === 'prop') {
      const prop: PropAsset = {
        id: uuidv4(),
        name: data.name || '新道具',
        description: data.description || '',
        imageUrl: data.imageUrl,
        status: (data.status as AssetStatus) || 'ready',
        approvedByUser: false,
        kind: 'prop',
      }
      library.props.push(prop)
      return NextResponse.json(prop)
    }

    return NextResponse.json({ error: 'Invalid assetType' }, { status: 400 })
  } catch (error) {
    console.error('Assets error:', error)
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, assetType, assetId, updates } = body

    if (!projectId || !assetType || !assetId) {
      return NextResponse.json({ error: 'projectId, assetType, and assetId required' }, { status: 400 })
    }

    const library = assetLibraries[projectId]
    if (!library) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    let assetList: any[] = []
    if (assetType === 'scene') assetList = library.scenes
    else if (assetType === 'character') assetList = library.characters
    else if (assetType === 'prop') assetList = library.props
    else return NextResponse.json({ error: 'Invalid assetType' }, { status: 400 })

    const asset = assetList.find((a) => a.id === assetId)
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    Object.assign(asset, updates)
    return NextResponse.json(asset)
  } catch (error) {
    console.error('Assets PATCH error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const assetType = searchParams.get('assetType')
  const assetId = searchParams.get('assetId')

  if (!projectId || !assetType || !assetId) {
    return NextResponse.json({ error: 'projectId, assetType, and assetId required' }, { status: 400 })
  }

  const library = assetLibraries[projectId]
  if (!library) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  let assetList: any[] = []
  if (assetType === 'scene') assetList = library.scenes
  else if (assetType === 'character') assetList = library.characters
  else if (assetType === 'prop') assetList = library.props
  else return NextResponse.json({ error: 'Invalid assetType' }, { status: 400 })

  const index = assetList.findIndex((a) => a.id === assetId)
  if (index === -1) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  assetList.splice(index, 1)
  return NextResponse.json({ success: true })
}
