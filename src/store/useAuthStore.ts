'use client'

import { create } from 'zustand'
import type { User } from '@/types'
import { mockLogin, mockRegister } from '@/mock/auth'

interface AuthState {
  currentUser: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, name: string, password: string) => Promise<boolean>
  logout: () => void
  updateProfile: (patch: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    const user = await mockLogin(email, password)
    if (user) {
      set({ currentUser: user, isAuthenticated: true, isLoading: false })
      return true
    }
    set({ isLoading: false, error: '邮箱或密码错误' })
    return false
  },

  register: async (email, name) => {
    set({ isLoading: true, error: null })
    const user = await mockRegister(email, name)
    set({ currentUser: user, isAuthenticated: true, isLoading: false })
    return true
  },

  logout: () => {
    set({ currentUser: null, isAuthenticated: false, error: null })
  },

  updateProfile: (patch) => {
    set(s => s.currentUser ? { currentUser: { ...s.currentUser, ...patch } } : s)
  },
}))
