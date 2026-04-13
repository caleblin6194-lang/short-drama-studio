// ===== Project =====
export type ProjectStatus = 'draft' | 'casting' | 'shooting' | 'mastering' | 'published' | 'archived'

// ===== Tags =====
export type TypeTag =
  | '穿越' | '逆袭' | '重生' | '爱情' | '玄幻' | '现代言情' | '总裁'
  | '虐恋' | '甜宠' | '神豪' | '女性成长' | '古风权谋' | '家庭伦理'
  | '复仇' | '悬疑推理' | '古风言情' | '生活' | '刑侦' | '恐怖'

export type SettingTag =
  | '大女主' | '马甲' | '小人物' | '无敌神医' | '草根' | '扮猪吃虎'
  | '青梅竹马' | '打脸虐渣' | '先婚后爱' | '都市修仙' | '闪婚' | '萌宝'
  | '豪门恩怨' | '强者回归' | '破镜重圆' | '欢喜冤家' | '赘婿逆袭'
  | '暗恋成真' | '亲情' | '传承觉醒'

export type WorldTag = '古风' | '架空' | '民国' | '乡村' | '现代' | '星际' | '都市'
export type RegionTag = '国内' | '北美' | '欧洲' | '东南亚' | '日韩' | '中东' | '拉美'

export interface TagSet {
  type: TypeTag
  setting: SettingTag
  world: WorldTag
  region: RegionTag
  audience: 'male' | 'female' | 'all'
}

// ===== Inferred Config =====
export type AspectRatio = '9:16' | '16:9' | '4:3' | '3:4' | '1:1' | '21:9'

export type ArtStyle =
  | 'modern_realism' | 'cyberpunk_neon' | 'ink_wash' | 'fantasy_concept'
  | 'rural_natural' | 'vintage_sepia' | 'urban_realism'

export type CastEthnicity =
  | 'east_asian' | 'caucasian' | 'european' | 'southeast_asian'
  | 'japanese_korean' | 'middle_eastern' | 'latino'

export interface InferredConfig {
  aspectRatio: AspectRatio
  artStyle: ArtStyle
  modelStrategy: 'cost_first' | 'quality_first'
  shotMode: 'single' | 'nine_grid'
  castEthnicity: CastEthnicity
  language: string
  targetPlatforms: string[]
  episodeLengthSec: number
  recommendedShotCount: number
}

// ===== Script =====
export interface Script {
  id: string
  rawText: string
  estimatedDurationSec: number
  characterCount: number
  wordLimit: number
  history: ScriptVersion[]
}

export interface ScriptVersion {
  id: string
  rawText: string
  savedAt: string
  source: 'auto_save' | 'manual_save' | 'opening_pick' | 'ai_extend'
}

// ===== Asset Library =====
export interface AssetLibrary {
  scenes: SceneAsset[]
  characters: CharacterAsset[]
  props: PropAsset[]
}

export type AssetStatus = 'pending' | 'generating' | 'ready' | 'failed'

export interface AssetBase {
  id: string
  name: string
  description: string
  imageUrl?: string
  status: AssetStatus
  approvedByUser: boolean
}

export interface SceneAsset extends AssetBase {
  kind: 'scene'
  timeOfDay?: 'day' | 'night' | 'dusk' | 'dawn'
  mood?: string
}

export interface CharacterAsset extends AssetBase {
  kind: 'character'
  tier: 'lead' | 'antagonist' | 'support' | 'extra'
  age?: string
  gender?: 'male' | 'female' | 'other'
}

export interface PropAsset extends AssetBase {
  kind: 'prop'
}

export type AnyAsset = SceneAsset | CharacterAsset | PropAsset

// ===== Shot =====
export type PipelineStatus = 'pending' | 'queued' | 'rendering' | 'done' | 'failed' | 'stale'

export interface PipelineStage {
  status: PipelineStatus
  cost?: number
  modelUsed?: string
  attemptCount: number
}

export interface ShotPipeline {
  image: PipelineStage
  video: PipelineStage
  audio: PipelineStage
}

export interface Shot {
  id: string
  number: string
  order: number
  sceneRef: string
  characterRefs: string[]
  propRefs: string[]
  description: string
  dialogue: string
  cameraDirection?: string
  durationSec: number
  pipeline: ShotPipeline
  imageUrl?: string
  videoUrl?: string
  audioUrl?: string
  finalClipUrl?: string
}

