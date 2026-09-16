import { Link } from 'react-router-dom'
import { cn } from './cn'

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-6 py-2.5 text-sm font-medium uppercase tracking-widest transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50'

const variants = {
  primary: 'bg-gold text-dark hover:bg-gold-hover',
  outline:
    'border border-gold bg-transparent text-gold hover:bg-gold hover:text-dark',
  secondary:
    'border border-gold/50 bg-transparent text-gold hover:border-gold hover:bg-gold/10',
  ghost:
    'border border-white/25 bg-transparent text-white/75 hover:border-white/50 hover:text-white',
}

const sizes = {
  default: 'min-h-11 px-6 text-sm',
  sm: 'min-h-10 px-4 text-xs',
  lg: 'min-h-12 px-8 text-[0.95rem]',
}

/**
 * Public-site button (native).
 * @param {'primary'|'outline'|'secondary'|'ghost'} [variant]
 */
export function Button({
  variant = 'primary',
  size = 'default',
  className,
  type = 'button',
  loading = false,
  disabled,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant] || variants.primary, sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? 'Skickar…' : children}
    </button>
  )
}

/**
 * Public-site link styled as button.
 */
export function ButtonLink({
  to,
  href,
  variant = 'outline',
  size = 'default',
  className,
  children,
  external,
  ...props
}) {
  const classes = cn(base, variants[variant] || variants.outline, sizes[size], className)
  if (external && href) {
    const isAppLink = /^(tel:|mailto:)/i.test(href)
    return (
      <a
        href={href}
        {...(isAppLink ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
        className={classes}
        {...props}
      >
        {children}
      </a>
    )
  }
  return (
    <Link to={to} className={classes} {...props}>
      {children}
    </Link>
  )
}
