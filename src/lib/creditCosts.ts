export const CREDIT_COSTS: Record<string, { costFirst: number; qualityFirst: number; label: string }> = {
  generate_openings: { costFirst: 50, qualityFirst: 80, label: '生成开场白' },
  extend_script: { costFirst: 80, qualityFirst: 120, label: 'AI 续写' },
  parse_script: { costFirst: 120, qualityFirst: 180, label: '解析剧本' },
  generate_shots: { costFirst: 200, qualityFirst: 350, label: '生成镜头' },
  shoot_pipeline: { costFirst: 541, qualityFirst: 2620, label: '自动开拍' },
  reshoot_shot: { costFirst: 50, qualityFirst: 240, label: '重拍镜头' },
  render_master_cut: { costFirst: 150, qualityFirst: 300, label: '渲染成片' },
  create_variant: { costFirst: 510, qualityFirst: 2530, label: '创建地域变体' },
}

export function getCreditCost(operation: string, strategy: 'cost_first' | 'quality_first'): number {
  const entry = CREDIT_COSTS[operation]
  if (!entry) return 0
  return strategy === 'cost_first' ? entry.costFirst : entry.qualityFirst
}
