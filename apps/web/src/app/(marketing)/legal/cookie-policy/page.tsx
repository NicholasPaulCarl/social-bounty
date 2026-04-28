import { LegalDocLayout } from '@/components/legal/LegalDocLayout';
import { LEGAL_ENTITY, LEGAL_EFFECTIVE_DATE, LEGAL_VERSION } from '@/content/legal/entity';
import Link from 'next/link';

export const metadata = {
  title: 'Cookie Policy — Social Bounty',
  description:
    'What cookies Social Bounty uses, what they do, and how you can control them.',
};

const TOC = [
  { id: 'what-are-cookies', label: 'What are cookies?' },
  { id: 'cookies-we-use', label: 'Cookies we use' },
  { id: 'your-choices', label: 'Your choices' },
  { id: 'consent', label: 'Consent and legal basis' },
  { id: 'third-party', label: 'Third-party cookies' },
  { id: 'changes', label: 'Changes to this policy' },
  { id: 'contact', label: 'Contact us' },
];

export default function CookiePolicyPage() {
  return (
    <LegalDocLayout
      title="Cookie Policy"
      category="POPIA & Data"
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      lastUpdated={LEGAL_EFFECTIVE_DATE}
      version={LEGAL_VERSION}
      summary="A short explanation of the cookies Social Bounty sets when you use the platform, why we use them, and how you can turn them off."
      toc={TOC}
    >
      <section id="what-are-cookies">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          What are cookies?
        </h2>
        <p className="mb-4">
          Cookies are small text files a website stores in your browser when you visit. They let a
          site remember who you are across pages (so you do not have to sign in on every click),
          record your preferences, and gather information about how the site is used.
        </p>
        <p className="mb-4">
          This policy explains what cookies{' '}
          <strong className="font-semibold text-text-primary">{LEGAL_ENTITY.registeredName}</strong>{' '}
          (trading as {LEGAL_ENTITY.tradingName}) sets on {LEGAL_ENTITY.domain}, and what you can
          do about them. We also use a few cookie-like technologies such as local storage and
          session storage — for simplicity we call all of them "cookies" in this policy.
        </p>
        <p className="mb-4">
          If you want the full picture of how we handle your personal information, read this
          alongside our{' '}
          <Link
            href="/legal/privacy-policy"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </section>

      <section id="cookies-we-use">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          Cookies we use
        </h2>
        <p className="mb-4">
          We keep our cookie footprint small. We do not run ad-targeting cookies and we do not
          sell cookie data to anyone. The cookies we do use fall into two categories.
        </p>

        <h3 className="text-lg font-heading font-semibold text-text-primary mt-6 mb-3">
          Essential cookies
        </h3>
        <p className="mb-4">
          These cookies are strictly necessary for the platform to work. Turning them off will
          break sign-in, checkout, and submission flows. We set these whenever you visit the site —
          you cannot use Social Bounty without them.
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-text-primary">Authentication session cookies</strong>{' '}
            — identify your signed-in session and let us keep you logged in as you move between
            pages. Cleared when you sign out or when the session expires.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">CSRF-protection tokens</strong>{' '}
            — a cryptographic token paired with your session to stop malicious sites from
            submitting forms on your behalf. Standard security control.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">
              Load-balancer and routing cookies
            </strong>{' '}
            — let our infrastructure route you back to the server that is already handling your
            session, so the platform stays fast and stable.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Preference cookies</strong>{' '}
            — remember UI choices such as your dashboard view density or the column order on a
            table.
          </li>
        </ul>

        <h3 className="text-lg font-heading font-semibold text-text-primary mt-6 mb-3">
          Analytics cookies
        </h3>
        <p className="mb-4">
          These cookies help us understand how the platform is being used in aggregate — which
          pages are popular, where people drop off in a flow, how long pages take to load. We use
          the data to improve the product, not to profile you personally. Analytics cookies are
          set only if you consent (or, in some jurisdictions, if you do not actively opt out).
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-text-primary">Aggregate usage analytics</strong>{' '}
            — anonymised page views, click paths, and performance metrics. The analytics provider
            processes this data on our behalf as an operator under POPIA.
          </li>
        </ul>

        <p className="mb-4">
          We do{' '}
          <strong className="font-semibold text-text-primary">
            not use advertising or retargeting cookies
          </strong>
          . We do not embed third-party advertising networks, and we do not share your data with
          them.
        </p>
      </section>

      <section id="your-choices">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          Your choices
        </h2>
        <p className="mb-4">
          You can control cookies at the browser level and within the platform.
        </p>

        <h3 className="text-lg font-heading font-semibold text-text-primary mt-6 mb-3">
          Browser controls
        </h3>
        <p className="mb-4">
          Every modern browser lets you block cookies, delete cookies that are already stored, and
          clear them automatically when you close the window. The steps differ per browser — the
          help pages for Chrome, Safari, Firefox, and Edge all have clear instructions. If you
          block cookies entirely, expect parts of the platform to stop working: you will not be
          able to stay signed in, and some forms will refuse to submit.
        </p>

        <h3 className="text-lg font-heading font-semibold text-text-primary mt-6 mb-3">
          Platform-level controls
        </h3>
        <p className="mb-4">
          Where we offer cookie choices on the platform itself (for example, an analytics
          consent banner when you first visit), your preference is remembered. You can change it
          at any time from the privacy settings in your account.
        </p>

        <h3 className="text-lg font-heading font-semibold text-text-primary mt-6 mb-3">
          Consequences of turning off essential cookies
        </h3>
        <p className="mb-4">
          Essential cookies are not optional in a practical sense — turn them off and the platform
          will not work. If you would rather not accept essential cookies, the simplest option is
          to not use the platform. We would be sorry to see you go, but we cannot deliver a
          bounty marketplace without session authentication.
        </p>
      </section>

      <section id="consent">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          Consent and legal basis
        </h2>
        <p className="mb-4">
          POPIA section 11 lets us process personal information on several lawful bases. For
          cookies we rely on two:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-text-primary">Essential cookies</strong>{' '}
            — we rely on the performance-of-contract basis (section 11(1)(b)) and our legitimate
            interest (section 11(1)(f)) in keeping the platform secure and available. These
            cookies are set without a separate consent step because they are necessary to provide
            the service you have asked for.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Analytics cookies</strong>{' '}
            — we rely on your consent (section 11(1)(a)). You can withdraw consent at any time,
            either through your browser or through the platform's privacy settings. Withdrawal
            does not affect the lawfulness of analytics we ran before you withdrew.
          </li>
        </ul>
      </section>

      <section id="third-party">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          Third-party cookies
        </h2>
        <p className="mb-4">
          A small number of cookies on the platform are set by third-party services we rely on.
          Each is bound by a written operator agreement that meets the requirements of POPIA
          sections 20 and 21.
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-text-primary">
              Analytics provider ([ANALYTICS_PROVIDER])
            </strong>{' '}
            — sets cookies to measure aggregate platform usage. Set only if you have consented to
            analytics cookies.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">TradeSafe Escrow (Pty) Ltd</strong>{' '}
            — if you are redirected to TradeSafe's hosted checkout to fund a bounty or register
            banking details, TradeSafe will set its own cookies on its pages. Those cookies are
            governed by TradeSafe's own privacy notice; we do not control them.
          </li>
        </ul>
        <p className="mb-4">
          For completeness, our payment partner's site and its cookie practice are at{' '}
          <a
            href={LEGAL_ENTITY.paymentPartner.url}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.paymentPartner.url}
          </a>
          .
        </p>
      </section>

      <section id="changes">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          Changes to this Cookie Policy
        </h2>
        <p className="mb-4">
          If we change the cookies we use — for example because we switch analytics provider or
          add a new third-party service — we will update this policy and increment the version
          number. If the change materially affects the cookies set on your browser, we will
          surface a banner or prompt at your next visit so you can re-review your choices.
        </p>
        <p className="mb-4">
          Current version: {LEGAL_VERSION}, effective {LEGAL_EFFECTIVE_DATE}.
        </p>
      </section>

      <section id="contact">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          Contact us
        </h2>
        <p className="mb-4">
          If you have questions about the cookies we set, email us at{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.privacy}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.privacy}
          </a>
          . For the broader picture of how we handle your personal information, see our{' '}
          <Link
            href="/legal/privacy-policy"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </section>
    </LegalDocLayout>
  );
}
