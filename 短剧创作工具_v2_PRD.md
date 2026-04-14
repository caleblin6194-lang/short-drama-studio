# 短剧创作工具 v2.0 产品需求文档

| 字段 | 内容 |
|---|---|
| 文档版本 | v2.0 |
| 状态 | 立项评审稿 |
| 受众 | 产品 / 设计 / 前端 / 后端 / 算法 / 测试 |
| 配套原型 | 见对话内的 4 个 Visualizer 交互原型 |

---

## 0. 阅读指南

本 PRD 是从竞品(纳米 AI 短剧工具)的 7 步线性流水线重构而来。原版本的逻辑骨架是对的(资产库先行 + 非线性回改),但 UI 是为懂行的人设计的,新手转化率低。本版本把 7 步压成 4 阶段,在不牺牲专业能力的前提下大幅降低新手认知门槛,并加入一项关键差异化能力:**一稿多投**(同一剧本一键生成多个地域市场的本地化版本)。

阅读顺序建议:第 1 章看清楚我们要做什么和为什么 → 第 2 章看整体架构 → 第 3 章看数据模型(这是工程的脊梁)→ 第 4-8 章按阶段看交互和接口细节 → 第 9-12 章看跨阶段机制和工程考虑 → 第 13 章看 MVP 怎么砍刀 → 第 14 章看怎么验收。

---

## 1. 产品定位

### 1.1 一句话定位

让没拍过短剧的人,**点四下、等七分钟**,做出一集可以直接发抖音/红果/ReelShort 的 AI 短剧;让会拍的人,五分钟做一集,十分钟做五个语种版本。

### 1.2 核心价值主张

1. **门槛低到底**:不需要懂分镜、不需要懂模型、不需要懂画面比例。会写故事就行,不会写故事 AI 帮你起头。
2. **资产复用强**:角色/场景/道具一次建库,跨镜头跨集数跨地域复用。
3. **非线性回改**:任何一步都能回去改,下游自动同步。
4. **一稿多投**:同一个剧本骨架,可以一键生成国内、北美、东南亚、日韩、中东 5 个市场的本地化版本(出海团队的核武器,所有竞品都没有)。

### 1.3 与纳米 AI 7 步流水线的差异

| 维度 | 纳米原版 | 本产品 |
|---|---|---|
| 步骤数 | 7 个独立 Tab | 4 个连续阶段 |
| 首屏负担 | 全局设定要先选 6+ 个技术参数 | 4 行标签点 4 下,参数自动反推 |
| 剧本起点 | 空白编辑器 | AI 预生成 3 个开场白可选 |
| 资产管理 | 独立 Tab "资产库" | 伪装成"剧组筹备会"审片流程 |
| 分镜编辑 | 一屏摊开 10+ 控件 | 大预览 + 一句话改镜 + 高级折叠 |
| 视频/口型 | Step 5 / Step 6 独立 Tab | 折叠为镜头流水线的内部阶段 |
| 出海支持 | 无 | 一稿多投到 5 个市场 |

### 1.4 目标用户

**P0 主要用户(新手创作者)**

- 短视频创作者,看过短剧但没拍过
- 每天可投入 1-3 小时
- 对 AI 工具有基本使用经验(用过 ChatGPT / 即梦 / 可灵)
- 不懂镜头语言、不知道什么是九宫格机位、不在乎模型策略
- 核心诉求:做出能发出去、有人看的内容

**P1 次要用户(出海 MCN / 短剧工作室)**

- 已有国内短剧拍摄经验
- 想低成本试水海外市场,但不懂当地文化
- 核心诉求:同一个剧本快速做多语种版本,看哪个市场跑得动

**非目标用户**

- 院线级动画团队、广告 4A、专业影视公司——他们会用 Runway / Midjourney 配 After Effects,本工具的天花板对他们太低

### 1.5 北极星指标与辅助指标

**北极星**:**新用户首日完成首集发布率**(NU1D-Publish Rate)。定义为新注册用户在 24 小时内完成"创建项目 → 完成阶段四 → 至少导出 1 次"的比例。目标 ≥ 15%。

**辅助指标**

- **首集创建到合成完成的中位时长**:目标 ≤ 12 分钟(纯操作 + 等待生成)
- **阶段间流失漏斗**:阶段一→二→三→四 各阶段流失率,任一节流失率 > 30% 触发设计 review
- **一稿多投使用率**:已发布项目中触发过至少一次 RegionVariant 的比例,目标 ≥ 8%(出海是高价值动作,占比不会高但 LTV 大)
- **新手对"高级设置"的打开率**:目标 < 20%(打开越少说明默认推断越准)

---

## 2. 信息架构

### 2.1 整体结构(5 屏)

```
[第 0 屏] 项目库
    │  新建 / 选既有项目
    ▼
[阶段一] 故事
    ├─ 标签选择(类型 / 设定 / 背景 / 地域 / 受众)
    ├─ 自动反推技术参数(画面比例 / 画风 / 选角 / 模型策略 / 分镜模式 / 投放规格)
    ├─ AI 预生成开场白(3 选 1 起手)
    └─ 剧本编辑器(用户在 AI 起手基础上扩写或改写)
            │
            ▼
[阶段二] 剧组筹备会
    ├─ 剧本自动解析(LLM 抽取场景 / 角色 / 道具)
    ├─ 资产卡网格(三类合一展示)
    ├─ 单卡操作:换一张 / 微调 / 通过
    ├─ 全局动作:一键全部通过 / 一键重抽 / 切换地域
    └─ 一致性机制:任意修改下游自动同步
            │
            ▼
[阶段三] 开机拍摄
    ├─ 镜头列表自动生成(从剧本 + 资产推导)
    ├─ 大预览框 + 镜头编辑面板
    ├─ 自动开拍(流水线调度:分镜图 → 视频 → 配音口型)
    ├─ 一句话改镜(80% 修改场景的主路径)
    ├─ 高级调整(构图 / 站位 / 台词 / 九宫格机位)
    └─ 横向时间线(12 镜头一览)
            │
            ▼
[阶段四] 成片预览
    ├─ 9:16 播放器(整集 loop 播放)
    ├─ 片头/字幕/BGM/片尾配置
    ├─ 整集时间轴(按镜头跳转)
    ├─ 导出三件套(竖版 / 横版 / 封面)
    └─ 一稿多投到其他地域市场
```

### 2.2 阶段间数据流向

```
[阶段一]
TagSet ──┐
         ├──→ InferredConfig(反推参数)─────┐
Script ──┼──→ ParsedAssets(解析出资产)───┐ │
         │                                │ │
         ▼                                ▼ ▼
                              [阶段二]
                              AssetLibrary { scenes, chars, props }
                                              │
                                              ▼
                              [阶段三]
                              Shot[] (引用 AssetLibrary 中的 id)
                              ShotPipeline (image → video → audio)
                                              │
                                              ▼
                              [阶段四]
                              MasterCut (拼接 + 字幕 + BGM + 片头尾)
                                              │
                                              ▼
                              ExportArtifact[] (vert / horz / cover)
                                              │
                                              ▼
                              RegionVariant[] (一稿多投)
```

### 2.3 非线性回改原则

任何阶段都能跳回上游修改,工程层面必须实现**失效传播**:

- 改 TagSet → InferredConfig 重算 → 用户可选是否重生成所有资产
- 改场景资产 → 引用该场景的所有 Shot 自动标记为 stale,提示用户重生成
- 改某 Shot 的画面描述 → 该 Shot 的 image / video / audio 全部置为 pending
- 改某 Shot 的图 → 该 Shot 的 video / audio 置为 pending(因为下游依赖)
- 改某 Shot 的视频 → 该 Shot 的 audio 置为 pending

详见第 9.1 节。

---

## 3. 核心数据模型

以下用 TypeScript 风格表达,实际实现可用任何强类型语言。所有 id 默认 ULID,所有时间戳默认 ISO 8601。

### 3.1 Project(项目)

```typescript
interface Project {
  id: string
  ownerId: string
  title: string                    // 用户起的名,默认是剧本第一句的前 12 个字
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  lastEnteredStage: 1 | 2 | 3 | 4  // 用户上次离开时停在哪一阶段(用于回到工具时定位)

  // 阶段产出
  tagSet: TagSet
  inferredConfig: InferredConfig
  script: Script
  assetLibrary: AssetLibrary
  shots: Shot[]
  masterCut: MasterCut | null
  variants: RegionVariant[]        // 一稿多投产物

  // 元数据
  costSpent: number                // 累计消耗的积分
  estimatedCostRemaining: number   // 完成下一阶段预计要花的积分
}

type ProjectStatus =
  | 'draft'           // 阶段一未完成
  | 'casting'         // 阶段二中
  | 'shooting'        // 阶段三中
  | 'mastering'       // 阶段四中
  | 'published'       // 至少导出过一次
  | 'archived'
```

