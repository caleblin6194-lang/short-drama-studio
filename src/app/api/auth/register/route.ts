import { NextRequest, NextResponse } from 'next/server'
import { getSupabase, hasSupabaseConfig } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }
  const supabase = getSupabase()

  const body = await req.json()
  const { email, password, name } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: name || email.split('@')[0] } },
  })

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message || 'Registration failed' }, { status: 400 })
  }

  // Create user profile
  const { data: profile } = await supabase
    .from('users')
    .insert({
      id: data.user.id,
      email: data.user.email!,
      name: name || email.split('@')[0],
      role: 'user',
      credits: 100, // Free tier starter credits
    })
    .select()
    .single()

  // Create default free membership
  await supabase.from('memberships').insert({
    user_id: data.user.id,
    plan_tier: 'free',
    status: 'active',
    monthly_credits_remaining: 2000,
    total_credits: 2000,
    auto_renew: false,
    renewal_history: [],
  })

  // Grant welcome credits transaction
  await supabase.from('credit_transactions').insert({
    user_id: data.user.id,
    type: 'one_time_grant',
    amount: 2000,
    balance: 2000,
    note: '新用户注册赠送 2000 积分',
  })

  const response = NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      name: profile?.name ?? name ?? email.split('@')[0],
      role: 'user',
      credits: 100,
    },
    session: data.session ? {
      accessToken: data.session.access_token,
      expiresAt: data.session.expires_at,
    } : null,
  })

  // 写 httpOnly cookie 供 middleware 路由保护使用
  if (data.session) {
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
  }

  return response
}
