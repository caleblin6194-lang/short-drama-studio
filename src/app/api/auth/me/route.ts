import { NextRequest, NextResponse } from 'next/server'
import { getSupabase, hasSupabaseConfig } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }
  const supabase = getSupabase()

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 })
  }

  const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: profile?.name ?? user.email?.split('@')[0] ?? '',
      role: profile?.role ?? 'user',
      credits: profile?.credits ?? 100,
    },
  })
}
