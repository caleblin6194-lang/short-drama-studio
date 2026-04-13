'use client'

import { useRouter } from 'next/navigation'
import { useProjectListStore } from '@/store/useProjectListStore'
import ProjectCard from '@/components/layout/ProjectCard'

export default function ProjectsPage() {
  const { projects, createProject } = useProjectListStore()
  const router = useRouter()

  const handleCreate = () => {
    const p = createProject()
    router.push(`/project/${p.id}/stage1`)
  }

  return (
    <div className="flex-1 p-8 max-w-6xl mx-auto w-full">
      {/* 顶栏 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">我的短剧</h1>
          <p className="text-sm text-[#a0a0b8] mt-1">{projects.length} 个项目</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-5 py-2.5 rounded-lg bg-[#6c5ce7] hover:bg-[#5a4bd1] text-white font-medium transition-colors cursor-pointer"
        >
          + 新建项目
        </button>
      </div>

      {/* 项目网格 */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-[#a0a0b8]">
          <span className="text-5xl mb-4 opacity-30">🎬</span>
          <p className="text-lg mb-2">还没有项目</p>
          <p className="text-sm">点击上方按钮创建你的第一部短剧</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  )
}
