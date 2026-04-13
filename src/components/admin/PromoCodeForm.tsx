'use client'

import { useState } from 'react'
import Modal from '@/components/shared/Modal'
import Button from '@/components/shared/Button'
import type { PlanTier } from '@/types'

interface PromoCodeFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { code: string; discountType: 'percentage' | 'fixed'; discountValue: number; applicablePlans: PlanTier[]; maxUses: number; validFrom: string; validUntil: string; isActive: boolean }) => void
}

export default function PromoCodeForm({ open, onClose, onSubmit }: PromoCodeFormProps) {
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [maxUses, setMaxUses] = useState('100')

  const handleSubmit = () => {
    if (!code.trim() || !discountValue) return
    onSubmit({
      code: code.toUpperCase(),
      discountType,
      discountValue: parseInt(discountValue),
      applicablePlans: ['creator', 'studio', 'flagship'],
      maxUses: parseInt(maxUses),
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '2026-12-31',
      isActive: true,
    })
    setCode('')
    setDiscountValue('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="创建优惠码">
      <div className="space-y-4">
        <div>
          <label className="text-sm text-[#a0a0b8] block mb-1">优惠码</label>
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="如 VIP20" className="w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm uppercase focus:outline-none focus:border-[#6c5ce7]" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-[#a0a0b8] block mb-1">折扣类型</label>
            <select value={discountType} onChange={e => setDiscountType(e.target.value as any)} className="w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#6c5ce7]">
              <option value="percentage">百分比</option>
              <option value="fixed">固定金额</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-[#a0a0b8] block mb-1">折扣值</label>
            <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder={discountType === 'percentage' ? '%' : '¥'} className="w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#6c5ce7]" />
          </div>
        </div>
        <div>
          <label className="text-sm text-[#a0a0b8] block mb-1">最大使用次数</label>
          <input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} className="w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#6c5ce7]" />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit} disabled={!code.trim() || !discountValue}>创建</Button>
        </div>
      </div>
    </Modal>
  )
}
