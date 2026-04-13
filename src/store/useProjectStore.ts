'use client'

import { create } from 'zustand'
import type { Project, TagSet, Shot, PipelineStage, Opening, RegionVariant, StoryBeatId, StoryStructurePlan, SubtitleStyle, Episode, EmotionalTone, CharacterAsset } from '@/types'
import { inferConfig } from '@/lib/inferConfig'
import { createStoryStructurePlan, formatStoryStructureToScript } from '@/lib/storyStructure'
import { useProjectListStore } from './useProjectListStore'
import { useCreditsStore } from './useCreditsStore'
import { getCreditCost } from '@/lib/creditCosts'
import * as gen from '@/mock/generators'
import { v4 as uuid } from 'uuid'

interface ProjectStoreState {
  project: Project | null
  openings: Opening[]
  isGeneratingOpenings: boolean
  isExtendingScript: boolean
  isParsingScript: boolean
  isGeneratingShots: boolean
  isShooting: boolean
  isRendering: boolean
  cancelShoot: (() => void) | null

  loadProject: (id: string) => void
  syncToList: () => void

  // Stage 1
  setTag: <K extends keyof TagSet>(key: K, value: TagSet[K]) => void
  generateOpenings: () => Promise<void>
  pickOpening: (opening: Opening) => void
  updateScript: (text: string) => void
  extendScript: () => Promise<void>
  generateStoryStructure: () => void
  updateStoryBeat: (beatId: StoryBeatId, text: string) => void
  updateStoryHook: (patch: Partial<StoryStructurePlan['hookScene']>) => void
  updateStoryHookCharacters: (line: string) => void
  updateStoryHookDialogues: (text: string) => void
  applyStoryStructureToScript: () => void

  // Stage 2
  parseScript: () => Promise<void>
  approveAsset: (assetId: string) => void
  approveAllAssets: () => void
  lockCharacter: (characterId: string) => void
  unlockCharacter: (characterId: string) => void

  // Stage 3
  generateShots: () => Promise<void>
  addEpisode: () => void
  removeEpisode: (episodeId: string) => void
  updateEpisode: (episodeId: string, patch: Partial<Episode>) => void
  moveShotToEpisode: (shotId: string, fromEpisodeId: string, toEpisodeId: string, newOrder: number) => void
  startShoot: () => void
  reshootShot: (shotId: string, instruction: string) => Promise<void>
  updateShotDialogue: (shotId: string, dialogue: string) => void

  // Stage 4
  renderMasterCut: () => Promise<void>
  toggleSubtitles: () => void
  setSubtitleStyle: (style: SubtitleStyle) => void
  toggleBgm: () => void
  createVariant: (regionTag: string) => Promise<void>

  // Navigation
  setStage: (stage: 1 | 2 | 3 | 4) => void
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  project: null,
  openings: [],
  isGeneratingOpenings: false,
  isExtendingScript: false,
  isParsingScript: false,
  isGeneratingShots: false,
  isShooting: false,
  isRendering: false,
  cancelShoot: null,

  loadProject: (id) => {
    const p = useProjectListStore.getState().getProject(id)
    if (p) set({ project: { ...p } })
  },

  syncToList: () => {
    const p = get().project
    if (p) useProjectListStore.getState().updateProject(p.id, p)
  },

  // === Stage 1 ===
  setTag: (key, value) => {
    set(s => {
      if (!s.project) return s
      const tagSet = { ...s.project.tagSet, [key]: value }
      return { project: { ...s.project, tagSet, inferredConfig: inferConfig(tagSet) } }
    })
    get().syncToList()
  },

  generateOpenings: async () => {
    const p = get().project
    const cost = getCreditCost('generate_openings', 'cost_first')
    const ok = useCreditsStore.getState().consumeCredits(cost, p?.id ?? '', p?.title ?? '', '生成开场白')
    if (!ok) { alert('积分不足，无法生成开场白'); return }
    set({ isGeneratingOpenings: true })
    const openings = await gen.generateOpenings()
    set({ openings, isGeneratingOpenings: false })
  },

