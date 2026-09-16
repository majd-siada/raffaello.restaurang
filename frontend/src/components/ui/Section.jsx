import { cn } from './cn'

/**
 * Consistent public section rhythm (Riva-inspired, Raffaello-scoped).
 */
export function Section({
  id,
  as: Tag = 'section',
  tone = 'bg',
  className,
  innerClassName,
  children,
  ...props
}) {
  const toneClass =
    tone === 'surface'
      ? 'bg-surface'
      : tone === 'elevated'
        ? 'bg-elevated'
        : tone === 'dark-2'
          ? 'bg-dark-2'
          : 'bg-bg'

  return (
    <Tag
      id={id}
      className={cn('public-section px-6 py-20 md:py-28', toneClass, className)}
      {...props}
    >
      <div className={cn('mx-auto max-w-content', innerClassName)}>{children}</div>
    </Tag>
  )
}

/**
 * Eyebrow + title + optional description.
 */
export function SectionHeading({
  eyebrow,
  title,
  titleId,
  description,
  align = 'left',
  className,
  titleClassName,
}) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow ? (
        <p className="public-eyebrow text-xs uppercase tracking-[0.24em] text-gold">
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={titleId}
        className={cn(
          'font-heading text-3xl leading-tight tracking-[-0.02em] text-cream md:text-4xl lg:text-5xl',
          eyebrow && 'mt-4',
          titleClassName,
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-pretty leading-relaxed text-muted">{description}</p>
      ) : null}
    </div>
  )
}
