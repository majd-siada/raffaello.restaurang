import { SITE } from '../siteConfig'
import { ButtonLink } from './ui/Button'

/** Shared conversion strip for trust/content pages. */
export default function TrustConversionCtas({ className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap ${className}`}
    >
      <ButtonLink to="/meny" variant="secondary">
        Meny
      </ButtonLink>
      <ButtonLink to="/lunch" variant="secondary">
        Lunch
      </ButtonLink>
      <ButtonLink to="/veckans-erbjudande" variant="secondary">
        Veckans Erbjudande
      </ButtonLink>
      <ButtonLink to={SITE.bookingUrl} variant="primary">
        Boka bord
      </ButtonLink>
      <ButtonLink to="/privata-events" variant="ghost">
        Privata events
      </ButtonLink>
    </div>
  )
}
