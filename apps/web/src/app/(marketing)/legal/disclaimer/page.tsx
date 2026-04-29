import { LegalDocLayout } from '@/components/legal/LegalDocLayout';
import { LEGAL_ENTITY, LEGAL_EFFECTIVE_DATE, LEGAL_VERSION } from '@/content/legal/entity';
import Link from 'next/link';

export const metadata = {
  title: 'Disclaimer — Social Bounty',
  description:
    'The limits of our role as a facilitator, and what we do and do not warrant.',
};

const TOC = [
  { id: 'role', label: 'Our role as a facilitator' },
  { id: 'no-warranty', label: 'No warranty' },
  { id: 'third-parties', label: 'Third-party providers' },
  { id: 'verification-limits', label: 'Limits of automated verification' },
  { id: 'not-financial-advice', label: 'Not financial advice (FAIS)' },
  { id: 'not-lending', label: 'Not a credit provider (NCA)' },
  { id: 'no-brokerage', label: 'Not an employment or talent agency' },
  { id: 'external-links', label: 'External links' },
  { id: 'user-submitted-content', label: 'User-submitted content' },
  { id: 'jurisdiction', label: 'Jurisdiction and cross-border use' },
  { id: 'changes', label: 'Changes to the Platform' },
  { id: 'contact', label: 'Contact' },
];

