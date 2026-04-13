'use client'

import { useParams } from 'next/navigation'
import { useAdminStore } from '@/store/useAdminStore'
import Badge from '@/components/shared/Badge'
import UserAvatar from '@/components/shared/UserAvatar'
import Button from '@/components/shared/Button'
import StatCard from '@/components/shared/StatCard'

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { users, banUser, unbanUser } = useAdminStore()
  const user = users.find(u => u.id === id)

  if (!user) {
    return <div className="text-[#a0a0b8] py-16 text-center">用户不存在</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">用户详情</h2>

      {/* User card */}
      <div className="card p-6 flex items-start gap-6">
        <UserAvatar name={user.name} size={64} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white">{user.name}</h3>
            {user.isBanned && <Badge variant="red">已封禁</Badge>}
            {user.role === 'admin' && <Badge variant="purple">管理员</Badge>}
          </div>
          <p className="text-sm text-[#a0a0b8]">{user.email}</p>
          <p className="text-xs text-[#a0a0b8] mt-2">
            注册：{new Date(user.createdAt).toLocaleDateString('zh-CN')} ·
            最后登录：{new Date(user.lastLoginAt).toLocaleDateString('zh-CN')}
          </p>
          {user.banReason && <p className="text-xs text-red-400 mt-2">封禁原因：{user.banReason}</p>}
        </div>
        <div>
          {user.isBanned ? (
            <Button variant="secondary" onClick={() => unbanUser(user.id)}>解除封禁</Button>
          ) : (
            <Button variant="danger" onClick={() => banUser(user.id, '管理员手动封禁')}>封禁</Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🪙" label="积分余额" value="2,580" color="#6c5ce7" />
        <StatCard icon="🎬" label="项目数" value="3" color="#00b894" />
        <StatCard icon="💰" label="累计消费" value="¥316" color="#0984e3" />
        <StatCard icon="📅" label="已使用天数" value={Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000)} color="#fdcb6e" />
      </div>
    </div>
  )
}
