import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project } from '@/types'
import { createEmptyProject, createInitialProjects } from '@/mock/data'

interface ProjectListState {
  projects: Project[]
  createProject: (overrides?: Partial<Project>) => Project
  deleteProject: (id: string) => void
  getProject: (id: string) => Project | undefined
  updateProject: (id: string, patch: Partial<Project>) => void
}

export const useProjectListStore = create<ProjectListState>()(
  persist(
    (set, get) => ({
      projects: createInitialProjects(),

      createProject: (overrides) => {
        const project = createEmptyProject(overrides)
        set(s => ({ projects: [project, ...s.projects] }))
        return project
      },

      deleteProject: (id) => {
        set(s => ({ projects: s.projects.filter(p => p.id !== id) }))
      },

      getProject: (id) => {
        return get().projects.find(p => p.id === id)
      },

      updateProject: (id, patch) => {
        set(s => ({
          projects: s.projects.map(p =>
            p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
          ),
        }))
      },
    }),
    { name: 'project-list' }
  )
)
