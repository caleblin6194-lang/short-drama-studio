'use client'

import { useEffect } from 'react'
import AuthGuard from '@/components/auth/AuthGuard'
import AdminShell from '@/components/layout/AdminShell'
import { useAdminStore } from '@/store/useAdminStore'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const loadAll = useAdminStore(s => s.loadAll)

  useEffect(() => { loadAll() }, [loadAll])

  return (
    <AuthGuard requiredRole="admin">
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  )
}
