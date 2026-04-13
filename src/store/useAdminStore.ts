'use client'

import { create } from 'zustand'
import type { User, Order, PromoCode, ReviewItem, SystemConfig, AuditLogEntry, PlatformStats, DailyUsageStat, PlanTier, ModelRoute } from '@/types'
import { MOCK_ADMIN_USERS, MOCK_ORDERS, MOCK_PROMO_CODES, MOCK_REVIEW_QUEUE, MOCK_SYSTEM_CONFIG, MOCK_AUDIT_LOG, MOCK_PLATFORM_STATS, generatePlatformDailyStats } from '@/mock/admin'
import { MOCK_USERS } from '@/mock/auth'
import { v4 as uuid } from 'uuid'

interface AdminState {
  users: User[]
  orders: Order[]
  promoCodes: PromoCode[]
  reviewQueue: ReviewItem[]
  systemConfig: SystemConfig
  auditLog: AuditLogEntry[]
  platformStats: PlatformStats
  platformDailyStats: DailyUsageStat[]
  isLoading: boolean

  loadAll: () => void
  searchUsers: (query: string) => User[]
  banUser: (id: string, reason: string) => void
  unbanUser: (id: string) => void
  adjustCredits: (userId: string, amount: number, note: string) => void
  createPromoCode: (data: Omit<PromoCode, 'id' | 'usedCount'>) => void
  togglePromoCode: (id: string) => void
  reviewApprove: (id: string) => void
  reviewReject: (id: string, reason: string) => void
  updateModelRoute: (id: string, patch: Partial<ModelRoute>) => void
  addModelRoute: (route: Omit<ModelRoute, 'id' | 'testStatus'>) => void
  deleteModelRoute: (id: string) => void
  testModelConnection: (id: string) => Promise<void>
  toggleFeatureFlag: (key: string) => void
  updateCreditPrice: (price: number) => void
}

