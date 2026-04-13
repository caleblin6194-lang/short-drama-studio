'use client'

import { useState } from 'react'
import Modal from '@/components/shared/Modal'
import Button from '@/components/shared/Button'

interface RejectReasonModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}

export default function RejectReasonModal({ open, onClose, onConfirm }: RejectReasonModalProps) {
  const [reason, setReason] = useState('')

  const handleSubmit = () => {
    if (!reason.trim()) return
    onConfirm(reason.trim())
    setReason('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="驳回原因">
      <div className="space-y-4">
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="请输入驳回原因..." rows={3} className="w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#6c5ce7] resize-none" />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button variant="danger" onClick={handleSubmit} disabled={!reason.trim()}>驳回</Button>
        </div>
      </div>
    </Modal>
  )
}
