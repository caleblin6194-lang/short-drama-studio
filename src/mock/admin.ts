import type { User, Order, PromoCode, ReviewItem, ModelRoute, FeatureFlag, SystemConfig, AuditLogEntry, PlatformStats, DailyUsageStat } from '@/types'
import { v4 as uuid } from 'uuid'

function daysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString()
}
function dateStr(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]
}

const names = ['王小明', '李芳', '陈伟', '赵丽', '刘强', '孙婷', '周杰', '吴敏', '郑浩', '黄雪', '林峰', '何佳', '马超', '高雅', '罗鑫']
const tiers = ['free', 'creator', 'studio', 'flagship'] as const

export const MOCK_ADMIN_USERS: User[] = names.map((name, i) => ({
  id: `user-${i + 10}`,
  email: `${name.toLowerCase().replace(/\s/g, '')}@example.com`,
  name,
  role: 'user' as const,
  createdAt: daysAgo(Math.floor(Math.random() * 180 + 30)),
  lastLoginAt: daysAgo(Math.floor(Math.random() * 14)),
  isBanned: i === 4 || i === 11,
  banReason: i === 4 ? '发布违规内容' : i === 11 ? '恶意刷积分' : undefined,
}))

export const MOCK_ORDERS: Order[] = Array.from({ length: 30 }, (_, i) => {
  const user = MOCK_ADMIN_USERS[i % MOCK_ADMIN_USERS.length]
  const tier = tiers[Math.floor(Math.random() * 3) + 1]
  const prices: Record<string, number> = { creator: 79, studio: 299, flagship: 899 }
  return {
    id: `order-${i + 1}`,
    userId: user.id,
    userName: user.name,
    planTier: tier,
    amount: prices[tier] || 79,
    status: i < 25 ? 'completed' : i < 27 ? 'pending' : i < 29 ? 'refunded' : 'failed',
    promoCode: i % 7 === 0 ? 'WELCOME20' : undefined,
    createdAt: daysAgo(Math.floor(Math.random() * 60)),
  }
}) as Order[]

export const MOCK_PROMO_CODES: PromoCode[] = [
  { id: 'pc1', code: 'WELCOME20', discountType: 'percentage', discountValue: 20, applicablePlans: ['creator', 'studio'], maxUses: 1000, usedCount: 234, validFrom: '2026-01-01', validUntil: '2026-12-31', isActive: true },
  { id: 'pc2', code: 'STUDIO50', discountType: 'fixed', discountValue: 50, applicablePlans: ['studio'], maxUses: 500, usedCount: 89, validFrom: '2026-03-01', validUntil: '2026-06-30', isActive: true },
  { id: 'pc3', code: 'LAUNCH100', discountType: 'fixed', discountValue: 100, applicablePlans: ['creator', 'studio', 'flagship'], maxUses: 200, usedCount: 200, validFrom: '2025-11-01', validUntil: '2026-01-31', isActive: false },
  { id: 'pc4', code: 'VIP30', discountType: 'percentage', discountValue: 30, applicablePlans: ['flagship'], maxUses: 100, usedCount: 12, validFrom: '2026-04-01', validUntil: '2026-07-31', isActive: true },
  { id: 'pc5', code: 'MCN15', discountType: 'percentage', discountValue: 15, applicablePlans: ['studio', 'flagship'], maxUses: 50, usedCount: 8, validFrom: '2026-04-01', validUntil: '2026-09-30', isActive: true },
]

export const MOCK_REVIEW_QUEUE: ReviewItem[] = [
  { id: 'rv1', projectId: 'p-101', projectTitle: '霸总的替嫁新娘', userId: 'user-10', userName: '王小明', type: 'project', status: 'pending', submittedAt: daysAgo(1) },
  { id: 'rv2', projectId: 'p-102', projectTitle: '重生之我是大佬', userId: 'user-12', userName: '陈伟', type: 'video', status: 'pending', submittedAt: daysAgo(1) },
  { id: 'rv3', projectId: 'p-103', projectTitle: '穿越成反派千金', userId: 'user-13', userName: '赵丽', type: 'project', status: 'pending', submittedAt: daysAgo(2) },
  { id: 'rv4', projectId: 'p-104', projectTitle: '修仙直播间', userId: 'user-15', userName: '孙婷', type: 'video', status: 'approved', submittedAt: daysAgo(5), reviewedAt: daysAgo(4), reviewedBy: '李管理' },
  { id: 'rv5', projectId: 'p-105', projectTitle: '都市最强战神', userId: 'user-16', userName: '周杰', type: 'project', status: 'approved', submittedAt: daysAgo(6), reviewedAt: daysAgo(5), reviewedBy: '李管理' },
  { id: 'rv6', projectId: 'p-106', projectTitle: '（含违规内容）', userId: 'user-14', userName: '刘强', type: 'video', status: 'rejected', reason: '内容含暴力元素，不符合平台规范', submittedAt: daysAgo(8), reviewedAt: daysAgo(7), reviewedBy: '李管理' },
  { id: 'rv7', projectId: 'p-107', projectTitle: '甜宠小娇妻', userId: 'user-17', userName: '吴敏', type: 'project', status: 'flagged', reason: '疑似抄袭已有作品', submittedAt: daysAgo(3) },
  { id: 'rv8', projectId: 'p-108', projectTitle: '龙王赘婿', userId: 'user-18', userName: '郑浩', type: 'project', status: 'pending', submittedAt: daysAgo(0) },
]

