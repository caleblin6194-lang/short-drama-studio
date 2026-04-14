'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { hasSupabaseConfig } from '@/lib/supabase'

interface AuthState {
  currentUser: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, name: string, password: string) => Promise<boolean>
  logout: () => void
  updateProfile: (patch: Partial<User>) => void
  loadSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })

        if (hasSupabaseConfig()) {
          try {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            })
            const data = await res.json()
            if (!res.ok) {
              set({ isLoading: false, error: data.error || '登录失败' })
              return false
            }
            set({
              currentUser: data.user as User,
              accessToken: data.session.accessToken,
              isAuthenticated: true,
              isLoading: false,
            })
            return true
          } catch {
            set({ isLoading: false, error: '网络错误' })
            return false
          }
        }

        // Fallback mock login
        await new Promise(r => setTimeout(r, 800))
        if (password !== '123456') {
          set({ isLoading: false, error: '邮箱或密码错误' })
          return false
        }
        const mockUser: User = {
          id: 'user-1',
          email,
          name: email.split('@')[0],
          role: 'user',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          isBanned: false,
        }
        set({ currentUser: mockUser, isAuthenticated: true, isLoading: false })
        return true
      },

      register: async (email, name, password) => {
        set({ isLoading: true, error: null })

        if (hasSupabaseConfig()) {
          try {
            const res = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, name, password }),
            })
            const data = await res.json()
            if (!res.ok) {
              set({ isLoading: false, error: data.error || '注册失败' })
              return false
            }
            set({
              currentUser: data.user as User,
              accessToken: data.session?.accessToken ?? null,
              isAuthenticated: true,
              isLoading: false,
            })
            return true
          } catch {
            set({ isLoading: false, error: '网络错误' })
            return false
          }
        }

        // Fallback mock register
        await new Promise(r => setTimeout(r, 1000))
        const mockUser: User = {
          id: `user-${Date.now()}`,
          email,
          name: name || email.split('@')[0],
          role: 'user',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          isBanned: false,
        }
        set({ currentUser: mockUser, isAuthenticated: true, isLoading: false })
        return true
      },

      logout: () => {
        set({ currentUser: null, accessToken: null, isAuthenticated: false, error: null })
      },

      updateProfile: (patch) => {
        set(s => s.currentUser ? { currentUser: { ...s.currentUser, ...patch } } : s)
      },

      loadSession: async () => {
        const { accessToken } = get()
        if (!accessToken || !hasSupabaseConfig()) return
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          if (res.ok) {
            const data = await res.json()
            set({ currentUser: data.user as User, isAuthenticated: true })
          }
        } catch { /* ignore */ }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ currentUser: state.currentUser, accessToken: state.accessToken, isAuthenticated: state.isAuthenticated }),
    }
  )
)
