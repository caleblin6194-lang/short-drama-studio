import type { SceneAsset, CharacterAsset, PropAsset, Shot, Opening, PipelineStage } from '@/types'
import { DEMO_OPENINGS, DEMO_SCENES, DEMO_CHARACTERS, DEMO_PROPS, createDemoShots, DEMO_SCRIPT } from './data'
import { delay, randomDelay } from './delays'
import { v4 as uuid } from 'uuid'

const pending: PipelineStage = { status: 'pending', attemptCount: 0 }

/** Simulate AI generating 3 opening options (1.5s delay) */
export async function generateOpenings(): Promise<Opening[]> {
  await delay(1500)
  return DEMO_OPENINGS
}

/** Simulate AI extending the script with ~200 chars (2s delay) */
export async function extendScript(current: string): Promise<string> {
  await delay(2000)
  const extension = `

（续写）

陈默站在落地窗前，俯瞰整个城市的夜景。手中的黑卡在灯光下反射出冷冽的光芒。

"三年的隐忍，不是懦弱，是等待。"他低声说道。

手机屏幕亮起，一条加密信息：「棋子已就位，明天董事会见。」

陈默嘴角勾起一抹冷笑。这盘棋，他已经布了三年。`
  return current + extension
}

/** Simulate parsing script into assets (3s + progressive updates via callback) */
export async function parseScript(
  _scriptText: string,
  onAssetReady?: (type: 'scene' | 'character' | 'prop', asset: SceneAsset | CharacterAsset | PropAsset) => void,
): Promise<{ scenes: SceneAsset[]; characters: CharacterAsset[]; props: PropAsset[] }> {
  await delay(1500)

  const scenes = [...DEMO_SCENES]
  const characters = [...DEMO_CHARACTERS]
  const props = [...DEMO_PROPS]

  const allAssets: Array<{ type: 'scene' | 'character' | 'prop'; asset: SceneAsset | CharacterAsset | PropAsset }> = [
    ...scenes.map(a => ({ type: 'scene' as const, asset: { ...a, status: 'generating' as const } })),
    ...characters.map(a => ({ type: 'character' as const, asset: { ...a, status: 'generating' as const } })),
    ...props.map(a => ({ type: 'prop' as const, asset: { ...a, status: 'generating' as const } })),
  ]

  for (const item of allAssets) {
    await randomDelay(300, 700)
    item.asset.status = 'ready'
    onAssetReady?.(item.type, item.asset)
  }

  return { scenes, characters, props }
}

/** Simulate generating shot list from script (2s delay) */
export async function generateShots(_scriptText: string, shotCount: number): Promise<Shot[]> {
  await delay(2000)
  return createDemoShots(shotCount)
}

/** Simulate the shoot pipeline: image → video → audio per shot (progressive via callback) */
export function startShootPipeline(
  shots: Shot[],
  onShotUpdate: (shotId: string, stage: 'image' | 'video' | 'audio', pipelineStage: PipelineStage) => void,
  onComplete: () => void,
): () => void {
  let cancelled = false
  const stages: Array<'image' | 'video' | 'audio'> = ['image', 'video', 'audio']

  const run = async () => {
    // Process shots with pipeline parallelism: start next shot's image while current does video
    for (let i = 0; i < shots.length && !cancelled; i++) {
      const shot = shots[i]
      for (const stage of stages) {
        if (cancelled) return
        // Mark as rendering
        onShotUpdate(shot.id, stage, { status: 'rendering', attemptCount: 1 })
        await randomDelay(600, 1000)
        if (cancelled) return
        // Mark as done
        onShotUpdate(shot.id, stage, {
          status: 'done',
          attemptCount: 1,
          cost: stage === 'video' ? 0.08 : stage === 'image' ? 0.01 : 0.005,
          modelUsed: stage === 'video' ? 'hailuo' : stage === 'image' ? 'flux_schnell' : 'deepseek_tts',
        })
      }
    }
    if (!cancelled) onComplete()
  }

  run()
  return () => { cancelled = true }
}

/** Simulate re-shooting a single shot (1.5s delay) */
export async function reshootShot(
  shotId: string,
  _instruction: string,
  onUpdate: (stage: 'image' | 'video' | 'audio', ps: PipelineStage) => void,
): Promise<void> {
  const stages: Array<'image' | 'video' | 'audio'> = ['image', 'video', 'audio']
  for (const stage of stages) {
    onUpdate(stage, { status: 'rendering', attemptCount: 1 })
    await randomDelay(400, 800)
    onUpdate(stage, { status: 'done', attemptCount: 1, cost: 0.01 })
  }
}

/** Simulate rendering the master cut (3s delay) */
export async function renderMasterCut(projectId: string): Promise<{ renderedUrl: string; durationSec: number }> {
  await delay(3000)
  return { renderedUrl: '#rendered', durationSec: 77 }
}

/** Simulate creating a region variant (5s, progressive status) */
export async function createRegionVariant(
  onStatusChange: (status: string) => void,
): Promise<void> {
  const statuses = ['translating', 'casting', 'shooting', 'mastering', 'done']
  for (const s of statuses) {
    await delay(1000)
    onStatusChange(s)
  }
}
