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

// Laptop (1024px and up): logo left, menu center, settings gear right.
// Phone and tablet: logo left, hamburger button right that opens the MobileNav.
export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { brand, menuItems } = useLocalized(navigationContent)
  const { nav } = useLocalized(uiContent)

  function closeMobileMenu() {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background plaster-grain">
      <div className="relative mx-auto flex h-16 page-width items-center justify-between px-5 md:px-8">
        <Link to={PATHS.home} onClick={closeMobileMenu} className="flex items-center gap-3">
          <BrandMark />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg tracking-[0.22em] uppercase">{brand.name}</span>
            <span className="mt-1.5 text-[0.62rem] tracking-[0.24em] text-muted uppercase">{brand.tagline}</span>
          </span>
        </Link>

        <nav
          aria-label={nav.mainLabel}
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 lg:flex"
        >
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              // "end": Home is only active on "/", not on every page
              end
              className={({ isActive }) =>
                `flex items-center gap-2 text-xs tracking-[0.2em] uppercase transition-colors duration-300 ${
                  isActive ? 'text-foreground' : 'text-muted hover:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* The current page carries a small iris dot */}
                  <span
                    aria-hidden="true"
                    className={`size-1.5 rounded-full ${isActive ? 'bg-primary' : 'bg-transparent'}`}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:block">
          <SettingsMenu />
        </div>

        <button
          type="button"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-nav"
          aria-label={isMobileMenuOpen ? nav.closeMenu : nav.openMenu}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex size-11 cursor-pointer items-center justify-center text-foreground hover:text-primary lg:hidden"
        >
          {isMobileMenuOpen ? <X className="size-6" strokeWidth={1.5} /> : <Menu className="size-6" strokeWidth={1.5} />}
        </button>
      </div>

      {isMobileMenuOpen && <MobileNav id="mobile-nav" onNavigate={closeMobileMenu} />}
    </header>
  )
}
