'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import type { UserRole } from '@/types'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { isAuthenticated, currentUser } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }
    if (requiredRole && currentUser?.role !== requiredRole) {
      router.replace(currentUser?.role === 'admin' ? '/admin/overview' : '/dashboard/overview')
    }
  }, [isAuthenticated, currentUser, requiredRole, router])

  if (!isAuthenticated || (requiredRole && currentUser?.role !== requiredRole)) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#a0a0b8]">
        加载中...
      </div>
    )
  }

  return <>{children}</>
}
