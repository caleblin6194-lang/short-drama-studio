'use client'

import { useState } from 'react'
import { useAdminStore } from '@/store/useAdminStore'
import ReviewCard from '@/components/admin/ReviewCard'
import RejectReasonModal from '@/components/admin/RejectReasonModal'
import Tabs from '@/components/shared/Tabs'

export default function AdminReviewPage() {
  const { reviewQueue, reviewApprove, reviewReject } = useAdminStore()
  const [filter, setFilter] = useState('pending')
  const [rejectId, setRejectId] = useState<string | null>(null)

  const filtered = filter === 'all' ? reviewQueue : reviewQueue.filter(r => r.status === filter)
  const pendingCount = reviewQueue.filter(r => r.status === 'pending').length

  const tabs = [
    { key: 'pending', label: '待审核', count: pendingCount },
    { key: 'all', label: '全部', count: reviewQueue.length },
    { key: 'rejected', label: '已驳回', count: reviewQueue.filter(r => r.status === 'rejected').length },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">内容审核</h2>

      <Tabs items={tabs} activeKey={filter} onChange={setFilter} />

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[#a0a0b8]">暂无审核内容</div>
        ) : (
          filtered.map(item => (
            <ReviewCard
              key={item.id}
              item={item}
              onApprove={() => reviewApprove(item.id)}
              onReject={() => setRejectId(item.id)}
            />
          ))
        )}
      </div>

      <RejectReasonModal
        open={!!rejectId}
        onClose={() => setRejectId(null)}
        onConfirm={(reason) => { if (rejectId) reviewReject(rejectId, reason); setRejectId(null) }}
      />
    </div>
  )
}
