import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import { hasSupabaseConfig, getSupabase } from '@/lib/supabase'

export const runtime = 'nodejs'

// ── File-based fallback (local dev) ──────────────────────────────────
const DATA_DIR = process.env.DATA_DIR || '/var/www/shotforge/data'

function ensureDataDir() {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }) } catch {}
}

function readProjectsFile(): any[] {
  ensureDataDir()
  const p = path.join(DATA_DIR, 'projects.json')
  if (!fs.existsSync(p)) return []
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) } catch { return [] }
}

function writeProjectsFile(projects: any[]) {
  ensureDataDir()
  fs.writeFileSync(path.join(DATA_DIR, 'projects.json'), JSON.stringify(projects, null, 2))
}

// ── Supabase helpers ──────────────────────────────────────────────────
async function readProjectsSupabase(userId?: string) {
  const sb = getSupabase()
  let q = sb.from('projects').select('*').order('updated_at', { ascending: false })
  if (userId) q = q.eq('user_id', userId)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

async function upsertProjectSupabase(project: any) {
  const sb = getSupabase()
  const { error } = await sb.from('projects').upsert(
    { ...project, updated_at: new Date().toISOString() },
    { onConflict: 'id' },
  )
  if (error) throw error
}

async function deleteProjectSupabase(id: string) {
  const sb = getSupabase()
  const { error } = await sb.from('projects').delete().eq('id', id)
  if (error) throw error
}

// ── Route handlers ────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    if (hasSupabaseConfig()) {
      const userId = req.headers.get('x-user-id') ?? undefined
      const projects = await readProjectsSupabase(userId)
      return NextResponse.json(projects)
    }
    return NextResponse.json(readProjectsFile())
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (hasSupabaseConfig()) {
      await upsertProjectSupabase(body)
      return NextResponse.json({ success: true })
    }
    const projects = readProjectsFile()
    const idx = projects.findIndex((p: any) => p.id === body.id)
    if (idx >= 0) {
      projects[idx] = { ...projects[idx], ...body, updatedAt: new Date().toISOString() }
    } else {
      projects.unshift({ ...body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    }
    writeProjectsFile(projects)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    if (hasSupabaseConfig()) {
      await deleteProjectSupabase(id)
      return NextResponse.json({ success: true })
    }
    const projects = readProjectsFile().filter((p: any) => p.id !== id)
    writeProjectsFile(projects)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