### 3.2 TagSet(标签组合)

```typescript
interface TagSet {
  type: TypeTag                    // 19 选 1
  setting: SettingTag              // 20 选 1
  world: WorldTag                  // 7 选 1
  region: RegionTag                // 7 选 1
  audience: 'male' | 'female' | 'all'
}

type TypeTag =
  | '穿越' | '逆袭' | '重生' | '爱情' | '玄幻' | '现代言情' | '总裁'
  | '虐恋' | '甜宠' | '神豪' | '女性成长' | '古风权谋' | '家庭伦理'
  | '复仇' | '悬疑推理' | '古风言情' | '生活' | '刑侦' | '恐怖'

type SettingTag =
  | '大女主' | '马甲' | '小人物' | '无敌神医' | '草根' | '扮猪吃虎'
  | '青梅竹马' | '打脸虐渣' | '先婚后爱' | '都市修仙' | '闪婚' | '萌宝'
  | '豪门恩怨' | '强者回归' | '破镜重圆' | '欢喜冤家' | '赘婿逆袭'
  | '暗恋成真' | '亲情' | '传承觉醒'

type WorldTag = '古风' | '架空' | '民国' | '乡村' | '现代' | '星际' | '都市'

type RegionTag = '国内' | '北美' | '欧洲' | '东南亚' | '日韩' | '中东' | '拉美'
```

### 3.3 InferredConfig(标签反推的技术参数)

```typescript
interface InferredConfig {
  aspectRatio: AspectRatio
  artStyle: ArtStyle
  modelStrategy: 'cost_first' | 'quality_first'
  shotMode: 'single' | 'nine_grid'
  castEthnicity: CastEthnicity
  language: string                 // ISO 639-1: 'zh', 'en', 'id', 'ja', 'ar', 'es'
  targetPlatforms: PlatformId[]
  episodeLengthSec: number         // 60 | 75 | 90
  recommendedShotCount: number     // 8-15

  // 用户在高级设置里覆盖的字段记录在这里,用于 UI 标识
  overrides?: Partial<InferredConfig>
}

type AspectRatio = '9:16' | '16:9' | '4:3' | '3:4' | '1:1' | '21:9'

type ArtStyle =
  | 'modern_realism' | 'cyberpunk_neon' | 'ink_wash' | 'fantasy_concept'
  | 'rural_natural' | 'vintage_sepia' | 'urban_realism'

type CastEthnicity =
  | 'east_asian' | 'caucasian' | 'european' | 'southeast_asian'
  | 'japanese_korean' | 'middle_eastern' | 'latino'

type PlatformId =
  | 'douyin' | 'kuaishou' | 'hongguo'           // CN
  | 'reelshort' | 'dramabox' | 'goodshort'      // NA / EU
  | 'tiktok_id' | 'wetv'                        // SEA
  | 'tiktok_jp' | 'bump'                        // JP / KR
  | 'shortmax' | 'yoozoo_mena'                  // ME
  | 'flextv'                                    // LATAM
```

### 3.4 标签到 InferredConfig 的反推规则

这是一组确定性规则(不需要 LLM),工程上是一个查找表 + 几条 if-else。完整规则放第 4.2 节。

### 3.5 Script(剧本)

```typescript
interface Script {
  id: string
  rawText: string                  // 用户最终的剧本全文,纯文本
  estimatedDurationSec: number     // 按"中文 4 字/秒,英文 2.5 词/秒"估算
  characterCount: number
  wordLimit: number                // 默认 10000
  history: ScriptVersion[]         // 自动版本快照
}

interface ScriptVersion {
  id: string
  rawText: string
  savedAt: string
  source: 'auto_save' | 'manual_save' | 'opening_pick' | 'ai_extend'
}
```

### 3.6 AssetLibrary(资产库)

```typescript
interface AssetLibrary {
  scenes: SceneAsset[]
  characters: CharacterAsset[]
  props: PropAsset[]
}

interface AssetBase {
  id: string
  name: string                     // 'Manhattan Ballroom' / '豪华婚宴大厅'
  description: string              // 长描述,用于生成 prompt
  imageUrl?: string
  imagePromptUsed?: string         // 生成此图所用的最终 prompt(便于复现)
  status: AssetStatus
  approvedByUser: boolean          // 用户是否点过"通过"
  generatedAt?: string
  variantOf?: string               // 如果是其他地域 variant,指向源 asset id
}

type AssetStatus = 'pending' | 'generating' | 'ready' | 'failed'

interface SceneAsset extends AssetBase {
  kind: 'scene'
  timeOfDay?: 'day' | 'night' | 'dusk' | 'dawn'
  weather?: string
  mood?: string                    // 'tense' | 'romantic' | 'gloomy'
}

interface CharacterAsset extends AssetBase {
  kind: 'character'
  tier: 'lead' | 'antagonist' | 'support' | 'extra'
  age?: string                     // '20s' | '30s' | 'middle-aged'
  gender?: 'male' | 'female' | 'other'
  variantGroup?: string            // 同一角色不同状态的分组(如"陈默-落魄""陈默-觉醒")
  consistencyToken?: string        // 角色一致性 token,用于 IP-Adapter / LoRA
}

interface PropAsset extends AssetBase {
  kind: 'prop'
}
```

### 3.7 Shot(分镜)

```typescript
interface Shot {
  id: string
  number: string                   // 'S01' ... 'S12'
  order: number                    // 整数,允许中间插入

  // 引用资产库
  sceneRef: string
  characterRefs: string[]
  propRefs: string[]

  // 内容(从剧本生成,可手动修改)
  description: string              // 画面描述,prompt 主体
  dialogue: string                 // 台词(可空,可纯音效)
  cameraDirection?: string         // 'close-up' | 'wide' | 'over-shoulder' | ...
  composition?: string             // 用户选的构图
  durationSec: number              // 该镜头时长,默认 5-8s

  // 流水线状态
  pipeline: ShotPipeline

  // 输出
  imageUrl?: string
  videoUrl?: string
  audioUrl?: string                // 配音文件
  finalClipUrl?: string            // image+video+audio 合成后的最终片段

  // 用户编辑历史
  editHistory: ShotEdit[]
}

interface ShotPipeline {
  image: PipelineStage
  video: PipelineStage
  audio: PipelineStage
}

interface PipelineStage {
  status: 'pending' | 'queued' | 'rendering' | 'done' | 'failed' | 'stale'
  jobId?: string                   // 异步任务 id
  startedAt?: string
  completedAt?: string
  error?: string
  cost?: number                    // 此阶段消耗的积分
  modelUsed?: string               // 'flux-pro' | 'kling-1.6' | 'minimax-tts-v2'
  attemptCount: number             // 重试次数
}

interface ShotEdit {
  id: string
  editedAt: string
  type: 'one_liner' | 'composition' | 'staging' | 'dialogue' | 'nine_grid'
  payload: string                  // 用户的修改内容
  invalidatedStages: ('image' | 'video' | 'audio')[]
}
```

### 3.8 MasterCut(成片配置)

```typescript
interface MasterCut {
  id: string
  projectId: string

  // 头尾配置
  intro: IntroSegment[]
  outro: OutroSegment[]

  // 全局开关
  subtitlesEnabled: boolean
  subtitleStyle: SubtitleStyle
  bgmEnabled: boolean
  bgmTrack?: string                // BGM 音轨 id

  // 渲染产物
  renderedUrl?: string             // 整集合成后的 mp4
  durationSec: number
  renderedAt?: string
  renderHash?: string              // 内容指纹,用于增量重渲染
}

interface IntroSegment {
  type: 'brand_logo' | 'title_card' | 'cold_open' | 'custom'
  durationSec: number
  config: Record<string, unknown>
}

interface OutroSegment {
  type: 'next_episode_teaser' | 'follow_cta' | 'credits' | 'custom'
  durationSec: number
  config: Record<string, unknown>
}

interface SubtitleStyle {
  font: string
  size: number
  color: string
  strokeColor: string
  position: 'bottom' | 'top' | 'center'
  maxCharsPerLine: number
}
```

### 3.9 RegionVariant(一稿多投)

