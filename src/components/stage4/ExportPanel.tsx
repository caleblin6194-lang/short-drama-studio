'use client'

import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import Button from '@/components/shared/Button'

export default function ExportPanel() {
  const { project } = useProjectStore()
  const [loading, setLoading] = useState<string | null>(null)

  const handleExport = async (format: string) => {
    if (!project?.masterCut?.renderedUrl) {
      alert('请先渲染成片再导出')
      return
    }
    setLoading(format)
    try {
      // Resolve absolute URL for server-side fetch
      let renderedUrl = project.masterCut.renderedUrl
      if (renderedUrl.startsWith('/')) {
        renderedUrl = 'https://verixa.online' + renderedUrl
      }

      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          format,
          renderedUrl,
        }),
      })
      const apiData = await res.json()
      if (apiData.url) {
        window.open(apiData.url, '_blank')
      } else {
        alert('导出失败：' + (apiData.error || '未知错误'))
      }
    } catch (e: any) {
      alert('导出请求失败：' + e.message)
    }
    setLoading(null)
  }

  return (
    <div className="card p-4">
      <h3 className="text-sm font-medium text-[#a0a0b8] mb-3">📤 导出</h3>
      <div className="space-y-2">
        <Button
          variant="secondary"
          className="w-full"
          loading={loading === 'vertical'}
          onClick={() => handleExport('vertical')}
        >
          竖版 9:16
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          loading={loading === 'horizontal'}
          onClick={() => handleExport('horizontal')}
        >
          横版 16:9
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          loading={loading === 'cover'}
          onClick={() => handleExport('cover')}
        >
          封面图
        </Button>
      </div>
    </div>
  )
}