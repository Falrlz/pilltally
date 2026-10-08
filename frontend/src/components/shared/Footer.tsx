import { Link } from 'react-router'
import { useLocalized } from '@/app/providers/localeContext'
import { navigationContent } from '@/content/navigation.content'

// Footer: description, navigation, disclaimer, copyright (not on the Count page)
export function Footer() {
  const { brand, menuItems, footer } = useLocalized(navigationContent)

  return (
    <footer className="border-t border-border bg-surface text-sm">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-3 md:px-8">
        <div>
          <p className="font-semibold">{brand.name}</p>
          <p className="mt-3 text-muted">{footer.description}</p>
        </div>

        <div>
          <p className="font-semibold">{footer.navigationTitle}</p>
          <ul className="mt-3 space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <Link to={item.path} className="text-muted hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-semibold">{footer.disclaimerTitle}</p>
          <p className="mt-3 text-muted">{footer.disclaimerText}</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl border-t border-border px-5 py-6 text-muted md:px-8">
        {footer.copyright}
      </div>
    </footer>
  )
}