  pickOpening: (opening) => {
    set(s => {
      if (!s.project) return s
      const rawText = `【${opening.title}】\n\n${opening.body}\n\n${opening.line}`
      const script = {
        ...s.project.script,
        rawText,
        characterCount: rawText.length,
        estimatedDurationSec: Math.round(rawText.length / 8),
        history: [
          ...s.project.script.history,
          { id: uuid(), rawText, savedAt: new Date().toISOString(), source: 'opening_pick' as const },
        ],
      }
      return { project: { ...s.project, script }, openings: [] }
    })
    get().syncToList()
  },

  updateScript: (text) => {
    set(s => {
      if (!s.project) return s
      return {
        project: {
          ...s.project,
          script: {
            ...s.project.script,
            rawText: text,
            characterCount: text.length,
            estimatedDurationSec: Math.round(text.length / 8),
          },
        },
      }
    })
    get().syncToList()
  },

  extendScript: async () => {
    const p = get().project
    const cost = getCreditCost('extend_script', 'cost_first')
    const ok = useCreditsStore.getState().consumeCredits(cost, p?.id ?? '', p?.title ?? '', 'AI 续写')
    if (!ok) { alert('积分不足，无法续写'); return }
    set({ isExtendingScript: true })
    const current = get().project?.script.rawText ?? ''
    const extended = await gen.extendScript(current)
    set(s => {
      if (!s.project) return { isExtendingScript: false }
      return {
        isExtendingScript: false,
        project: {
          ...s.project,
          script: {
            ...s.project.script,
            rawText: extended,
            characterCount: extended.length,
            estimatedDurationSec: Math.round(extended.length / 8),
            history: [
              ...s.project.script.history,
              { id: uuid(), rawText: extended, savedAt: new Date().toISOString(), source: 'ai_extend' as const },
            ],
          },
        },
      }
    })
    get().syncToList()
  },

  generateStoryStructure: () => {
    const p = get().project
    if (!p) return
    const plan = createStoryStructurePlan(p)
    set(s => s.project ? { project: { ...s.project, storyStructure: plan } } : s)
    get().syncToList()
  },

  updateStoryBeat: (beatId, text) => {
    set(s => {
      if (!s.project?.storyStructure) return s
      const beats = s.project.storyStructure.beats.map(b => b.id === beatId ? { ...b, text } : b)
      return { project: { ...s.project, storyStructure: { ...s.project.storyStructure, beats } } }
    })
    get().syncToList()
  },

  updateStoryHook: (patch) => {
    set(s => {
      if (!s.project?.storyStructure) return s
      return { project: { ...s.project, storyStructure: { ...s.project.storyStructure, hookScene: { ...s.project.storyStructure.hookScene, ...patch } } } }
    })
    get().syncToList()
  },

  updateStoryHookCharacters: (line) => {
    const chars = line.split(/[、,，]/).map(s => s.trim()).filter(Boolean)
    set(s => {
      if (!s.project?.storyStructure) return s
      return { project: { ...s.project, storyStructure: { ...s.project.storyStructure, hookScene: { ...s.project.storyStructure.hookScene, characters: chars } } } }
    })
    get().syncToList()
  },

  updateStoryHookDialogues: (text) => {
    const lines = text.split('\n').filter(l => l.trim())
    set(s => {
      if (!s.project?.storyStructure) return s
      return { project: { ...s.project, storyStructure: { ...s.project.storyStructure, hookScene: { ...s.project.storyStructure.hookScene, dialogueLines: lines } } } }
    })
    get().syncToList()
  },

