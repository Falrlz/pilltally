interface PageHeaderProps {
  title: string
  subtitle?: string
}

// Title (h1) and short introduction at the top of a page
export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="border-b border-border pb-8">
      <h1 className="text-3xl font-bold md:text-5xl">{title}</h1>
      {subtitle && <p className="mt-4 max-w-2xl text-lg text-muted">{subtitle}</p>}
    </header>
  )
}
