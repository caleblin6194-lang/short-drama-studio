import { NextRequest, NextResponse } from 'next/server'
import { getSupabase, hasSupabaseConfig } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

function withAuth(handler: (req: NextRequest, supabase: any, userId: string) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    const supabase = getSupabase()
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 })
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return handler(req, supabase, user.id)
  }
}

const TOPUP_OPTIONS: Record<string, { dp: number; priceCny: number }> = {
  topup_1000: { dp: 1000, priceCny: 59 },
  topup_5000: { dp: 5000, priceCny: 249 },
  topup_20000: { dp: 20000, priceCny: 899 },
}

// POST /api/membership/topup
export const POST = withAuth(async (req: NextRequest, supabase: any, userId: string) => {
  const body = await req.json()
  const { topupId } = body as { topupId: string }

  if (!topupId || !TOPUP_OPTIONS[topupId]) {
    return NextResponse.json({ error: 'Invalid topupId' }, { status: 400 })
  }

  const option = TOPUP_OPTIONS[topupId]

  // Get current membership
  const { data: membership } = await supabase
    .from('memberships')
    .select('total_credits, monthly_credits_remaining')
    .eq('user_id', userId)
    .single()

  const newTotal = (membership?.total_credits ?? 0) + option.dp
  const newMonthly = (membership?.monthly_credits_remaining ?? 0) + option.dp

  // Upsert membership with new totals
  const { data: updated, error } = await supabase
    .from('memberships')
    .upsert({
      user_id: userId,
      total_credits: newTotal,
      monthly_credits_remaining: newMonthly,
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Add topup transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    type: 'one_time_grant',
    amount: option.dp,
    balance: newTotal,
    note: `充值 ${option.dp} 积分（${option.priceCny}元）`,
  })

  return NextResponse.json({
    success: true,
    addedDp: option.dp,
    totalCredits: newTotal,
    monthlyCreditsRemaining: newMonthly,
  })
})
