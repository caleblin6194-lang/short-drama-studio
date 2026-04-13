'use client'

import type { CreditBalance } from '@/types'

export default function CreditBar({ balance }: { balance: CreditBalance }) {
  const pct = balance.monthlyBudget > 0 ? (balance.used / balance.monthlyBudget) * 100 : 0

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[#a0a0b8]">积分余额</h3>
        <span className="text-2xl font-bold text-white">{balance.remaining.toLocaleString()}</span>
      </div>
      <div className="h-3 rounded-full bg-[#1a1a2e] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(pct, 100)}%`,
            backgroundColor: pct > 90 ? '#e74c3c' : pct > 70 ? '#fdcb6e' : '#6c5ce7',
          }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-[#a0a0b8]">
        <span>已用 {balance.used.toLocaleString()}</span>
        <span>本月额度 {balance.monthlyBudget.toLocaleString()}</span>
      </div>
    </div>
  )
}
