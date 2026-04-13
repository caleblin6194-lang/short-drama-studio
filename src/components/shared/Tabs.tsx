'use client'

interface TabItem {
  key: string
  label: string
  count?: number
}

interface TabsProps {
  items: TabItem[]
  activeKey: string
  onChange: (key: string) => void
}

export default function Tabs({ items, activeKey, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 bg-[#1a1a2e] rounded-lg p-1">
      {items.map(item => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
            activeKey === item.key
              ? 'bg-[#6c5ce7] text-white'
              : 'text-[#a0a0b8] hover:text-white'
          }`}
        >
          {item.label}
          {item.count !== undefined && (
            <span className={`ml-1.5 text-xs ${activeKey === item.key ? 'text-white/70' : 'text-[#a0a0b8]/60'}`}>
              {item.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
