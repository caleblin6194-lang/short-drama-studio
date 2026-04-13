'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminStore } from '@/store/useAdminStore'
import SearchInput from '@/components/shared/SearchInput'
import UserRow from '@/components/admin/UserRow'
import AdjustCreditsModal from '@/components/admin/AdjustCreditsModal'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

export default function AdminUsersPage() {
  const { users, banUser, unbanUser, adjustCredits } = useAdminStore()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [banTarget, setBanTarget] = useState<string | null>(null)
  const [adjustTarget, setAdjustTarget] = useState<{ id: string; name: string } | null>(null)

  const filtered = search
    ? users.filter(u => u.name.includes(search) || u.email.includes(search))
    : users

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">用户管理</h2>
        <span className="text-sm text-[#a0a0b8]">{users.length} 个用户</span>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="搜索用户名或邮箱..." />

      <div className="card p-4">
        {filtered.map(user => (
          <UserRow
            key={user.id}
            user={user}
            onView={() => router.push(`/admin/users/${user.id}`)}
            onBan={() => setBanTarget(user.id)}
            onUnban={() => unbanUser(user.id)}
            onAdjustCredits={() => setAdjustTarget({ id: user.id, name: user.name })}
          />
        ))}
      </div>

      <ConfirmDialog
        open={!!banTarget}
        onClose={() => setBanTarget(null)}
        onConfirm={() => { if (banTarget) banUser(banTarget, '管理员操作封禁'); setBanTarget(null) }}
        title="封禁用户"
        message="确定要封禁该用户吗？"
        confirmLabel="封禁"
        variant="danger"
      />

      <AdjustCreditsModal
        open={!!adjustTarget}
        onClose={() => setAdjustTarget(null)}
        userName={adjustTarget?.name || ''}
        onConfirm={(amount, note) => { if (adjustTarget) adjustCredits(adjustTarget.id, amount, note) }}
      />
    </div>
  )
}