  applyStoryStructureToScript: () => {
    const p = get().project
    if (!p?.storyStructure) return
    const structureText = formatStoryStructureToScript(p.storyStructure)
    const newRaw = p.script.rawText ? `${p.script.rawText}\n\n${structureText}` : structureText
    set(s => {
      if (!s.project) return s
      return {
        project: {
          ...s.project,
          script: { ...s.project.script, rawText: newRaw, characterCount: newRaw.length, estimatedDurationSec: Math.round(newRaw.length / 8) },
        },
      }
    })
    get().syncToList()
  },

  // === Stage 2 ===
  parseScript: async () => {
    const p = get().project
    const cost = getCreditCost('parse_script', 'cost_first')
    const ok = useCreditsStore.getState().consumeCredits(cost, p?.id ?? '', p?.title ?? '', '解析剧本')
    if (!ok) { alert('积分不足，无法解析剧本'); return }
    set({ isParsingScript: true })
    const scriptText = get().project?.script.rawText ?? ''
    await gen.parseScript(scriptText, (type, asset) => {
      set(s => {
        if (!s.project) return s
        const lib = { ...s.project.assetLibrary }
        if (type === 'scene') lib.scenes = [...lib.scenes.filter(a => a.id !== asset.id), asset as any]
        if (type === 'character') lib.characters = [...lib.characters.filter(a => a.id !== asset.id), asset as any]
        if (type === 'prop') lib.props = [...lib.props.filter(a => a.id !== asset.id), asset as any]
        return { project: { ...s.project, assetLibrary: lib, status: 'casting' } }
      })
    })
    set({ isParsingScript: false })
    get().syncToList()
  },

  approveAsset: (assetId) => {
    set(s => {
      if (!s.project) return s
      const lib = { ...s.project.assetLibrary }
      lib.scenes = lib.scenes.map(a => a.id === assetId ? { ...a, approvedByUser: true } : a)
      lib.characters = lib.characters.map(a => a.id === assetId ? { ...a, approvedByUser: true } : a)
      lib.props = lib.props.map(a => a.id === assetId ? { ...a, approvedByUser: true } : a)
      return { project: { ...s.project, assetLibrary: lib } }
    })
    get().syncToList()
  },

  approveAllAssets: () => {
    set(s => {
      if (!s.project) return s
      const lib = {
        scenes: s.project.assetLibrary.scenes.map(a => ({ ...a, approvedByUser: true })),
        characters: s.project.assetLibrary.characters.map(a => ({ ...a, approvedByUser: true })),
        props: s.project.assetLibrary.props.map(a => ({ ...a, approvedByUser: true })),
      }
      return { project: { ...s.project, assetLibrary: lib } }
    })
    get().syncToList()
  },

  lockCharacter: (characterId: string) => {
    set(s => {
      if (!s.project) return s
      const lib = { ...s.project.assetLibrary }
      lib.characters = lib.characters.map(a => {
        if (a.id !== characterId || a.kind !== 'character') return a
        const char = a as CharacterAsset
        return {
          ...char,
          isLocked: true,
          lockedImageUrl: char.imageUrl,
          approvedByUser: true,
        }
      })
      return { project: { ...s.project, assetLibrary: lib } }
    })
    get().syncToList()
  },

  unlockCharacter: (characterId: string) => {
    set(s => {
      if (!s.project) return s
      const lib = { ...s.project.assetLibrary }
      lib.characters = lib.characters.map(a => {
        if (a.id !== characterId || a.kind !== 'character') return a
        return { ...a, isLocked: false }
      })
      return { project: { ...s.project, assetLibrary: lib } }
    })
    get().syncToList()
  },