export default function DisclaimerPage() {
  return (
    <LegalDocLayout
      title="Disclaimer"
      category="Platform Rules"
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      lastUpdated={LEGAL_EFFECTIVE_DATE}
      version={LEGAL_VERSION}
      summary="Social Bounty is a facilitator, not a party to the bounty arrangement between brand and hunter. This page explains what that means and what we do and do not warrant."
      toc={TOC}
    >
      <section id="role">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          1. Our role as a facilitator
        </h2>
        <p className="mb-4">
          {LEGAL_ENTITY.registeredName} (registration number {LEGAL_ENTITY.cipcRegNumber}) operates
          the Social Bounty platform at {LEGAL_ENTITY.domain}. We are a{' '}
          <strong className="font-semibold text-text-primary">facilitator</strong>: we provide software that connects brands, who publish
          bounty briefs, with hunters, who deliver social-media content in exchange
          for a reward.
        </p>
        <p className="mb-4">
          We are not a party to the contractual arrangement between a brand and a
          hunter. The substantive bargain — what the brief requires, what the
          hunter produces, whether the output meets the brief — is between them.
          Our role is to host the brief, run the mechanical checks our verification
          partner makes available, and route money through an escrow partner so
          that hunters are paid when the brief is satisfied.
        </p>
        <p className="mb-4">
          Bounty funds are held in escrow by our payment partner,{' '}
          {LEGAL_ENTITY.paymentPartner.name}, under TradeSafe's own terms. See the{' '}
          <Link href="/legal/escrow-terms" className="text-pink-600 hover:text-pink-700 font-medium">
            Payout & Escrow Terms
          </Link>{' '}
          for how escrow operates and our role in it.
        </p>
      </section>

      <section id="no-warranty">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          2. No warranty
        </h2>
        <p className="mb-4">
          The Platform is provided on an "as is" and "as available" basis. To the
          maximum extent permitted by South African law, we do not warrant that:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>the Platform will be uninterrupted, error-free, or available at all times;</li>
          <li>every bounty published is commercially attractive, ethical, or suitable for you;</li>
          <li>every brand who opens an account is reputable, solvent, or pleasant to deal with;</li>
          <li>every hunter's output will meet a brand's expectations beyond the mechanical checks our verification process performs;</li>
          <li>specific commercial outcomes (views, impressions, followers, conversions, sales) will result from any bounty.</li>
        </ul>
        <p className="mb-4">
          Nothing in this Disclaimer excludes or limits any right or protection you
          enjoy under a statute that cannot lawfully be excluded, including
          applicable rights under the Consumer Protection Act 68 of 2008 (the{' '}
          <strong className="font-semibold text-text-primary">CPA</strong>) where the CPA applies to you. Our CPA position is
          summarised in the{' '}
          <Link href="/legal/consumer-rights" className="text-pink-600 hover:text-pink-700 font-medium">
            Consumer Rights Notice
          </Link>
          .
        </p>
      </section>

      <section id="third-parties">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          3. Third-party providers
        </h2>
        <p className="mb-4">
          The Platform relies on independent third parties to do parts of the job.
          Each of them has its own terms, its own operating capacity, and its own
          failure modes. We are not responsible for their performance beyond our
          reasonable procurement and oversight of them.
        </p>
        <h3 className="text-lg font-heading font-semibold text-text-primary mt-6 mb-3">
          TradeSafe (escrow)
        </h3>
        <p className="mb-4">
          {LEGAL_ENTITY.paymentPartner.name} is a separate legal entity that provides the
          escrow custody and settlement layer. Funds held in escrow are held by
          TradeSafe under its own terms and in its own bank arrangements. Issues
          that arise on the TradeSafe side — escrow release delays, payout rail
          outages, bank failures, compliance holds applied by TradeSafe — are
          ultimately matters between you and TradeSafe. We will, in good faith,
          help you engage with TradeSafe and provide such reasonable assistance as
          we can, but we do not underwrite TradeSafe's performance.
        </p>
        <h3 className="text-lg font-heading font-semibold text-text-primary mt-6 mb-3">
          Apify (verification)
        </h3>
        <p className="mb-4">
          {LEGAL_ENTITY.verificationProcessor.name} is our verification processor.
          It fetches public metadata from social-media posts so we can run
          mechanical checks against the rules a bounty brief specifies. Apify is an
          independent third party and may experience outages, rate limits, and
          edge-case failures. See{' '}
          <a href="#verification-limits" className="text-pink-600 hover:text-pink-700 font-medium">
            Limits of automated verification
          </a>{' '}
          below.
        </p>
        <h3 className="text-lg font-heading font-semibold text-text-primary mt-6 mb-3">
          Hosting, mail, and other infrastructure
        </h3>
        <p className="mb-4">
          We use third-party hosting, email, analytics, error-tracking, and
          customer-support providers to run the Platform. Those providers are
          listed (and the categories of personal information shared with them
          disclosed) in our{' '}
          <Link href="/legal/privacy-policy" className="text-pink-600 hover:text-pink-700 font-medium">
            Privacy Policy
          </Link>
          . Their service disruptions may cause Platform disruptions; we aim to
          restore service promptly but cannot eliminate this risk.
        </p>
        <h3 className="text-lg font-heading font-semibold text-text-primary mt-6 mb-3">
          Social-media platforms
        </h3>
        <p className="mb-4">
          Instagram, TikTok, Facebook, X, and other social platforms are
          independent services that we do not control. Their content moderation,
          metric accuracy, account-suspension decisions, and API behaviour are
          their own. We cannot, for example, undo a target platform's removal of a
          hunter's post.
        </p>
      </section>

      <section id="verification-limits">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          4. Limits of automated verification
        </h2>
        <p className="mb-4">
          A core Platform feature is mechanical verification of submissions against
          the rules a bounty brief sets (for example, minimum views, a required
          mention, or post-visibility rules). This verification is automated: it
          reads publicly available post metadata through our verification processor
          and compares it to the brief. Automated verification has structural
          limits:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            The processor can fail for transient reasons (rate limits, outages,
            edge-case URL structures it does not recognise, target-platform
            throttling).
          </li>
          <li>
            A single failed scrape is not enough evidence, by itself, that a
            submission is non-compliant. We therefore apply a two-consecutive-failure
            threshold before an automated visibility outcome triggers a refund. See{' '}
            <Link
              href="/legal/escrow-terms"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Payout & Escrow Terms
            </Link>{' '}
            and our internal ADR 0010 for the design rationale.
          </li>
          <li>
            Verification does not assess creative quality, tone, or whether a post
            is a "good ad". Quality judgement remains with the brand reviewer.
          </li>
          <li>
            Verification relies on public social-media data; if a hunter deletes,
            unpublishes, or sets a post to private, the processor may report that
            as a failure even if the hunter believes the underlying content is
            still compliant.
          </li>
        </ul>
        <p className="mb-4">
          If you believe a verification decision was wrong, raise the issue through
          our{' '}
          <Link href="/legal/complaints" className="text-pink-600 hover:text-pink-700 font-medium">
            Complaints & Dispute Resolution
          </Link>{' '}
          process. A human on our team will review the scrape history, the
          submission, and the relevant rule.
        </p>
      </section>

      <section id="not-financial-advice">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          5. Not financial advice (FAIS carve-out)
        </h2>
        <p className="mb-4">
          Social Bounty is <strong className="font-semibold text-text-primary">not</strong> a financial services provider as contemplated
          by the Financial Advisory and Intermediary Services Act 37 of 2002 (
          <strong className="font-semibold text-text-primary">FAIS</strong>). We do not furnish financial advice, make recommendations
          about financial products, or act as an intermediary in respect of any
          financial product listed in section 1 of FAIS.
        </p>
        <p className="mb-4">
          Nothing on the Platform — including reward figures, payout timing
          indicators, or any commentary we provide about the cash-flow implications
          of participating — should be treated as financial, tax, or investment
          advice. You are solely responsible for your own financial decisions and,
          where appropriate, for obtaining advice from a suitably licensed
          adviser.
        </p>
        <p className="mb-4">
          Hunters who earn income through the Platform are responsible for their
          own tax affairs, including income tax registration with the South African
          Revenue Service where applicable, and for any VAT, PAYE (if they trade
          through a company that pays them a salary), or provisional tax
          obligations that result from their earnings. We do not withhold tax on
          hunter payouts.
        </p>
      </section>

      <section id="not-lending">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          6. Not a credit provider (NCA carve-out)
        </h2>
        <p className="mb-4">
          Social Bounty does not extend credit. We do not lend money, offer
          instalment plans, issue credit facilities, or otherwise provide credit
          agreements as contemplated by the National Credit Act 34 of 2005 (the{' '}
          <strong className="font-semibold text-text-primary">NCA</strong>). Bounty payments flow from the brand, through escrow held by
          TradeSafe, to the hunter. No party is lending to another through this
          arrangement.
        </p>
        <p className="mb-4">
          Where a brand funds a bounty and it is later not claimed or is refunded,
          the brand is returned its own money through the escrow process; that is
          not a loan repayment and is not regulated by the NCA.
        </p>
      </section>

      <section id="no-brokerage">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          7. Not an employment or talent agency
        </h2>
        <p className="mb-4">
          Social Bounty is not a talent agency, a personnel or recruitment agency
          within the meaning of the Basic Conditions of Employment Act 75 of 1997
          or the Labour Relations Act 66 of 1995, or a placement service. The
          relationship between a brand and a hunter is not one of employer and
          employee. No hunter becomes our employee, independent contractor,
          partner, or agent by using the Platform.
        </p>
        <p className="mb-4">
          Hunters deliver bounties in their own capacity and on their own
          initiative. A hunter is free to take or ignore any brief, is not
          subject to our supervision in how they do the work, and carries the
          creative and operational risk of their own output.
        </p>
      </section>

      <section id="external-links">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          8. External links
        </h2>
        <p className="mb-4">
          The Platform may link to external sites — social-media platforms,
          TradeSafe, payment providers, news articles, third-party tools — for
          convenience. We do not control those sites, do not endorse their
          content, and are not responsible for what you find there. Following an
          external link is at your own risk and under the terms and privacy
          practices of the site you arrive at.
        </p>
      </section>

      <section id="user-submitted-content">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          9. User-submitted content
        </h2>
        <p className="mb-4">
          Bounty briefs, submissions, profile information, and messages on the
          Platform are authored by users — brands and hunters — not by us. We do
          not pre-moderate user content. Responsibility for user content rests
          with the user who submitted it.
        </p>
        <p className="mb-4">
          We act on content that breaches the{' '}
          <Link href="/legal/acceptable-use" className="text-pink-600 hover:text-pink-700 font-medium">
            Acceptable Use Policy
          </Link>{' '}
          when we become aware of it. Where we host user content and receive a
          valid take-down notice, we follow the procedure set out in our{' '}
          <Link href="/legal/ip-policy" className="text-pink-600 hover:text-pink-700 font-medium">
            IP & Copyright Takedown Policy
          </Link>
          . To the extent we qualify for the intermediary limitations in Chapter
          XI of the Electronic Communications and Transactions Act 25 of 2002 (
          <strong className="font-semibold text-text-primary">ECTA</strong>), we rely on them.
        </p>
      </section>

      <section id="jurisdiction">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          10. Jurisdiction and cross-border use
        </h2>
        <p className="mb-4">
          The Platform is designed primarily for use by people and brands based in
          South Africa. Our escrow partner, our compliance posture, and the
          contractual framework assume South African law. If you access the
          Platform from outside South Africa, you do so on your own initiative and
          are responsible for compliance with your local law, including any
          restrictions on cross-border payments, tax, content, advertising, and
          the use of social-media platforms.
        </p>
        <p className="mb-4">
          Our hosted services may not be available in every jurisdiction, and we
          may restrict access from specific countries where required to manage
          legal or operational risk.
        </p>
      </section>

      <section id="changes">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          11. Changes to the Platform
        </h2>
        <p className="mb-4">
          The Platform is a living product. We add features, remove features,
          change rules, and retire endpoints over time. Minor changes happen
          without notice. Material changes — anything that would meaningfully
          affect the rights or obligations of brands or hunters — are notified in
          accordance with the{' '}
          <Link href="/legal/terms-of-service" className="text-pink-600 hover:text-pink-700 font-medium">
            Terms of Service
          </Link>{' '}
          and reflected in the versioning of this and related documents.
        </p>
      </section>

      <section id="contact">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          12. Contact
        </h2>
        <p className="mb-4">
          Questions about this Disclaimer can be directed to{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.legal}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.legal}
          </a>
          , or by post to our registered office at {LEGAL_ENTITY.registeredAddress.formatted}.
        </p>
      </section>
    </LegalDocLayout>
  );
}
