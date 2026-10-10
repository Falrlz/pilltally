import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router'
import { RootLayout } from '@/app/layouts/RootLayout'
import { PATHS } from '@/app/paths'
import { PageLoading } from '@/components/shared/PageLoading'
// Home is the first page most visitors see, so it is loaded right away
import HomePage from '@/pages/HomePage'

// Other pages are downloaded only when they are opened (code splitting).
// The Count page will later contain the camera and model code,
// so Home and About stay small (docs/web_app.md section 7).
function lazyPage(loadPage: () => Promise<{ default: ComponentType }>) {
  return async () => {
    const pageModule = await loadPage()
    return { Component: pageModule.default }
  }
}

export const router = createBrowserRouter([
  {
    // Every page is shown inside RootLayout (at its <Outlet />)
    element: <RootLayout />,
    // Shown on the first visit while the code of a lazy page is downloading
    hydrateFallbackElement: <PageLoading />,
    children: [
      { path: PATHS.home, element: <HomePage /> },
      { path: PATHS.count, lazy: lazyPage(() => import('@/pages/CountPage')) },
      { path: PATHS.about, lazy: lazyPage(() => import('@/pages/AboutPage')) },
      // Any other URL
      { path: '*', lazy: lazyPage(() => import('@/pages/NotFoundPage')) },
    ],
  },
])
