'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Lang = 'en' | 'zh'

type LanguageContextValue = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (k: string) => string
}

const LanguageContext = createContext<LanguageContextValue>({ lang: 'en', setLang: () => {}, t: (k: string) => k })

const messages: Record<Lang, Record<string, string>> = {
  en: {
    settings_label: 'Settings',
    theme_label: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language_label: 'Language',
    english: 'English',
    chinese: 'Chinese',

    service_monitor_title: 'Service Monitor',
    logged_in_as: 'Logged in as',
    admin: 'Admin',
    total_services: 'Total Services',
    active: 'Active',
    failed: 'Failed',
    inactive: 'Inactive',
    monitored_services: 'Monitored Services',
    refresh: 'Refresh',
    status_overview: 'Status Overview',
    manage_services: 'Manage Services',
    loading_services: 'Loading services...',
    no_services_monitored: 'No services are being monitored yet',
    add_services: 'Add Services',
    enabled: 'Enabled',
    loaded: 'Loaded',
    yes: 'Yes',
    no: 'No',
    view_details: 'View Details',
    sign_out: 'Sign out',

    back: 'Back',
    manage_services_subtitle: 'Add or remove services from monitoring',
    search_placeholder: 'Search services...',
    previous_page: 'Previous',
    next_page: 'Next',
    available_services: 'Available Services',
    monitored_services_count: 'Monitored Services',
    monitored_badge: 'Monitored',
    remove: 'Remove',
    add: 'Add',
    not_found_title: 'Not found in available list',
    not_found_tip: 'You can still try to add it directly; backend will validate existence',
    add_directly: 'Add directly',
  },
  zh: {
    settings_label: '设置',
    theme_label: '主题',
    light: '浅色',
    dark: '深色',
    system: '系统',
    language_label: '语言',
    english: 'English',
    chinese: '中文',

    service_monitor_title: '服务监控',
    logged_in_as: '当前用户',
    admin: '管理员',
    total_services: '服务总数',
    active: '运行中',
    failed: '失败',
    inactive: '未运行',
    monitored_services: '监控的服务',
    refresh: '刷新',
    status_overview: '状态总览',
    manage_services: '管理服务',
    loading_services: '正在加载服务...',
    no_services_monitored: '当前没有被监控的服务',
    add_services: '添加服务',
    enabled: '启用',
    loaded: '已加载',
    yes: '是',
    no: '否',
    view_details: '查看详情',
    sign_out: '退出登录',

    back: '返回',
    manage_services_subtitle: '添加或移除需要监控的服务',
    search_placeholder: '搜索服务...',
    previous_page: '上一页',
    next_page: '下一页',
    available_services: '可用服务',
    monitored_services_count: '已监控服务',
    monitored_badge: '已监控',
    remove: '移除',
    add: '添加',
    not_found_title: '未在可用列表中找到',
    not_found_tip: '您仍可尝试直接添加，后端将校验服务是否存在',
    add_directly: '直接添加',
  },
}

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
  const t = (k: string) => {
    const table = messages[lang] || messages.en
    return table[k] || messages.en[k] || k
  }

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  return useContext(LanguageContext)
}
