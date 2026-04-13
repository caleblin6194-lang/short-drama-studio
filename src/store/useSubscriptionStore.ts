'use client'

import { create } from 'zustand'
import type { Subscription, PlanConfig, PlanTier } from '@/types'
import { PLANS } from '@/lib/plans'
import { MOCK_SUBSCRIPTION } from '@/mock/dashboard'
import { delay } from '@/mock/delays'
import { v4 as uuid } from 'uuid'

interface SubscriptionState {
  subscription: Subscription | null
  plans: PlanConfig[]
  isProcessing: boolean

  loadForUser: (userId: string) => void
  upgradePlan: (tier: PlanTier) => Promise<void>
  downgradePlan: (tier: PlanTier) => Promise<void>
  toggleAutoRenew: () => void
  cancelSubscription: () => Promise<void>
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  plans: PLANS,
  isProcessing: false,

  loadForUser: () => {
    set({ subscription: { ...MOCK_SUBSCRIPTION } })
  },

  upgradePlan: async (tier) => {
    set({ isProcessing: true })
    await delay(1500)
    const plan = PLANS.find(p => p.tier === tier)!
    set(s => ({
      isProcessing: false,
      subscription: s.subscription ? {
        ...s.subscription,
        planTier: tier,
        status: 'active',
        renewalHistory: [
          ...s.subscription.renewalHistory,
          { id: uuid(), date: new Date().toISOString().split('T')[0], amount: plan.monthlyPrice, planTier: tier, method: 'manual' as const },
        ],
      } : null,
    }))
  },

  downgradePlan: async (tier) => {
    set({ isProcessing: true })
    await delay(1500)
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
    await delay(1000)
    set(s => ({
      isProcessing: false,
      subscription: s.subscription ? { ...s.subscription, status: 'cancelled', autoRenew: false } : null,
    }))
  },
}))
