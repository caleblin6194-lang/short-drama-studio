'use client'

import { useAdminStore } from '@/store/useAdminStore'
import StatCard from '@/components/shared/StatCard'
import UsageChart from '@/components/dashboard/UsageChart'

export default function AdminOverviewPage() {
  const { platformStats, platformDailyStats } = useAdminStore()
  const s = platformStats

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">数据看板</h2>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon="👥" label="DAU" value={s.dau} color="#0984e3" trend={{ value: 5.2, label: '较昨日' }} />
        <StatCard icon="📊" label="MAU" value={s.mau} color="#6c5ce7" trend={{ value: 12, label: '较上月' }} />
        <StatCard icon="💰" label="本月营收" value={`¥${s.monthlyRevenue.toLocaleString()}`} color="#00b894" trend={{ value: 18, label: '较上月' }} />
        <StatCard icon="🪙" label="总积分消耗" value={s.totalCreditsConsumed.toLocaleString()} color="#fdcb6e" />
        <StatCard icon="🖥️" label="模型成本" value={`¥${s.totalModelCost.toLocaleString()}`} color="#e74c3c" />
        <StatCard icon="🔄" label="付费转化率" value={`${s.conversionRate}%`} color="#e84393" trend={{ value: 2.1, label: '较上月' }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UsageChart data={platformDailyStats} title="30 日积分消耗" field="creditsUsed" color="#6c5ce7" type="bar" />
        <UsageChart data={platformDailyStats} title="30 日项目创建" field="projectsCreated" color="#00b894" type="line" />
      </div>
    </div>
  )
}
