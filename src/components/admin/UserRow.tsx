'use client'

import type { User } from '@/types'
import Badge from '@/components/shared/Badge'
import UserAvatar from '@/components/shared/UserAvatar'

interface UserRowProps {
  user: User
  onBan: () => void
  onUnban: () => void
  onAdjustCredits: () => void
  onView: () => void
}

export default function UserRow({ user, onBan, onUnban, onAdjustCredits, onView }: UserRowProps) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-[#2a2a3e]/50 last:border-0">
      <UserAvatar name={user.name} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white font-medium">{user.name}</span>
          {user.isBanned && <Badge variant="red">已封禁</Badge>}
          {user.role === 'admin' && <Badge variant="purple">管理员</Badge>}
        </div>
        <p className="text-xs text-[#a0a0b8]">{user.email}</p>
      </div>
      <span className="text-xs text-[#a0a0b8]">{new Date(user.createdAt).toLocaleDateString('zh-CN')}</span>
      <div className="flex gap-1">
        <button onClick={onView} className="px-2 py-1 text-xs text-[#a0a0b8] hover:text-white rounded hover:bg-[#1a1a2e] cursor-pointer">详情</button>
        <button onClick={onAdjustCredits} className="px-2 py-1 text-xs text-[#a0a0b8] hover:text-white rounded hover:bg-[#1a1a2e] cursor-pointer">调积分</button>
        {!user.isBanned ? (
          <button onClick={onBan} className="px-2 py-1 text-xs text-red-400 hover:text-red-300 rounded hover:bg-red-500/10 cursor-pointer">封禁</button>
        ) : (
          <button onClick={onUnban} className="px-2 py-1 text-xs text-emerald-400 hover:text-emerald-300 rounded hover:bg-emerald-500/10 cursor-pointer">解封</button>
        )}
      </div>
    </div>
  )
}
