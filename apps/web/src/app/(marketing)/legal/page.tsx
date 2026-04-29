import Link from 'next/link';
import { ShieldCheck, FileText, Scale, BookOpen, ChevronRight, type LucideIcon } from 'lucide-react';
import { LEGAL_EFFECTIVE_DATE, LEGAL_VERSION } from '@/content/legal/entity';

export const metadata = {
  title: 'Legal — Social Bounty',
  description:
    'Policies, terms, and data-protection notices governing your use of Social Bounty.',
};

interface LegalDoc {
  slug: string;
  title: string;
  summary: string;
}

interface CategoryGroup {
  id: string;
  title: string;
  blurb: string;
  Icon: LucideIcon;
  docs: LegalDoc[];
}

const CATEGORIES: CategoryGroup[] = [
  {
    id: 'popia',
    title: 'POPIA & Data',
    blurb: 'How we handle personal information under the Protection of Personal Information Act.',
    Icon: ShieldCheck,
    docs: [
      {
        slug: 'privacy-policy',
        title: 'Privacy Policy',
        summary:
          'What personal information we collect, why, how long we keep it, and your rights.',
      },
      {
        slug: 'cookie-policy',
        title: 'Cookie Policy',
        summary: 'The cookies we use, what they do, and how to control them.',
      },
      {
        slug: 'paia-manual',
        title: 'PAIA Manual',
        summary:
          'Your statutory right to request records we hold under the Promotion of Access to Information Act.',
      },
      {
        slug: 'information-officer',
        title: 'Information Officer & Data Subject Rights',
        summary:
          'Who our Information Officer is, and how to submit access, correction, or deletion requests.',
      },
    ],
  },
  {
    id: 'commercial',
    title: 'Commercial',
    blurb: 'The contractual terms between you and Social Bounty, including how money moves.',
    Icon: FileText,
    docs: [
      {
        slug: 'terms-of-service',
        title: 'Terms of Service',
        summary: 'The agreement governing your use of the platform — bounties, fees, licences.',
      },
      {
        slug: 'escrow-terms',
        title: 'Payout & Escrow Terms',
        summary:
          'How TradeSafe holds bounty funds in escrow, and how payouts are released to hunters.',
      },
    ],
  },
  {
    id: 'consumer',
    title: 'Consumer',
    blurb:
      'Your rights under the Consumer Protection Act if you use Social Bounty as an individual.',
    Icon: Scale,
    docs: [
      {
        slug: 'consumer-rights',
        title: 'Consumer Rights Notice',
        summary: 'A plain-English summary of your CPA rights as a hunter or individual brand.',
      },
      {
        slug: 'complaints',
        title: 'Complaints & Dispute Resolution',
        summary:
          'How to raise a complaint with us, our response commitment, and where to escalate.',
      },
    ],
  },
  {
    id: 'platform-rules',
    title: 'Platform Rules',
    blurb: 'How we expect the platform to be used, and where our responsibility ends.',
    Icon: BookOpen,
    docs: [
      {
        slug: 'acceptable-use',
        title: 'Acceptable Use Policy',
        summary: 'Prohibited content, prohibited behaviour, and how we enforce the rules.',
      },
      {
        slug: 'disclaimer',
        title: 'Disclaimer',
        summary:
          'The limits of our role as a facilitator, and what we do and do not warrant.',
      },
      {
        slug: 'ip-policy',
        title: 'IP & Copyright Takedown Policy',
        summary:
          'How to report content that infringes your copyright, and our takedown procedure.',
      },
    ],
  },
];

export default function LegalHubPage() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12 sm:mb-16 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-pink-600 mb-3">
            Legal
          </p>
          <h1 className="text-4xl sm:text-5xl font-heading font-bold text-text-primary mb-4">
            Policies & agreements
          </h1>
          <p className="text-slate-600 leading-relaxed">
            These are the documents that govern how you use Social Bounty, how we handle your
            personal information, and how money moves through the platform. They are drafted
            against South African law and in plain English wherever we can manage it.
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Version {LEGAL_VERSION} · Current as of {LEGAL_EFFECTIVE_DATE}
          </p>
        </header>

        <div
          role="note"
          className="mb-12 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
        >
          <strong className="font-semibold">Working drafts.</strong> Every document here is a
          first draft pending review by an admitted South African attorney before production
          launch. They reflect current platform practice but are not yet the binding final
          versions.
        </div>

        <div className="space-y-14">
          {CATEGORIES.map(({ id, title, blurb, Icon, docs }) => (
            <section key={id} aria-labelledby={`category-${id}`}>
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-pink-600" aria-hidden />
                </div>
                <div>
                  <h2
                    id={`category-${id}`}
                    className="text-2xl font-heading font-semibold text-text-primary"
                  >
                    {title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 max-w-2xl">{blurb}</p>
                </div>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {docs.map((doc) => (
                  <li key={doc.slug}>
                    <Link
                      href={`/legal/${doc.slug}`}
                      className="group block h-full rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-pink-300 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-base font-heading font-semibold text-text-primary group-hover:text-pink-600 transition-colors">
                          {doc.title}
                        </h3>
                        <ChevronRight
                          className="h-5 w-5 flex-shrink-0 text-slate-300 group-hover:text-pink-600 group-hover:translate-x-0.5 transition-all mt-0.5"
                          aria-hidden
                        />
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{doc.summary}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-20 pt-10 border-t border-slate-200 text-sm text-slate-500">
          <p>
            Questions about any of these documents? Email us at{' '}
            <a
              href="mailto:legal@socialbounty.cash"
              className="font-medium text-pink-600 hover:text-pink-700"
            >
              legal@socialbounty.cash
            </a>{' '}
            or reach out through our{' '}
            <Link href="/contact" className="font-medium text-pink-600 hover:text-pink-700">
              contact page
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
