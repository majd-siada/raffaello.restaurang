import { PageHeader } from './ui'

/** Ops compatibility page — FAQ/Legal CMS lives under React Admin. */
export default function FaqLegalPage() {
  return (
    <div>
      <PageHeader
        title="FAQ / Legal"
        subtitle="CMS finns i Admin — /admin/faq och /admin/legal"
      />
      <div className="rounded border border-white/10 bg-dark-2 p-5 text-sm text-white/65">
        <p>
          Redigera FAQ och juridiska sidor i{' '}
          <a className="text-gold underline" href="/admin/faq">
            /admin/faq
          </a>{' '}
          respektive{' '}
          <a className="text-gold underline" href="/admin/legal">
            /admin/legal
          </a>
          .
        </p>
        <p className="mt-3 text-white/45">
          Public SoT: <code className="text-white/60">TRUST_CONTENT_SOURCE</code>{' '}
          (default frontend → trustContent.js). Inventera inte innehåll.
        </p>
      </div>
    </div>
  )
}
