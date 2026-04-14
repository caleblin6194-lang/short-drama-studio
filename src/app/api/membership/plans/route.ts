import { NextRequest, NextResponse } from 'next/server'
import { PLANS } from '@/lib/plans'

// GET /api/membership/plans
export async function GET() {
  return NextResponse.json({
    plans: PLANS,
    topupOptions: [
      { id: 'topup_1000', dp: 1000, priceCny: 59 },
      { id: 'topup_5000', dp: 5000, priceCny: 249 },
      { id: 'topup_20000', dp: 20000, priceCny: 899 },
    ],
  })
}
