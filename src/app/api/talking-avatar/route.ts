import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// Mock talking avatar generator for demo/MVP
// In production, replace with D-ID API (did.com) or HeyGen API (heygen.com)

interface TalkingAvatarRequest {
  projectId: string
  characterId: string
  characterName: string
  characterImageUrl?: string
  dialogue: string
  userId: string
}

// Store pending jobs in memory (use Redis/DB in production)
const pendingJobs = new Map<string, { status: string; videoUrl?: string; createdAt: number }>()

export async function POST(request: NextRequest) {
  try {
    const body: TalkingAvatarRequest = await request.json()
    const { projectId, characterId, characterName, characterImageUrl, dialogue, userId } = body

    if (!projectId || !characterId || !dialogue || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!dialogue.trim()) {
      return NextResponse.json({ error: 'Dialogue cannot be empty' }, { status: 400 })
    }

    const jobId = uuidv4()

    // For MVP/demo: store job and return immediately with a mock response
    // In production with D-ID: call https://api.d-id.com/talks with the source image and script
    // In production with HeyGen: call HeyGen API to create talking avatar video

    pendingJobs.set(jobId, { status: 'generating', createdAt: Date.now() })

    // Simulate async generation (in production this would be a real async job)
    setTimeout(() => {
      pendingJobs.set(jobId, {
        status: 'done',
        videoUrl: `https://replicate.com/api/examples/talking-avatar-${jobId.slice(0, 8)}.mp4`,
        createdAt: Date.now(),
      })
    }, 5000)

    return NextResponse.json({
      jobId,
      status: 'generating',
      message: 'Talking avatar video is being generated',
      estimatedTime: 5, // seconds
    })
  } catch (error: any) {
    console.error('Talking avatar error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 })
  }

  const job = pendingJobs.get(jobId)
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  // Clean up old jobs (older than 1 hour)
  const oneHour = 60 * 60 * 1000
  for (const [id, j] of pendingJobs.entries()) {
    if (Date.now() - j.createdAt > oneHour) {
      pendingJobs.delete(id)
    }
  }

  return NextResponse.json({
    jobId,
    status: job.status,
    videoUrl: job.videoUrl,
  })
}
