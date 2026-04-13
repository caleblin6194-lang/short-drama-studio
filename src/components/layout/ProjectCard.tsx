'use client'

import Link from 'next/link'
import type { Project } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  draft: '草稿',
  scripting: '编剧中',
  casting: '筹备中',
  shooting: '拍摄中',
  mastering: '制作中',
  published: '已发布',
}

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  scripting: 'bg-purple-500/20 text-purple-400',
  casting: 'bg-blue-500/20 text-blue-400',
  shooting: 'bg-amber-500/20 text-amber-400',
  mastering: 'bg-emerald-500/20 text-emerald-400',
  published: 'bg-green-500/20 text-green-400',
}

export default function ProjectCard({ project }: { project: Project }) {
  const stageProgress = (project.lastEnteredStage / 4) * 100

  return (
    <Link href={`/project/${project.id}/stage1`} className="card block p-4 transition-all hover:shadow-lg hover:shadow-[#6c5ce7]/5 group">
      {/* 封面占位 */}
      <div className="aspect-video rounded-lg bg-[#1a1a2e] mb-3 flex items-center justify-center overflow-hidden">
        <span className="text-3xl opacity-30">🎬</span>
      </div>

      {/* 标题 */}
      <h3 className="font-semibold text-white truncate mb-2 group-hover:text-[#6c5ce7] transition-colors">
        {project.title || '未命名项目'}
      </h3>

      {/* 状态 */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[project.status] || STATUS_COLOR.draft}`}>
          {STATUS_LABEL[project.status] || '草稿'}
        </span>
        <span className="text-xs text-[#a0a0b8]">阶段 {project.lastEnteredStage}/4</span>
      </div>

      {/* 进度条 */}
      <div className="h-1 rounded-full bg-[#1e1e2e] overflow-hidden">
        <div className="h-full rounded-full bg-[#6c5ce7] transition-all" style={{ width: `${stageProgress}%` }} />
      </div>
    </Link>
  )
}
