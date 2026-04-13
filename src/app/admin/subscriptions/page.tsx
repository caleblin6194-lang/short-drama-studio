'use client'

import { useState } from 'react'
import { useAdminStore } from '@/store/useAdminStore'
import Tabs from '@/components/shared/Tabs'
import DataTable from '@/components/shared/DataTable'
import Badge from '@/components/shared/Badge'
import Button from '@/components/shared/Button'
import PromoCodeForm from '@/components/admin/PromoCodeForm'
import { PLANS } from '@/lib/plans'
import type { Order, PromoCode } from '@/types'

const ORDER_STATUS: Record<string, { label: string; variant: 'green' | 'yellow' | 'red' | 'gray' }> = {
  completed: { label: '完成', variant: 'green' },
  pending: { label: '待处理', variant: 'yellow' },
  refunded: { label: '已退款', variant: 'red' },
  failed: { label: '失败', variant: 'gray' },
}

export default function AdminSubscriptionsPage() {
  const { orders, promoCodes, createPromoCode, togglePromoCode } = useAdminStore()
  const [tab, setTab] = useState('orders')
  const [showPromoForm, setShowPromoForm] = useState(false)

  const tabs = [
    { key: 'orders', label: '订单', count: orders.length },
    { key: 'promos', label: '优惠码', count: promoCodes.length },
    { key: 'plans', label: '套餐配置' },
  ]

  const orderColumns = [
    { key: 'userName', label: '用户' },
    { key: 'planTier', label: '套餐', render: (o: Order) => <Badge variant="purple">{o.planTier}</Badge> },
    { key: 'amount', label: '金额', render: (o: Order) => `¥${o.amount}`, sortable: true },
    { key: 'status', label: '状态', render: (o: Order) => { const s = ORDER_STATUS[o.status]; return <Badge variant={s?.variant}>{s?.label}</Badge> } },
    { key: 'promoCode', label: '优惠码', render: (o: Order) => o.promoCode || '-' },
    { key: 'createdAt', label: '日期', render: (o: Order) => new Date(o.createdAt).toLocaleDateString('zh-CN'), sortable: true },
  ]

  const promoColumns = [
    { key: 'code', label: '优惠码', render: (p: PromoCode) => <span className="font-mono text-[#6c5ce7]">{p.code}</span> },
    { key: 'discountValue', label: '折扣', render: (p: PromoCode) => p.discountType === 'percentage' ? `${p.discountValue}%` : `¥${p.discountValue}` },
    { key: 'usedCount', label: '使用/上限', render: (p: PromoCode) => `${p.usedCount}/${p.maxUses}` },
    { key: 'isActive', label: '状态', render: (p: PromoCode) => (
      <button onClick={() => togglePromoCode(p.id)} className="cursor-pointer">
        <Badge variant={p.isActive ? 'green' : 'gray'}>{p.isActive ? '启用' : '停用'}</Badge>
      </button>
    )},
    { key: 'validUntil', label: '有效期至' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">订阅管理</h2>

      <Tabs items={tabs} activeKey={tab} onChange={setTab} />

      {tab === 'orders' && (
        <div className="card p-5">
          <DataTable columns={orderColumns} data={orders} pageSize={10} />
        </div>
      )}

      {tab === 'promos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowPromoForm(true)}>+ 创建优惠码</Button>
          </div>
          <div className="card p-5">
            <DataTable columns={promoColumns} data={promoCodes} pageSize={10} />
          </div>
          <PromoCodeForm open={showPromoForm} onClose={() => setShowPromoForm(false)} onSubmit={createPromoCode} />
        </div>
      )}

      {tab === 'plans' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map(plan => (
            <div key={plan.tier} className="card p-5">
              <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
              <p className="text-2xl font-bold text-white">¥{plan.monthlyPrice}<span className="text-sm text-[#a0a0b8] font-normal">/月</span></p>
              <p className="text-sm text-[#a0a0b8] mt-2">{plan.monthlyCredits.toLocaleString()} 积分</p>
              <p className="text-xs text-[#a0a0b8] mt-1">最大项目数：{plan.maxProjects === -1 ? '无限' : plan.maxProjects}</p>
              <ul className="mt-3 space-y-1">
                {plan.features.map(f => <li key={f} className="text-xs text-[#a0a0b8]">· {f}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
