'use client'

import Button from '@/components/shared/Button'

export default function ExportPanel() {
  const handleExport = (format: string) => {
    alert(`导出 ${format} 版本（mock）`)
  }

  return (
    <div className="card p-4">
      <h3 className="text-sm font-medium text-[#a0a0b8] mb-3">📤 导出</h3>
      <div className="space-y-2">
        <Button variant="secondary" className="w-full" onClick={() => handleExport('竖版 9:16')}>
          竖版 9:16
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => handleExport('横版 16:9')}>
          横版 16:9
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => handleExport('封面图')}>
          封面图
        </Button>
      </div>
    </div>
  )
}
