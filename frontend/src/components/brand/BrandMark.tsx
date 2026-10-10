// TEMPORARY logo until the real one is ready: a counting frame around one pill,
// with the iris corner handle. Replace this file when the logo is decided,
// together with public/favicon.svg (the browser tab icon, same mark drawn thicker).
export function BrandMark({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect x="3" y="3" width="24" height="24" fill="none" className="stroke-foreground" strokeWidth="1.5" />
      <ellipse cx="15" cy="15" rx="6" ry="3.6" className="fill-foreground" />
      <rect x="23" y="23" width="8" height="8" className="fill-primary" />
    </svg>
  )
}