function appendLog(state: AdminState, action: AuditLogEntry['action'], targetType: AuditLogEntry['targetType'], targetId: string, details: string): AuditLogEntry[] {
  return [{
    id: uuid(),
    adminId: 'admin-1',
    adminName: '李管理',
    action,
    targetType,
    targetId,
    details,
    createdAt: new Date().toISOString(),
  }, ...state.auditLog]
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  orders: [],
  promoCodes: [],
  reviewQueue: [],
  systemConfig: MOCK_SYSTEM_CONFIG,
  auditLog: [],
  platformStats: MOCK_PLATFORM_STATS,
  platformDailyStats: [],
  isLoading: false,

  loadAll: () => {
    set({
      users: [...MOCK_USERS, ...MOCK_ADMIN_USERS],
      orders: [...MOCK_ORDERS],
      promoCodes: [...MOCK_PROMO_CODES],
      reviewQueue: [...MOCK_REVIEW_QUEUE],
      systemConfig: { ...MOCK_SYSTEM_CONFIG },
      auditLog: [...MOCK_AUDIT_LOG],
      platformStats: { ...MOCK_PLATFORM_STATS },
      platformDailyStats: generatePlatformDailyStats(30),
    })
  },

  searchUsers: (query) => {
    const q = query.toLowerCase()
    return get().users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  },

  banUser: (id, reason) => {
    set(s => ({
      users: s.users.map(u => u.id === id ? { ...u, isBanned: true, banReason: reason } : u),
      auditLog: appendLog(s, 'ban_user', 'user', id, `封禁用户：${reason}`),
    }))
  },

  unbanUser: (id) => {
    set(s => ({
      users: s.users.map(u => u.id === id ? { ...u, isBanned: false, banReason: undefined } : u),
      auditLog: appendLog(s, 'unban_user', 'user', id, '解除封禁'),
    }))
  },

  adjustCredits: (userId, amount, note) => {
    set(s => ({
      auditLog: appendLog(s, 'adjust_credits', 'user', userId, `调整积分 ${amount > 0 ? '+' : ''}${amount}：${note}`),
    }))
  },

  createPromoCode: (data) => {
    const code: PromoCode = { ...data, id: uuid(), usedCount: 0 }
    set(s => ({
      promoCodes: [code, ...s.promoCodes],
      auditLog: appendLog(s, 'create_promo', 'subscription', code.id, `创建优惠码 ${code.code}`),
    }))
  },

  togglePromoCode: (id) => {
    set(s => ({
      promoCodes: s.promoCodes.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p),
    }))
  },

  reviewApprove: (id) => {
    set(s => ({
      reviewQueue: s.reviewQueue.map(r => r.id === id ? { ...r, status: 'approved', reviewedAt: new Date().toISOString(), reviewedBy: '李管理' } : r),
      auditLog: appendLog(s, 'review_approve', 'content', id, `通过审核`),
    }))
  },

  reviewReject: (id, reason) => {
    set(s => ({
      reviewQueue: s.reviewQueue.map(r => r.id === id ? { ...r, status: 'rejected', reason, reviewedAt: new Date().toISOString(), reviewedBy: '李管理' } : r),
      auditLog: appendLog(s, 'review_reject', 'content', id, `驳回审核：${reason}`),
    }))
  },

  updateModelRoute: (id, patch) => {
    const route = get().systemConfig.modelRoutes.find(m => m.id === id)
    const label = route ? `${route.provider}/${route.model}` : id
    set(s => ({
      systemConfig: {
        ...s.systemConfig,
        modelRoutes: s.systemConfig.modelRoutes.map(m => m.id === id ? { ...m, ...patch } : m),
      },
      auditLog: appendLog(s, 'update_model_route', 'system', id, `更新模型配置：${label}`),
    }))
  },

  addModelRoute: (route) => {
    const newRoute: ModelRoute = { ...route, id: uuid(), testStatus: 'untested' } as ModelRoute
    set(s => ({
      systemConfig: {
        ...s.systemConfig,
        modelRoutes: [...s.systemConfig.modelRoutes, newRoute],
      },
      auditLog: appendLog(s, 'update_model_route', 'system', newRoute.id, `新增模型：${route.provider}/${route.model}`),
    }))
  },

  deleteModelRoute: (id) => {
    const route = get().systemConfig.modelRoutes.find(m => m.id === id)
    const label = route ? `${route.provider}/${route.model}` : id
    set(s => ({
      systemConfig: {
        ...s.systemConfig,
        modelRoutes: s.systemConfig.modelRoutes.filter(m => m.id !== id),
      },
      auditLog: appendLog(s, 'update_model_route', 'system', id, `删除模型：${label}`),
    }))
  },

  testModelConnection: async (id) => {
    set(s => ({
      systemConfig: {
        ...s.systemConfig,
        modelRoutes: s.systemConfig.modelRoutes.map(m => m.id === id ? { ...m, testStatus: 'testing' as const } : m),
      },
    }))
    // mock 测试延迟
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000))
    const route = get().systemConfig.modelRoutes.find(m => m.id === id)
    const hasKey = route?.apiKey && route.apiKey.length > 0
    const success = hasKey && Math.random() > 0.15
    set(s => ({
      systemConfig: {
        ...s.systemConfig,
        modelRoutes: s.systemConfig.modelRoutes.map(m => m.id === id ? {
          ...m,
          testStatus: success ? 'success' as const : 'failed' as const,
          lastTestedAt: new Date().toISOString(),
          testLatencyMs: success ? Math.floor(300 + Math.random() * 5000) : undefined,
          testError: success ? undefined : (!hasKey ? 'API Key 未配置' : '连接超时或认证失败'),
        } : m),
      },
    }))
  },

  toggleFeatureFlag: (key) => {
    set(s => ({
      systemConfig: {
        ...s.systemConfig,
        featureFlags: s.systemConfig.featureFlags.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f),
      },
      auditLog: appendLog(s, 'toggle_feature', 'system', key, `切换功能开关`),
    }))
  },

  updateCreditPrice: (price) => {
    set(s => ({
      systemConfig: { ...s.systemConfig, creditPriceYuan: price },
      auditLog: appendLog(s, 'update_plan_config', 'system', 'credit_price', `积分单价调至 ¥${price}`),
    }))
  },
}))
