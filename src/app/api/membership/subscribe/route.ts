import { NextRequest, NextResponse } from 'next/server'
import { getSupabase, hasSupabaseConfig } from '@/lib/supabase'
import { getPlan } from '@/lib/plans'
import type { PlanTier } from '@/types'
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

// POST /api/membership/subscribe
export const POST = withAuth(async (req: NextRequest, supabase: any, userId: string) => {
  const body = await req.json()
  const { planTier } = body as { planTier: PlanTier }

  if (!planTier) {
    return NextResponse.json({ error: 'planTier required' }, { status: 400 })
  }

  const plan = getPlan(planTier)
  if (!plan) {
    return NextResponse.json({ error: 'Invalid plan tier' }, { status: 400 })
  }

  const now = new Date()
  const renewalDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const today = now.toISOString().split('T')[0]

  // Upsert membership
  const { data: membership, error } = await supabase
    .from('memberships')
    .upsert({
      user_id: userId,
      plan_tier: planTier,
      status: 'active',
      monthly_credits_remaining: plan.monthlyCredits,
      total_credits: plan.monthlyCredits,
      renewal_date: renewalDate.toISOString().split('T')[0],
      auto_renew: true,
      renewal_history: [{
        id: uuidv4(),
        date: today,
        amount: plan.monthlyPrice,
        planTier,
        method: 'subscribe',
      }],
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Add credit grant transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    type: 'subscription_grant',
    amount: plan.monthlyCredits,
    balance: plan.monthlyCredits,
    note: `${plan.name} 订阅赠送 ${plan.monthlyCredits} 积分`,
  })

  return NextResponse.json({
    success: true,
    membership: {
      userId: membership.user_id,
      planTier: membership.plan_tier,
      status: membership.status,
      monthlyCredits: plan.monthlyCredits,
      monthlyCreditsRemaining: membership.monthly_credits_remaining,
      totalCredits: membership.total_credits,
      renewalDate: membership.renewal_date,
    },
  })
})
