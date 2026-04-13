'use client'

import { useState, useMemo } from 'react'

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  pageSize?: number
  keyField?: string
  emptyText?: string
}

export default function DataTable<T extends Record<string, any>>({
  columns, data, pageSize = 10, keyField = 'id', emptyText = '暂无数据',
}: DataTableProps<T>) {
  const [page, setPage] = useState(0)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey]
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / pageSize)
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  if (data.length === 0) {
    return <div className="text-center py-12 text-[#a0a0b8] text-sm">{emptyText}</div>
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a3e]">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-[#a0a0b8] uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:text-white' : ''}`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  {col.label}
                  {sortKey === col.key && <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map(item => (
              <tr key={item[keyField]} className="border-b border-[#2a2a3e]/50 hover:bg-[#1a1a2e] transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-white">
                    {col.render ? col.render(item) : String(item[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-[#a0a0b8]">共 {sorted.length} 条</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 rounded bg-[#1a1a2e] text-[#a0a0b8] disabled:opacity-30 hover:bg-[#2a2a3e] cursor-pointer disabled:cursor-not-allowed">上一页</button>
            <span className="px-3 py-1 text-[#a0a0b8]">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1 rounded bg-[#1a1a2e] text-[#a0a0b8] disabled:opacity-30 hover:bg-[#2a2a3e] cursor-pointer disabled:cursor-not-allowed">下一页</button>
          </div>
        </div>
      )}
    </div>
  )
}
