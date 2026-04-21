import * as fs from 'fs'
import * as path from 'path'

export const RENDER_DIR = '/var/www/shotforge/renders'

const TMP_RENDER_DIR = process.env.TMPDIR || '/tmp'
const SAFE_JOB_RE = /^(?:render-|export-)?[A-Za-z0-9_-]+$/
const SAFE_FILE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

function isSafeJob(job: string): boolean {
  return SAFE_JOB_RE.test(job) && !job.includes('/') && !job.includes('\\') && !job.includes('..')
}

function isSafeFile(file: string): boolean {
  return SAFE_FILE_RE.test(file) && path.basename(file) === file && !file.includes('..')
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function candidateJobDirs(job: string): string[] {
  const dirs = [job]
  if (!job.startsWith('render-') && !job.startsWith('export-')) {
    dirs.push(`render-${job}`)
  }
  return unique(dirs)
}

function resolveFromBase(baseDir: string, jobDir: string, fileName: string): string | null {
  const resolvedBase = path.resolve(baseDir)
  const jobRoot = path.resolve(resolvedBase, jobDir)
  const filePath = path.resolve(jobRoot, fileName)

  if (jobRoot !== resolvedBase && !jobRoot.startsWith(`${resolvedBase}${path.sep}`)) {
    return null
  }

  if (!filePath.startsWith(`${jobRoot}${path.sep}`)) {
    return null
  }

  return fs.existsSync(filePath) ? filePath : null
}

export function resolveRenderAssetPath(
  job: string,
  file: string,
  options?: { allowTmp?: boolean }
): string | null {
  if (!isSafeJob(job) || !isSafeFile(file)) {
    return null
  }

  const baseDirs = options?.allowTmp ? [RENDER_DIR, TMP_RENDER_DIR] : [RENDER_DIR]

  for (const baseDir of baseDirs) {
    for (const jobDir of candidateJobDirs(job)) {
      const resolved = resolveFromBase(baseDir, jobDir, file)
      if (resolved) return resolved
    }
  }

  return null
}

export function resolveRenderedUrlToPath(
  renderedUrl: string,
  options?: { allowTmp?: boolean }
): string | null {
  if (renderedUrl.includes('/api/render/serve')) {
    const qs = renderedUrl.includes('?') ? renderedUrl.split('?')[1] : ''
    const params = new URLSearchParams(qs)
    const file = params.get('file')
    const job = params.get('job')
    if (!file || !job) return null
    return resolveRenderAssetPath(job, file, options)
  }

  const legacyMatch = renderedUrl.match(/\/renders\/((?:render-|export-)?[A-Za-z0-9_-]+)\/([A-Za-z0-9][A-Za-z0-9._-]*)$/)
  if (!legacyMatch) {
    return null
  }

  return resolveRenderAssetPath(legacyMatch[1], legacyMatch[2], { allowTmp: false })
}

export function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()

  if (['.mp4'].includes(ext)) return 'video/mp4'
  if (['.mov'].includes(ext)) return 'video/quicktime'
  if (['.webm'].includes(ext)) return 'video/webm'
  if (['.mp3'].includes(ext)) return 'audio/mpeg'
  if (['.wav'].includes(ext)) return 'audio/wav'
  if (['.ogg'].includes(ext)) return 'audio/ogg'
  if (['.m4a'].includes(ext)) return 'audio/mp4'
  if (['.jpg', '.jpeg'].includes(ext)) return 'image/jpeg'
  if (['.png'].includes(ext)) return 'image/png'
  if (['.webp'].includes(ext)) return 'image/webp'

  return 'application/octet-stream'
}