```typescript
interface RegionVariant {
  id: string
  parentProjectId: string
  region: RegionTag

  // 复用自父项目
  scriptStructure: ShotStructureRef[]   // 镜头骨架(只有节奏点,没有具体台词)

  // 重生成的内容
  localizedScript: Script               // 翻译 + 文化本地化后的剧本
  localizedAssetLibrary: AssetLibrary   // 重生成的角色/场景(本地选角)
  localizedShots: Shot[]                // 重生成的成片
  localizedMasterCut: MasterCut

  // 该地域的目标配置
  targetConfig: InferredConfig          // 选角风格 / 语言 / 平台 / 时长

  status: VariantStatus
  createdAt: string
  estimatedCost: number
  actualCost?: number
}

interface ShotStructureRef {
  parentShotId: string
  beatType: 'hook' | 'setup' | 'conflict' | 'twist' | 'cliffhanger'
  emotionalIntensity: 1 | 2 | 3 | 4 | 5
}

type VariantStatus =
  | 'pending'
  | 'translating'      // LLM 在做剧本本地化
  | 'casting'          // 在重生成角色资产
  | 'shooting'         // 在跑流水线
  | 'mastering'        // 在合成成片
  | 'done'
  | 'failed'
```

---

## 4. 阶段一:故事

### 4.1 标签选择器

**交互细节**

- 4 行标签水平展示:类型 / 设定 / 背景 / 地域。前 3 行用绿色 pill 标签,第 4 行(地域)用蓝色 pill 标签——视觉上区分"创作决策"和"市场决策"。
- 每行单选,点击切换。任意标签变化都立即触发 InferredConfig 重算和参考剧库刷新。
- 受众(男频/女频/不限)放在右上角作为独立 toggle group,默认根据"类型"标签自动判断(总裁→女频,神豪→男频),用户可覆盖。
- 默认值:用户首次打开取上次创建项目的标签;首次新用户取 `{ 类型:'逆袭', 设定:'赘婿逆袭', 背景:'都市', 地域:'国内', 受众:'女频' }`(我们已知的高转化默认组合)。

**状态机**

```
[idle] ──[user clicks tag]──> [recomputing]
[recomputing] ──[infer + fetch refs done]──> [idle]
```

整个状态切换应在 200ms 内完成。InferredConfig 反推是纯本地查表,不走网络。参考剧库可走 SWR 缓存。

### 4.2 标签到 InferredConfig 的完整反推规则

**aspectRatio**:始终默认 `9:16`(短剧标准),除非用户在高级设置里改。

**artStyle**:由 `world` 决定。

| world | artStyle |
|---|---|
| 古风 | ink_wash |
| 架空 | fantasy_concept |
| 民国 | vintage_sepia |
| 乡村 | rural_natural |
| 现代 | modern_realism |
| 星际 | cyberpunk_neon |
| 都市 | urban_realism |

**modelStrategy**:由 `type` 决定。

```
quality_first: 玄幻 / 古风权谋 / 古风言情 / 悬疑推理 / 刑侦 / 恐怖
cost_first:    生活 / 家庭伦理 / 现代言情
其余:           cost_first(默认偏便宜)
```

**shotMode**:由 `type` 决定。

```
nine_grid: 玄幻 / 悬疑推理 / 刑侦 / 复仇 / 恐怖 / 古风权谋(需要丰富机位)
single:    其他(单镜头足够)
```

**castEthnicity**:由 `region` 决定。

| region | castEthnicity |
|---|---|
| 国内 | east_asian |
| 北美 | caucasian |
| 欧洲 | european |
| 东南亚 | southeast_asian |
| 日韩 | japanese_korean |
| 中东 | middle_eastern |
| 拉美 | latino |

**language**:由 `region` 决定。`国内→zh`、`北美/欧洲→en`、`东南亚→id`(印尼语为基线,后续可扩马来/泰)、`日韩→ja`(日语为基线)、`中东→ar`、`拉美→es`。

**targetPlatforms** + **episodeLengthSec**:由 `region` 决定。

| region | platforms | episodeLengthSec |
|---|---|---|
| 国内 | douyin, hongguo | 75 |
| 北美 | reelshort, dramabox | 90 |
| 欧洲 | reelshort, goodshort | 90 |
| 东南亚 | tiktok_id, wetv | 60 |
| 日韩 | tiktok_jp, bump | 60 |
| 中东 | shortmax, yoozoo_mena | 90 |
| 拉美 | dramabox, flextv | 90 |

**recommendedShotCount**:`Math.round(episodeLengthSec / 7)`,每镜约 7 秒。

### 4.3 开场白预生成

**触发**:用户每次切换标签组合,后台异步调用一次 LLM,缓存 5 分钟。如果用户在 5 分钟内回到同一组合,直接读缓存。

**LLM Prompt 模板**

```
你是一位资深短剧编剧,擅长写抓人眼球的开场。

请基于以下设定,写出 3 个完全不同的、可拍摄的短剧开场白。

【受众】{audience}
【类型】{type}
【设定】{setting}
【背景】{world}
【目标市场】{region}

要求:
1. 每个开场必须是 3-5 句话的具体场景,不是大纲,不是梗概
2. 必须包含一个抓眼球的视觉元素和一句有冲突的关键台词
3. 三个开场必须用三种完全不同的"事件触发"(婚礼/家宴/电话/醒来/相遇/受辱…)
4. 必须符合 {region} 市场的叙事节奏和文化习惯
5. 关键台词要金句感强,适合做成抖音字幕卡

输出 JSON 格式:
{
  "openings": [
    { "title": "5 字以内标题", "body": "3-5 句场景描述", "line": "关键台词,带引号" },
    ...
  ]
}
```

**降级策略**:LLM 调用失败或超时(> 8 秒)时,返回模板兜底文案(参见原型代码中的 `defaultOpenings()`)。

### 4.4 参考剧库

**数据来源**:维护一个内部表 `reference_dramas`,字段为 `(region, type, title, platform, view_count, year, cover_url)`。每周由运营 + 爬虫更新一次。

**展示逻辑**:按当前 `region + type` 取 Top 3,按播放量降序。如果该组合下 < 3 条,降级到该 region 的全类型 Top 3。

**为什么这一块重要**:出海创作者最大的盲点是用国内套路拍海外剧。让他在选完地域的瞬间就能扫一眼"哦原来北美在看狼人吸血鬼,不是赘婿",胜过任何教程。

### 4.5 剧本编辑器

- 富文本编辑器,支持撤销/重做/复制/清空、自动保存(每 3 秒,debounced)、字数计数(默认上限 10000)
- 用户从开场白卡片进入时,卡片内容直接预填到编辑器顶部
- 提供"AI 续写"按钮:基于当前剧本调用 LLM 生成接下来 200-300 字
- 提供"导入剧本(单集)"功能,接受 .txt / .md / .docx,自动解析对白和场景描述

### 4.6 高级设置抽屉

默认折叠在右上角"高级设置 →"。打开后可手动覆盖任意 InferredConfig 字段。被用户覆盖的字段在 InferredConfig.overrides 里记录,UI 上加一个"已自定义"标记,提示用户切换标签时这些字段不会被自动反推覆盖。

### 4.7 阶段一 API

```
POST   /api/v1/projects                       创建新项目(只需 tagSet)
PATCH  /api/v1/projects/:id/tags              更新标签
POST   /api/v1/projects/:id/openings/generate 生成开场白(返回 3 个候选)
PATCH  /api/v1/projects/:id/script            保存剧本
POST   /api/v1/projects/:id/script/extend     AI 续写
POST   /api/v1/projects/:id/script/import     导入外部剧本文件
GET    /api/v1/references?region=xx&type=xx   参考剧库
PATCH  /api/v1/projects/:id/config/override   高级设置覆盖
```

---

## 5. 阶段二:剧组筹备会

### 5.1 剧本解析

**触发**:用户点"下一步:进入剧组筹备会"按钮时,后端调用 LLM 解析当前剧本。解析过程中前端显示 skeleton loading,正常应在 5-15 秒内完成。

**LLM Prompt 模板**

