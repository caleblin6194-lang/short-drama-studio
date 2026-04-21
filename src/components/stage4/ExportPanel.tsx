'use client'

import { useState, useEffect, useRef } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import Button from '@/components/shared/Button'

const FORMATS = [
  { key: 'vertical', label: '竖版 9:16', ext: 'mp4' },
  { key: 'horizontal', label: '横版 16:9', ext: 'mp4' },
  { key: 'cover', label: '封面图', ext: 'jpg' },
]

export default function ExportPanel() {
  const { project } = useProjectStore()
  const [loading, setLoading] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Simulate progress: ramp to 90% over ~60s, hold until API responds
  const startProgress = () => {
    setProgress(0)
    let p = 0
    timerRef.current = setInterval(() => {
      p = Math.min(p + (90 - p) * 0.03, 90)
      setProgress(Math.round(p))
    }, 500)
  }

  const finishProgress = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setProgress(100)
    setTimeout(() => setProgress(0), 800)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const handleExport = async (format: string, ext: string) => {
    if (!project?.masterCut?.renderedUrl) {
      alert('请先渲染成片再导出')
      return
    }
    setLoading(format)
    startProgress()
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          format,
          renderedUrl: project.masterCut.renderedUrl,
        }),
      })
      const apiData = await res.json()
      finishProgress()

      if (!apiData.url) {
        alert('导出失败：' + (apiData.error || '未知错误'))
        return
      }

      // Fetch the file and trigger browser download
      const fileRes = await fetch(apiData.url)
      if (!fileRes.ok) throw new Error('文件下载失败')
      const blob = await fileRes.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `${project.title || 'export'}_${format}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
    } catch (e: any) {
      finishProgress()
      alert('导出失败：' + e.message)
    }
    setLoading(null)
  }

  return (
    <div className="card p-4">
      <h3 className="text-sm font-medium text-[#a0a0b8] mb-3">📤 导出</h3>

      {loading && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-[#a0a0b8] mb-1">
            <span>正在导出{FORMATS.find(f => f.key === loading)?.label}…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#2a2a3e] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#6c5ce7] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {FORMATS.map(({ key, label, ext }) => (
          <Button
            key={key}
            variant="secondary"
            className="w-full"
            loading={loading === key}
            disabled={!!loading && loading !== key}
            onClick={() => handleExport(key, ext)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  )
}
