import type { TypeTag, SettingTag, WorldTag, RegionTag, ArtStyle, CastEthnicity } from '@/types'

export const TYPE_TAGS: TypeTag[] = [
  '穿越', '逆袭', '重生', '爱情', '玄幻', '现代言情', '总裁',
  '虐恋', '甜宠', '神豪', '女性成长', '古风权谋', '家庭伦理',
  '复仇', '悬疑推理', '古风言情', '生活', '刑侦', '恐怖',
]

export const SETTING_TAGS: SettingTag[] = [
  '大女主', '马甲', '小人物', '无敌神医', '草根', '扮猪吃虎',
  '青梅竹马', '打脸虐渣', '先婚后爱', '都市修仙', '闪婚', '萌宝',
  '豪门恩怨', '强者回归', '破镜重圆', '欢喜冤家', '赘婿逆袭',
  '暗恋成真', '亲情', '传承觉醒',
]

export const WORLD_TAGS: WorldTag[] = ['古风', '架空', '民国', '乡村', '现代', '星际', '都市']
export const REGION_TAGS: RegionTag[] = ['国内', '北美', '欧洲', '东南亚', '日韩', '中东', '拉美']

// ===== artStyle: world -> artStyle =====
export const WORLD_TO_ART_STYLE: Record<WorldTag, ArtStyle> = {
  '古风': 'ink_wash',
  '架空': 'fantasy_concept',
  '民国': 'vintage_sepia',
  '乡村': 'rural_natural',
  '现代': 'modern_realism',
  '星际': 'cyberpunk_neon',
  '都市': 'urban_realism',
}

// ===== modelStrategy: type -> strategy =====
const QUALITY_FIRST_TYPES: TypeTag[] = ['玄幻', '古风权谋', '古风言情', '悬疑推理', '刑侦', '恐怖']
const COST_FIRST_TYPES: TypeTag[] = ['生活', '家庭伦理', '现代言情']

export function getModelStrategy(type: TypeTag): 'cost_first' | 'quality_first' {
  if (QUALITY_FIRST_TYPES.includes(type)) return 'quality_first'
  return 'cost_first'
}

// ===== shotMode: type -> mode =====
const NINE_GRID_TYPES: TypeTag[] = ['玄幻', '悬疑推理', '刑侦', '复仇', '恐怖', '古风权谋']

export function getShotMode(type: TypeTag): 'single' | 'nine_grid' {
  return NINE_GRID_TYPES.includes(type) ? 'nine_grid' : 'single'
}

// ===== region configs =====
export const REGION_TO_ETHNICITY: Record<RegionTag, CastEthnicity> = {
  '国内': 'east_asian',
  '北美': 'caucasian',
  '欧洲': 'european',
  '东南亚': 'southeast_asian',
  '日韩': 'japanese_korean',
  '中东': 'middle_eastern',
  '拉美': 'latino',
}

export const REGION_TO_LANGUAGE: Record<RegionTag, string> = {
  '国内': 'zh', '北美': 'en', '欧洲': 'en', '东南亚': 'id', '日韩': 'ja', '中东': 'ar', '拉美': 'es',
}

export const REGION_TO_PLATFORMS: Record<RegionTag, string[]> = {
  '国内': ['douyin', 'hongguo'],
  '北美': ['reelshort', 'dramabox'],
  '欧洲': ['reelshort', 'goodshort'],
  '东南亚': ['tiktok_id', 'wetv'],
  '日韩': ['tiktok_jp', 'bump'],
  '中东': ['shortmax', 'yoozoo_mena'],
  '拉美': ['dramabox', 'flextv'],
}

export const REGION_TO_DURATION: Record<RegionTag, number> = {
  '国内': 75, '北美': 90, '欧洲': 90, '东南亚': 60, '日韩': 60, '中东': 90, '拉美': 90,
}

// ===== audience auto-detect =====
const FEMALE_TYPES: TypeTag[] = ['总裁', '现代言情', '甜宠', '虐恋', '女性成长', '古风言情', '爱情']
const MALE_TYPES: TypeTag[] = ['神豪', '玄幻', '刑侦', '恐怖']

export function guessAudience(type: TypeTag): 'male' | 'female' | 'all' {
  if (FEMALE_TYPES.includes(type)) return 'female'
  if (MALE_TYPES.includes(type)) return 'male'
  return 'all'
}

// ===== display labels =====
export const ART_STYLE_LABELS: Record<ArtStyle, string> = {
  ink_wash: '水墨国风', fantasy_concept: '幻想概念', vintage_sepia: '复古怀旧',
  rural_natural: '乡村自然', modern_realism: '现代写实', cyberpunk_neon: '赛博霓虹', urban_realism: '都市写实',
}

export const ETHNICITY_LABELS: Record<CastEthnicity, string> = {
  east_asian: '东亚面孔', caucasian: '欧美面孔', european: '欧洲面孔',
  southeast_asian: '东南亚面孔', japanese_korean: '日韩面孔', middle_eastern: '中东面孔', latino: '拉丁面孔',
}