```
你是一位影视制片助理。请从以下短剧剧本中识别出所有需要准备的:
1. 场景(Scene):故事发生的物理位置,如"豪华婚宴大厅""雨夜立交桥下"
2. 角色(Character):有台词或有戏份的人物,包括同一角色的不同状态(如"陈默-落魄期""陈默-觉醒后")
3. 道具(Prop):剧情关键的物件,如"撕碎的喜帖""老式翻盖手机"

剧本:
{script}

输出 JSON 格式:
{
  "scenes": [
    { "name": "...", "description": "10 字以内的画面感描述", "timeOfDay": "...", "mood": "..." }
  ],
  "characters": [
    {
      "name": "...",
      "tier": "lead" | "antagonist" | "support" | "extra",
      "age": "...",
      "gender": "...",
      "appearanceDescription": "20-40 字外形描述",
      "variantGroup": "如果是同一角色的不同状态,填角色基础名"
    }
  ],
  "props": [
    { "name": "...", "description": "..." }
  ]
}

约束:
- scenes 数量上限 8
- characters 数量上限 12
- props 数量上限 10
- 不要漏掉群演角色,但只列有名字或有特写的
```

**解析后处理**:对每个识别到的资产,按当前 InferredConfig 的 `castEthnicity` 和 `artStyle` 自动追加生成 prompt 后缀(如 `, east asian features, modern urban realism style`),然后异步触发图片生成任务。

### 5.2 资产卡组件

三类资产用同一组件,但视觉密度和宽高比不同。

| 类型 | 卡片宽高比 | 视觉权重 |
|---|---|---|
| 场景 | 4:3 | 大卡片,4 列网格 |
| 角色 | 3:4 | 大卡片,4 列网格 |
| 道具 | 横向 chip | 极小,inline 排列 |

每张资产卡的状态机:

```
pending ──[user enters stage 2]──> generating
generating ──[image gen success]──> ready
generating ──[image gen fail]──> failed
ready ──[user clicks 通过]──> approved (just a flag)
ready ──[user clicks 换一张]──> generating
ready ──[user clicks 微调 + submit]──> generating
failed ──[user clicks 重试]──> generating
```

**关键决策**:`approved` 是一个独立的布尔标记,不是状态机的一个状态。这是为了让用户即使没有审核完,也能跳到阶段三。审核是可选精修,不是必经卡口。

### 5.3 资产生成 pipeline

```
parseScript()
   ├──> 识别 N 个 scenes
   ├──> 识别 M 个 characters
   └──> 识别 K 个 props
        │
        ▼
为每个资产构造 prompt
        │
        ▼
推入图像生成队列(批量,但有并发上限)
        │
        ▼
并行生成,每个生成完立即推送 WS 事件给前端
        │
        ▼
前端按事件逐一替换占位卡为成品卡(进度感)
```

**并发控制**:同一项目内最多 4 个并发生成任务。超出排队。这是为了避免单用户烧钱过快,也是为了保护 GPU 资源。

### 5.4 一致性机制

这是工程上最难的一块。"一处修改全剧同步"听起来简单,实现需要:

**角色一致性**:每个 CharacterAsset 在第一次生成时除了产出 imageUrl,还需要产出一个 `consistencyToken`——可以是 IP-Adapter 的 face embedding,也可以是基于该角色训练的 LoRA 权重 id。后续所有引用该角色的 Shot 在生成图片时,都必须把这个 token 注入 prompt/condition。

**场景一致性**:场景一致性比角色弱,通常用同一组 style keywords + 一张 reference image 即可。可不训练 LoRA。

**变体角色处理**:同一个角色的不同状态(陈默-落魄 vs 陈默-觉醒)用 `variantGroup` 字段分组。同组共享 consistencyToken 但 prompt 不同。

**MVP 阶段降级**:如果一致性方案在 P0 来不及做,可以接受"角色脸会跑偏"的事实,UI 上不主动承诺一致性。这是底层成本与上线时间的权衡。

### 5.5 地域切换

用户在阶段二切换地域(右上角的"国内阵容 / 北美阵容"等),会触发:

1. 弹确认框:"切换地域将重新生成所有资产,需要 X 积分,继续吗?"
2. 用户确认后,InferredConfig.castEthnicity 更新
3. 当前所有 AssetBase 的 `approvedByUser` 重置为 false
4. 触发批量资产重生成,新资产带 `variantOf` 指向源资产

**注意**:这个动作会创建一个 RegionVariant 草稿,但不立刻进入阶段四的"一稿多投"。它的本质就是阶段四"一稿多投"的提前触发——架构上是同一套机制,只是入口不同。

### 5.6 阶段二 API

```
POST   /api/v1/projects/:id/script/parse           触发剧本解析
GET    /api/v1/projects/:id/assets                  获取当前资产库
POST   /api/v1/assets/:assetId/regenerate           换一张
PATCH  /api/v1/assets/:assetId                      微调(传新的 description / prompt)
POST   /api/v1/assets/:assetId/approve              通过
POST   /api/v1/projects/:id/assets/approve-all      全部通过
POST   /api/v1/projects/:id/assets/regenerate-all   一键重抽
POST   /api/v1/projects/:id/region/switch           地域切换
WS     /api/v1/projects/:id/events                  实时推送资产生成进度
```

---

## 6. 阶段三:开机拍摄

### 6.1 镜头数据初始化

用户进入阶段三时,如果 `project.shots` 为空,后端基于剧本 + 资产库生成镜头列表。

**LLM Prompt 模板**

```
你是一位资深短剧导演。请把以下剧本拆成 {recommendedShotCount} 个连续镜头。

【剧本】
{script}

【可用场景】
{scenes_json}

【可用角色】
{characters_json}

【可用道具】
{props_json}

【目标时长】每镜约 7 秒,总时长约 {episodeLengthSec} 秒

要求:
- 每个镜头必须引用上述场景、角色、道具的 id(不要新建)
- 必须有清晰的画面描述(20-50 字)
- 必须保留剧本中的关键台词
- 镜头节奏:前 8 秒必须有视觉钩子(撕喜帖/被泼茶/电话响起 等)
- 最后一个镜头必须留钩子,引向下一集

输出 JSON 格式:
{
  "shots": [
    {
      "number": "S01",
      "sceneRef": "scene_id",
      "characterRefs": ["char_id"],
      "propRefs": [],
      "description": "...",
      "dialogue": "...",
      "cameraDirection": "wide" | "medium" | "close-up" | "over-shoulder",
      "durationSec": 7
    }
  ]
}
```

生成完成后,所有 Shot 的 pipeline 状态全部为 `pending`。

### 6.2 自动开拍调度器

**触发**:用户点"自动开拍 ▶"按钮。

**调度逻辑**:

```python
def auto_shoot(project_id):
    shots = get_shots(project_id, order_by='order')
    for shot in shots:
        # 阶段 1: 分镜图
        if shot.pipeline.image.status == 'pending':
            schedule_image_gen(shot)
            wait_until(shot.pipeline.image.status in ['done', 'failed'])
            if shot.pipeline.image.status == 'failed':
                continue  # 跳过,等用户手动处理
        
        # 阶段 2: 视频
        if shot.pipeline.video.status == 'pending':
            schedule_video_gen(shot)
            wait_until(shot.pipeline.video.status in ['done', 'failed'])
            if shot.pipeline.video.status == 'failed':
                continue
        
        # 阶段 3: 配音口型
        if shot.pipeline.audio.status == 'pending':
            schedule_audio_gen(shot)
            wait_until(shot.pipeline.audio.status in ['done', 'failed'])
        
        # 三阶段都完成后,做最终合成
        if all_done(shot):
            schedule_final_clip_merge(shot)
```

**并发**:同一项目内,可以"流水线并行"——S01 在做 video 的同时,S02 在做 image,S03 在排队。这不是简单的串行,而是 3-stage pipeline parallelism。

**WebSocket 推送**:每个 PipelineStage 状态变化都推送一个事件给前端,前端实时更新时间线和大预览框。事件格式:

```json
{
  "type": "shot_pipeline_update",
  "shotId": "shot_xxx",
  "stage": "image" | "video" | "audio",
  "status": "queued" | "rendering" | "done" | "failed",
  "progress": 0.65,        // 可选,如果模型支持进度
  "previewUrl": "...",     // 可选,如果模型支持中间预览
  "cost": 1.5
}
```

### 6.3 大预览框 + 编辑面板

**大预览框**

- 始终显示 `state.selectedShotId` 对应的 shot
- 已完成:显示视频(`finalClipUrl`),loop 播放,底部叠加台词字幕
- 生成中:显示 spinner + "正在拍摄..."
- 排队中:显示空心圆 + "排队中"
- 用户切换 selectedShotId 时,大预览框立即切换内容,不需要重新拉数据

**编辑面板(右侧)**

包含以下区块,按从上到下顺序:

1. 镜号 + 当前状态 pill
2. 画面描述(只读 + "改一下"按钮)
3. 台词(只读 + "改一下"按钮)
4. 流水线管线指示器(image → video → audio,三个 pill)
5. **一句话改镜**输入框 + "重新生成"按钮(主操作)
6. 可折叠的"高级调整"展开区(默认折叠)

