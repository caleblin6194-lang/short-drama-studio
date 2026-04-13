'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectListStore } from '@/store/useProjectListStore'
import ProjectCard from '@/components/layout/ProjectCard'
import SearchInput from '@/components/shared/SearchInput'
import Tabs from '@/components/shared/Tabs'
import Button from '@/components/shared/Button'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

export default function DashboardProjectsPage() {
  const { projects, createProject, deleteProject } = useProjectListStore()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = projects.filter(p => {
    if (search && !p.title.includes(search)) return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    return true
  })

  const tabs = [
    { key: 'all', label: '全部', count: projects.length },
    { key: 'draft', label: '草稿', count: projects.filter(p => p.status === 'draft').length },
    { key: 'published', label: '已发布', count: projects.filter(p => p.status === 'published').length },
  ]

  const handleCreate = () => {
    const p = createProject()
    router.push(`/project/${p.id}/stage1`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">项目管理</h2>
        <Button onClick={handleCreate}>+ 新建项目</Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="搜索项目..." />
        </div>
        <Tabs items={tabs} activeKey={statusFilter} onChange={setStatusFilter} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="relative group">
            <ProjectCard project={p} />
            <button
              onClick={e => { e.preventDefault(); setDeleteId(p.id) }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-red-500/20 text-red-400 text-xs flex items-center justify-center transition-opacity cursor-pointer hover:bg-red-500/30"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteProject(deleteId); setDeleteId(null) }}
        title="删除项目"
        message="确定要删除这个项目吗？此操作不可撤销。"
        confirmLabel="删除"
        variant="danger"
      />
    </div>
  )
}
