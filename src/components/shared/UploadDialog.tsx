'use client'

import { useState, useCallback, useRef } from 'react'
import Modal from './Modal'
import Button from './Button'

interface UploadDialogProps {
  open: boolean
  onClose: () => void
  onUpload: (file: File) => Promise<void>
  assetType: 'scene' | 'character' | 'prop'
  accept?: string
}

export default function UploadDialog({
  open,
  onClose,
  onUpload,
  assetType,
  accept = 'image/*',
}: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('请上传图片文件')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('文件大小不能超过 10MB')
      return
    }
    setFile(f)
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleSubmit = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      await onUpload(file)
      onClose()
      setFile(null)
      setPreview(null)
    } catch (err: any) {
      setError(err.message || '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (!uploading) {
      setFile(null)
      setPreview(null)
      setError(null)
      onClose()
    }
  }

  const labels = {
    scene: '场景',
    character: '角色',
    prop: '道具',
  }

  return (
    <Modal open={open} onClose={handleClose} title={`上传${labels[assetType]}`}>
      <div className="space-y-4">
        {/* 拖拽区域 */}
        <div
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${dragOver ? 'border-[#6c5ce7] bg-[#6c5ce7]/10' : 'border-[#2a2a3e] hover:border-[#3a3a4e]'}
          `}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
          ) : (
            <>
              <div className="text-4xl mb-2 opacity-50">📁</div>
              <p className="text-[#a0a0b8]">拖拽图片到这里，或点击选择</p>
              <p className="text-xs text-[#666] mt-1">支持 JPG、PNG、WebP，最大 10MB</p>
            </>
          )}
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {file && (
          <div className="flex items-center gap-3 text-sm text-[#a0a0b8]">
            <span className="truncate flex-1">{file.name}</span>
            <span>{(file.size / 1024).toFixed(1)} KB</span>
            <button
              onClick={() => { setFile(null); setPreview(null) }}
              className="text-red-400 hover:text-red-300 cursor-pointer"
            >
              移除
            </button>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="ghost" onClick={handleClose} disabled={uploading}>取消</Button>
          <Button onClick={handleSubmit} loading={uploading} disabled={!file}>
            上传
          </Button>
        </div>
      </div>
    </Modal>
  )
}