### 6.4 一句话改镜

**这是阶段三的主路径,80% 的用户修改请求应该通过这一个输入框完成。**

**交互流程**

1. 用户在输入框写自然语言修改要求,如"眼神再凶一点"或"换个机位拍背影"
2. 点"重新生成"
3. 后端把当前 shot 的 description + 用户输入一起传给 LLM,让 LLM 重写 description
4. 用新 description 重新触发 image gen,然后 video,然后 audio
5. 新生成完成后,旧的进 ShotEdit 历史

**LLM Prompt 模板**

```
你是短剧导演。下面是一个镜头的当前画面描述,以及用户的修改要求。
请基于修改要求,重写画面描述。

【当前画面描述】
{current_description}

【用户的修改要求】
{user_input}

【约束】
- 保留原镜头的场景、角色、道具不变
- 保留原镜头的剧情功能不变
- 只修改用户提到的方面(摄影角度/表情/动作/光线等)

直接输出新的画面描述,不要解释。
```

**失效传播**:一句话改镜会触发整个 pipeline(image / video / audio)的重新生成,因为画面变了视频和音频也得重做。

### 6.5 高级调整面板

折叠展开后展示 4 个按钮,每个按钮触发一个具体的修改流程:

| 按钮 | 触发动作 |
|---|---|
| 调整构图 | 弹出 4-6 种构图预设(推近/拉远/低角度/俯拍/过肩...),点选直接重生成 |
| 角色站位 | 显示当前镜头中所有角色,允许拖拽改变他们在画面中的位置 |
| 改台词 | 文本编辑器,只重新生成 audio,不重新生成 image/video |
| 九宫格机位 | 一次性生成 9 个不同机位的备选图,用户挑一张作为该镜头的图 |

### 6.6 时间线组件

**布局**:6 列网格(可滚动)。每个 cell 是一个 Shot 的迷你卡:

- 顶部:镜号(如 S03)
- 中部:场景图标缩略图
- 底部:三个状态点(image / video / audio),颜色按状态(灰=pending,橙脉冲=rendering,绿=done)

**交互**:

- 点击切换 selectedShotId
- 当前选中的 cell 加 2px 蓝边
- 拖拽可调整顺序(P1 功能,P0 不做)

### 6.7 阶段三 API

```
POST   /api/v1/projects/:id/shots/generate         从剧本+资产生成镜头列表
GET    /api/v1/projects/:id/shots                  获取当前镜头列表
POST   /api/v1/projects/:id/shoot/start            自动开拍
POST   /api/v1/projects/:id/shoot/pause            暂停
POST   /api/v1/shots/:shotId/regenerate            一句话改镜(传 user_input)
POST   /api/v1/shots/:shotId/composition           调整构图(传预设 id)
PATCH  /api/v1/shots/:shotId/dialogue              改台词(只重生成 audio)
POST   /api/v1/shots/:shotId/nine-grid             生成九宫格机位
WS     /api/v1/projects/:id/events                 流水线进度推送
```

---

## 7. 阶段四:成片预览与一稿多投

### 7.1 成片合成引擎

用户进入阶段四时,后端检查 `MasterCut` 是否存在。如果不存在,创建一个空的 MasterCut 并按默认配置初始化:

- intro: `[brand_logo:2s, title_card:1.5s]`
- outro: `[next_episode_teaser:3s, follow_cta:2s]`
- subtitlesEnabled: true
- bgmEnabled: true
- bgmTrack: 按 InferredConfig.modelStrategy 自动选一首预置 BGM(quality_first 走更贵的版权曲库)

**渲染时机**:每次用户改任何配置(片头/字幕/BGM/片尾)都不立即渲染,而是 debounced 5 秒后触发后台渲染。前端在等待渲染时仍然能播放(用旧 renderedUrl 或片段拼接预览)。

**渲染产物**:`MasterCut.renderedUrl` 是合成后的整集 mp4(横竖看 InferredConfig.aspectRatio)。`renderHash` 用于增量重渲染——如果只是字幕变了,可以只重做字幕轨而不重新拼视频。

### 7.2 字幕生成

**自动字幕**:对每个 Shot 的 `dialogue` 字段做 SRT 格式化,时间戳按 Shot 的 `durationSec` 累加。如果 dialogue 为空(纯音效或场景描述带括号),则该镜头不出字幕。

**用户编辑**:阶段四的"整集时间轴"组件下方有一条字幕轨,每个 cell 显示该镜头的字幕,点击可编辑。编辑只影响 SubtitleStyle 引用的文本,不重新生成 audio。

### 7.3 BGM 自动配

**P0 实现**:维护一个预置 BGM 库(50-100 首),按 mood 标签分类(tense / romantic / triumphant / melancholic ...)。根据 TagSet 推一首默认 BGM,允许用户在下拉里换。

**P1 实现**:接入 AI 配乐模型(Suno API / Udio API),根据剧本情绪自动生成专属 BGM。

### 7.4 导出三件套

**竖版正片**:1080×1920 MP4,H.264,音频 AAC 128k。直接是 MasterCut.renderedUrl(假设 aspectRatio=9:16)。

**横版重剪**:1920×1080 MP4。把竖版居中,左右用同帧高斯模糊填充。这是 ffmpeg 一个滤镜的事,不需要重新跑模型。

**封面三件套**:

- 竖封 1080×1920(取首镜的关键帧 + 剧名烫金 overlay)
- 横封 1920×1080(同上但裁切)
- 方封 1080×1080(同上)

烫金标题用 SVG → PNG 渲染,字体可配。

**导出 API**

```
POST /api/v1/projects/:id/cuts/render         触发渲染
GET  /api/v1/projects/:id/cuts/:cutId         获取渲染状态和产物 url
POST /api/v1/projects/:id/cuts/export         触发导出(传 format: vert | horz | cover)
GET  /api/v1/projects/:id/cuts/exports        列出所有已导出的产物
```

### 7.5 一稿多投架构(本节是工程的重头戏)

**核心思路**:RegionVariant 不是简单地"再做一遍",而是**只重做应该重做的层**。

| 层级 | 是否重生成 | 原因 |
|---|---|---|
| 剧本骨架(节奏点 + 情绪曲线) | 否 | 这是用户的原创结构,价值在这里 |
| 剧本台词 | 是 | 翻译 + 文化本地化 |
| 角色资产 | 是 | 选角风格变了 |
| 场景资产 | 部分 | 视场景而定。"婚宴大厅"在哪都差不多;"四合院"在北美得换成"mansion" |
| 道具资产 | 部分 | 同上 |
| Shot 列表 | 复用结构 + 重生成内容 | 镜号和节奏不变,prompt 重写 |
| 镜头流水线产物(image/video/audio) | 是 | 所有的视频要重新跑 |
| MasterCut 配置 | 部分 | 时长规格按目标地域调,字幕语言换 |

**一稿多投触发流程**

```
[用户在阶段四点 → 北美卡片]
   │
   ▼
[弹出确认框: "需要 X 积分,预计 Y 分钟,确认?"]
   │
   ▼
[创建 RegionVariant 草稿,status=pending]
   │
   ▼
[Step A: LLM 本地化剧本]
   ├─ 输入:原 Script + 目标 region + 目标 language
   ├─ 输出:LocalizedScript(保留情绪节奏,翻译台词,替换文化梗)
   └─ status → translating
   │
   ▼
[Step B: 决定哪些资产需要重生成]
   ├─ 角色:全部重生成(选角风格变了)
   ├─ 场景:LLM 判断是否需要本地化("婚宴大厅"→不需要;"四合院"→替换为"mansion")
   ├─ 道具:同上
   └─ status → casting
   │
   ▼
[Step C: 批量生成新资产]
   ├─ 按目标 castEthnicity 重新跑图像生成
   └─ 完成后构造 LocalizedAssetLibrary
   │
   ▼
[Step D: 重写 Shot 列表]
   ├─ 复用原 Shot 的 number / order / cameraDirection / durationSec
   ├─ 替换 sceneRef / characterRefs / propRefs 指向新资产
   ├─ 替换 description(LLM 重写以匹配新角色特征)
   ├─ 替换 dialogue(用 LocalizedScript 中的对应行)
   └─ 重置所有 pipeline 为 pending
   │
   ▼
[Step E: 自动开拍流水线]
   ├─ 走和阶段三一样的调度器
   └─ status → shooting
   │
   ▼
[Step F: 合成 LocalizedMasterCut]
   ├─ 按目标平台的时长规格(60s/75s/90s)调整
   ├─ 字幕换语言
   └─ status → mastering → done
```

