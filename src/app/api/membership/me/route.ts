import { NextRequest, NextResponse } from 'next/server'
import { getSupabase, hasSupabaseConfig } from '@/lib/supabase'
import { PLANS, getPlan } from '@/lib/plans'
import type { PlanTier } from '@/types'

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

// GET /api/membership/me
export const GET = withAuth(async (_req: NextRequest, supabase: any, userId: string) => {
  const { data: membership, error } = await supabase
    .from('memberships')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If no membership record, create default free plan
  if (!membership) {
    const freePlan = getPlan('free')
    return NextResponse.json({
      membership: {
        userId,
        planTier: 'free' as PlanTier,
        status: 'active',
        monthlyCredits: freePlan.monthlyCredits,
        monthlyCreditsRemaining: freePlan.monthlyCredits,
        totalCredits: freePlan.monthlyCredits,
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        autoRenew: false,
        renewalHistory: [],
      },
    })
  }

  const plan = getPlan(membership.plan_tier as PlanTier)
  return NextResponse.json({
    membership: {
      userId: membership.user_id,
      planTier: membership.plan_tier,
      status: membership.status,
      monthlyCredits: plan.monthlyCredits,
      monthlyCreditsRemaining: membership.monthly_credits_remaining ?? plan.monthlyCredits,
      totalCredits: membership.total_credits ?? plan.monthlyCredits,
      renewalDate: membership.renewal_date,
      autoRenew: membership.auto_renew ?? false,
      renewalHistory: membership.renewal_history ?? [],
    },
  })
})
