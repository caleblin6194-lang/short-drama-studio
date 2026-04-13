'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, currentUser } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login')
    } else if (currentUser?.role === 'admin') {
      router.replace('/admin/overview')
    } else {
      router.replace('/dashboard/overview')
    }
  }, [isAuthenticated, currentUser, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#6c5ce7] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
