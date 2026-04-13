'use client'

import type { ReviewItem } from '@/types'
import Badge from '@/components/shared/Badge'
import Button from '@/components/shared/Button'

const STATUS_MAP: Record<string, { label: string; variant: 'yellow' | 'green' | 'red' | 'purple' }> = {
  pending: { label: '待审核', variant: 'yellow' },
  approved: { label: '已通过', variant: 'green' },
  rejected: { label: '已驳回', variant: 'red' },
  flagged: { label: '已标记', variant: 'purple' },
}

interface ReviewCardProps {
  item: ReviewItem
  onApprove: () => void
  onReject: () => void
}

export default function ReviewCard({ item, onApprove, onReject }: ReviewCardProps) {
  const s = STATUS_MAP[item.status] || STATUS_MAP.pending

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={s.variant}>{s.label}</Badge>
            <Badge variant={item.type === 'video' ? 'blue' : 'gray'}>{item.type === 'video' ? '视频' : '项目'}</Badge>
          </div>
          <h4 className="text-white font-medium">{item.projectTitle}</h4>
          <p className="text-xs text-[#a0a0b8] mt-1">
            {item.userName} · {new Date(item.submittedAt).toLocaleDateString('zh-CN')}
          </p>
          {item.reason && <p className="text-xs text-red-400 mt-2">原因：{item.reason}</p>}
          {item.reviewedBy && <p className="text-xs text-[#a0a0b8] mt-1">审核人：{item.reviewedBy}</p>}
        </div>
        {item.status === 'pending' && (
          <div className="flex gap-2 ml-4">
            <Button size="sm" onClick={onApprove}>通过</Button>
            <Button size="sm" variant="danger" onClick={onReject}>驳回</Button>
          </div>
        )}
      </div>
    </div>
  )
}
