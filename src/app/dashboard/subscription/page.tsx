'use client'

import { useSubscriptionStore } from '@/store/useSubscriptionStore'
import PlanCard from '@/components/dashboard/PlanCard'
import DataTable from '@/components/shared/DataTable'
import Badge from '@/components/shared/Badge'
import Button from '@/components/shared/Button'
import type { PlanTier, RenewalRecord } from '@/types'

export default function SubscriptionPage() {
  const { subscription, plans, isProcessing, upgradePlan, downgradePlan, toggleAutoRenew, cancelSubscription } = useSubscriptionStore()

  const handleSelect = (tier: PlanTier) => {
    if (!subscription) return
    const currentOrder = tierOrder(subscription.planTier)
    const newOrder = tierOrder(tier)
    if (newOrder > currentOrder) upgradePlan(tier)
    else downgradePlan(tier)
  }

  const columns = [
    { key: 'date', label: '日期', sortable: true },
    { key: 'planTier', label: '套餐', render: (r: RenewalRecord) => <Badge variant="purple">{r.planTier}</Badge> },
    { key: 'amount', label: '金额', render: (r: RenewalRecord) => `¥${r.amount}` },
    { key: 'method', label: '方式', render: (r: RenewalRecord) => r.method === 'auto' ? '自动续费' : '手动' },
  ]

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-white">订阅管理</h2>

      {/* Current plan info */}
      {subscription && (
        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-[#a0a0b8]">当前套餐</p>
            <p className="text-lg font-bold text-white">{plans.find(p => p.tier === subscription.planTier)?.name}</p>
            <p className="text-xs text-[#a0a0b8] mt-1">
              到期：{new Date(subscription.expiresAt).toLocaleDateString('zh-CN')} ·
              自动续费：{subscription.autoRenew ? '开启' : '关闭'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={toggleAutoRenew}>
              {subscription.autoRenew ? '关闭自动续费' : '开启自动续费'}
            </Button>
            {subscription.status === 'active' && (
              <Button size="sm" variant="danger" onClick={cancelSubscription} loading={isProcessing}>
                取消订阅
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Plan comparison */}
      <div>
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-4">套餐对比</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map(plan => (
            <PlanCard
              key={plan.tier}
              plan={plan}
              currentTier={subscription?.planTier || 'free'}
              onSelect={handleSelect}
              loading={isProcessing}
            />
          ))}
        </div>
      </div>

      {/* Renewal history */}
      {subscription && subscription.renewalHistory.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-medium text-[#a0a0b8] mb-4">续费记录</h3>
          <DataTable columns={columns} data={subscription.renewalHistory} pageSize={5} />
        </div>
      )}
    </div>
  )
}

function tierOrder(tier: PlanTier): number {
  return { free: 0, creator: 1, studio: 2, flagship: 3 }[tier] ?? 0
}
