'use client'

import { useState, useEffect, ReactNode } from 'react'
import { I18nProvider, type Locale } from '@/i18n/I18nProvider'

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'zh'
  const stored = localStorage.getItem('locale')
  if (stored && ['zh', 'en', 'ja', 'ko'].includes(stored)) {
    return stored as Locale
  }
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('zh')) return 'zh'
  if (browserLang.startsWith('ja')) return 'ja'
  if (browserLang.startsWith('ko')) return 'ko'
  return 'zh'
}

export default function Providers({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('zh')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setLocale(getInitialLocale())
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <I18nProvider initialLocale={locale}>
      {children}
    </I18nProvider>
  )
}
