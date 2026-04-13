'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import UserAvatar from '@/components/shared/UserAvatar'

const NAV_ITEMS = [
  { href: '/admin/overview', label: '数据看板', icon: '📊' },
  { href: '/admin/users', label: '用户管理', icon: '👥' },
  { href: '/admin/subscriptions', label: '订阅管理', icon: '💳' },
  { href: '/admin/review', label: '内容审核', icon: '🔍' },
  { href: '/admin/system', label: '系统配置', icon: '⚙️' },
  { href: '/admin/logs', label: '操作日志', icon: '📋' },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { currentUser, logout } = useAuthStore()

  return (
    <div className="flex flex-1 min-h-0">
      <aside className="w-60 shrink-0 bg-[#12121e] border-r border-[#2a2a3e] flex flex-col">
        <div className="p-5 border-b border-[#2a2a3e]">
          <Link href="/admin/overview" className="text-white font-bold text-lg">短剧创作工具</Link>
          <p className="text-xs text-red-400 mt-0.5">管理后台</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive ? 'bg-[#6c5ce7]/15 text-[#6c5ce7] font-medium' : 'text-[#a0a0b8] hover:bg-[#1a1a2e] hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[#2a2a3e] flex items-center gap-3">
          <UserAvatar name={currentUser?.name || '管理员'} size={32} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{currentUser?.name}</p>
            <button onClick={logout} className="text-xs text-[#a0a0b8] hover:text-red-400 cursor-pointer">退出登录</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
