'use client'

import { useState, useEffect, useRef } from 'react'

interface SearchInputProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
}

export default function SearchInput({ value: externalValue, onChange, placeholder = '搜索...', debounceMs = 300 }: SearchInputProps) {
  const [internal, setInternal] = useState(externalValue || '')
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (externalValue !== undefined) setInternal(externalValue)
  }, [externalValue])

  const handleChange = (v: string) => {
    setInternal(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(v), debounceMs)
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0b8] text-sm">🔍</span>
      <input
        type="text"
        value={internal}
        onChange={e => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-[#a0a0b8]/50 focus:outline-none focus:border-[#6c5ce7]"
      />
    </div>
  )
}