**LLM 本地化 prompt 模板**

```
你是一位精通{language}文化的影视本地化专家。请把以下中文短剧剧本本地化为面向{region}市场的版本。

【原剧本】
{script}

【本地化要求】
1. 翻译为{language}语言,语气符合短剧观众的口语习惯
2. 把"赘婿""敬茶""婚宴主桌"等中国文化特有的概念,替换为{region}观众能理解的等价物
3. 把人名换成{region}市场常见的姓名
4. 保留所有的剧情节奏点(冲突/反转/钩子)在原位置
5. 关键台词(被泼茶后的咆哮、电话救星的开场白)必须有等价的金句感,不要直译
6. 不要超出{episodeLengthSec}秒的总时长,中文台词每秒约 4 字,{language}台词按 {wordsPerSec} 词/秒折算

输出 JSON 格式:
{
  "localized_title": "本地化后的剧名",
  "scenes_to_localize": [{ "original": "...", "localized": "..." }],
  "characters_to_rename": [{ "original": "...", "localized": "..." }],
  "lines": [{ "shot_number": "S01", "original": "...", "localized": "..." }],
  "cultural_notes": "翻译时做了哪些重要的文化替换,简要说明"
}
```

**积分预估公式**

```
estimated_cost(variant) =
    cost_per_localization_call           # 1 次 LLM 长上下文
  + N_characters * cost_per_char_image   # 角色重生成
  + M_scenes_to_localize * cost_per_scene_image
  + N_shots * cost_per_image_gen
  + N_shots * cost_per_video_gen
  + N_shots * cost_per_audio_gen
  + cost_per_master_cut_render
```

前端在弹确认框时显示这个估算值。实际消耗记录在 `RegionVariant.actualCost`。

### 7.6 阶段四 API

```
GET    /api/v1/projects/:id/cut                       获取 MasterCut
PATCH  /api/v1/projects/:id/cut                       更新配置(片头/字幕/BGM/片尾)
POST   /api/v1/projects/:id/cut/render                触发渲染
POST   /api/v1/projects/:id/cut/export                导出(format)

POST   /api/v1/projects/:id/variants                  创建 RegionVariant(传 region)
GET    /api/v1/projects/:id/variants                  列出所有变体
GET    /api/v1/variants/:id                           获取单个变体详情
DELETE /api/v1/variants/:id                           删除变体
WS     /api/v1/variants/:id/events                    变体生成进度推送
```

---

## 8. 第 0 屏:项目库

### 8.1 列表展示

用户每次进入工具的落地页。展示当前用户的所有项目,默认按 `updatedAt` 倒序。

**视图模式**

- 网格视图(默认):每个项目一张 4:3 卡片,封面 + 标题 + 状态 + 进度
- 列表视图:每个项目一行,带更多元数据

**卡片信息**

- 封面缩略图(取首镜的 image,如果还没生成显示占位)
- 项目标题
- 状态 pill(草稿/拍摄中/已完成/已发布)
- 进度条(基于当前 stage 和该 stage 的完成度)
- 标签 chip(类型 + 设定)
- 已生成的 RegionVariant 数量(如有)

### 8.2 创建新项目

右上角"+ 新建项目"按钮,直接进入阶段一,默认标签如 4.1 所述。

**项目模板**:P1 功能。运营可以预置一组"一键开拍"的样板项目,用户选完直接进阶段四看效果,然后回头改。这是给"还没想好拍什么"的新手的兜底入口。

### 8.3 项目操作

每张卡片右上角的菜单:

- 重命名
- 复制(创建一个新项目,复制 TagSet + Script,但不复制资产和镜头)
- 导出 PRJ 文件(P2)
- 归档
- 删除

### 8.4 阶段 0 API

```
GET    /api/v1/projects                 列出当前用户的所有项目
POST   /api/v1/projects                 新建(可选 templateId)
PATCH  /api/v1/projects/:id             重命名等
DELETE /api/v1/projects/:id             删除
POST   /api/v1/projects/:id/duplicate   复制
GET    /api/v1/templates                项目模板列表(P1)
```

---

## 9. 跨阶段机制

### 9.1 失效传播

任何上游修改都可能让下游产物失效。我们用一个统一的 `staleness propagation` 机制实现。

**失效规则表**

| 修改的字段 | 受影响的下游 | 处理 |
|---|---|---|
| TagSet | InferredConfig | 自动重算 |
| InferredConfig.castEthnicity | 所有 Character 资产 | 提示用户重生成 |
| InferredConfig.artStyle | 所有 Scene 资产 | 提示用户重生成 |
| InferredConfig.aspectRatio | 所有 Shot 的 image/video | 提示用户重生成 |
| Script.rawText | Shot 列表 + 资产识别 | 弹框:"剧本变了,要重新解析吗?" |
| Asset.imageUrl(任意) | 引用该资产的所有 Shot 的 pipeline.image | 自动置 stale |
| Shot.description | 该 Shot 的 image / video / audio | 自动置 pending |
| Shot.dialogue | 该 Shot 的 audio | 自动置 pending |
| Shot.imageUrl | 该 Shot 的 video / audio | 自动置 pending |
| Shot.videoUrl | 该 Shot 的 audio | 自动置 pending |
| MasterCut config | renderedUrl | debounced 重渲染 |

**关键原则**:

1. **不静默重生成**:除了 InferredConfig 这种纯计算的字段,任何需要重新调用模型的失效都应该提示用户确认,因为生成是付费动作。
2. **Stale 状态可视化**:UI 上把 stale 的资产/镜头加一个虚线边框 + 黄色"已过期"角标,用户能一眼看到哪些东西需要重做。
3. **批量重生成**:用户可以选择"一键更新所有过期内容"。

### 9.2 自动保存与版本快照

- 用户在任何输入框的修改都 debounced 1 秒自动保存到后端
- 每次重大动作(进入下一阶段、点击重生成、切换地域)生成一个 ProjectVersion 快照
- 快照保存最近 20 个,允许用户回滚

```typescript
interface ProjectVersion {
  id: string
  projectId: string
  snapshotAt: string
  trigger: 'auto' | 'stage_advance' | 'major_action' | 'manual'
  deltaJson: string  // JSON Patch 格式,只存与上一版本的差异
  description: string
}
```

### 9.3 LLM 调用统一封装

所有 LLM 调用走一个内部 LLMGateway 服务,职责包括:

- 厂商抽象(OpenAI / Anthropic / 国内大模型 / 自研模型,可热切换)
- Prompt 模板管理(prompt 版本化,A/B 测试)
- Token 计费记录
- 失败重试 + 降级
- Response schema validation(JSON 输出必须验证)
- Latency / cost 监控

```typescript
interface LLMRequest {
  promptId: string             // 内部 prompt 模板 id
  variables: Record<string, unknown>
  model?: string               // 覆盖默认模型
  responseFormat?: 'text' | 'json_schema'
  schema?: object              // JSON schema for validation
  maxTokens?: number
  temperature?: number
  trace: TraceContext          // 谁/哪个项目/哪个阶段触发的
}

interface LLMResponse<T> {
  data: T
  promptId: string
  modelUsed: string
  inputTokens: number
  outputTokens: number
  costInCredits: number
  latencyMs: number
}
```

### 9.4 视频/图像生成抽象层

类似 LLMGateway,但是面对图像和视频模型。需要支持:

- 多厂商:Flux / SDXL / 即梦 / 可灵 / Hailuo / Runway / Hedra / ...
- 模型策略路由:`cost_first` 走便宜模型,`quality_first` 走贵的
- 异步任务模式(图像和视频生成都是长任务)
- 一致性 token 注入(LoRA id / IP-Adapter embedding)
- 失败降级(贵的失败了 fallback 到便宜的)

### 9.5 积分系统

**积分定价**:

| 动作 | 大致积分 |
|---|---|
| 1 次 LLM 短调用(开场白生成) | 1 |
| 1 次 LLM 长上下文调用(剧本解析/本地化) | 5-10 |
| 1 张图像生成(便宜模型) | 2 |
| 1 张图像生成(贵模型) | 8 |
| 1 段视频生成(5s, 便宜) | 15 |
| 1 段视频生成(5s, 贵) | 50 |
| 1 段配音对口型 | 5 |
| 1 次成片渲染 | 3 |

**预估机制**:

- 用户进入每个阶段前,显示"完成本阶段预计消耗 X 积分"
- 一稿多投的弹框单独显示该地域版本的总预估
- 实际消耗实时累加到 `Project.costSpent`