// ===== Subtitle Style =====
export type SubtitleAnimation = 'none' | 'fade' | 'typewriter' | 'bounce' | 'karaoke' | 'slide'
export type SubtitlePosition = 'bottom' | 'top' | 'center'

export interface SubtitleStyle {
  animation: SubtitleAnimation
  position: SubtitlePosition
  fontSize: 'sm' | 'md' | 'lg'
  fontColor: string
  backgroundColor: string
  backgroundEnabled: boolean
}

export const SUBTITLE_PRESETS: { label: string; value: SubtitleStyle }[] = [
  {
    label: '经典白字',
    value: { animation: 'fade', position: 'bottom', fontSize: 'md', fontColor: '#ffffff', backgroundColor: 'rgba(0,0,0,0.6)', backgroundEnabled: true },
  },
  {
    label: '打字机',
    value: { animation: 'typewriter', position: 'bottom', fontSize: 'md', fontColor: '#ffffff', backgroundColor: 'rgba(0,0,0,0.7)', backgroundEnabled: true },
  },
  {
    label: '弹跳入场',
    value: { animation: 'bounce', position: 'bottom', fontSize: 'md', fontColor: '#fff700', backgroundColor: 'rgba(0,0,0,0.5)', backgroundEnabled: true },
  },
  {
    label: '卡拉OK',
    value: { animation: 'karaoke', position: 'bottom', fontSize: 'md', fontColor: '#00ff88', backgroundColor: 'rgba(0,0,0,0.6)', backgroundEnabled: true },
  },
  {
    label: '滑入',
    value: { animation: 'slide', position: 'bottom', fontSize: 'md', fontColor: '#ffffff', backgroundColor: 'rgba(0,0,0,0.6)', backgroundEnabled: true },
  },
  {
    label: '顶部字幕',
    value: { animation: 'fade', position: 'top', fontSize: 'sm', fontColor: '#ffffff', backgroundColor: 'rgba(0,0,0,0.5)', backgroundEnabled: true },
  },
]

// ===== Master Cut =====
export interface MasterCut {
  id: string
  projectId: string
  subtitlesEnabled: boolean
  subtitleStyle: SubtitleStyle
  bgmEnabled: boolean
  bgmTrack?: string
  renderedUrl?: string
  durationSec: number
}

// ===== Region Variant =====
export type VariantStatus = 'pending' | 'translating' | 'casting' | 'shooting' | 'mastering' | 'done' | 'failed'

export interface RegionVariant {
  id: string
  parentProjectId: string
  region: RegionTag
  status: VariantStatus
  estimatedCost: number
  actualCost?: number
}

// ===== Opening =====
export interface Opening {
  title: string
  body: string
  line: string
}

// ===== Auth & User =====
export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  createdAt: string
  lastLoginAt: string
  isBanned: boolean
  banReason?: string
}

// ===== Subscription =====
export type PlanTier = 'free' | 'creator' | 'studio' | 'flagship'
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'past_due'

export interface PlanConfig {
  tier: PlanTier
  name: string
  monthlyPrice: number
  monthlyCredits: number
  isOneTime: boolean
  maxProjects: number
  features: string[]
}

export interface Subscription {
  id: string
  userId: string
  planTier: PlanTier
  status: SubscriptionStatus
  startedAt: string
  expiresAt: string
  autoRenew: boolean
  renewalHistory: RenewalRecord[]
}

export interface RenewalRecord {
  id: string
  date: string
  amount: number
  planTier: PlanTier
  method: 'auto' | 'manual'
}

// ===== Credits =====
export type CreditTransactionType =
  | 'subscription_grant' | 'one_time_grant' | 'admin_adjust'
  | 'consumption' | 'refund'

export interface CreditTransaction {
  id: string
  userId: string
  type: CreditTransactionType
  amount: number
  balance: number
  projectId?: string
  projectTitle?: string
  operation?: string
  note?: string
  createdAt: string
}

export interface CreditBalance {
  total: number
  used: number
  remaining: number
  monthlyBudget: number
}

