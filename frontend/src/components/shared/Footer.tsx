import { Link } from 'react-router'
import { useLocalized } from '@/app/providers/localeContext'
import { BrandMark } from '@/components/brand/BrandMark'
import { navigationContent } from '@/content/navigation.content'

// Footer: description, navigation, medical disclaimer, copyright (not on the Count page)
export function Footer() {
  const { brand, menuItems, footer } = useLocalized(navigationContent)

  return (
    <footer className="border-t border-border bg-surface text-sm">
      <div className="mx-auto grid page-width gap-12 px-5 py-16 md:grid-cols-12 md:px-8">
        <div className="md:col-span-5">
          <p className="flex items-center gap-3">
            <BrandMark className="size-7" />
            <span className="font-display text-lg tracking-[0.22em] uppercase">{brand.name}</span>
          </p>
          <p className="mt-5 max-w-[46ch] leading-relaxed text-muted">{footer.description}</p>
        </div>

        <div className="md:col-span-2">
          <p className="text-xs tracking-[0.2em] uppercase">{footer.navigationTitle}</p>
          <ul className="mt-5 space-y-3">
            {menuItems.map((item) => (
              <li key={item.id}>
                <Link to={item.path} className="text-muted transition-colors duration-300 hover:text-primary">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-5">
          <p className="text-xs tracking-[0.2em] uppercase">{footer.disclaimerTitle}</p>
          <p className="mt-5 max-w-[52ch] leading-relaxed text-muted">{footer.disclaimerText}</p>
        </div>
      </div>

      <div className="mx-auto page-width border-t border-border px-5 py-6 text-xs tracking-[0.16em] text-muted uppercase md:px-8">
        {footer.copyright}
      </div>
    </footer>
  )
}