export const MOCK_MODEL_ROUTES: ModelRoute[] = [
  {
    id: 'mr1', stage: 'image', provider: 'Flux (Black Forest Labs)', model: 'flux-schnell',
    costPerCall: 0.003, isActive: true, priority: 1, authType: 'bearer',
    baseUrl: 'https://api.bfl.ml/v1', apiKey: 'bfl-sk-****demo****', apiVersion: 'v1',
    timeout: 30, maxRetries: 2, testStatus: 'success', lastTestedAt: daysAgo(1), testLatencyMs: 1820,
    description: '快速图像生成，适合低成本批量出图',
  },
  {
    id: 'mr2', stage: 'image', provider: 'Flux (Black Forest Labs)', model: 'flux-2-pro',
    costPerCall: 0.04, isActive: true, priority: 2, authType: 'bearer',
    baseUrl: 'https://api.bfl.ml/v1', apiKey: 'bfl-sk-****demo****', apiVersion: 'v1',
    timeout: 60, maxRetries: 2, testStatus: 'success', lastTestedAt: daysAgo(1), testLatencyMs: 4250,
    description: '高质量图像生成，quality_first 策略使用',
  },
  {
    id: 'mr3', stage: 'image', provider: '豆包 (ByteDance)', model: 'doubao-seedream-3-0',
    costPerCall: 0.006, isActive: true, priority: 3, authType: 'bearer',
    baseUrl: 'https://visual.volcengineapi.com/v1', apiKey: 'volc-ak-****demo****',
    timeout: 45, maxRetries: 2, testStatus: 'success', lastTestedAt: daysAgo(1), testLatencyMs: 2100,
    description: '字节豆包图像生成，中文 prompt 理解能力强，性价比高',
  },
  {
    id: 'mr3b', stage: 'image', provider: 'Silicon Flow', model: 'Kwai-Kolors/Kolors',
    costPerCall: 0.01, isActive: false, priority: 4, authType: 'bearer',
    baseUrl: 'https://api.siliconflow.cn/v1', apiKey: 'sf-sk-****demo****',
    timeout: 45, maxRetries: 2, testStatus: 'untested',
    description: '快手可灵图像模型，国风场景效果好',
  },
  {
    id: 'mr4', stage: 'video', provider: 'Hailuo AI (MiniMax)', model: 'T2V-01-Director',
    costPerCall: 0.045, isActive: true, priority: 1, authType: 'bearer',
    baseUrl: 'https://api.minimaxi.chat/v1', apiKey: 'mm-sk-****demo****',
    timeout: 120, maxRetries: 1, testStatus: 'success', lastTestedAt: daysAgo(2), testLatencyMs: 28400,
    description: '支持镜头运动控制的视频生成模型',
  },
  {
    id: 'mr5', stage: 'video', provider: 'Runway', model: 'gen4_turbo',
    costPerCall: 0.20, isActive: true, priority: 2, authType: 'bearer',
    baseUrl: 'https://api.dev.runwayml.com/v1', apiKey: 'rw-sk-****demo****',
    timeout: 180, maxRetries: 1, testStatus: 'success', lastTestedAt: daysAgo(3), testLatencyMs: 45200,
    description: '旗舰视频生成，质量最高但耗时长',
  },
  {
    id: 'mr6', stage: 'video', provider: 'Kling AI (Kuaishou)', model: 'kling-v2',
    costPerCall: 0.08, isActive: false, priority: 3, authType: 'bearer',
    baseUrl: 'https://api.klingai.com/v1', apiKey: '',
    timeout: 150, maxRetries: 1, testStatus: 'untested',
    description: '国产视频生成模型，性价比高',
  },
  {
    id: 'mr6b', stage: 'video', provider: '豆包 (ByteDance)', model: 'seedance-2-0',
    costPerCall: 0.06, isActive: true, priority: 4, authType: 'bearer',
    baseUrl: 'https://visual.volcengineapi.com/v1', apiKey: 'volc-ak-****demo****',
    timeout: 150, maxRetries: 1, testStatus: 'success', lastTestedAt: daysAgo(1), testLatencyMs: 35600,
    description: '字节豆包 Seedance 2.0 视频生成，支持文生视频/图生视频，动作连贯性强',
  },
  {
    id: 'mr7', stage: 'audio', provider: 'Fish Audio', model: 'fish-speech-1.5',
    costPerCall: 0.005, isActive: true, priority: 1, authType: 'bearer',
    baseUrl: 'https://api.fish.audio/v1', apiKey: 'fa-sk-****demo****',
    timeout: 30, maxRetries: 3, testStatus: 'success', lastTestedAt: daysAgo(1), testLatencyMs: 950,
    description: '中文语音合成，音色自然、支持情感控制',
  },
  {
    id: 'mr8', stage: 'audio', provider: 'Minimax', model: 'speech-02-hd',
    costPerCall: 0.008, isActive: false, priority: 2, authType: 'bearer',
    baseUrl: 'https://api.minimaxi.chat/v1', apiKey: 'mm-sk-****demo****',
    timeout: 30, maxRetries: 3, testStatus: 'untested',
    description: '高清语音，支持多音色切换',
  },
  {
    id: 'mr9', stage: 'script', provider: 'DeepSeek', model: 'deepseek-chat',
    costPerCall: 0.001, isActive: true, priority: 1, authType: 'bearer',
    baseUrl: 'https://api.deepseek.com/v1', apiKey: 'ds-sk-****demo****',
    maxTokens: 8192, temperature: 0.8,
    timeout: 60, maxRetries: 2, testStatus: 'success', lastTestedAt: daysAgo(0), testLatencyMs: 380,
    description: '低成本文本生成，适合剧本续写和开场白',
  },
  {
    id: 'mr10', stage: 'script', provider: 'Anthropic', model: 'claude-sonnet-4-20250514',
    costPerCall: 0.015, isActive: true, priority: 2, authType: 'api_key_header', authHeaderName: 'x-api-key',
    baseUrl: 'https://api.anthropic.com/v1', apiKey: 'sk-ant-****demo****', apiVersion: '2024-06-01',
    maxTokens: 16384, temperature: 0.7,
    timeout: 90, maxRetries: 2, testStatus: 'success', lastTestedAt: daysAgo(1), testLatencyMs: 1200,
    description: '高质量文本，quality_first 策略使用',
  },
  {
    id: 'mr11', stage: 'script', provider: 'OpenAI', model: 'gpt-4o',
    costPerCall: 0.01, isActive: false, priority: 3, authType: 'bearer',
    baseUrl: 'https://api.openai.com/v1', apiKey: '',
    maxTokens: 8192, temperature: 0.7,
    timeout: 60, maxRetries: 2, testStatus: 'untested',
    description: '备用文本模型',
  },
  {
    id: 'mr12', stage: 'script', provider: 'Zhipu AI', model: 'glm-4-plus',
    costPerCall: 0.005, isActive: false, priority: 4, authType: 'bearer',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4', apiKey: '',
    maxTokens: 8192, temperature: 0.8,
    timeout: 60, maxRetries: 2, testStatus: 'failed', lastTestedAt: daysAgo(5), testError: 'Invalid API key',
    description: '国产大模型，中文创作能力强',
  },
  // ── 自定义接口示例 ──
  {
    id: 'mr-custom-1', stage: 'image', provider: '自建 ComfyUI', model: 'sdxl-workflow',
    costPerCall: 0, isActive: false, priority: 10, isCustom: true,
    authType: 'custom_header', authHeaderName: 'X-ComfyUI-Token',
    baseUrl: 'http://192.168.1.100:8188/api/prompt', apiKey: 'local-token-****',
    httpMethod: 'POST', contentType: 'application/json',
    requestTemplate: '{\n  "prompt": {\n    "3": {\n      "inputs": { "text": "{{prompt}}", "clip": ["4", 0] },\n      "class_type": "CLIPTextEncode"\n    }\n  }\n}',
    responseMapping: 'images[0].url',
    customHeaders: { 'X-Workflow-Id': 'txt2img-sdxl' },
    timeout: 120, maxRetries: 1, testStatus: 'untested',
    description: '自建 ComfyUI 服务器，SDXL 文生图工作流',
  },
]

