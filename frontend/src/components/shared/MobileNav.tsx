import { ArrowRight } from 'lucide-react'
import { NavLink } from 'react-router'
import { useLocalized } from '@/app/providers/localeContext'
import { navigationContent } from '@/content/navigation.content'
import { uiContent } from '@/content/ui.content'
import { SettingsPanel } from './SettingsPanel'

interface MobileNavProps {
  id: string
  // Called after a menu item is clicked, so the Navbar can close the menu
  onNavigate: () => void
}

// The menu that opens under the navbar on phones: pages + settings
export function MobileNav({ id, onNavigate }: MobileNavProps) {
  const { menuItems } = useLocalized(navigationContent)
  const { nav } = useLocalized(uiContent)

  return (
    <nav id={id} aria-label={nav.mainLabel} className="border-t border-border bg-background px-5 pt-2 pb-6 md:hidden">
      <ul>
        {menuItems.map((item) => (
          <li key={item.id} className="border-b border-border">
            <NavLink
              to={item.path}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                isActive
                  ? 'flex items-center justify-between py-4 text-2xl font-medium text-primary'
                  : 'flex items-center justify-between py-4 text-2xl font-medium'
              }
            >
              {item.label}
              <ArrowRight className="size-5" aria-hidden="true" />
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <SettingsPanel />
      </div>
    </nav>
  )
}
