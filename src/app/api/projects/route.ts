import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

const DATA_DIR = '/var/www/shotforge/data'

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readProjects(): any[] {
  ensureDataDir()
  const indexPath = path.join(DATA_DIR, 'projects.json')
  if (!fs.existsSync(indexPath)) return []
  try {
    return JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
  } catch { return [] }
}

function writeProjects(projects: any[]) {
  ensureDataDir()
  const indexPath = path.join(DATA_DIR, 'projects.json')
  fs.writeFileSync(indexPath, JSON.stringify(projects, null, 2))
}

export async function GET(req: NextRequest) {
  try {
    const projects = readProjects()
    return NextResponse.json(projects)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const projects = readProjects()
    const existingIdx = projects.findIndex((p: any) => p.id === body.id)
    if (existingIdx >= 0) {
      projects[existingIdx] = { ...projects[existingIdx], ...body, updatedAt: new Date().toISOString() }
    } else {
      projects.unshift({ ...body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    }
    writeProjects(projects)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const projects = readProjects().filter((p: any) => p.id !== id)
    writeProjects(projects)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}