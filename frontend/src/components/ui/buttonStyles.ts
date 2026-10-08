// Shared look of <Button> and <ButtonLink>, so a link can look like a button.
// Square corners and wide-tracked capitals, like a label on a pine frame.

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'md' | 'lg'

const baseClasses =
  'inline-flex items-center justify-center gap-3 font-medium uppercase tracking-[0.16em] transition-colors duration-300 ease-settle cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-foreground hover:text-background',
  secondary: 'border border-foreground/60 text-foreground hover:border-primary hover:text-primary',
  ghost: 'text-foreground hover:text-primary',
}

const sizeClasses: Record<ButtonSize, string> = {
  md: 'min-h-11 px-5 text-xs',
  lg: 'min-h-12 px-7 text-sm',
}

export function buttonClassName(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  extraClassName = '',
): string {
  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${extraClassName}`
}
