'use client'

import { useCreditsStore } from '@/store/useCreditsStore'
import { useProjectListStore } from '@/store/useProjectListStore'
import StatCard from '@/components/shared/StatCard'
import CreditBar from '@/components/dashboard/CreditBar'
import TransactionRow from '@/components/dashboard/TransactionRow'
import UsageChart from '@/components/dashboard/UsageChart'

export default function DashboardOverviewPage() {
  const { balance, transactions, dailyUsage } = useCreditsStore()
  const projects = useProjectListStore(s => s.projects)

  const publishedCount = projects.filter(p => p.status === 'published').length

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">仪表盘</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🪙" label="剩余积分" value={balance.remaining} color="#6c5ce7" trend={{ value: -12, label: '较上周' }} />
        <StatCard icon="📊" label="本月已用" value={balance.used} color="#0984e3" />
        <StatCard icon="🎬" label="项目总数" value={projects.length} color="#00b894" />
        <StatCard icon="✅" label="已发布" value={publishedCount} color="#fdcb6e" />
      </div>

      {/* Credit bar */}
      <CreditBar balance={balance} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UsageChart data={dailyUsage} title="7 日积分消耗" field="creditsUsed" color="#6c5ce7" type="bar" />
        <UsageChart data={dailyUsage} title="项目创建趋势" field="projectsCreated" color="#00b894" type="line" />
      </div>

      {/* Recent transactions */}
      <div className="card p-5">
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-4">最近交易</h3>
        {transactions.slice(0, 8).map(tx => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </div>
    </div>
  )
}
