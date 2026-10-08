import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Link, NavLink } from 'react-router'
import { PATHS } from '@/app/paths'
import { useLocalized } from '@/app/providers/localeContext'
import { BrandMark } from '@/components/brand/BrandMark'
import { navigationContent } from '@/content/navigation.content'
import { uiContent } from '@/content/ui.content'
import { MobileNav } from './MobileNav'
import { SettingsMenu } from './SettingsMenu'

// Laptop: logo left, menu center, settings gear right.
// Phone: logo left, hamburger button right that opens the MobileNav.
export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { brand, menuItems } = useLocalized(navigationContent)
  const { nav } = useLocalized(uiContent)

  function closeMobileMenu() {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
        <Link to={PATHS.home} onClick={closeMobileMenu} className="flex items-center gap-3">
          <BrandMark />
          <span className="flex flex-col leading-none">
            <span className="text-lg font-semibold">{brand.name}</span>
            <span className="mt-1 text-xs text-muted">{brand.tagline}</span>
          </span>
        </Link>

        <nav
          aria-label={nav.mainLabel}
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex"
        >
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              // "end": Home is only active on "/", not on every page
              end
              className={({ isActive }) =>
                isActive ? 'font-medium text-primary' : 'font-medium text-foreground hover:text-primary'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:block">
          <SettingsMenu />
        </div>

        <button
          type="button"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-nav"
          aria-label={isMobileMenuOpen ? nav.closeMenu : nav.openMenu}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex size-11 cursor-pointer items-center justify-center rounded-lg hover:bg-surface md:hidden"
        >
          {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {isMobileMenuOpen && <MobileNav id="mobile-nav" onNavigate={closeMobileMenu} />}
    </header>
  )
}
