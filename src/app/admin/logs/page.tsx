'use client'

import { useAdminStore } from '@/store/useAdminStore'
import DataTable from '@/components/shared/DataTable'
import Badge from '@/components/shared/Badge'
import type { AuditLogEntry } from '@/types'

const ACTION_LABELS: Record<string, { label: string; variant: 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'gray' }> = {
  ban_user: { label: '封禁用户', variant: 'red' },
  unban_user: { label: '解封用户', variant: 'green' },
  adjust_credits: { label: '调整积分', variant: 'blue' },
  update_plan_config: { label: '更新套餐', variant: 'purple' },
  create_promo: { label: '创建优惠码', variant: 'purple' },
  toggle_feature: { label: '切换功能', variant: 'yellow' },
  review_approve: { label: '审核通过', variant: 'green' },
  review_reject: { label: '审核驳回', variant: 'red' },
  update_model_route: { label: '更新模型', variant: 'blue' },
}

export default function AdminLogsPage() {
  const { auditLog } = useAdminStore()

  const columns = [
    { key: 'createdAt', label: '时间', sortable: true, render: (e: AuditLogEntry) => new Date(e.createdAt).toLocaleString('zh-CN') },
    { key: 'adminName', label: '操作人' },
    { key: 'action', label: '操作', render: (e: AuditLogEntry) => {
      const a = ACTION_LABELS[e.action] || { label: e.action, variant: 'gray' as const }
      return <Badge variant={a.variant}>{a.label}</Badge>
    }},
    { key: 'details', label: '详情', render: (e: AuditLogEntry) => <span className="text-[#a0a0b8] text-xs">{e.details}</span> },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">操作日志</h2>
      <div className="card p-5">
        <DataTable columns={columns} data={auditLog} pageSize={15} />
      </div>
    </div>
  )
}
