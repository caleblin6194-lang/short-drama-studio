'use client'

import { useState } from 'react'
import Button from '@/components/shared/Button'

interface OneLineEditProps {
  onSubmit: (instruction: string) => void
  loading?: boolean
}

export default function OneLineEdit({ onSubmit, loading }: OneLineEditProps) {
  const [text, setText] = useState('')

  const handleSubmit = () => {
    if (!text.trim()) return
    onSubmit(text.trim())
    setText('')
  }

  return (
    <div className="flex gap-2">
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="一句话改镜：让角色转身..."
        className="flex-1 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#a0a0b8]/50 focus:outline-none focus:border-[#6c5ce7]"
      />
      <Button size="sm" variant="secondary" onClick={handleSubmit} loading={loading} disabled={!text.trim()}>
        重拍
      </Button>
    </div>
  )
}