**新用户额度**:首次注册赠送足够完成 1 集 + 1 个海外版本的积分(让用户能完整体验一稿多投的甜头)。

---

## 10. 状态机汇总

### 10.1 Project 生命周期

```
draft ──[完成阶段一]──> casting
casting ──[进入阶段三]──> shooting
shooting ──[进入阶段四]──> mastering
mastering ──[导出至少 1 次]──> published
任意状态 ──[user archives]──> archived
任意状态 ──[user back to stage 1]──> draft (会询问是否清理下游)
```

### 10.2 Asset 生命周期

```
pending ──[image gen 任务入队]──> generating
generating ──[模型成功]──> ready
generating ──[模型失败]──> failed
ready ──[user clicks 通过]──> ready (approvedByUser=true)
ready ──[user clicks 换一张/微调]──> generating
ready ──[上游 InferredConfig 变化]──> stale
stale ──[user 确认重生成]──> generating
failed ──[user retry]──> generating
```

### 10.3 ShotPipeline 生命周期(每个 stage 独立)

```
pending ──[scheduler 选中 OR user 主动触发]──> queued
queued ──[worker 拉取]──> rendering
rendering ──[完成]──> done
rendering ──[失败]──> failed
done ──[上游修改]──> stale
stale ──[user 确认重生成]──> queued
failed ──[user retry]──> queued
```

**Stage 间依赖**:

- video 进入 queued 的前提:image.status == done
- audio 进入 queued 的前提:dialogue 非空 OR 调度器明确允许纯音效

### 10.4 RegionVariant 生命周期

```
pending ──[Step A start]──> translating
translating ──[剧本本地化完成]──> casting
casting ──[资产重生成完成]──> shooting
shooting ──[流水线全部完成]──> mastering
mastering ──[合成完成]──> done
任意状态 ──[失败次数达上限]──> failed
```

---

## 11. 关键技术决策

### 11.1 前端

**框架建议**:Next.js (App Router) + React 18+ + TypeScript

**状态管理**:Zustand 或 Jotai。Redux 太重,Context 跨阶段传递难。每个阶段一个 store,共享一个根 ProjectStore。

**实时通信**:WebSocket(Socket.io 或原生 WS)用于流水线进度推送。SSE 也可以,但 SSE 不支持双向,生成中暂停/取消等动作还要走 HTTP,复杂度反而高。

**视频播放**:阶段三/四的播放器用 Video.js 或 Plyr。直接 `<video>` 标签也行,但缺缝隙拼接和帧级跳转能力。

**字幕渲染**:阶段四播放器叠字幕用 WebVTT,工程上比烧录到视频里灵活得多(改字幕不用重渲染)。

### 11.2 后端

**框架建议**:Node.js (NestJS) 或 Python (FastAPI)。两者都行,看团队栈。

**异步任务队列**:**这是核心组件**。生成是分钟级长任务,必须有可靠的任务队列。推荐:

- Python:Celery + Redis
- Node:BullMQ + Redis
- 跨语言:Temporal(贵但工作流编排能力强,适合一稿多投这种多步骤任务)

**数据库**:

- 主库:PostgreSQL(强一致性 + JSONB 存复杂结构)
- 缓存:Redis(参考剧库 / 开场白缓存 / WS pub-sub)
- 对象存储:S3 兼容(Cloudflare R2 / 阿里云 OSS / AWS S3)用于 image / video / audio / cut 文件

### 11.3 LLM 厂商策略

**P0**:绑定 1 个主厂商(建议 OpenAI 或 Anthropic),所有 prompt 在该厂商上调通。

**P1**:LLMGateway 抽象层落地,支持 1 主 1 备,主厂商失败自动降级。

**P2**:按任务类型路由——长上下文用 Claude / Gemini,短任务用 GPT-4o-mini,中文敏感任务用国内模型(避免出海合规风险时也避免国内合规风险)。

### 11.4 图像/视频生成厂商

**P0 推荐组合**:

- 图像便宜:Flux Schnell / SDXL Turbo
- 图像贵:Flux Pro / Imagen 3
- 视频便宜:Hailuo / Pika
- 视频贵:Kling 1.6 / Runway Gen-4
- 配音对口型:Hedra Character-3 / 自研

**关键能力要求**:

- 图像模型必须支持 IP-Adapter / LoRA 注入,否则角色一致性做不到
- 视频模型必须支持 image-to-video(把分镜图作为首帧,视频是图的延续)
- 配音模型必须支持口型同步到角色脸

### 11.5 资产存储

- 每个 asset 文件存 R2/S3,文件路径:`{ownerId}/{projectId}/assets/{assetId}/{version}.png`
- 启用 CDN(Cloudflare 自带或独立 CDN)
- 缩略图独立生成,前端优先加载缩略图避免大图阻塞
- 删除项目时异步清理(GDPR 合规要求 30 天内可恢复)

### 11.6 一致性的工程实现选择

**方案 A:IP-Adapter(P0 推荐)**

- 角色第一次生成时,提取 face embedding
- 后续所有引用该角色的图像生成,把 embedding 注入 condition
- 优点:不需要训练,实时可用,成本低
- 缺点:一致性不完美,极端角度会跑偏

**方案 B:LoRA 微调(P1)**

- 角色第一次生成 4-8 张种子图后,后台异步训练一个轻量级 LoRA
- 后续生成调用该 LoRA
- 优点:一致性强
- 缺点:训练耗时(每个角色 5-15 分钟),成本高

**P0 决策**:用方案 A,接受跑偏。在 UI 上不主动承诺"100% 一致",但在 Asset 详情里露出"重生成此角色的某张图"的能力,让用户自己挑最一致的版本。

---

## 12. MVP 拆解

### 12.1 P0:能跑通主路径

**目标**:一个新用户能完成"标签 → 剧本 → 资产 → 镜头 → 成片导出"全流程,做出一集可看的短剧。

| 模块 | 范围 | 砍刀 |
|---|---|---|
| 项目库 | 简单列表 + 新建 | 不做模板 |
| 阶段一 | 标签 + 反推 + 开场白 + 剧本编辑器 | 参考剧库可用静态 mock 数据 |
| 阶段二 | 剧本解析 + 资产卡 + 单卡操作 | 一致性走 IP-Adapter,接受跑偏 |
| 阶段三 | 镜头列表 + 自动开拍 + 一句话改镜 + 时间线 | 高级调整面板的 4 个按钮砍掉 3 个,只留"改台词";九宫格机位砍掉 |
| 阶段四 | 播放器 + 字幕 + 竖版导出 | 横版重剪和封面三件套砍掉;BGM 用预置库不接入 AI 配乐 |
| 一稿多投 | **完全砍掉** | 这是 P1 重点 |
| 跨阶段 | 自动保存 + 失效传播(基础版本) | 版本快照砍掉 |
| 积分系统 | 简单余额扣减 | 不做精细预估 |

**P0 时间预估**:6-10 周(4-6 人小队)

### 12.2 P1:差异化登场

**目标**:上线一稿多投,出海团队拿到核武器。

- 一稿多投全流程(7.5 节)
- 横版重剪 + 封面三件套
- LoRA 角色一致性
- 高级调整面板的剩余 3 个按钮
- 项目模板库
- 完整失效传播 + 版本快照

**P1 时间预估**:4-6 周

### 12.3 P2:长尾打磨

- AI 配乐(接 Suno/Udio)
- 在线剧本协作(多人编辑)
- Academy 嵌入式教学(微课 tooltip,见对话讨论)
- 数据看板(导出后的播放/完播/留存数据接入)
- API 开放(给 MCN 集成)

### 12.4 砍刀原则

**不能砍的**:

- 4 个阶段的连续性(砍任何一个阶段就回到纳米的体验了)
- 标签到 InferredConfig 的反推(这是新手友好的根本)
- 自动开拍流水线(没这个就退回手动)
- 一句话改镜(80% 的修改都通过它)

**可以砍的**:

- 一致性的高级实现(P0 接受跑偏)
- 高级调整的细分按钮(留一个就够)
- 视图切换(只做网格,不做列表)
- 多人协作 / 模板 / 数据看板(都是 P2)

---

## 13. 风险与对策

### 13.1 一致性风险

**问题**:角色脸在不同镜头之间会跑偏,严重影响观感。

**对策**:

- P0 接受不完美,UI 不承诺
- 提供"为此镜头重生成"按钮,让用户挑最像的
- P1 上 LoRA
- 长期:训练自有的角色保持模型

