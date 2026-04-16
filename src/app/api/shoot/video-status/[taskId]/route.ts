import { NextRequest, NextResponse } from 'next/server'
import { getSeedVideoStatus } from '@/lib/api/seed-video'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params
    const result = await getSeedVideoStatus(taskId)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json(
      { status: 'failed', error: err?.message || 'Status route error' },
      { status: 500 },
    )
  }
}
