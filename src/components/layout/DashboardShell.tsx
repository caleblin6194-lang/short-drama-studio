'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import UserAvatar from '@/components/shared/UserAvatar'

const NAV_ITEMS = [
  { href: '/dashboard/overview', label: '仪表盘', icon: '📊' },
  { href: '/dashboard/subscription', label: '订阅管理', icon: '💎' },
  { href: '/dashboard/credits', label: '积分明细', icon: '🪙' },
  { href: '/dashboard/projects', label: '项目管理', icon: '🎬' },
  { href: '/dashboard/analytics', label: '用量分析', icon: '📈' },
  { href: '/dashboard/settings', label: '账户设置', icon: '⚙️' },
]

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { currentUser, logout } = useAuthStore()

  return (
    <div className="flex flex-1 min-h-0">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-[#12121e] border-r border-[#2a2a3e] flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-[#2a2a3e]">
          <Link href="/dashboard/overview" className="text-white font-bold text-lg">短剧创作工具</Link>
          <p className="text-xs text-[#a0a0b8] mt-0.5">会员中心</p>
        </div>

        {/* Nav */}
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

        {/* 创作入口 */}
        <div className="p-3 border-t border-[#2a2a3e]">
          <Link href="/projects" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-[#a0a0b8] hover:bg-[#1a1a2e] hover:text-white transition-all">
            <span>🎨</span><span>进入创作</span>
          </Link>
        </div>

        {/* User */}
        <div className="p-4 border-t border-[#2a2a3e] flex items-center gap-3">
          <UserAvatar name={currentUser?.name || '用户'} size={32} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{currentUser?.name}</p>
            <button onClick={logout} className="text-xs text-[#a0a0b8] hover:text-red-400 cursor-pointer">退出登录</button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl">{children}</div>
      </main>
    </div>
  )
}
