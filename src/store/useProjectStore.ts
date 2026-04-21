'use client'

import { create } from 'zustand'
import type { Project, TagSet, Shot, PipelineStage, Opening, RegionVariant, StoryBeatId, StoryStructurePlan, SubtitleStyle, Episode, EmotionalTone, CharacterAsset, PipelineStatus, VideoModelOption, SubtitleBlock } from '@/types'
import { DEFAULT_GLOBAL_CONFIG } from '@/types'
import { inferConfig } from '@/lib/inferConfig'
import { createStoryStructurePlan, formatStoryStructureToScript } from '@/lib/storyStructure'
import { useProjectListStore } from './useProjectListStore'
import { useCreditsStore } from './useCreditsStore'
import { useAuthStore } from './useAuthStore'
import { getCreditCost } from '@/lib/creditCosts'
import * as gen from '@/mock/generators'
import { v4 as uuid } from 'uuid'
import { startRealShootPipeline } from '@/lib/api/shoot-pipeline'

let renderAbortController: AbortController | null = null

interface ProjectStoreState {
  project: Project | null
  openings: Opening[]
  isGeneratingOpenings: boolean
  isExtendingScript: boolean
  isParsingScript: boolean
  imageGenProgress: { done: number; total: number } | null
  isGeneratingShots: boolean
  isShooting: boolean
  isRendering: boolean
  cancelShoot: (() => void) | null

  loadProject: (id: string) => void
  syncToList: () => void
  syncFromServer: (id: string) => Promise<void>

  // Stage 1
  setTag: <K extends keyof TagSet>(key: K, value: TagSet[K]) => void
  setTitle: (title: string) => void
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
  resetAssetApprovals: () => void
  reshootAsset: (assetId: string, instruction?: string) => void
  reshootAllAssets: (kind: 'scene' | 'character' | 'prop') => void
  addAsset: (asset: any, kind: 'scene' | 'character' | 'prop') => void
  lockCharacter: (characterId: string) => void
  unlockCharacter: (characterId: string) => void

  // Stage 3
  deleteShot: (shotId: string) => void
  insertShot: (afterShotId?: string, episodeId?: string) => void
  generateShots: () => Promise<void>
  addEpisode: () => void
  removeEpisode: (episodeId: string) => void
  updateEpisode: (episodeId: string, patch: Partial<Episode>) => void
  moveShotToEpisode: (shotId: string, fromEpisodeId: string, toEpisodeId: string, newOrder: number) => void
  startShoot: () => void
  shootEpisode: (episodeId: string) => void
  shootSingleShot: (shotId: string) => Promise<void>
  reshootShot: (shotId: string, instruction: string, model?: VideoModelOption) => Promise<void>
  updateShotDialogue: (shotId: string, dialogue: string) => void
  updateShotVideoModel: (shotId: string, model: VideoModelOption) => void

  // Stage 3 extra
  assignShotToEpisode: (shotId: string, episodeId: string) => void
  setShotTransition: (shotId: string, transitionType: string) => void
  updateShotDescription: (shotId: string, description: string) => void
  updateShotNarration: (shotId: string, narration: string) => void
  toggleNarrationMode: () => void

  // Stage 4
  renderMasterCut: () => Promise<void>
  cancelRender: () => void
  toggleSubtitles: () => void
  setSubtitleStyle: (style: SubtitleStyle) => void
  toggleBgm: () => void
  setBgmTrack: (track: string) => void
  applySubtitleBlocks: (blocks: SubtitleBlock[]) => void
  createVariant: (regionTag: string) => Promise<void>

  // Global config
  updateGlobalConfig: (patch: Partial<import('@/types').GlobalConfig>) => void

