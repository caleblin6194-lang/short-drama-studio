'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useCreditsStore } from '@/store/useCreditsStore'

export default function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, currentUser, logout } = useAuthStore()
  const remaining = useCreditsStore(s => s.balance?.remaining ?? 0)
  const monthlyBudget = useCreditsStore(s => s.balance?.monthlyBudget ?? 1)

  // 制作流水线页面全屏显示，不需要 TopNav
  if (pathname === '/create') return null

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header className="h-12 bg-[#0d0d17] border-b border-[#2a2a3e] flex items-center justify-between px-4 shrink-0 z-50">
      <Link href="/" className="flex items-center gap-2 text-white font-bold text-sm">
        <span className="text-[#6c5ce7]">AI</span> 短剧创作工具
      </Link>

      <div className="flex items-center gap-3">
        {isAuthenticated && currentUser ? (
          <>
            {currentUser.role === 'admin' && (
              <Link href="/admin/overview" className="text-xs text-[#a0a0b8] hover:text-white transition-colors">
                管理后台
              </Link>
            )}
            {/* Credit balance indicator */}
            <Link
              href="/dashboard/credits"
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
                remaining < monthlyBudget * 0.1
                  ? 'border-red-500/40 text-red-400 bg-red-500/10'
                  : remaining < monthlyBudget * 0.3
                  ? 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10'
                  : 'border-[#2a2a3e] text-[#a0a0b8] hover:border-[#6c5ce7]/50'
              }`}
              title={`积分余额: ${remaining} / ${monthlyBudget}`}
            >
              <span>💎</span>
              <span>{remaining.toLocaleString()}</span>
            </Link>
            <Link href="/dashboard/overview" className="text-xs text-[#a0a0b8] hover:text-white transition-colors">
              会员中心
            </Link>
            <Link href="/projects" className="text-xs text-[#a0a0b8] hover:text-white transition-colors">
              创作
            </Link>
            <span className="text-xs text-[#a0a0b8]">{currentUser.name}</span>
            <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer">
              退出
            </button>
          </>
        ) : (
          <Link href="/login" className="text-xs text-[#6c5ce7] hover:text-[#a29bfe] transition-colors">
            登录
          </Link>
        )}
      </div>
    </header>
  )
}