// ===== Admin: Promo Code =====
export interface PromoCode {
  id: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  applicablePlans: PlanTier[]
  maxUses: number
  usedCount: number
  validFrom: string
  validUntil: string
  isActive: boolean
}

// ===== Admin: Order =====
export type OrderStatus = 'completed' | 'pending' | 'refunded' | 'failed'

export interface Order {
  id: string
  userId: string
  userName: string
  planTier: PlanTier
  amount: number
  status: OrderStatus
  promoCode?: string
  createdAt: string
}

// ===== Admin: Content Review =====
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged'

export interface ReviewItem {
  id: string
  projectId: string
  projectTitle: string
  userId: string
  userName: string
  type: 'project' | 'video'
  status: ReviewStatus
  reason?: string
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
}

// ===== Admin: System Config =====
export type ModelStage = 'image' | 'video' | 'audio' | 'script'
export type ModelTestStatus = 'untested' | 'testing' | 'success' | 'failed'

export type ModelAuthType = 'bearer' | 'api_key_header' | 'custom_header' | 'query_param' | 'none'

export interface ModelRoute {
  id: string
  stage: ModelStage
  provider: string
  model: string
  costPerCall: number
  isActive: boolean
  priority: number
  isCustom?: boolean        // 是否为自定义接口
  // API 对接
  baseUrl: string
  apiKey: string
  apiVersion?: string
  // 认证方式
  authType: ModelAuthType
  authHeaderName?: string   // authType=api_key_header/custom_header 时的 header 名
  authQueryParam?: string   // authType=query_param 时的参数名
  // 自定义请求配置
  customHeaders?: Record<string, string>
  requestTemplate?: string  // JSON 模板，用 {{prompt}} {{image_url}} 等占位符
  responseMapping?: string  // 从响应 JSON 提取结果的路径，如 data.output.url
  httpMethod?: 'POST' | 'GET'
  contentType?: string      // 默认 application/json
  // 模型参数
  maxTokens?: number
  temperature?: number
  timeout: number           // 秒
  maxRetries: number
  // 状态
  testStatus: ModelTestStatus
  lastTestedAt?: string
  testLatencyMs?: number
  testError?: string
  description?: string
}

export interface FeatureFlag {
  id: string
  key: string
  label: string
  enabled: boolean
  description: string
}

export interface SystemConfig {
  creditPriceYuan: number
  modelRoutes: ModelRoute[]
  featureFlags: FeatureFlag[]
}

// ===== Admin: Audit Log =====
export type AdminAction =
  | 'ban_user' | 'unban_user' | 'adjust_credits'
  | 'update_plan_config' | 'create_promo' | 'toggle_feature'
  | 'review_approve' | 'review_reject' | 'update_model_route'

export interface AuditLogEntry {
  id: string
  adminId: string
  adminName: string
  action: AdminAction
  targetType: 'user' | 'system' | 'content' | 'subscription'
  targetId: string
  details: string
  createdAt: string
}

// ===== Analytics =====
export interface DailyUsageStat {
  date: string
  creditsUsed: number
  projectsCreated: number
  episodesCompleted: number
}

export interface PlatformStats {
  dau: number
  mau: number
  totalRevenue: number
  monthlyRevenue: number
  totalCreditsConsumed: number
  totalModelCost: number
  conversionRate: number
}

// ===== Story Structure =====
export type StoryBeatId = 'opening' | 'buildup' | 'climax' | 'twist' | 'suspense'

export interface StoryBeat {
  id: StoryBeatId
  icon: string
  label: string
  timeRange: string
  text: string
}

export interface StoryStructurePlan {
  durationLabel: string
  beats: StoryBeat[]
  hookScene: {
    label: string
    timeRange: string
    location: string
    characters: string[]
    visualCue: string
    dialogueLines: string[]
  }
  generatedAt: string
}

// ===== Project =====
export interface Project {
  id: string
  title: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  lastEnteredStage: 1 | 2 | 3 | 4
  tagSet: TagSet
  inferredConfig: InferredConfig
  script: Script
  assetLibrary: AssetLibrary
  shots: Shot[]
  masterCut: MasterCut | null
  variants: RegionVariant[]
  storyStructure: StoryStructurePlan | null
  costSpent: number
  estimatedCostRemaining: number
}
