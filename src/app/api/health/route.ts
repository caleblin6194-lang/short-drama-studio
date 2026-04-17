import { NextResponse } from 'next/server'
import { hasSupabaseConfig, getSupabase } from '@/lib/supabase'

export async function GET() {
  const checks: Record<string, 'ok' | 'error' | 'unconfigured'> = {}

  // Supabase connectivity check
  if (!hasSupabaseConfig()) {
    checks.database = 'unconfigured'
  } else {
    try {
      const supabase = getSupabase()
      const { error } = await supabase.from('users').select('id').limit(1)
      checks.database = error ? 'error' : 'ok'
    } catch {
      checks.database = 'error'
    }
  }

  // API key presence checks (no value exposed)
  checks.doubao_image = process.env.DOUBAN_SEED_API_KEY ? 'ok' : 'unconfigured'
  checks.openai = process.env.OPENAI_API_KEY ? 'ok' : 'unconfigured'
  checks.real_pipeline = process.env.NEXT_PUBLIC_ENABLE_REAL_PIPELINE === '1' ? 'ok' : 'unconfigured'

  const allOk = Object.values(checks).every(v => v === 'ok' || v === 'unconfigured')

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      version: process.env.npm_package_version ?? '2.0.0',
      timestamp: new Date().toISOString(),
      checks,
      mock_mode: process.env.NEXT_PUBLIC_ENABLE_REAL_PIPELINE !== '1',
    },
    { status: allOk ? 200 : 503 }
  )
}
