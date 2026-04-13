'use client'

import type { CreditTransaction } from '@/types'

const TYPE_MAP: Record<string, { label: string; color: string }> = {
  subscription_grant: { label: '套餐充值', color: 'text-emerald-400' },
  one_time_grant: { label: '赠送', color: 'text-blue-400' },
  admin_adjust: { label: '管理调整', color: 'text-purple-400' },
  consumption: { label: '消耗', color: 'text-red-400' },
  refund: { label: '退还', color: 'text-amber-400' },
}

export default function TransactionRow({ tx }: { tx: CreditTransaction }) {
  const t = TYPE_MAP[tx.type] || { label: tx.type, color: 'text-gray-400' }
  const isPositive = tx.amount > 0

  return (
    <div className="flex items-center justify-between py-3 border-b border-[#2a2a3e]/50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${t.color}`}>{t.label}</span>
          {tx.operation && <span className="text-xs text-[#a0a0b8]">{tx.operation}</span>}
        </div>
        {tx.projectTitle && <p className="text-xs text-[#a0a0b8] mt-0.5 truncate">{tx.projectTitle}</p>}
        {tx.note && <p className="text-xs text-[#a0a0b8] mt-0.5">{tx.note}</p>}
      </div>
      <div className="text-right ml-4">
        <p className={`text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{tx.amount.toLocaleString()}
        </p>
        <p className="text-xs text-[#a0a0b8]">{new Date(tx.createdAt).toLocaleDateString('zh-CN')}</p>
      </div>
    </div>
  )
}
