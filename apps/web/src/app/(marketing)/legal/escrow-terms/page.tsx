import { LegalDocLayout } from '@/components/legal/LegalDocLayout';
import { LEGAL_ENTITY, LEGAL_EFFECTIVE_DATE, LEGAL_VERSION } from '@/content/legal/entity';
import Link from 'next/link';

export const metadata = {
  title: 'Payout & Escrow Terms — Social Bounty',
  description:
    'How bounty funds are held in escrow by TradeSafe, and how payouts are released to hunters.',
};

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'not-banking-not-lending', label: 'Not banking, not lending' },
  { id: 'flow', label: 'How funds move' },
  { id: 'payment-methods', label: 'Payment methods' },
  { id: 'fees-recap', label: 'Fees recap' },
  { id: 'clearance', label: 'Clearance & settlement' },
  { id: 'refunds-and-reversals', label: 'Refunds & reversals' },
  { id: 'tradesafe-terms', label: "TradeSafe's own terms" },
  { id: 'failures', label: 'Outages & retries' },
  { id: 'tax', label: 'Tax' },
  { id: 'contact', label: 'Contact' },
];

export default function EscrowTermsPage() {
  return (
    <LegalDocLayout
      title="Payout & Escrow Terms"
      category="Commercial"
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      lastUpdated={LEGAL_EFFECTIVE_DATE}
      version={LEGAL_VERSION}
      summary="How bounty funds are held in escrow by TradeSafe Escrow (Pty) Ltd, how and when payouts are released to hunters, and when a payment may be refunded or reversed."
      toc={TOC}
    >
      <section id="overview">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">1. Overview</h2>
        <p className="mb-4">
          These Payout & Escrow Terms describe how money moves through the Platform and supplement
          the main{' '}
          <Link
            href="/legal/terms-of-service"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Terms of Service
          </Link>
          . Where this document and the main Terms of Service disagree, the main Terms of Service
          take precedence for contract formation and{' '}
          <Link
            href="/legal/terms-of-service#disputes"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            dispute-handling
          </Link>
          , and this document takes precedence for the mechanics of custody and payout.
        </p>
        <p className="mb-4">
          The Platform uses a three-party escrow arrangement operated by{' '}
          <strong className="font-semibold text-text-primary">TradeSafe Escrow (Pty) Ltd</strong>{' '}
          (<strong className="font-semibold text-text-primary">TradeSafe</strong>), a registered South
          African digital-escrow service:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            The <strong className="font-semibold text-text-primary">brand</strong> that posts and funds
            a bounty is the <strong className="font-semibold text-text-primary">BUYER</strong>.
          </li>
          <li>
            The <strong className="font-semibold text-text-primary">hunter</strong> who claims the
            bounty, submits compliant proof, and receives a payout is the{' '}
            <strong className="font-semibold text-text-primary">SELLER</strong>.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">{LEGAL_ENTITY.registeredName}</strong>{' '}
            acts as <strong className="font-semibold text-text-primary">AGENT</strong> on the
            transaction — we instruct release from escrow when the brand approves the submission and
            are paid our fees through the same mechanism.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">TradeSafe</strong> is the escrow — it
            holds the funds from deposit to release in its regulated escrow account.
          </li>
        </ul>
        <p className="mb-4">
          Social Bounty does <strong className="font-semibold text-text-primary">not</strong> receive,
          hold, or re-transmit bounty funds in its own bank account at any point. The funds sit in
          TradeSafe's escrow from deposit to release.
        </p>
      </section>

      <section id="not-banking-not-lending">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          2. Not banking, not lending, not investment
        </h2>
        <p className="mb-4">
          The service described in these Terms is a{' '}
          <strong className="font-semibold text-text-primary">commercial escrow</strong> on a
          per-bounty basis. It is not any of the following, and nothing on the Platform should be
          read as offering any of the following:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-text-primary">It is not a deposit-taking service.</strong>{' '}
            {LEGAL_ENTITY.registeredName} is not a bank, is not registered as such under the Banks
            Act 94 of 1990, and does not hold balances on your behalf. You cannot deposit funds
            with us and cannot withdraw a "wallet balance" on demand — there is no wallet.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">It is not a credit or lending
            service.</strong> No credit is extended by us to any participant. Nothing in these Terms
            constitutes a "credit agreement" for the purposes of the National Credit Act 34 of 2005
            (<strong className="font-semibold text-text-primary">NCA</strong>).
          </li>
          <li>
            <strong className="font-semibold text-text-primary">
              It is not a financial-advice or intermediary service.
            </strong>{' '}
            We do not give financial advice and we do not act as an intermediary in a financial
            product for purposes of the Financial Advisory and Intermediary Services Act 37 of 2002
            (<strong className="font-semibold text-text-primary">FAIS</strong>). The Platform does not
            offer investment, savings, or yield features.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">It is not an investment scheme.</strong>{' '}
            Funding a bounty is payment for a specific promotional deliverable; it is not the
            purchase of a security and carries no expectation of return beyond the content described
            in the brief.
          </li>
        </ul>
        <p className="mb-4">
          TradeSafe's own regulatory status as a digital-escrow service is set out on its website.
          Our arrangement with TradeSafe does not extend its licences or registrations to
          {' '}{LEGAL_ENTITY.registeredName}.
        </p>
      </section>

      <section id="flow">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          3. How funds move
        </h2>
        <p className="mb-4">The end-to-end flow for a single bounty is:</p>
        <ol className="list-decimal pl-6 mb-4 space-y-1">
          <li>
            The brand creates a bounty, enters a face-value reward, and is quoted a total charge
            that includes the brand admin fee, transaction fee, and global platform fee (see clause 5).
          </li>
          <li>
            The brand pays the total charge via TradeSafe's hosted checkout. TradeSafe captures the
            payment and records it against the bounty's escrow transaction.
          </li>
          <li>
            TradeSafe <strong className="font-semibold text-text-primary">holds the funds in escrow</strong>.
            Social Bounty receives confirmation of the deposit and flips the bounty to live; the
            bounty can now accept submissions.
          </li>
          <li>
            Hunters claim the bounty, submit proof, and (where the brief has checkable rules) their
            submissions are automatically verified.
          </li>
          <li>
            The brand approves a submission in the brand review tool. Social Bounty (as AGENT)
            calls TradeSafe's <code className="text-xs bg-slate-100 text-slate-800 px-1 py-0.5 rounded">allocationAcceptDelivery</code>{' '}
            instruction.
          </li>
          <li>
            TradeSafe <strong className="font-semibold text-text-primary">releases the hunter's net
            payout</strong> from escrow to the hunter's registered South African bank account,
            deducts the platform fees and pays them to Social Bounty, and marks the allocation as
            settled.
          </li>
          <li>
            Social Bounty records the release in its internal double-entry ledger and writes an
            audit-log entry for the transaction.
          </li>
        </ol>
      </section>

      <section id="payment-methods">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          4. Payment methods
        </h2>
        <p className="mb-4">
          Inbound payments are captured through TradeSafe's hosted checkout. TradeSafe supports a
          range of South African payment methods, which currently include:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Debit and credit card (Visa, Mastercard)</li>
          <li>Instant EFT via Ozow</li>
          <li>SnapScan</li>
          <li>Ecentric card-present flows (for in-person scenarios)</li>
          <li>PayJustNow (pay-in-instalments)</li>
          <li>Manual EFT (bank-deposit reference)</li>
        </ul>
        <p className="mb-4">
          The exact list available at checkout is controlled by TradeSafe and may change without
          notice. Foreign-issued cards may be declined by the issuing bank for South African
          merchants; that is a matter between you and your issuer.
        </p>
        <p className="mb-4">
          Outbound payouts to hunters are made by <strong className="font-semibold text-text-primary">EFT to
          a South African bank account</strong> registered on the hunter's TradeSafe SELLER token.
          We do not currently support payouts to mobile-money wallets, foreign bank accounts, or
          crypto wallets.
        </p>
      </section>

      <section id="fees-recap">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          5. Fees recap
        </h2>
        <p className="mb-4">Fees deducted from each bounty comprise:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            a <strong className="font-semibold text-text-primary">20% hunter commission</strong> (Free
            plan), deducted from the reward before the hunter is paid;
          </li>
          <li>
            a <strong className="font-semibold text-text-primary">15% brand admin fee</strong> (Free
            plan), added to the brand's checkout total;
          </li>
          <li>
            a <strong className="font-semibold text-text-primary">5% transaction fee</strong>, added to
            the brand's checkout total;
          </li>
          <li>
            a <strong className="font-semibold text-text-primary">3.5% global platform fee</strong>,
            charged separately on each side of the transaction.
          </li>
        </ul>
        <p className="mb-4">
          Banking or payment-method charges imposed by TradeSafe or the paying bank are passed
          through at cost and disclosed at checkout. {LEGAL_ENTITY.registeredName} is not currently
          VAT-registered (our turnover is below the R1 million compulsory-registration threshold
          under the Value-Added Tax Act 89 of 1991), so no VAT is charged on our fees. The full
          numeric example is in clause 8 of the{' '}
          <Link
            href="/legal/terms-of-service#fees"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Terms of Service
          </Link>
          .
        </p>
      </section>

      <section id="clearance">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          6. Clearance & settlement
        </h2>
        <p className="mb-4">
          The time between brand approval and funds landing in the hunter's bank account has two
          components:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-text-primary">Platform clearance</strong> — a hold
            we apply on the hunter's side, set by the hunter's plan, to absorb
            reversal-within-window scenarios (see clause 7). Current plan terms are published on
            the Platform and recorded on each transaction at the moment of approval. The plan in
            force at that moment is the one that applies, even if the hunter's plan changes later.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">TradeSafe settlement</strong> — the
            time TradeSafe takes to move the funds from its escrow account to the hunter's bank.
            TradeSafe's own service-level commitments apply; in typical operation this is
            same-business-day after the release instruction. TradeSafe's settlement timings are
            controlled by TradeSafe and{' '}
            <strong className="font-semibold text-text-primary">are not guaranteed by Social Bounty</strong>.
          </li>
        </ul>
        <p className="mb-4">
          Payouts requested on weekends or public holidays settle on the next business day. If your
          bank has its own inbound-deposit hold, the funds may be visible but not yet cleared in
          your account for a further period — that is a matter between you and your bank.
        </p>
      </section>

      <section id="refunds-and-reversals">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          7. Refunds & reversals
        </h2>
        <p className="mb-4">
          A bounty-funded payment may be refunded or reversed in the following scenarios. In each
          case we write an audit-log entry and (where you are affected) notify you by email with a
          short reason.
        </p>
        <h3 className="text-lg font-heading font-semibold text-text-primary mt-6 mb-3">
          7.1 Submission rejected before approval
        </h3>
        <p className="mb-4">
          If a brand rejects every submission to a bounty, or cancels the bounty before any
          submission is approved, the escrowed funds (less non-recoverable payment-method fees
          levied by TradeSafe or the paying bank) are refunded to the brand's originating payment
          method. Refunds follow TradeSafe's refund channel for the original payment method and
          typically take two to seven business days to appear.
        </p>
        <h3 className="text-lg font-heading font-semibold text-text-primary mt-6 mb-3">
          7.2 Auto-refund on post removal
        </h3>
        <p className="mb-4">
          Where a bounty brief requires the hunter's post to remain publicly accessible for a set
          duration, our scheduler re-checks the post on a regular cadence. If{' '}
          <strong className="font-semibold text-text-primary">
            two consecutive re-checks at least six hours apart
          </strong>{' '}
          both find the post unreachable, and the failures are not attributable to a known
          third-party outage, we may automatically reverse the payout back to the brand by posting
          a compensating ledger entry.
        </p>
        <p className="mb-4">
          We notify both brand and hunter by email before and at the point of reversal. Hunters who
          believe the reversal was triggered by a false-positive check (for example the post is
          live but geo-blocked to the scraper) may appeal through our{' '}
          <Link
            href="/legal/complaints"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            complaints process
          </Link>
          , and we reinstate the payout where the appeal is upheld.
        </p>
        <h3 className="text-lg font-heading font-semibold text-text-primary mt-6 mb-3">
          7.3 Dispute decided in the brand's favour
        </h3>
        <p className="mb-4">
          Where a formal dispute is decided in the brand's favour following review, the escrow
          release for that submission may be reversed by compensating entry and the funds returned
          to the brand.
        </p>
        <h3 className="text-lg font-heading font-semibold text-text-primary mt-6 mb-3">
          7.4 Financial Kill Switch
        </h3>
        <p className="mb-4">
          During a suspected financial-integrity incident a super-admin may activate the Platform's{' '}
          <strong className="font-semibold text-text-primary">Financial Kill Switch</strong>, which
          halts new payouts and new ledger postings while the underlying cause is investigated.
          Pending instructions to TradeSafe are held in the queue rather than cancelled. Once the
          incident is resolved, the queue is released. The Kill Switch is a last-resort control and
          is fully audit-logged.
        </p>
        <h3 className="text-lg font-heading font-semibold text-text-primary mt-6 mb-3">
          7.5 Super-admin correction
        </h3>
        <p className="mb-4">
          Where a ledger error is identified that cannot be fixed by ordinary flows, a super-admin
          may post a balanced compensating entry to correct the error. Compensating entries require
          a typed confirmation and a written reason, and a full audit-log row is written with the
          actor identity and the correction rationale. They are reviewed post-hoc through our
          Finance dashboards.
        </p>
      </section>

      <section id="tradesafe-terms">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          8. TradeSafe's own terms
        </h2>
        <p className="mb-4">
          TradeSafe Escrow (Pty) Ltd has its own service terms, privacy notice, and fee schedule
          that apply in addition to these Terms. Your use of TradeSafe (as BUYER to fund a bounty,
          as SELLER to receive a payout) is governed by those TradeSafe terms, which you will be
          asked to accept when you first interact with the TradeSafe hosted checkout or
          beneficiary-capture flow.
        </p>
        <p className="mb-4">
          You can read TradeSafe's service terms, privacy notice, and fee schedule at{' '}
          <a
            href={LEGAL_ENTITY.paymentPartner.url}
            className="text-pink-600 hover:text-pink-700 font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            tradesafe.co.za
          </a>
          . {LEGAL_ENTITY.registeredName} is not responsible for TradeSafe's own policies, but we
          choose our escrow partner with care and we will tell you if we change it.
        </p>
      </section>

      <section id="failures">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          9. Outages & retries
        </h2>
        <p className="mb-4">
          If TradeSafe is unreachable when a brand tries to fund a bounty or when we try to release
          a payout, the relevant instruction is held in the queue and retried on an exponential
          backoff. Brands will see a clear error and can retry; hunters will see the payout as
          "release initiated — waiting for escrow partner" until TradeSafe confirms.
        </p>
        <p className="mb-4">
          For release instructions, our system is{' '}
          <strong className="font-semibold text-text-primary">idempotent</strong>: a retried
          instruction will not cause a double release. The TradeSafe webhook replay protections and
          our own double-entry ledger prevent duplicate postings even if multiple retries reach
          TradeSafe.
        </p>
        <p className="mb-4">
          If an outage lasts more than 24 hours for any single instruction, we will proactively
          email the affected user with a short update and an ETA where we have one.
        </p>
      </section>

      <section id="tax">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">10. Tax</h2>
        <p className="mb-4">
          <strong className="font-semibold text-text-primary">Hunters are responsible for their own
          income tax.</strong> Payouts to a hunter are payments for services rendered; they are not
          employment income and we do not withhold PAYE or UIF. If you are unsure of your tax
          position, speak to a SARS-registered tax practitioner.
        </p>
        <p className="mb-4">
          We may be required to report aggregated payout information to the South African Revenue
          Service under the Tax Administration Act 28 of 2011. Where we do so, we act as required
          by law and in line with the disclosure commitments in our{' '}
          <Link
            href="/legal/privacy-policy"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <p className="mb-4">
          <strong className="font-semibold text-text-primary">VAT.</strong>{' '}
          {LEGAL_ENTITY.registeredName} is not currently VAT-registered under the Value-Added Tax
          Act 89 of 1991, as our taxable supplies are below the R1 million compulsory-registration
          threshold. No VAT is charged on our fees and no VAT invoices are issued. If our turnover
          reaches the threshold we will register, display our VAT number on the Platform, and give
          at least 30 days' notice before adding VAT to any fee.
        </p>
        <p className="mb-4">
          <strong className="font-semibold text-text-primary">Record retention.</strong> We retain
          financial records for at least <strong className="font-semibold text-text-primary">five
          years</strong> from the date of the transaction, in line with section 29 of the Tax
          Administration Act, and for longer where another law requires it. Deleting your account
          does not delete financial records within that window.
        </p>
      </section>

      <section id="contact">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">11. Contact</h2>
        <p className="mb-4">
          For questions about payouts, escrow, or any item in this document, email us at{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.legal}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.legal}
          </a>
          . To raise a formal complaint, use our{' '}
          <Link
            href="/legal/complaints"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Complaints & Dispute Resolution
          </Link>{' '}
          process.
        </p>
      </section>
    </LegalDocLayout>
  );
}
