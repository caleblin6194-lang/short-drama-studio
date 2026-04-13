import type { TagSet, InferredConfig } from '@/types'
import {
  WORLD_TO_ART_STYLE, REGION_TO_ETHNICITY, REGION_TO_LANGUAGE,
  REGION_TO_PLATFORMS, REGION_TO_DURATION, getModelStrategy, getShotMode,
} from './constants'

export function inferConfig(tagSet: TagSet): InferredConfig {
  const episodeLengthSec = REGION_TO_DURATION[tagSet.region]
  return {
    aspectRatio: '9:16',
    artStyle: WORLD_TO_ART_STYLE[tagSet.world],
    modelStrategy: getModelStrategy(tagSet.type),
    shotMode: getShotMode(tagSet.type),
    castEthnicity: REGION_TO_ETHNICITY[tagSet.region],
    language: REGION_TO_LANGUAGE[tagSet.region],
    targetPlatforms: REGION_TO_PLATFORMS[tagSet.region],
    episodeLengthSec,
    recommendedShotCount: Math.round(episodeLengthSec / 7),
  }
}