### 13.2 成本风险

**问题**:LLM + 图像 + 视频 + 配音叠加,一集短剧的生成成本可能超过用户付费意愿。

**对策**:

- 严格的并发控制(每用户最多 N 个任务)
- 失败不重复扣费
- 智能模型路由:cost_first 占大头,quality_first 只在用户明确选时用
- 监控单集平均成本,持续优化 prompt 减少无效生成

### 13.3 模型能力天花板

**问题**:当前 AI 视频模型还做不到电影级质量,人物动作僵硬、逻辑跳跃。

**对策**:

- 产品定位明确瞄准短剧,不瞄准电影
- 短剧本身的拍摄语言就是高密度切镜 + 强情绪对白,弱化连贯动作的需求
- 强化字幕/BGM/音效,用音画包装弥补视频本身的缺陷
- 跟厂商保持密切关系,新模型出了快速接入

### 13.4 一稿多投的本地化质量

**问题**:LLM 翻译可能水土不服,文化梗替换可能错位。

**对策**:

- Prompt 显式要求"cultural_notes",让 LLM 自己说明做了哪些替换,用户可审核
- 弹出确认框时让用户选"保守翻译"或"激进本地化"
- P1 引入本地化 reviewer(可选的人工服务,加价)
- 数据反馈:对生成的本地版本采集用户编辑率,发现高编辑率的字段持续优化 prompt

### 13.5 合规风险

**问题**:不同地域有不同的内容合规要求(中东禁酒禁某些服装、北美对种族刻画敏感、国内对历史/政治敏感)。

**对策**:

- 各地域维护一份"禁止/敏感"关键词表,在剧本解析阶段就预警
- 阶段二资产生成时把这些约束注入 prompt(negative prompt)
- 阶段四导出时再做一次内容审查(图像 + 文本)
- 高风险内容必须人工审核才能导出

---

## 14. 验收标准

### 14.1 主路径验收

**场景**:一个从未用过本工具的新用户。

- 步骤 1:打开工具落地页 → 5 秒内看到"+ 新建项目"按钮
- 步骤 2:点新建 → 进入阶段一,看到默认标签和默认开场白
- 步骤 3:点任意一张开场白卡片 → 进入剧本编辑器,内容已预填
- 步骤 4:不修改剧本,直接点"下一步" → 进入阶段二,资产开始生成
- 步骤 5:不审核任何资产,直接点"全部通过" → 进入阶段三
- 步骤 6:点"自动开拍" → 看到时间线上 12 个镜头依次烤完
- 步骤 7:点"合成成片预览" → 进入阶段四,看到播放器
- 步骤 8:点播放,看完整集
- 步骤 9:点"竖版正片 → 下载" → 拿到 mp4

**验收标准**:

- 整个流程操作步骤 ≤ 9
- 用户主动操作时间 ≤ 5 分钟(不含等待生成)
- 总时长(含生成等待)≤ 12 分钟
- 任何一个阶段切换时间 ≤ 1 秒(UI 响应)
- 生成的成片可以直接发布到至少 1 个目标平台

### 14.2 一稿多投验收

**场景**:同一个用户基于已完成的国内版,生成北美版。

- 步骤 1:在阶段四点"→ 北美"卡片
- 步骤 2:确认弹框中的预估积分和时长
- 步骤 3:确认开始
- 步骤 4:看到 RegionVariant 进度推送(translating → casting → shooting → mastering → done)
- 步骤 5:跳转到北美版的阶段四,看到全套英文台词 + 欧美面孔 + ReelShort 规格

**验收标准**:

- 北美版的剧情节奏与国内版完全一致(节拍点对应)
- 北美版的角色全部为欧美面孔
- 北美版的台词全部为英文且符合英语母语者表达习惯
- 北美版的总时长在 80-100 秒区间(ReelShort 规格)
- 整个一稿多投流程在 ≤ 10 分钟内完成

### 14.3 关键性能指标

| 指标 | 目标 |
|---|---|
| 首屏加载时间 | < 2s |
| 标签切换响应 | < 200ms |
| 开场白生成 | < 8s |
| 剧本解析 | < 15s |
| 单张图像生成 | < 30s |
| 单段视频生成 | < 90s |
| 单集自动开拍总时长 | < 7 分钟 |
| 成片渲染 | < 30s |
| 字幕开关切换 | < 500ms |

---

## 15. 术语表

| 术语 | 含义 |
|---|---|
| TagSet | 用户在阶段一选择的 4 个创作标签(类型/设定/背景/地域)+ 受众 |
| InferredConfig | 由 TagSet 自动反推出来的技术参数,用户感知不到但驱动整个工具 |
| 资产库 (AssetLibrary) | 项目内所有场景、角色、道具的集合 |
| 资产卡 | 阶段二中展示单个资产的 UI 卡片 |
| 镜头 (Shot) | 一个最小的视频片段,通常 5-8 秒,引用 1 个场景 + 若干角色道具 |
| 流水线 (Pipeline) | 单个 Shot 的三阶段生成过程:image → video → audio |
| 一句话改镜 | 用自然语言修改单个 Shot 的主交互方式 |
| 自动开拍 | 阶段三的核心动作,按顺序为所有 Shot 跑流水线 |
| 成片 (MasterCut) | 阶段四的产物,所有 Shot 拼接 + 片头尾 + 字幕 + BGM 后的完整一集 |
| 一稿多投 | 把同一项目以另一个地域市场的本地化版本重新生成 |
| RegionVariant | 一稿多投的产物,与父项目共享剧本骨架,独立的本地化资产和成片 |
| 失效传播 | 上游修改导致下游产物失效的自动标记机制 |
| 一致性 token | 角色在不同图像生成中保持外观一致的技术手段(embedding 或 LoRA) |
| 积分 | 工具的计费单位,所有生成动作都消耗积分 |
| Stage | 本 PRD 中特指 4 个阶段,与"shot 流水线的 stage"是不同概念 |

---

## 附录 A:阶段间用户旅程图

```
[落地页]
   │
   ▼
[第 0 屏: 项目库] ─────"+ 新建项目"────┐
                                       │
                                       ▼
                              [阶段一: 故事]
                              ┌──────────────┐
                              │ 选 4 个标签   │
                              │ 看开场白预览  │
                              │ 写/改剧本     │
                              └──────┬───────┘
                                     │ "下一步"
                                     ▼
                              [阶段二: 剧组筹备会]
                              ┌──────────────┐
                              │ 等待资产生成  │
                              │ 审/换/微调    │
                              │ (可跳过审核) │
                              └──────┬───────┘
                                     │ "下一步"
                                     ▼
                              [阶段三: 开机拍摄]
                              ┌──────────────┐
                              │ 自动开拍 ▶   │
                              │ 单镜一句话改  │
                              │ 看时间线进度  │
                              └──────┬───────┘
                                     │ "合成成片预览"
                                     ▼
                              [阶段四: 成片预览]
                              ┌──────────────┐
                              │ 整集播放      │
                              │ 调片头尾字幕  │
                              │ 导出三件套    │
                              │ 一稿多投 ●●● │
                              └──────┬───────┘
                                     │
                                     ▼
                              [项目库] ←── 完成 ────
```

---

## 附录 B:核心 LLM Prompt 清单

| ID | 用途 | 输入 | 输出 |
|---|---|---|---|
| `prompt.opening.generate` | 阶段一开场白预生成 | TagSet | 3 个 opening |
| `prompt.script.parse` | 阶段二剧本解析 | Script | scenes/chars/props |
| `prompt.script.extend` | 阶段一 AI 续写 | Script + N 字 | 续写文本 |
| `prompt.shots.generate` | 阶段三镜头列表生成 | Script + AssetLibrary | Shot[] |
| `prompt.shot.rewrite` | 阶段三一句话改镜 | Shot + user_input | 新 description |
| `prompt.shot.composition` | 阶段三调整构图 | Shot + 构图预设 | 新 description |
| `prompt.script.localize` | 一稿多投剧本本地化 | Script + region | LocalizedScript |
| `prompt.assets.localize` | 一稿多投资产本地化判断 | AssetLibrary + region | 哪些需要重生成 |

每个 prompt 都需要在 LLMGateway 中独立版本化,允许 A/B 测试和回滚。

---

**文档结束**

下一步建议:本 PRD 完成评审后,进入设计阶段(Figma 高保真稿)和工程拆解阶段(Linear/Jira issue 拆分)。建议设计稿基于本 PRD 配套的 4 个 Visualizer 原型展开,能省 50% 的设计沟通成本。
