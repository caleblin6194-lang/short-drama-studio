'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import zh from './zh.json'
import en from './en.json'
import ja from './ja.json'
import ko from './ko.json'

export type Locale = 'zh' | 'en' | 'ja' | 'ko'

const translations: Record<Locale, typeof zh> = { zh, en, ja, ko }

export const LOCALES: { key: Locale; label: string; nativeLabel: string }[] = [
  { key: 'zh', label: '中文', nativeLabel: '简体中文' },
  { key: 'en', label: 'English', nativeLabel: 'English' },
  { key: 'ja', label: '日本語', nativeLabel: '日本語' },
  { key: 'ko', label: '한국어', nativeLabel: '한국어' },
]

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType>({
  locale: 'zh',
  setLocale: () => {},
  t: (key) => key,
})

export function I18nProvider({ children, initialLocale = 'zh' }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', l)
      document.documentElement.lang = l
    }
  }, [])

  const t = useCallback((key: string): string => {
    const keys = key.split('.')
    let value: any = translations[locale]
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key
      }
    }
    return typeof value === 'string' ? value : key
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

export function useLocale() {
  return useContext(I18nContext).locale
}

export function useSetLocale() {
  return useContext(I18nContext).setLocale
}
