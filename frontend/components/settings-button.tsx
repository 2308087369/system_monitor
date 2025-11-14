'use client'

import { useTheme } from 'next-themes'
import { useLanguage } from '@/lib/language-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sun, Moon, Globe } from 'lucide-react'
import { useState } from 'react'

export function SettingsButton() {
  const { theme, setTheme } = useTheme()
  const { lang, setLang, t } = useLanguage()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button variant="outline" size="sm" className="border-neutral-300 hover:bg-neutral-100" onClick={() => setOpen(o => !o)}>
        <Globe className="w-4 h-4 mr-2" />
        {t('settings_label')}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-64">
          <Card className="border-neutral-200">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="text-sm font-semibold text-neutral-900">{t('theme_label')}</div>
                <div className="flex gap-2">
                  <Button variant={theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('light')}>
                    <Sun className="w-4 h-4 mr-2" />{t('light')}
                  </Button>
                  <Button variant={theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('dark')}>
                    <Moon className="w-4 h-4 mr-2" />{t('dark')}
                  </Button>
                  <Button variant={theme === 'system' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('system')}>
                    {t('system')}
                  </Button>
                </div>
                <div className="text-sm font-semibold text-neutral-900 mt-3">{t('language_label')}</div>
                <div className="flex gap-2">
                  <Button variant={lang === 'en' ? 'default' : 'outline'} size="sm" onClick={() => setLang('en')}>{t('english')}</Button>
                  <Button variant={lang === 'zh' ? 'default' : 'outline'} size="sm" onClick={() => setLang('zh')}>{t('chinese')}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
