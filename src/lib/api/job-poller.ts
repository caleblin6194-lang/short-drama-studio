/**
 * Job status poller for async AI generation tasks
 * Handles video/image generation that return taskIds requiring polling
 */

import { getSeedVideoStatus } from './seed-video'
import { generateImageWithDoubao, DoubaoImageResponse } from './doubao-image'

export type JobStatus = 'pending' | 'processing' | 'done' | 'failed'

export interface PollerOptions {
  intervalMs?: number
  maxAttempts?: number
  onStatusChange?: (status: JobStatus, result?: any) => void
}

const DEFAULT_INTERVAL = 3000 // 3 seconds
const DEFAULT_MAX_ATTEMPTS = 60 // ~3 minutes max

/**
 * Poll a Seed video task until completion
 */
export async function pollVideoJob(
  taskId: string,
  options: PollerOptions = {},
): Promise<{ videoUrl: string } | null> {
  const { intervalMs = DEFAULT_INTERVAL, maxAttempts = DEFAULT_MAX_ATTEMPTS, onStatusChange } = options

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await getSeedVideoStatus(taskId)

    if (result.status === 'done' && result.videoUrl) {
      onStatusChange?.('done', result)
      return { videoUrl: result.videoUrl }
    }

    if (result.status === 'failed') {
      onStatusChange?.('failed', result)
      return null
    }

    onStatusChange?.('processing')
    await sleep(intervalMs)
  }

  onStatusChange?.('failed', { error: 'Timeout waiting for video job' })
  return null
}

/**
 * Submit a Doubao image generation job and poll until done
 */
export async function generateImageWithPolling(
  prompt: string,
  options: {
    size?: '1K' | '2K' | '4K'
    seed?: number
    intervalMs?: number
    maxAttempts?: number
    onStatusChange?: (status: JobStatus, result?: DoubaoImageResponse) => void
  } = {},
): Promise<{ imageUrl: string } | null> {
  const { intervalMs = DEFAULT_INTERVAL, maxAttempts = DEFAULT_MAX_ATTEMPTS, onStatusChange, ...reqOptions } = options

  const initial = await generateImageWithDoubao({ prompt, ...reqOptions })

  if (initial.status === 'done' && initial.imageUrl) {
    onStatusChange?.('done', initial)
    return { imageUrl: initial.imageUrl }
  }

  if (initial.status === 'failed') {
    onStatusChange?.('failed', initial)
    return null
  }

  if (!initial.taskId) {
    onStatusChange?.('failed', { status: 'failed', error: 'No taskId returned' } as DoubaoImageResponse)
    return null
  }

  // Poll for completion
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(intervalMs)
    const status = await getSeedVideoStatus(initial.taskId)
    // Doubao image uses same task polling endpoint
    // For seed images, we poll the same endpoint

    if (status.status === 'done' && status.videoUrl) {
      onStatusChange?.('done')
      return { imageUrl: status.videoUrl }
    }
    if (status.status === 'failed') {
      onStatusChange?.('failed', { status: 'failed', error: status.error || 'Unknown error' } as DoubaoImageResponse)
      return null
    }
    onStatusChange?.('processing')
  }

  onStatusChange?.('failed', { status: 'failed', error: 'Timeout' } as DoubaoImageResponse)
  return null
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
