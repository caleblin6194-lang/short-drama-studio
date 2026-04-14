import { NextRequest, NextResponse } from 'next/server'
import { getSupabase, hasSupabaseConfig } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }
  const supabase = getSupabase()

  const body = await req.json()
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message || 'Login failed' }, { status: 401 })
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single()

  return NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      name: profile?.name ?? data.user.email?.split('@')[0] ?? '',
      role: profile?.role ?? 'user',
      credits: profile?.credits ?? 100,
      createdAt: data.user.created_at,
    },
    session: {
      accessToken: data.session.access_token,
      expiresAt: data.session.expires_at,
    },
  })
}
