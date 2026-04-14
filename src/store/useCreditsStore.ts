'use client'

import { create } from 'zustand'
import type { CreditBalance, CreditTransaction, CreditTransactionType, DailyUsageStat } from '@/types'
import { MOCK_CREDIT_BALANCE, MOCK_TRANSACTIONS, generateDailyUsage } from '@/mock/dashboard'
import { useAuthStore } from './useAuthStore'
import { v4 as uuid } from 'uuid'

interface CreditsState {
  balance: CreditBalance
  transactions: CreditTransaction[]
  dailyUsage: DailyUsageStat[]

  loadForUser: () => Promise<void>
  consumeCredits: (amount: number, projectId: string, projectTitle: string, operation: string) => Promise<boolean>
  addCredits: (amount: number, type: CreditTransactionType, note: string) => Promise<void>
  refreshLedger: () => Promise<void>
}

function getToken() {
  return useAuthStore.getState().accessToken
}

export const useCreditsStore = create<CreditsState>((set, get) => ({
  balance: { total: 0, used: 0, remaining: 0, monthlyBudget: 0 },
  transactions: [],
  dailyUsage: [],

  loadForUser: async () => {
    const token = getToken()
    if (!token) {
      set({
        balance: { ...MOCK_CREDIT_BALANCE },
        transactions: [...MOCK_TRANSACTIONS],
        dailyUsage: generateDailyUsage(30),
      })
      return
    }
    try {
      const [membershipRes, ledgerRes] = await Promise.all([
        fetch('/api/membership/me', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/membership/ledger?limit=50', { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (membershipRes.ok) {
        const { membership } = await membershipRes.json()
        const { transactions = [] } = ledgerRes.ok ? await ledgerRes.json() : {}

        set({
          balance: {
            total: membership.totalCredits,
            used: membership.totalCredits - membership.monthlyCreditsRemaining,
            remaining: membership.monthlyCreditsRemaining,
            monthlyBudget: membership.monthlyCredits,
          },
          transactions,
          dailyUsage: generateDailyUsage(30),
        })
        return
      }
    } catch { /* fall through */ }

    set({
      balance: { ...MOCK_CREDIT_BALANCE },
      transactions: [...MOCK_TRANSACTIONS],
      dailyUsage: generateDailyUsage(30),
    })
  },

  consumeCredits: async (amount, projectId, projectTitle, operation) => {
    const { balance } = get()
    if (balance.remaining < amount) return false

    const newBalance = {
      ...balance,
      used: balance.used + amount,
      remaining: balance.remaining - amount,
    }
    const tx: CreditTransaction = {
      id: uuid(),
      userId: useAuthStore.getState().currentUser?.id ?? 'anon',
      type: 'consumption',
      amount: -amount,
      balance: newBalance.remaining,
      projectId,
      projectTitle,
      operation,
      createdAt: new Date().toISOString(),
    }

    // Optimistic update
    set(s => ({
      balance: newBalance,
      transactions: [tx, ...s.transactions],
    }))

    const token = getToken()
    if (token) {
      try {
        await fetch('/api/membership/ledger', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ type: 'consumption', amount: -amount, projectId, operation, note: `${operation}` }),
        })
      } catch { /* non-critical */ }
    }

    return true
  },

  addCredits: async (amount, type, note) => {
    const token = getToken()
    if (token) {
      try {
        await fetch('/api/membership/ledger', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ type, amount, note }),
        })
      } catch { /* non-critical */ }
    }

    set(s => {
      const newBalance = {
        ...s.balance,
        total: s.balance.total + amount,
        remaining: s.balance.remaining + amount,
      }
      const tx: CreditTransaction = {
        id: uuid(),
        userId: useAuthStore.getState().currentUser?.id ?? 'anon',
        type,
        amount,
        balance: newBalance.remaining,
        note,
        createdAt: new Date().toISOString(),
      }
      return { balance: newBalance, transactions: [tx, ...s.transactions] }
    })
  },

  refreshLedger: async () => {
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch('/api/membership/ledger?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        set({ transactions: data.transactions })
      }
    } catch { /* ignore */ }
  },
}))
