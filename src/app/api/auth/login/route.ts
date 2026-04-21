import { NextRequest, NextResponse } from 'next/server'
import { getSupabase, hasSupabaseConfig } from '@/lib/supabase'

const DEMO_ACCOUNTS: Record<string, { role: 'user' | 'admin'; name: string }> = {
  'demo@example.com': { role: 'user', name: 'Demo 用户' },
  'admin@example.com': { role: 'admin', name: 'Admin' },
}

function isDemoLoginEnabled(): boolean {
  return process.env.ALLOW_DEMO_LOGIN === '1' && process.env.NODE_ENV !== 'production'
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  if (isDemoLoginEnabled() && password === '123456' && DEMO_ACCOUNTS[email]) {
    const { role, name } = DEMO_ACCOUNTS[email]
    const demoId = `demo-${role}`
    const expiresAt = Math.floor(Date.now() / 1000) + 86400 * 7
    const accessToken = `demo-token-${demoId}`

    const response = NextResponse.json({
      user: {
        id: demoId,
        email,
        name,
        role,
        credits: role === 'admin' ? 99999 : 500,
        createdAt: new Date().toISOString(),
      },
      session: {
        accessToken,
        expiresAt,
      },
    })

    response.cookies.set('sb-access-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400 * 7,
    })

    return response
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user || !data.session) {
    return NextResponse.json({ error: error?.message || 'Login failed' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single()

  const response = NextResponse.json({
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

  const maxAge = data.session.expires_at
    ? data.session.expires_at - Math.floor(Date.now() / 1000)
    : 60 * 60 * 24 * 7

  response.cookies.set('sb-access-token', data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  })

  return response
}