export const MOCK_FEATURE_FLAGS: FeatureFlag[] = [
  { id: 'ff1', key: 'nine_grid_mode', label: '九宫格机位', enabled: true, description: '允许使用九宫格分镜模式' },
  { id: 'ff2', key: 'lora_training', label: 'LoRA 角色训练', enabled: false, description: '允许用户训练自定义角色 LoRA' },
  { id: 'ff3', key: 'quality_first', label: 'quality_first 模式', enabled: true, description: '允许使用高质量模型策略' },
  { id: 'ff4', key: 'batch_export', label: '批量导出', enabled: true, description: '允许批量导出多集内容' },
  { id: 'ff5', key: 'team_collab', label: '团队协作', enabled: false, description: '允许多人协作编辑项目' },
  { id: 'ff6', key: 'api_access', label: 'API 访问', enabled: true, description: '允许通过 API 调用创作流程' },
]

export const MOCK_SYSTEM_CONFIG: SystemConfig = {
  creditPriceYuan: 0.01,
  modelRoutes: MOCK_MODEL_ROUTES,
  featureFlags: MOCK_FEATURE_FLAGS,
}

export const MOCK_AUDIT_LOG: AuditLogEntry[] = [
  { id: 'al1', adminId: 'admin-1', adminName: '李管理', action: 'ban_user', targetType: 'user', targetId: 'user-14', details: '封禁用户刘强：发布违规内容', createdAt: daysAgo(7) },
  { id: 'al2', adminId: 'admin-1', adminName: '李管理', action: 'review_reject', targetType: 'content', targetId: 'rv6', details: '驳回视频：含暴力元素', createdAt: daysAgo(7) },
  { id: 'al3', adminId: 'admin-1', adminName: '李管理', action: 'review_approve', targetType: 'content', targetId: 'rv4', details: '通过项目：修仙直播间', createdAt: daysAgo(4) },
  { id: 'al4', adminId: 'admin-1', adminName: '李管理', action: 'adjust_credits', targetType: 'user', targetId: 'user-1', details: '补偿500积分给张创作', createdAt: daysAgo(1) },
  { id: 'al5', adminId: 'admin-1', adminName: '李管理', action: 'create_promo', targetType: 'subscription', targetId: 'pc5', details: '创建优惠码 MCN15', createdAt: daysAgo(12) },
  { id: 'al6', adminId: 'admin-1', adminName: '李管理', action: 'toggle_feature', targetType: 'system', targetId: 'ff2', details: '关闭 LoRA 角色训练', createdAt: daysAgo(15) },
  { id: 'al7', adminId: 'admin-1', adminName: '李管理', action: 'update_model_route', targetType: 'system', targetId: 'mr3', details: '启用 Hailuo 02 视频模型', createdAt: daysAgo(20) },
  { id: 'al8', adminId: 'admin-1', adminName: '李管理', action: 'ban_user', targetType: 'user', targetId: 'user-21', details: '封禁用户何佳：恶意刷积分', createdAt: daysAgo(25) },
  { id: 'al9', adminId: 'admin-1', adminName: '李管理', action: 'review_approve', targetType: 'content', targetId: 'rv5', details: '通过项目：都市最强战神', createdAt: daysAgo(5) },
  { id: 'al10', adminId: 'admin-1', adminName: '李管理', action: 'update_plan_config', targetType: 'subscription', targetId: 'studio', details: '工作室套餐积分从25000调至30000', createdAt: daysAgo(30) },
]

export const MOCK_PLATFORM_STATS: PlatformStats = {
  dau: 1247,
  mau: 8930,
  totalRevenue: 156800,
  monthlyRevenue: 42300,
  totalCreditsConsumed: 3450000,
  totalModelCost: 28600,
  conversionRate: 12.3,
}

export function generatePlatformDailyStats(days: number = 30): DailyUsageStat[] {
  return Array.from({ length: days }, (_, i) => ({
    date: dateStr(days - 1 - i),
    creditsUsed: Math.floor(Math.random() * 80000 + 60000),
    projectsCreated: Math.floor(Math.random() * 40 + 20),
    episodesCompleted: Math.floor(Math.random() * 25 + 10),
  }))
}
