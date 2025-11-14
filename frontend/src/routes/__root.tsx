import { PAGE_TITLE, SIDE_MENUS } from '@/constants/menus'
import { findMenuItem } from '@/utils'
import { createRootRouteWithContext, HeadContent, Outlet } from '@tanstack/react-router'
import Exception from '@/components/exception'
import LoadingScreen from '@/components/loading-screen'
import NotFoundSvg from '@/assets/svg-icon/not-found.svg'
import { useInitialLoading } from '@/hooks/useInitialLoading'

export interface RouterContext {
  isLogged: boolean
}

const getPageTitle = () => {
  const siteTitle = import.meta.env.VITE_APP_TITLE
  const menuItem = findMenuItem(SIDE_MENUS, location.pathname)
  const elsePageTitle = PAGE_TITLE[location.pathname] || ''

  if (elsePageTitle) {
    return `${siteTitle} - ${elsePageTitle}`
  }

  const pageTitle = menuItem?.label
    ? `${siteTitle} - ${menuItem.label}`
    : siteTitle
  return pageTitle
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    window.NProgress?.start?.()
  },
  loader: async () => {
    window.NProgress?.done?.()
  },
  component: () => {
    const isInitialLoading = useInitialLoading(2000)

    if (isInitialLoading) {
      return <LoadingScreen tip={import.meta.env.VITE_APP_TITLE} />
    }

    return (
      <>
        <HeadContent />
        <Outlet />
      </>
    )
  },

  pendingComponent: () => {
    return <LoadingScreen tip='页面加载中...' />
  },
  notFoundComponent: () => {
    return <Exception src={NotFoundSvg} />
  },
  errorComponent: () => {
    return <Exception src={NotFoundSvg} />
  },
  head: () => ({
    meta: [
      {
        name: 'description',
        content: import.meta.env.VITE_APP_DESCRIPTION,
      },
      {
        title: getPageTitle(),
      },
    ],
    links: [
      {
        rel: 'icon',
        href: '/logo.jpg',
      },
    ],
    styles: [
      {
        media: 'all and (max-width: 500px)',
        children: `p {
                  color: blue;
                  background-color: yellow;
                }`,
      },
    ],
    scripts: [],
  }),
})
