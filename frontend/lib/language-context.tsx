'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Lang = 'en' | 'zh'

type LanguageContextValue = {
  lang: Lang
  setLang: (l: Lang) => void
}

const LanguageContext = createContext<LanguageContextValue>({ lang: 'en', setLang: () => {} })

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const s = typeof window !== 'undefined' ? (localStorage.getItem('lang') as Lang | null) : null
    if (s) setLangState(s)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', lang)
      document.documentElement.lang = lang
    }
  }, [lang])

  const setLang = (l: Lang) => setLangState(l)

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  return useContext(LanguageContext)
}
