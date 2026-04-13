'use client'

import AuthGuard from '@/components/auth/AuthGuard'
import DashboardShell from '@/components/layout/DashboardShell'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useCreditsStore } from '@/store/useCreditsStore'
import { useSubscriptionStore } from '@/store/useSubscriptionStore'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuthStore()
  const loadCredits = useCreditsStore(s => s.loadForUser)
  const loadSub = useSubscriptionStore(s => s.loadForUser)

  useEffect(() => {
    if (currentUser) {
      loadCredits(currentUser.id)
      loadSub(currentUser.id)
    }
  }, [currentUser, loadCredits, loadSub])

  return (
    <AuthGuard requiredRole="user">
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  )
}
