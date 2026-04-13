'use client'

import { useState } from 'react'
import { useCreditsStore } from '@/store/useCreditsStore'
import CreditBar from '@/components/dashboard/CreditBar'
import TransactionRow from '@/components/dashboard/TransactionRow'
import Tabs from '@/components/shared/Tabs'

export default function CreditsPage() {
  const { balance, transactions } = useCreditsStore()
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all'
    ? transactions
    : filter === 'consumption'
      ? transactions.filter(t => t.type === 'consumption')
      : transactions.filter(t => t.type !== 'consumption')

  const tabs = [
    { key: 'all', label: '全部', count: transactions.length },
    { key: 'consumption', label: '消耗', count: transactions.filter(t => t.type === 'consumption').length },
    { key: 'income', label: '充值/赠送', count: transactions.filter(t => t.type !== 'consumption').length },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">积分明细</h2>

      <CreditBar balance={balance} />

      <div className="card p-5">
        <div className="mb-4">
          <Tabs items={tabs} activeKey={filter} onChange={setFilter} />
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-[#a0a0b8] text-sm">暂无记录</p>
          ) : (
            filtered.map(tx => <TransactionRow key={tx.id} tx={tx} />)
          )}
        </div>
      </div>
    </div>
  )
}