  // === Stage 3 ===
  generateShots: async () => {
    const p = get().project
    const cost = getCreditCost('generate_shots', 'cost_first')
    const ok = useCreditsStore.getState().consumeCredits(cost, p?.id ?? '', p?.title ?? '', '生成镜头')
    if (!ok) { alert('积分不足，无法生成镜头'); return }
    set({ isGeneratingShots: true })
    const count = p?.inferredConfig.recommendedShotCount ?? 10
    const shots = await gen.generateShots(p?.script.rawText ?? '', count)
    // Group shots into episodes (5 shots per episode default)
    const shotsPerEpisode = 5
    const episodes: Episode[] = []
    for (let i = 0; i < shots.length; i += shotsPerEpisode) {
      const episodeShots = shots.slice(i, i + shotsPerEpisode)
      const episodeNum = Math.floor(i / shotsPerEpisode) + 1
      episodes.push({
        id: uuid(),
        number: episodeNum,
        title: `第${episodeNum}集`,
        emotionalTone: episodeNum === 1 ? 'setup' : episodeNum === Math.ceil(shots.length / shotsPerEpisode) ? 'cliffhanger' : 'conflict',
        shots: episodeShots,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    set(s => {
      if (!s.project) return { isGeneratingShots: false }
      return { isGeneratingShots: false, project: { ...s.project, shots, episodes, status: 'shooting' } }
    })
    get().syncToList()
  },

  addEpisode: () => {
    set(s => {
      if (!s.project) return s
      const eps = s.project.episodes
      const newEp: Episode = {
        id: uuid(),
        number: eps.length + 1,
        title: `第${eps.length + 1}集`,
        emotionalTone: 'setup',
        shots: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      return { project: { ...s.project, episodes: [...eps, newEp] } }
    })
  },

  removeEpisode: (episodeId) => {
    set(s => {
      if (!s.project) return s
      const episodes = s.project.episodes.filter(e => e.id !== episodeId)
        .map((e, i) => ({ ...e, number: i + 1, title: `第${i + 1}集` }))
      return { project: { ...s.project, episodes } }
    })
  },

  updateEpisode: (episodeId, patch) => {
    set(s => {
      if (!s.project) return s
      const episodes = s.project.episodes.map(e =>
        e.id === episodeId ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e,
      )
      return { project: { ...s.project, episodes } }
    })
  },

  moveShotToEpisode: (shotId, fromEpisodeId, toEpisodeId, newOrder) => {
    set(s => {
      if (!s.project) return s
      const episodes = s.project.episodes.map(ep => {
        if (ep.id === fromEpisodeId) {
          return { ...ep, shots: ep.shots.filter(sh => sh.id !== shotId), updatedAt: new Date().toISOString() }
        }
        if (ep.id === toEpisodeId) {
          const shot = s.project!.shots.find(sh => sh.id === shotId)
          if (!shot) return ep
          const newShots = [...ep.shots]
          newShots.splice(newOrder, 0, shot)
          return { ...ep, shots: newShots.map((sh, i) => ({ ...sh, order: i })), updatedAt: new Date().toISOString() }
        }
        return ep
      })
      return { project: { ...s.project, episodes } }
    })
  },

  startShoot: () => {
    const p = get().project
    if (!p || p.shots.length === 0) return
    const cost = getCreditCost('shoot_pipeline', 'cost_first')
    const ok = useCreditsStore.getState().consumeCredits(cost, p.id, p.title, '自动开拍')
    if (!ok) { alert('积分不足，无法开拍'); return }
    set({ isShooting: true })
    const cancel = gen.startShootPipeline(
      p.shots,
      (shotId, stage, ps) => {
        set(s => {
          if (!s.project) return s
          const shots = s.project.shots.map(sh =>
            sh.id === shotId ? { ...sh, pipeline: { ...sh.pipeline, [stage]: ps } } : sh,
          )
          return { project: { ...s.project, shots } }
        })
      },
      () => {
        set({ isShooting: false, cancelShoot: null })
        get().syncToList()
      },
    )
    set({ cancelShoot: cancel })
  },

  reshootShot: async (shotId, instruction) => {
    const p = get().project
    const cost = getCreditCost('reshoot_shot', 'cost_first')
    const ok = useCreditsStore.getState().consumeCredits(cost, p?.id ?? '', p?.title ?? '', '重拍镜头')
    if (!ok) { alert('积分不足，无法重拍'); return }
    await gen.reshootShot(shotId, instruction, (stage, ps) => {
      set(s => {
        if (!s.project) return s
        const shots = s.project.shots.map(sh =>
          sh.id === shotId ? { ...sh, pipeline: { ...sh.pipeline, [stage]: ps } } : sh,
        )
        return { project: { ...s.project, shots } }
      })
    })
    get().syncToList()
  },

  updateShotDialogue: (shotId, dialogue) => {
    set(s => {
      if (!s.project) return s
      const shots = s.project.shots.map(sh => sh.id === shotId ? { ...sh, dialogue } : sh)
      return { project: { ...s.project, shots } }
    })
    get().syncToList()
  },

  // === Stage 4 ===
  renderMasterCut: async () => {
    const p = get().project
    if (!p) return
    const cost = getCreditCost('render_master_cut', 'cost_first')
    const ok = useCreditsStore.getState().consumeCredits(cost, p.id, p.title, '渲染成片')
    if (!ok) { alert('积分不足，无法渲染'); return }
    set({ isRendering: true })
    const result = await gen.renderMasterCut(p.id)
    set(s => {
      if (!s.project) return { isRendering: false }
      return {
        isRendering: false,
        project: {
          ...s.project,
          status: 'mastering',
          masterCut: {
            id: uuid(),
            projectId: s.project.id,
            subtitlesEnabled: true,
            subtitleStyle: { animation: 'fade', position: 'bottom', fontSize: 'md', fontColor: '#ffffff', backgroundColor: 'rgba(0,0,0,0.6)', backgroundEnabled: true },
            bgmEnabled: true,
            bgmTrack: 'epic_tension',
            ...result,
          },
        },
      }
    })
    get().syncToList()
  },

  toggleSubtitles: () => {
    set(s => {
      if (!s.project?.masterCut) return s
      return {
        project: {
          ...s.project,
          masterCut: { ...s.project.masterCut, subtitlesEnabled: !s.project.masterCut.subtitlesEnabled },
        },
      }
    })
  },

  setSubtitleStyle: (style) => {
    set(s => {
      if (!s.project?.masterCut) return s
      return {
        project: {
          ...s.project,
          masterCut: { ...s.project.masterCut, subtitleStyle: style },
        },
      }
    })
  },

  toggleBgm: () => {
    set(s => {
      if (!s.project?.masterCut) return s
      return {
        project: {
          ...s.project,
          masterCut: { ...s.project.masterCut, bgmEnabled: !s.project.masterCut.bgmEnabled },
        },
      }
    })
  },

  createVariant: async (regionTag) => {
    const p = get().project
    if (!p) return
    const cost = getCreditCost('create_variant', 'cost_first')
    const ok = useCreditsStore.getState().consumeCredits(cost, p.id, p.title, '创建地域变体')
    if (!ok) { alert('积分不足，无法创建变体'); return }
    const variant: RegionVariant = {
      id: uuid(),
      parentProjectId: p.id,
      region: regionTag as any,
      status: 'pending',
      estimatedCost: 50,
    }
    set(s => {
      if (!s.project) return s
      return { project: { ...s.project, variants: [...s.project.variants, variant] } }
    })
    await gen.createRegionVariant((status) => {
      set(s => {
        if (!s.project) return s
        const variants = s.project.variants.map(v =>
          v.id === variant.id ? { ...v, status: status as any } : v,
        )
        return { project: { ...s.project, variants } }
      })
    })
    get().syncToList()
  },

  setStage: (stage) => {
    set(s => {
      if (!s.project) return s
      const lastEnteredStage = Math.max(s.project.lastEnteredStage, stage) as 1 | 2 | 3 | 4
      return { project: { ...s.project, lastEnteredStage } }
    })
    get().syncToList()
  },
}))
