'use client'

import { useState } from 'react'
import Modal from '@/components/shared/Modal'
import Button from '@/components/shared/Button'

interface AdjustCreditsModalProps {
  open: boolean
  onClose: () => void
  userName: string
  onConfirm: (amount: number, note: string) => void
}

export default function AdjustCreditsModal({ open, onClose, userName, onConfirm }: AdjustCreditsModalProps) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const handleSubmit = () => {
    const num = parseInt(amount)
    if (isNaN(num) || num === 0 || !note.trim()) return
    onConfirm(num, note.trim())
    setAmount('')
    setNote('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={`调整积分 — ${userName}`}>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-[#a0a0b8] block mb-1">积分数量（正数=增加，负数=扣减）</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="如 500 或 -200" className="w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#6c5ce7]" />
        </div>
        <div>
          <label className="text-sm text-[#a0a0b8] block mb-1">备注</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="调整原因" className="w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#6c5ce7]" />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit} disabled={!amount || !note.trim()}>确认调整</Button>
        </div>
      </div>
    </Modal>
  )
}
