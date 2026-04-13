'use client'

import { useState } from 'react'
import { useI18n, LOCALES, useLocale, useSetLocale, type Locale } from '@/i18n/I18nProvider'

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale } = useI18n()
  const setLocale = useSetLocale()
  const [isOpen, setIsOpen] = useState(false)

  const currentLocale = LOCALES.find(l => l.key === locale)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 text-white hover:text-[#6c5ce7] transition-colors ${
          compact ? 'text-xs' : 'text-sm'
        }`}
        title="切换语言 / Switch Language"
      >
        <span>{currentLocale?.label}</span>
        <span className="text-[10px] opacity-60">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl shadow-2xl overflow-hidden min-w-[140px]">
            {LOCALES.map(l => (
              <button
                key={l.key}
                onClick={() => { setLocale(l.key); setIsOpen(false) }}
                className={`flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-[#2a2a3e] transition-colors ${
                  locale === l.key ? 'text-[#6c5ce7] bg-[#6c5ce7]/10' : 'text-white'
                }`}
              >
                <span>{l.label}</span>
                <span className="text-[10px] text-[#6b6b8a]">{l.nativeLabel}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
