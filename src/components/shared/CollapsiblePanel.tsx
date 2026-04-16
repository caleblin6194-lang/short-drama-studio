'use client'

import { useState } from 'react'

interface CollapsiblePanelProps {
  title: string
  icon?: string
  children: React.ReactNode
  defaultCollapsed?: boolean
}

export default function CollapsiblePanel({ 
  title, 
  icon = '▸', 
  children, 
  defaultCollapsed = true 
}: CollapsiblePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  return (
    <div className="card p-4">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between text-left cursor-pointer"
      >
        <h3 className="text-sm font-medium text-[#a0a0b8]">
          {icon} {title}
        </h3>
        <span className={`text-[#a0a0b8] text-xs transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>
          ▸
        </span>
      </button>
      {!isCollapsed && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  )
}
