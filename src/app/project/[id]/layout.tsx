'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useProjectStore } from '@/store/useProjectStore'
import StageNav from '@/components/layout/StageNav'

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>()
  const { project, loadProject } = useProjectStore()

  useEffect(() => {
    if (id) loadProject(id)
  }, [id, loadProject])

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#a0a0b8]">
        加载中...
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-[#2a2a3e]">
        <div className="max-w-6xl mx-auto w-full px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/projects" className="text-[#a0a0b8] hover:text-white transition-colors text-sm">
              ← 返回
            </Link>
            <h1 className="text-white font-semibold truncate">{project.title || '未命名项目'}</h1>
          </div>
          <StageNav projectId={project.id} lastEnteredStage={project.lastEnteredStage} />
        </div>
      </header>

      {/* 页面内容 */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-6">
        {children}
      </main>
    </div>
  )
}
