'use client'

import { create } from 'zustand'
import type { Subscription, PlanConfig, PlanTier } from '@/types'
import { PLANS } from '@/lib/plans'
import { MOCK_SUBSCRIPTION } from '@/mock/dashboard'
import { useAuthStore } from './useAuthStore'

interface SubscriptionState {
  subscription: Subscription | null
  plans: PlanConfig[]
  isProcessing: boolean

  loadForUser: () => void
  upgradePlan: (tier: PlanTier) => Promise<void>
  downgradePlan: (tier: PlanTier) => Promise<void>
  toggleAutoRenew: () => void
  cancelSubscription: () => Promise<void>
}

function getToken() {
  return useAuthStore.getState().accessToken
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  plans: PLANS,
  isProcessing: false,

  loadForUser: async () => {
    const token = getToken()
    if (!token) {
      set({ subscription: { ...MOCK_SUBSCRIPTION } })
      return
    }
    try {
      const res = await fetch('/api/membership/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        set({ subscription: data.membership })
      } else {
        set({ subscription: { ...MOCK_SUBSCRIPTION } })
      }
    } catch {
      set({ subscription: { ...MOCK_SUBSCRIPTION } })
    }
  },

  upgradePlan: async (tier) => {
    set({ isProcessing: true })
    const token = getToken()
    try {
      const res = await fetch('/api/membership/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planTier: tier }),
      })
      if (res.ok) {
        const data = await res.json()
        set(s => ({
          isProcessing: false,
          subscription: s.subscription
            ? { ...s.subscription, planTier: tier, status: 'active', totalCredits: data.membership.totalCredits }
            : null,
        }))
        return
      }
    } catch { /* fall through to mock */ }
    // Fallback mock
    await new Promise(r => setTimeout(r, 1500))
    const plan = PLANS.find(p => p.tier === tier)!
    set(s => ({
      isProcessing: false,
      subscription: s.subscription ? {
        ...s.subscription,
        planTier: tier,
        status: 'active',
        renewalHistory: [
          ...s.subscription.renewalHistory,
          { id: `rh-${Date.now()}`, date: new Date().toISOString().split('T')[0], amount: plan.monthlyPrice, planTier: tier, method: 'manual' as const },
        ],
      } : null,
    }))
  },

  downgradePlan: async (tier) => {
    set({ isProcessing: true })
    await new Promise(r => setTimeout(r, 1500))
    set(s => ({
      isProcessing: false,
      subscription: s.subscription ? { ...s.subscription, planTier: tier } : null,
    }))
  },

  toggleAutoRenew: () => {
    set(s => ({
      subscription: s.subscription ? { ...s.subscription, autoRenew: !s.subscription.autoRenew } : null,
    }))
  },

  cancelSubscription: async () => {
    set({ isProcessing: true })
    await new Promise(r => setTimeout(r, 1000))
    set(s => ({
      isProcessing: false,
      subscription: s.subscription ? { ...s.subscription, status: 'cancelled', autoRenew: false } : null,
    }))
  },
}))
