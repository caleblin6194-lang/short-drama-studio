import { describe, it, expect } from 'vitest'
import { getCreditCost, CREDIT_COSTS } from '@/lib/creditCosts'

describe('getCreditCost', () => {
  it('returns costFirst value for cost_first strategy', () => {
    expect(getCreditCost('generate_openings', 'cost_first')).toBe(50)
    expect(getCreditCost('parse_script', 'cost_first')).toBe(120)
    expect(getCreditCost('shoot_pipeline', 'cost_first')).toBe(541)
  })

  it('returns qualityFirst value for quality_first strategy', () => {
    expect(getCreditCost('generate_openings', 'quality_first')).toBe(80)
    expect(getCreditCost('shoot_pipeline', 'quality_first')).toBe(2620)
  })

  it('returns 0 for unknown operation', () => {
    expect(getCreditCost('unknown_op', 'cost_first')).toBe(0)
    expect(getCreditCost('', 'quality_first')).toBe(0)
  })

  it('qualityFirst is always >= costFirst', () => {
    for (const entry of Object.values(CREDIT_COSTS)) {
      expect(entry.qualityFirst).toBeGreaterThanOrEqual(entry.costFirst)
    }
  })

  it('all operations have positive costs', () => {
    for (const [op, entry] of Object.entries(CREDIT_COSTS)) {
      expect(entry.costFirst, `${op}.costFirst should be > 0`).toBeGreaterThan(0)
      expect(entry.qualityFirst, `${op}.qualityFirst should be > 0`).toBeGreaterThan(0)
    }
  })
})