  // Navigation
  setStage: (stage: 1 | 2 | 3 | 4) => void
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  project: null,
  openings: [],
  isGeneratingOpenings: false,
  isExtendingScript: false,
  isParsingScript: false,
  imageGenProgress: null,
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
    if (p) {
      useProjectListStore.getState().updateProject(p.id, p)
      // Also sync to server
      fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      }).catch(console.error)
    }
  },

  syncFromServer: async (id: string) => {
    try {
      const res = await fetch(`/api/projects?id=${id}`)
      if (res.ok) {
        const projects = await res.json()
        const serverProject = projects.find((p: any) => p.id === id)
        if (serverProject) {
          useProjectListStore.getState().updateProject(id, serverProject)
          set({ project: { ...serverProject } })
        }
      }
    } catch (e) {
      console.error('Failed to sync from server:', e)
    }
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

  setTitle: (title) => {
    set(s => {
      if (!s.project) return s
      return { project: { ...s.project, title } }
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

    // Call server-side API route which proxies to Doubao LLM (bypasses CORS)
    try {
      const res = await fetch('/api/script-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptText }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || '解析失败 HTTP ' + res.status)
      }

      // Add all assets first (without images, status=generating)
      const allAssetIds: { id: string; type: 'scene' | 'character' | 'prop' }[] = []

      const addAssets = (assets: any[], type: 'scene' | 'character' | 'prop') => {
        for (const a of assets) {
          const id = uuid()
          allAssetIds.push({ id, type })
          let asset: any = { id, name: a.name ?? a.Name ?? '', description: a.description ?? a.Description ?? '', status: 'generating' as const, approvedByUser: false }
          if (type === 'scene') {
            asset = { ...asset, kind: 'scene' as const, timeOfDay: a.timeOfDay ?? a.TimeOfDay, mood: a.mood ?? a.Mood }
          } else if (type === 'character') {
            asset = { ...asset, kind: 'character' as const, tier: a.tier ?? 'support', age: a.age, gender: a.gender, isLocked: false }
          } else {
            asset = { ...asset, kind: 'prop' as const }
          }
          set(s => {
            if (!s.project) return s
            const lib = { ...s.project.assetLibrary }
            if (type === 'scene') lib.scenes = [...lib.scenes, asset]
            if (type === 'character') lib.characters = [...lib.characters, asset]
            if (type === 'prop') lib.props = [...lib.props, asset]
            return { project: { ...s.project, assetLibrary: lib, status: 'casting' } }
          })
        }
      }

      addAssets(data.scenes ?? [], 'scene')
      addAssets(data.characters ?? [], 'character')
      addAssets(data.props ?? [], 'prop')

      // Now generate images for each asset via server-side API
      const generateImageForAsset = async (assetId: string, type: 'scene' | 'character' | 'prop', name: string, description: string) => {
        try {
          let prompt = ''
          if (type === 'scene') {
            prompt = `电影级场景画面，${name}，${description}，电影光影，高细节，8K`
          } else if (type === 'character') {
            prompt = `电影级人物肖像，${name}，${description}，正脸，高细节，8K`
          } else {
            prompt = `电影级道具特写，${name}，${description}，高细节，8K`
          }

          const ires = await fetch('/api/shoot/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, size: '1K' }),
          })
          const iresult = await ires.json()

          if (iresult.status === 'done' && iresult.imageUrl) {
            set(s => {
              if (!s.project) return s
              const lib = { ...s.project.assetLibrary }
              const update = (arr: any[]) => arr.map(a => a.id === assetId ? { ...a, imageUrl: iresult.imageUrl, status: 'ready' as const } : a)
              lib.scenes = update(lib.scenes)
              lib.characters = update(lib.characters)
              lib.props = update(lib.props)
              return { project: { ...s.project, assetLibrary: lib } }
            })
          }
        } catch (e) {
          console.error('Image gen failed for', name, e)
          // Mark as ready without image
          set(s => {
            if (!s.project) return s
            const lib = { ...s.project.assetLibrary }
            const update = (arr: any[]) => arr.map(a => a.id === assetId ? { ...a, status: 'ready' as const } : a)
            lib.scenes = update(lib.scenes)
            lib.characters = update(lib.characters)
            lib.props = update(lib.props)
            return { project: { ...s.project, assetLibrary: lib } }
          })
        }
      }

      // Generate images in parallel for all assets
      const allAssets = [...(data.scenes ?? []), ...(data.characters ?? []), ...(data.props ?? [])]
      let done = 0
      const total = allAssets.length
      set({ imageGenProgress: { done: 0, total } })
      await Promise.all(allAssets.map((a, i) => {
        const { id, type } = allAssetIds[i]
        return generateImageForAsset(id, type, a.name ?? a.Name ?? '', a.description ?? a.Description ?? '').then(() => {
          done++
          set({ imageGenProgress: { done, total } })
        })
      }))
      set({ imageGenProgress: null })
    } catch (err: any) {
      alert('解析剧本失败：' + err.message)
    }

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

  resetAssetApprovals: () => {
    set(s => {
      if (!s.project) return s
      const lib = {
        scenes: s.project.assetLibrary.scenes.map(a => ({ ...a, approvedByUser: false })),
        characters: s.project.assetLibrary.characters.map(a => ({ ...a, approvedByUser: false })),
        props: s.project.assetLibrary.props.map(a => ({ ...a, approvedByUser: false })),
      }
      return { project: { ...s.project, assetLibrary: lib } }
    })
    get().syncToList()
  },

  reshootAsset: (assetId, instruction?) => {
    const p = get().project
    if (!p) return
    // Find the asset
    let asset: any = null
    let kind: 'scene' | 'character' | 'prop' | null = null
    for (const s of p.assetLibrary.scenes) { if (s.id === assetId) { asset = s; kind = 'scene' } }
    for (const c of p.assetLibrary.characters) { if (c.id === assetId) { asset = c; kind = 'character' } }
    for (const pr of p.assetLibrary.props) { if (pr.id === assetId) { asset = pr; kind = 'prop' } }
    if (!asset || !kind) return

    let prompt = ''
    if (instruction?.trim()) {
      // User gave specific instruction — blend with asset identity
      if (kind === 'scene') prompt = `电影级场景画面，${asset.name}，${instruction}，电影光影，高细节，8K`
      else if (kind === 'character') prompt = `电影级人物肖像，${asset.name}，${instruction}，正脸，高细节，8K`
      else prompt = `电影级道具特写，${asset.name}，${instruction}，高细节，8K`
    } else {
      if (kind === 'scene') prompt = `电影级场景画面，${asset.name}，${asset.description ?? ''}，电影光影，高细节，8K`
      else if (kind === 'character') prompt = `电影级人物肖像，${asset.name}，${asset.description ?? ''}，正脸，高细节，8K`
      else prompt = `电影级道具特写，${asset.name}，${asset.description ?? ''}，高细节，8K`
    }

    // Mark as generating
    set(s => {
      if (!s.project) return s
      const lib = { ...s.project.assetLibrary }
      const update = (arr: any[]) => arr.map(a => a.id === assetId ? { ...a, imageUrl: undefined, status: 'generating' as const } : a)
      if (kind === 'scene') lib.scenes = update(lib.scenes)
      else if (kind === 'character') lib.characters = update(lib.characters)
      else lib.props = update(lib.props)
      return { project: { ...s.project, assetLibrary: lib } }
    })

    // Generate new image
    fetch('/api/shoot/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, size: '1K' }),
    }).then(res => res.json()).then(iresult => {
      if (iresult.status === 'done' && iresult.imageUrl) {
        set(s => {
          if (!s.project) return s
          const lib = { ...s.project.assetLibrary }
          const update = (arr: any[]) => arr.map(a => a.id === assetId ? { ...a, imageUrl: iresult.imageUrl, status: 'ready' as const } : a)
          if (kind === 'scene') lib.scenes = update(lib.scenes)
          else if (kind === 'character') lib.characters = update(lib.characters)
          else lib.props = update(lib.props)
          return { project: { ...s.project, assetLibrary: lib } }
        })
      } else {
        set(s => {
          if (!s.project) return s
          const lib = { ...s.project.assetLibrary }
          const update = (arr: any[]) => arr.map(a => a.id === assetId ? { ...a, status: 'ready' as const } : a)
          if (kind === 'scene') lib.scenes = update(lib.scenes)
          else if (kind === 'character') lib.characters = update(lib.characters)
          else lib.props = update(lib.props)
          return { project: { ...s.project, assetLibrary: lib } }
        })
      }
      get().syncToList()
    }).catch(() => {
      set(s => {
        if (!s.project) return s
        const lib = { ...s.project.assetLibrary }
        const update = (arr: any[]) => arr.map(a => a.id === assetId ? { ...a, status: 'ready' as const } : a)
        if (kind === 'scene') lib.scenes = update(lib.scenes)
        else if (kind === 'character') lib.characters = update(lib.characters)
        else lib.props = update(lib.props)
        return { project: { ...s.project, assetLibrary: lib } }
      })
      get().syncToList()
    })
  },

  reshootAllAssets: (kind) => {
    const p = get().project
    if (!p) return
    const assets = kind === 'scene' ? p.assetLibrary.scenes : kind === 'character' ? p.assetLibrary.characters : p.assetLibrary.props
    for (const a of assets) get().reshootAsset(a.id)
  },

  addAsset: (asset, kind) => {
    set(s => {
      if (!s.project) return s
      const lib = { ...s.project.assetLibrary }
      if (kind === 'scene') lib.scenes = [...lib.scenes, asset]
      else if (kind === 'character') lib.characters = [...lib.characters, asset]
      else if (kind === 'prop') lib.props = [...lib.props, asset]
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
  deleteShot: (shotId) => {
    set(s => {
      if (!s.project) return {}
      const shots = s.project.shots
        .filter(sh => sh.id !== shotId)
        .map((sh, i) => ({ ...sh, order: i }))
      return { project: { ...s.project, shots } }
    })
    get().syncToList()
  },

  insertShot: (afterShotId, episodeId) => {
    set(s => {
      if (!s.project) return {}
      const shots = [...s.project.shots]
      const idx = afterShotId ? shots.findIndex(sh => sh.id === afterShotId) : shots.length - 1
      const insertAt = idx >= 0 ? idx + 1 : shots.length
      // Inherit episodeId from the shot we're inserting after, or use provided episodeId
      const inheritedEpisodeId = episodeId
        ?? (afterShotId ? shots.find(sh => sh.id === afterShotId)?.episodeId : undefined)
      const newShot: import('@/types').Shot = {
        id: uuid(),
        number: `S${insertAt + 1}`,
        order: insertAt,
        sceneRef: '',
        characterRefs: [],
        propRefs: [],
        description: '新增镜头，请编辑描述后重新生成',
        dialogue: '',
        durationSec: 5,
        episodeId: inheritedEpisodeId,
        pipeline: {
          image: { status: 'pending', attemptCount: 0 },
          video: { status: 'pending', attemptCount: 0 },
          audio: { status: 'pending', attemptCount: 0 },
        },
      }
      shots.splice(insertAt, 0, newShot)
      const reordered = shots.map((sh, i) => ({ ...sh, order: i }))
      return { project: { ...s.project, shots: reordered } }
    })
    get().syncToList()
  },

  generateShots: async () => {
    const p = get().project
    const cost = getCreditCost('generate_shots', 'cost_first')
    const ok = useCreditsStore.getState().consumeCredits(cost, p?.id ?? '', p?.title ?? '', '生成镜头')
    if (!ok) { alert('积分不足，无法生成镜头'); return }
    set({ isGeneratingShots: true })
    try {
      const res = await fetch('/api/shots/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptText: p?.script.rawText ?? '', narrationMode: p?.narrationMode ?? false }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { alert(data.error || '生成镜头失败'); return }
      // Clear stale shots before setting new ones
      set(s => s.project ? { project: { ...s.project, shots: [], episodes: [] } } : s)
      const rawShots = data.shots
      // Detect episode sections from script markers like 第一集 / 第1集 / Episode 1
      const scriptText = p?.script.rawText ?? ''
      const EP_RE = /^[\s\S]*?(?=第[一二三四五六七八九十百千\d]+[集话]|Episode\s*\d|第\d+[集话])/i
      const sectionMatches = [...scriptText.matchAll(
        /(?:^|\n)(第[一二三四五六七八九十百千\d]+[集话][^\n]*|Episode\s*\d+[^\n]*)/gi
      )]
      const sectionCount = sectionMatches.length > 1 ? sectionMatches.length : 1
      const tones: EmotionalTone[] = ['setup', 'conflict', 'climax', 'cliffhanger', 'resolution']
      const shotsPerEp = Math.ceil(rawShots.length / sectionCount)
      const episodes: Episode[] = Array.from({ length: sectionCount }, (_, i) => {
        const epId = uuid()
        const label = sectionMatches[i]?.[1]?.trim() || `第${i + 1}集`
        const epShots = rawShots.slice(i * shotsPerEp, (i + 1) * shotsPerEp)
        return {
          id: epId,
          number: i + 1,
          title: label.length > 10 ? `第${i + 1}集` : label,
          emotionalTone: tones[Math.min(i, tones.length - 1)],
          shots: epShots.map((sh: Shot) => ({ ...sh, episodeId: epId })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      })
      const shots = episodes.flatMap(ep => ep.shots as Shot[])
      set(s => {
        if (!s.project) return s
        return { project: { ...s.project, shots, episodes, status: 'shooting', shotsScript: scriptText } }
      })
      get().syncToList()
    } finally {
      set({ isGeneratingShots: false })
    }
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

    const shootCallbacks = {
      onShotUpdate: (shotId: string, stage: 'image' | 'video' | 'audio', ps: any) => {
        set(s => {
          if (!s.project) return s
          const shots = s.project.shots.map(sh => {
            if (sh.id !== shotId) return sh
            const updated = { ...sh, pipeline: { ...sh.pipeline, [stage]: ps } }
            if (stage === 'video' && ps.videoUrl) updated.videoUrl = ps.videoUrl
            if (stage === 'image' && ps.imageUrl) updated.imageUrl = ps.imageUrl
            if (stage === 'audio' && ps.audioUrl) updated.audioUrl = ps.audioUrl
            return updated
          })
          return { project: { ...s.project, shots } }
        })
      },
      onComplete: () => {
        set({ isShooting: false, cancelShoot: null })
        get().syncToList()
      },
      onError: (shotId: string, stage: string, error: string) => {
        console.error(`[Shoot] Shot ${shotId} ${stage} error:`, error)
      },
    }

    const cancel = startRealShootPipeline(p.shots, shootCallbacks, p.assetLibrary, p.narrationMode, p.globalConfig)

    set({ cancelShoot: cancel })
  },

  shootEpisode: (episodeId) => {
    const p = get().project
    if (!p) return
    const episodeShots = p.shots.filter(s => s.episodeId === episodeId)
    if (episodeShots.length === 0) return
    const cost = getCreditCost('shoot_pipeline', 'cost_first')
    const ok = useCreditsStore.getState().consumeCredits(cost, p.id, p.title, '拍摄本集')
    if (!ok) { alert('积分不足，无法开拍'); return }
    set({ isShooting: true })

    const shootCallbacks = {
      onShotUpdate: (shotId: string, stage: 'image' | 'video' | 'audio', ps: any) => {
        set(s => {
          if (!s.project) return s
          const shots = s.project.shots.map(sh => {
            if (sh.id !== shotId) return sh
            const updated = { ...sh, pipeline: { ...sh.pipeline, [stage]: ps } }
            if (stage === 'video' && ps.videoUrl) updated.videoUrl = ps.videoUrl
            if (stage === 'image' && ps.imageUrl) updated.imageUrl = ps.imageUrl
            if (stage === 'audio' && ps.audioUrl) updated.audioUrl = ps.audioUrl
            return updated
          })
          return { project: { ...s.project, shots } }
        })
      },
      onComplete: () => {
        set({ isShooting: false, cancelShoot: null })
        get().syncToList()
      },
      onError: (shotId: string, stage: string, error: string) => {
        console.error(`[ShootEpisode] Shot ${shotId} ${stage} error:`, error)
      },
    }

    const cancel = startRealShootPipeline(episodeShots, shootCallbacks, p.assetLibrary, p.narrationMode, p.globalConfig)
    set({ cancelShoot: cancel })
  },

  shootSingleShot: async (shotId) => {
    const p = get().project
    if (!p) return
    const shot = p.shots.find(s => s.id === shotId)
    if (!shot) return

    const cost = getCreditCost('shoot_pipeline', 'cost_first')
    const ok = useCreditsStore.getState().consumeCredits(cost, p.id, p.title, '生成镜头')
    if (!ok) { alert('积分不足，无法生成'); return }

    // Reset pipeline for this shot
    set(s => {
      if (!s.project) return s
      const shots = s.project.shots.map(sh =>
        sh.id === shotId ? {
          ...sh,
          pipeline: {
            image: { status: 'rendering' as const, attemptCount: 1 },
            video: { status: 'pending' as const, attemptCount: 0 },
            audio: { status: 'pending' as const, attemptCount: 0 },
          },
          imageUrl: undefined, videoUrl: undefined,
        } : sh,
      )
      return { project: { ...s.project, shots } }
    })

    try {
      // Stage 1: Generate image
      const ires = await fetch('/api/shoot/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: shot.description, size: '2K' }),
      })
      const iresult = await ires.json()
      let imageUrl = iresult.imageUrl

      if (iresult.taskId && !imageUrl) {
        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 3000))
          const pr = await fetch(`/api/shoot/video-status/${encodeURIComponent(iresult.taskId)}`)
          const pres = await pr.json()
          if (pres.status === 'done' && pres.imageUrl) { imageUrl = pres.imageUrl; break }
          if (pres.status === 'failed') break
        }
      }

      const imageStatus = imageUrl ? 'done' : 'failed'
      set(s => {
        if (!s.project) return s
        const shots = s.project.shots.map(sh =>
          sh.id === shotId ? {
            ...sh, imageUrl,
            pipeline: { ...sh.pipeline, image: { status: imageStatus as any, attemptCount: 1, modelUsed: 'doubao-seedream-5-0-260128' } },
          } : sh,
        )
        return { project: { ...s.project, shots } }
      })

      if (!imageUrl) return

      // Stage 2: Generate video
      set(s => {
        if (!s.project) return s
        const shots = s.project.shots.map(sh =>
          sh.id === shotId ? { ...sh, pipeline: { ...sh.pipeline, video: { status: 'rendering' as const, attemptCount: 1 } } } : sh,
        )
        return { project: { ...s.project, shots } }
      })

      const model = shot.videoModel && shot.videoModel !== 'auto' ? shot.videoModel : undefined
      const vres = await fetch('/api/shoot/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: shot.description, imageUrl, duration: shot.durationSec || 5, aspectRatio: '9:16', model }),
      })
      const vresult = await vres.json()
      let videoUrl = vresult.videoUrl || vresult.data?.videoUrl

      if (vresult.taskId && !videoUrl) {
        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 5000))
          const pr = await fetch(`/api/shoot/video-status/${encodeURIComponent(vresult.taskId)}`)
          const pres = await pr.json()
          if (pres.status === 'done' && pres.videoUrl) { videoUrl = pres.videoUrl; break }
          if (pres.status === 'failed') break
        }
      }

      const videoStatus = videoUrl ? 'done' : 'failed'
      set(s => {
        if (!s.project) return s
        const shots = s.project.shots.map(sh =>
          sh.id === shotId ? {
            ...sh, videoUrl,
            pipeline: { ...sh.pipeline, video: { status: videoStatus as any, attemptCount: 1, modelUsed: model || 'seedance-2-0' } },
          } : sh,
        )
        return { project: { ...s.project, shots } }
      })

      // Stage 3: Generate audio (TTS from dialogue)
      if (shot.dialogue && videoUrl) {
        set(s => {
          if (!s.project) return s
          const shots = s.project.shots.map(sh =>
            sh.id === shotId ? { ...sh, pipeline: { ...sh.pipeline, audio: { status: 'done' as const, attemptCount: 1 } } } : sh,
          )
          return { project: { ...s.project, shots } }
        })
      } else {
        set(s => {
          if (!s.project) return s
          const shots = s.project.shots.map(sh =>
            sh.id === shotId ? { ...sh, pipeline: { ...sh.pipeline, audio: { status: 'done' as const, attemptCount: 1 } } } : sh,
          )
          return { project: { ...s.project, shots } }
        })
      }

      get().syncToList()
    } catch (err) {
      console.error('[shootSingleShot] error:', err)
      set(s => {
        if (!s.project) return s
        const shots = s.project.shots.map(sh =>
          sh.id === shotId ? {
            ...sh,
            pipeline: {
              image: { ...sh.pipeline.image, status: 'failed' as const },
              video: { ...sh.pipeline.video, status: 'failed' as const },
              audio: { ...sh.pipeline.audio, status: 'done' as const },
            },
          } : sh,
        )
        return { project: { ...s.project, shots } }
      })
    }
  },

  reshootShot: async (shotId, instruction, model) => {
    const p = get().project
    const cost = getCreditCost('reshoot_shot', 'cost_first')
    const ok = useCreditsStore.getState().consumeCredits(cost, p?.id ?? '', p?.title ?? '', '重拍镜头')
    if (!ok) { alert('积分不足，无法重拍'); return }
    const shot = p?.shots.find(s => s.id === shotId)
    if (!shot) return
    // Use real pipeline for reshoot
    const newPrompt = instruction ? `${shot.description} | ${instruction}` : shot.description
    try {
      // Reset pipeline
      set(s => {
        if (!s.project) return s
        const shots = s.project.shots.map(sh =>
          sh.id === shotId ? {
            ...sh,
            description: newPrompt,
            videoModel: model as any,
            pipeline: {
              image: { status: 'pending' as const, attemptCount: 0 },
              video: { status: 'pending' as const, attemptCount: 0 },
              audio: { status: 'pending' as const, attemptCount: 0 },
            },
            imageUrl: undefined, videoUrl: undefined, audioUrl: undefined,
          } : sh,
        )
        return { project: { ...s.project, shots } }
      })
      // Call image API
      const ires = await fetch('/api/shoot/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: newPrompt, size: '1K' }),
      })
      const iresult = await ires.json()
      let imageUrl = iresult.imageUrl
      if (iresult.taskId && !imageUrl) {
        // Poll for result
        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 3000))
          const pr = await fetch(`/api/shoot/video-status/${encodeURIComponent(iresult.taskId)}`)
          const pres = await pr.json()
          if (pres.status === 'done' && pres.imageUrl) { imageUrl = pres.imageUrl; break }
          if (pres.status === 'failed') break
        }
      }
      set(s => {
        if (!s.project) return s
        const shots = s.project.shots.map(sh =>
          sh.id === shotId ? { ...sh, imageUrl, pipeline: { ...sh.pipeline, image: { status: (imageUrl ? 'done' : 'failed') as PipelineStatus, attemptCount: 1, modelUsed: 'doubao-seedream-5-0-260128' } } } : sh,
        )
        return { project: { ...s.project, shots } }
      })
      if (!imageUrl) return
      // Call video API with model
      const vres = await fetch('/api/shoot/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: newPrompt, imageUrl, duration: 5, aspectRatio: '9:16', model }),
      })
      const vresult = await vres.json()
      let videoUrl = vresult.videoUrl
      if (vresult.taskId && !videoUrl) {
        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 3000))
          const pr = await fetch(`/api/shoot/video-status/${encodeURIComponent(vresult.taskId)}`)
          const pres = await pr.json()
          if (pres.status === 'done' && pres.videoUrl) { videoUrl = pres.videoUrl; break }
          if (pres.status === 'failed') break
        }
      }
      set(s => {
        if (!s.project) return s
        const shots = s.project.shots.map(sh =>
          sh.id === shotId ? { ...sh, videoUrl, pipeline: { ...sh.pipeline, video: { status: (videoUrl ? 'done' : 'failed') as PipelineStatus, attemptCount: 1, modelUsed: 'doubao-seedance-2-0-260128' } } } : sh,
        )
        return { project: { ...s.project, shots } }
      })
    } catch (e: any) {
      console.error('Reshoot error:', e)
    }
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

  updateShotVideoModel: (shotId, model) => {
    set(s => {
      if (!s.project) return s
      const shots = s.project.shots.map(sh => sh.id === shotId ? { ...sh, videoModel: model } : sh)
      return { project: { ...s.project, shots } }
    })
    get().syncToList()
  },

  assignShotToEpisode: (shotId, episodeId) => {
    set(s => {
      if (!s.project) return s
      const shots = s.project.shots.map(sh => sh.id === shotId ? { ...sh, episodeId } : sh)
      // Also update episode.shots arrays
      const episodes = s.project.episodes.map(ep => {
        const epShots = shots.filter(sh => sh.episodeId === ep.id)
        return { ...ep, shots: epShots }
      })
      return { project: { ...s.project, shots, episodes } }
    })
    get().syncToList()
  },

  setShotTransition: (shotId, transitionType) => {
    set(s => {
      if (!s.project) return s
      const shots = s.project.shots.map(sh => sh.id === shotId ? { ...sh, transitionIn: transitionType } : sh)
      return { project: { ...s.project, shots } }
    })
    get().syncToList()
  },

  updateShotDescription: (shotId, description) => {
    set(s => {
      if (!s.project) return s
      const shots = s.project.shots.map(sh => sh.id === shotId ? { ...sh, description } : sh)
      return { project: { ...s.project, shots } }
    })
    get().syncToList()
  },

  updateShotNarration: (shotId, narration) => {
    set(s => {
      if (!s.project) return s
      const shots = s.project.shots.map(sh => sh.id === shotId ? { ...sh, narration } : sh)
      return { project: { ...s.project, shots } }
    })
    get().syncToList()
  },

  toggleNarrationMode: () => {
    set(s => {
      if (!s.project) return s
      return { project: { ...s.project, narrationMode: !s.project.narrationMode } }
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
    renderAbortController = new AbortController()
    set({ isRendering: true })
    try {
      const shotsWithVideo = p.shots.filter(s =>
        (s.videoUrl && s.videoUrl !== '#') ||
        (s.pipeline?.video?.videoUrl && s.pipeline.video.videoUrl !== '#')
      )
      if (shotsWithVideo.length === 0) throw new Error('没有可用的镜头视频')

      // Build render list: prefer shot.videoUrl, fall back to pipeline videoUrl
      const renderShots = p.shots
        .filter(s => (s.videoUrl && s.videoUrl !== '#') || (s.pipeline?.video?.videoUrl && s.pipeline.video.videoUrl !== '#'))
        .map(s => ({
          videoUrl: s.videoUrl || s.pipeline.video.videoUrl,
          description: s.description,
          dialogue: s.dialogue || '',
          narration: s.narration || '',
          emotionTag: s.emotionTag || 'neutral',
          durationSec: s.durationSec,
          transitionIn: s.transitionIn,
        }))

      // Resolve bgmUrl: use current bgmTrack as URL if it looks like a URL, else skip
      const mc = p.masterCut
      const bgmUrl = (mc?.bgmEnabled && mc?.bgmTrack?.startsWith('http')) ? mc.bgmTrack : undefined

      const res = await fetch('/api/render/master-cut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: p.id,
          shots: renderShots,
          colorGrading: p.globalConfig?.colorGrading || '',
          narrationMode: p.narrationMode || false,
          bgmUrl,
        }),
        signal: renderAbortController.signal,
      })
      const result = await res.json()
      if (!res.ok || result.error) throw new Error(result.error || '渲染失败')
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
              subtitlesEnabled: s.project.masterCut?.subtitlesEnabled ?? true,
              subtitleStyle: s.project.masterCut?.subtitleStyle ?? { animation: 'fade', position: 'bottom', fontSize: 'md', fontColor: '#ffffff', backgroundColor: 'rgba(0,0,0,0.6)', backgroundEnabled: true },
              bgmEnabled: s.project.masterCut?.bgmEnabled ?? false,
              bgmTrack: s.project.masterCut?.bgmTrack ?? '',
              renderedUrl: result.renderedUrl,
              durationSec: result.durationSec,
            },
          },
        }
      })
    } catch (err: any) {
      if (err.name !== 'AbortError') alert('渲染失败：' + err.message)
      set({ isRendering: false })
    } finally {
      renderAbortController = null
    }
    get().syncToList()
  },

  cancelRender: () => {
    renderAbortController?.abort()
    renderAbortController = null
    set({ isRendering: false })
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

  setBgmTrack: (track) => {
    set(s => {
      if (!s.project?.masterCut) return s
      return {
        project: {
          ...s.project,
          masterCut: { ...s.project.masterCut, bgmTrack: track, bgmEnabled: true },
        },
      }
    })
    get().syncToList()
  },

  applySubtitleBlocks: (blocks) => {
    set(s => {
      if (!s.project?.masterCut) return s
      return {
        project: {
          ...s.project,
          masterCut: { ...s.project.masterCut, subtitleBlocks: blocks, subtitlesEnabled: true },
        },
      }
    })
    get().syncToList()
  },

  createVariant: async (regionTag) => {
    const p = get().project
    if (!p) return
    const token = useAuthStore.getState().accessToken
    if (!token) { alert('请先登录'); return }

    const variant: RegionVariant = {
      id: uuid(),
      parentProjectId: p.id,
      region: regionTag as any,
      status: 'pending',
      estimatedCost: 510,
    }

    // Optimistic update
    set(s => {
      if (!s.project) return s
      return { project: { ...s.project, variants: [...s.project.variants, variant] } }
    })

    try {
      const res = await fetch('/api/variants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId: p.id, region: regionTag }),
      })

      if (res.ok) {
        const { variant: savedVariant } = await res.json()
        set(s => {
          if (!s.project) return s
          return {
            project: {
              ...s.project,
              variants: s.project.variants.map(v => v.id === variant.id ? savedVariant : v),
            },
          }
        })
      } else {
        const err = await res.json()
        alert(err.error || '创建变体失败')
        // Rollback
        set(s => {
          if (!s.project) return s
          return { project: { ...s.project, variants: s.project.variants.filter(v => v.id !== variant.id) } }
        })
      }
    } catch {
      alert('网络错误')
      set(s => {
        if (!s.project) return s
        return { project: { ...s.project, variants: s.project.variants.filter(v => v.id !== variant.id) } }
      })
    }
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

  updateGlobalConfig: (patch) => {
    set(s => {
      if (!s.project) return s
      return {
        project: {
          ...s.project,
          globalConfig: { ...(s.project.globalConfig ?? DEFAULT_GLOBAL_CONFIG), ...patch },
        },
      }
    })
    get().syncToList()
  },
}))
