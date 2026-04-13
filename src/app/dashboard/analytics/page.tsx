'use client'

import { useCreditsStore } from '@/store/useCreditsStore'
import { useProjectListStore } from '@/store/useProjectListStore'
import UsageChart from '@/components/dashboard/UsageChart'
import StatCard from '@/components/shared/StatCard'
import DataTable from '@/components/shared/DataTable'
import type { Project } from '@/types'

export default function AnalyticsPage() {
  const { dailyUsage, transactions } = useCreditsStore()
  const projects = useProjectListStore(s => s.projects)

  const totalCreditsUsed = transactions.filter(t => t.type === 'consumption').reduce((s, t) => s + Math.abs(t.amount), 0)
  const avgPerProject = projects.length > 0 ? Math.round(totalCreditsUsed / projects.length) : 0

  const columns = [
    { key: 'title', label: '项目', render: (p: Project) => <span className="text-white">{p.title}</span> },
    { key: 'status', label: '状态' },
    { key: 'costSpent', label: '已消耗积分', sortable: true, render: (p: Project) => p.costSpent.toLocaleString() },
    { key: 'shots', label: '镜头数', render: (p: Project) => p.shots.length },
    { key: 'lastEnteredStage', label: '进度', render: (p: Project) => `${p.lastEnteredStage}/4` },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">用量分析</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🪙" label="总消耗积分" value={totalCreditsUsed} color="#6c5ce7" />
        <StatCard icon="📊" label="平均每项目" value={avgPerProject} color="#0984e3" />
        <StatCard icon="🎬" label="项目数" value={projects.length} color="#00b894" />
        <StatCard icon="📦" label="交易笔数" value={transactions.length} color="#fdcb6e" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UsageChart data={dailyUsage} title="30 日积分消耗趋势" field="creditsUsed" color="#6c5ce7" type="bar" />
        <UsageChart data={dailyUsage} title="30 日完成集数" field="episodesCompleted" color="#00b894" type="line" />
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-4">项目消耗明细</h3>
        <DataTable columns={columns} data={projects} pageSize={10} />
      </div>
    </div>
  )
}
