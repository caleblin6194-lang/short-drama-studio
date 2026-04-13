'use client'

import { create } from 'zustand'
import type { CreditBalance, CreditTransaction, CreditTransactionType, DailyUsageStat } from '@/types'
import { MOCK_CREDIT_BALANCE, MOCK_TRANSACTIONS, generateDailyUsage } from '@/mock/dashboard'
import { v4 as uuid } from 'uuid'

interface CreditsState {
  balance: CreditBalance
  transactions: CreditTransaction[]
  dailyUsage: DailyUsageStat[]

  loadForUser: (userId: string) => void
  consumeCredits: (amount: number, projectId: string, projectTitle: string, operation: string) => boolean
  addCredits: (amount: number, type: CreditTransactionType, note: string) => void
}

export const useCreditsStore = create<CreditsState>((set, get) => ({
  balance: { total: 0, used: 0, remaining: 0, monthlyBudget: 0 },
  transactions: [],
  dailyUsage: [],

  loadForUser: () => {
    set({
      balance: { ...MOCK_CREDIT_BALANCE },
      transactions: [...MOCK_TRANSACTIONS],
      dailyUsage: generateDailyUsage(30),
    })
  },

  consumeCredits: (amount, projectId, projectTitle, operation) => {
    const { balance } = get()
    if (balance.remaining < amount) return false

    const newBalance = {
      ...balance,
      used: balance.used + amount,
      remaining: balance.remaining - amount,
    }
    const tx: CreditTransaction = {
      id: uuid(),
      userId: 'user-1',
      type: 'consumption',
      amount: -amount,
      balance: newBalance.remaining,
      projectId,
      projectTitle,
      operation,
      createdAt: new Date().toISOString(),
    }
    set(s => ({
      balance: newBalance,
      transactions: [tx, ...s.transactions],
    }))
    return true
  },

  addCredits: (amount, type, note) => {
    set(s => {
      const newBalance = {
        ...s.balance,
        total: s.balance.total + amount,
        remaining: s.balance.remaining + amount,
      }
      const tx: CreditTransaction = {
        id: uuid(),
        userId: 'user-1',
        type,
        amount,
        balance: newBalance.remaining,
        note,
        createdAt: new Date().toISOString(),
      }
      return { balance: newBalance, transactions: [tx, ...s.transactions] }
    })
  },
}))
