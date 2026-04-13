'use client'

import { useState, useCallback } from 'react'

interface UploadResult {
  url: string
  filename: string
  originalName: string
  size: number
  type: string
}

export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (file: File): Promise<UploadResult | null> => {
    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '上传失败')
      }

      const data = await res.json()
      return data as UploadResult
    } catch (err: any) {
      setError(err.message || '上传失败')
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  return { upload, uploading, error }
}
