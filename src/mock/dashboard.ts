import type { CreditTransaction, CreditBalance, Subscription, DailyUsageStat } from '@/types'
import { v4 as uuid } from 'uuid'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function dateStr(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

export const MOCK_CREDIT_BALANCE: CreditBalance = {
  total: 6000,
  used: 3420,
  remaining: 2580,
  monthlyBudget: 6000,
}

export const MOCK_SUBSCRIPTION: Subscription = {
  id: 'sub-1',
  userId: 'user-1',
  planTier: 'creator',
  status: 'active',
  startedAt: '2026-01-15T00:00:00Z',
  expiresAt: '2026-05-15T00:00:00Z',
  autoRenew: true,
  renewalHistory: [
    { id: 'r1', date: '2026-01-15', amount: 79, planTier: 'creator', method: 'manual' },
    { id: 'r2', date: '2026-02-15', amount: 79, planTier: 'creator', method: 'auto' },
    { id: 'r3', date: '2026-03-15', amount: 79, planTier: 'creator', method: 'auto' },
    { id: 'r4', date: '2026-04-15', amount: 79, planTier: 'creator', method: 'auto' },
  ],
}

export const MOCK_TRANSACTIONS: CreditTransaction[] = [
  { id: uuid(), userId: 'user-1', type: 'subscription_grant', amount: 6000, balance: 6000, note: '4月创作者套餐积分', createdAt: daysAgo(12) },
  { id: uuid(), userId: 'user-1', type: 'consumption', amount: -50, balance: 5950, projectId: 'demo-1', projectTitle: '赘婿逆袭：三年隐忍', operation: '生成开场白', createdAt: daysAgo(11) },
  { id: uuid(), userId: 'user-1', type: 'consumption', amount: -80, balance: 5870, projectId: 'demo-1', projectTitle: '赘婿逆袭：三年隐忍', operation: 'AI 续写', createdAt: daysAgo(11) },
  { id: uuid(), userId: 'user-1', type: 'consumption', amount: -120, balance: 5750, projectId: 'demo-1', projectTitle: '赘婿逆袭：三年隐忍', operation: '解析剧本', createdAt: daysAgo(10) },
  { id: uuid(), userId: 'user-1', type: 'consumption', amount: -200, balance: 5550, projectId: 'demo-1', projectTitle: '赘婿逆袭：三年隐忍', operation: '生成镜头', createdAt: daysAgo(10) },
  { id: uuid(), userId: 'user-1', type: 'consumption', amount: -541, balance: 5009, projectId: 'demo-1', projectTitle: '赘婿逆袭：三年隐忍', operation: '自动开拍', createdAt: daysAgo(9) },
  { id: uuid(), userId: 'user-1', type: 'consumption', amount: -150, balance: 4859, projectId: 'demo-1', projectTitle: '赘婿逆袭：三年隐忍', operation: '渲染成片', createdAt: daysAgo(8) },
  { id: uuid(), userId: 'user-1', type: 'consumption', amount: -510, balance: 4349, projectId: 'demo-1', projectTitle: '赘婿逆袭：三年隐忍', operation: '创建地域变体', createdAt: daysAgo(7) },
  { id: uuid(), userId: 'user-1', type: 'consumption', amount: -50, balance: 4299, projectId: 'demo-2', projectTitle: '穿越大唐：女将军', operation: '生成开场白', createdAt: daysAgo(5) },
  { id: uuid(), userId: 'user-1', type: 'consumption', amount: -80, balance: 4219, projectId: 'demo-2', projectTitle: '穿越大唐：女将军', operation: 'AI 续写', createdAt: daysAgo(5) },
  { id: uuid(), userId: 'user-1', type: 'consumption', amount: -120, balance: 4099, projectId: 'demo-2', projectTitle: '穿越大唐：女将军', operation: '解析剧本', createdAt: daysAgo(4) },
  { id: uuid(), userId: 'user-1', type: 'consumption', amount: -200, balance: 3899, projectId: 'demo-3', projectTitle: '都市修仙日记', operation: '生成镜头', createdAt: daysAgo(3) },
  { id: uuid(), userId: 'user-1', type: 'consumption', amount: -541, balance: 3358, projectId: 'demo-3', projectTitle: '都市修仙日记', operation: '自动开拍', createdAt: daysAgo(2) },
  { id: uuid(), userId: 'user-1', type: 'admin_adjust', amount: 500, balance: 3858, note: '客服补偿', createdAt: daysAgo(1) },
  { id: uuid(), userId: 'user-1', type: 'consumption', amount: -50, balance: 3808, projectId: 'demo-3', projectTitle: '都市修仙日记', operation: '重拍镜头', createdAt: daysAgo(0) },
]

export function generateDailyUsage(days: number = 30): DailyUsageStat[] {
  return Array.from({ length: days }, (_, i) => ({
    date: dateStr(days - 1 - i),
    creditsUsed: Math.floor(Math.random() * 400 + 50),
    projectsCreated: Math.random() > 0.7 ? 1 : 0,
    episodesCompleted: Math.random() > 0.8 ? 1 : 0,
  }))
}
