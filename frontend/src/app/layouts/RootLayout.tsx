import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import { PATHS } from '@/app/paths'
import { useLocalized } from '@/app/providers/localeContext'
import { Footer } from '@/components/shared/Footer'
import { Navbar } from '@/components/shared/Navbar'
import { uiContent } from '@/content/ui.content'

// The frame around every page: navbar, page content, footer
export function RootLayout() {
  const location = useLocation()
  const { nav } = useLocalized(uiContent)
  // The Count page uses the whole screen for the camera, so no footer there
  const showFooter = location.pathname !== PATHS.count

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Keyboard users can jump over the navbar (visible only when focused) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground"
      >
        {nav.skipToContent}
      </a>

      <Navbar />

      <main id="main-content" className="flex-1">
        {/* The current page is shown here */}
        <Outlet />
      </main>

      {showFooter && <Footer />}

      {/* Scroll to the top when going to another page */}
      <ScrollRestoration />
    </div>
  )
}
