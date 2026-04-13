import type { PlanConfig } from '@/types'

export const PLANS: PlanConfig[] = [
  {
    tier: 'free',
    name: '免费',
    monthlyPrice: 0,
    monthlyCredits: 2000,
    isOneTime: true,
    maxProjects: 3,
    features: ['基础创作流程', '单集制作', 'cost_first 模式', '720p 导出'],
  },
  {
    tier: 'creator',
    name: '创作者',
    monthlyPrice: 79,
    monthlyCredits: 6000,
    isOneTime: false,
    maxProjects: 20,
    features: ['全部创作功能', '单集/批量制作', 'cost_first + quality_first', '1080p 导出', '一稿多投（3 地域）'],
  },
  {
    tier: 'studio',
    name: '工作室',
    monthlyPrice: 299,
    monthlyCredits: 30000,
    isOneTime: false,
    maxProjects: 100,
    features: ['全部创作功能', '批量制作', '全模型策略', '4K 导出', '一稿多投（全地域）', '团队协作（3人）', 'API 访问'],
  },
  {
    tier: 'flagship',
    name: '出海旗舰',
    monthlyPrice: 899,
    monthlyCredits: 100000,
    isOneTime: false,
    maxProjects: -1, // unlimited
    features: ['全部功能', 'LoRA 角色训练', '批量 API', '4K+HDR 导出', '一稿多投（全地域）', '团队协作（10人）', '优先客服', '专属模型配额'],
  },
]

export function getPlan(tier: string): PlanConfig {
  return PLANS.find(p => p.tier === tier) || PLANS[0]
}
