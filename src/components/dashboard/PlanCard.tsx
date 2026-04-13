'use client'

import type { PlanConfig, PlanTier } from '@/types'
import Button from '@/components/shared/Button'

interface PlanCardProps {
  plan: PlanConfig
  currentTier: PlanTier
  onSelect: (tier: PlanTier) => void
  loading?: boolean
}

export default function PlanCard({ plan, currentTier, onSelect, loading }: PlanCardProps) {
  const isCurrent = plan.tier === currentTier
  const isUpgrade = !isCurrent && tierOrder(plan.tier) > tierOrder(currentTier)
  const isDowngrade = !isCurrent && tierOrder(plan.tier) < tierOrder(currentTier)

  return (
    <div className={`card p-5 flex flex-col ${isCurrent ? 'border-[#6c5ce7] ring-1 ring-[#6c5ce7]/30' : ''}`}>
      {isCurrent && <span className="text-xs text-[#6c5ce7] font-medium mb-2">当前套餐</span>}
      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
      <div className="mt-2 mb-4">
        <span className="text-3xl font-bold text-white">¥{plan.monthlyPrice}</span>
        {!plan.isOneTime && <span className="text-sm text-[#a0a0b8]">/月</span>}
      </div>
      <p className="text-sm text-[#a0a0b8] mb-4">
        {plan.monthlyCredits.toLocaleString()} 积分{plan.isOneTime ? '（一次性）' : '/月'}
      </p>
      <ul className="flex-1 space-y-2 mb-5">
        {plan.features.map(f => (
          <li key={f} className="text-xs text-[#a0a0b8] flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">✓</span>{f}
          </li>
        ))}
      </ul>
      {isCurrent ? (
        <Button variant="secondary" disabled className="w-full">当前套餐</Button>
      ) : (
        <Button variant={isUpgrade ? 'primary' : 'secondary'} onClick={() => onSelect(plan.tier)} loading={loading} className="w-full">
          {isUpgrade ? '升级' : isDowngrade ? '降级' : '选择'}
        </Button>
      )}
    </div>
  )
}

function tierOrder(tier: PlanTier): number {
  return { free: 0, creator: 1, studio: 2, flagship: 3 }[tier] ?? 0
}
