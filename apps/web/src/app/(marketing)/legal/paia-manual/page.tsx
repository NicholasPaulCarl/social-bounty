import { LegalDocLayout } from '@/components/legal/LegalDocLayout';
import { LEGAL_ENTITY, LEGAL_EFFECTIVE_DATE, LEGAL_VERSION } from '@/content/legal/entity';
import Link from 'next/link';

export const metadata = {
  title: 'PAIA Manual — Social Bounty',
  description:
    'Social Bounty\'s manual under section 51 of the Promotion of Access to Information Act, explaining the records we hold and how to request them.',
};

const TOC = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'particulars-of-body', label: 'Particulars of the body' },
  { id: 'information-officer', label: 'Information Officer' },
  { id: 'records-held', label: 'Records held' },
  { id: 'voluntary-disclosure', label: 'Voluntary disclosure' },
  { id: 'request-procedure', label: 'How to request a record' },
  { id: 'fees', label: 'Fees' },
  { id: 'grounds-for-refusal', label: 'Grounds for refusal' },
  { id: 'internal-appeal', label: 'Internal appeal' },
  { id: 'ir-escalation', label: 'Escalation to the Information Regulator' },
  { id: 'availability', label: 'Availability of this manual' },
];

export default function PaiaManualPage() {
  return (
    <LegalDocLayout
      title="PAIA Manual"
      category="POPIA & Data"
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      lastUpdated={LEGAL_EFFECTIVE_DATE}
      version={LEGAL_VERSION}
      summary="Your right to request records we hold, under the Promotion of Access to Information Act 2 of 2000 (PAIA). This manual tells you what records we keep, how to ask for them, and what to do if we refuse."
      toc={TOC}
    >
      <section id="introduction">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">Introduction</h2>
        <p className="mb-4">
          This is the manual of{' '}
          <strong className="font-semibold text-text-primary">{LEGAL_ENTITY.registeredName}</strong>{' '}
          (trading as {LEGAL_ENTITY.tradingName}) published in compliance with section 51 of the
          Promotion of Access to Information Act 2 of 2000 (PAIA).
        </p>
        <p className="mb-4">
          PAIA gives effect to the constitutional right of access to information. It lets any
          person request records held by a public body, and any person request records held by a
          private body where the record is required to exercise or protect a right. Social Bounty
          is a private body. This manual explains what records we hold and how to ask for them.
        </p>
        <p className="mb-4">
          The structure of this manual follows the template issued by the Information Regulator of
          South Africa. If a heading seems oddly formal, that is why — the Regulator asks for a
          specific layout so that manuals across the country are comparable.
        </p>
        <p className="mb-4">
          Read this together with our{' '}
          <Link
            href="/legal/privacy-policy"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Privacy Policy
          </Link>{' '}
          (which covers POPIA and your personal-information rights) and our{' '}
          <Link
            href="/legal/information-officer"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Information Officer page
          </Link>{' '}
          (which explains how to exercise your POPIA access and correction rights specifically).
        </p>
      </section>

      <section id="particulars-of-body">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          Particulars of the private body
        </h2>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-text-primary">Registered name:</strong>{' '}
            {LEGAL_ENTITY.registeredName}
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Trading name:</strong>{' '}
            {LEGAL_ENTITY.tradingName}
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Type of body:</strong> Private company
            incorporated under the Companies Act 71 of 2008
          </li>
          <li>
            <strong className="font-semibold text-text-primary">CIPC registration number:</strong>{' '}
            {LEGAL_ENTITY.cipcRegNumber}
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Date of incorporation:</strong>{' '}
            {LEGAL_ENTITY.incorporationDate}
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Financial year-end:</strong>{' '}
            {LEGAL_ENTITY.financialYearEnd}
          </li>
          <li>
            <strong className="font-semibold text-text-primary">VAT status:</strong>{' '}
            {LEGAL_ENTITY.vatStatus}
          </li>
          <li>
            <strong className="font-semibold text-text-primary">
              Registered office / domicilium citandi et executandi:
            </strong>{' '}
            {LEGAL_ENTITY.registeredAddress.formatted}
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Website:</strong>{' '}
            <a
              href={LEGAL_ENTITY.websiteUrl}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.websiteUrl}
            </a>
          </li>
          <li>
            <strong className="font-semibold text-text-primary">General contact:</strong>{' '}
            <a
              href={`mailto:${LEGAL_ENTITY.emails.general}`}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.emails.general}
            </a>
          </li>
        </ul>
      </section>

      <section id="information-officer">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          Information Officer
        </h2>
        <p className="mb-4">
          The Information Officer is the designated contact for all PAIA and POPIA matters.
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-text-primary">Name:</strong>{' '}
            {LEGAL_ENTITY.informationOfficer.name}
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Role:</strong>{' '}
            {LEGAL_ENTITY.informationOfficer.role}
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Email:</strong>{' '}
            <a
              href={`mailto:${LEGAL_ENTITY.informationOfficer.email}`}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.informationOfficer.email}
            </a>
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Postal address:</strong>{' '}
            {LEGAL_ENTITY.registeredAddress.formatted}
          </li>
        </ul>
        <p className="mb-4">
          For the role's statutory responsibilities under POPIA sections 55 and 56 and PAIA
          section 17, and for the practical way to submit a POPIA data-subject rights request, see
          our{' '}
          <Link
            href="/legal/information-officer"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Information Officer & Data Subject Rights
          </Link>{' '}
          page.
        </p>
      </section>

      <section id="records-held">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          Records held by Social Bounty
        </h2>
        <p className="mb-4">
          The categories below summarise the records we hold. Some records are available on
          request; others are subject to one of the grounds for refusal in Chapter 4 of PAIA. The
          fact that a record appears in this list does not by itself entitle you to access — you
          still need to establish the requirement set by section 50 of PAIA.
        </p>

        <h3 className="text-lg font-heading font-semibold text-text-primary mt-6 mb-3">
          User records
        </h3>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Account registration data: name, email, hashed password, email-verification state.</li>
          <li>Profile data supplied by the user.</li>
          <li>Session and authentication logs.</li>
          <li>Role assignments (Participant / Business Admin / Super Admin).</li>
        </ul>

        <h3 className="text-lg font-heading font-semibold text-text-primary mt-6 mb-3">
          Brand records
        </h3>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Brand registered name, trading name, CIPC registration number, VAT number.</li>
          <li>Brand-member roles and access permissions.</li>
          <li>Brand subscription tier and payment history (snapshot of plan state).</li>
          <li>Product-level KYB documentation supplied during brand onboarding.</li>
        </ul>

        <h3 className="text-lg font-heading font-semibold text-text-primary mt-6 mb-3">
          Bounty records
        </h3>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Bounty title, description, reward, channels, formats, and eligibility rules.</li>
          <li>Bounty lifecycle state (draft, live, paused, closed, cancelled).</li>
          <li>Funding records linking the bounty to a TradeSafe transaction reference.</li>
        </ul>

        <h3 className="text-lg font-heading font-semibold text-text-primary mt-6 mb-3">
          Submission records
        </h3>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Submission text, URLs, uploaded media, and hunter-supplied metrics.</li>
          <li>Verification and scraping results from Apify, per URL.</li>
          <li>Brand review decisions (approved / rejected / needs more info) and reviewer notes.</li>
          <li>Post-visibility check history and any auto-refund events.</li>
        </ul>

        <h3 className="text-lg font-heading font-semibold text-text-primary mt-6 mb-3">
          Financial and ledger records
        </h3>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            Append-only double-entry ledger capturing every bounty funding, payout, fee, and
            refund.
          </li>
          <li>
            TradeSafe transaction identifiers, allocation identifiers, and webhook payloads that
            settled each ledger entry.
          </li>
          <li>
            Fee calculations per transaction (hunter commission, brand admin fee, transaction fee,
            global platform fee).
          </li>
          <li>Reconciliation reports and exception investigations.</li>
          <li>Subscription and recurring-billing records.</li>
          <li>Refund and chargeback records.</li>
        </ul>

        <h3 className="text-lg font-heading font-semibold text-text-primary mt-6 mb-3">
          Audit logs
        </h3>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Administrative actions taken by staff on user accounts and bounties.</li>
          <li>Financial state transitions and the actor, timestamp, and reason for each.</li>
          <li>Access to sensitive records by authorised staff.</li>
        </ul>

        <h3 className="text-lg font-heading font-semibold text-text-primary mt-6 mb-3">
          System logs
        </h3>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Web server request logs.</li>
          <li>Application-level error logs and stack traces.</li>
          <li>Background-job run records.</li>
          <li>Webhook receipt and delivery logs.</li>
        </ul>

        <h3 className="text-lg font-heading font-semibold text-text-primary mt-6 mb-3">
          Corporate and statutory records
        </h3>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Memorandum of Incorporation and Companies Act registers (directors, shareholders).</li>
          <li>CIPC annual returns and beneficial-ownership declarations.</li>
          <li>Tax records, VAT records where applicable, and correspondence with SARS.</li>
          <li>Commercial contracts with operators, suppliers, and partners.</li>
          <li>Insurance policies.</li>
        </ul>
      </section>

      <section id="voluntary-disclosure">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          Records voluntarily made available
        </h2>
        <p className="mb-4">
          Under section 52 of PAIA, a private body may publish a list of the records it makes
          available without a formal request. Social Bounty voluntarily publishes the following on{' '}
          {LEGAL_ENTITY.domain}:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>The{' '}
            <Link
              href="/legal/privacy-policy"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Privacy Policy
            </Link>.
          </li>
          <li>The{' '}
            <Link
              href="/legal/cookie-policy"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Cookie Policy
            </Link>.
          </li>
          <li>The{' '}
            <Link
              href="/legal/terms-of-service"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/legal/escrow-terms"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Payout & Escrow Terms
            </Link>.
          </li>
          <li>Pricing and fee information for bounties and subscriptions.</li>
          <li>Platform rules, acceptable use policy, and content guidelines.</li>
          <li>This PAIA manual.</li>
        </ul>
      </section>

      <section id="request-procedure">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          How to request a record
        </h2>
        <p className="mb-4">
          A PAIA request must be made on Form 2 of the PAIA Regulations (the official "Request for
          access to record of private body" form). You can download Form 2 from the Information
          Regulator's website at{' '}
          <a
            href={LEGAL_ENTITY.informationRegulator.url}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.informationRegulator.url}
          </a>
          , or request a copy by emailing us. Submit the completed form by email to{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.informationOfficer.email}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.informationOfficer.email}
          </a>{' '}
          or by post to the Information Officer at our registered address.
        </p>
        <p className="mb-4">To help us respond quickly, include:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Your full name and identity number (or passport number if not a SA citizen).</li>
          <li>
            An address, email, and phone number at which we can reach you and deliver the record.
          </li>
          <li>
            A description of the record sought, in enough detail for us to identify it. "All
            records about me" is not specific enough — tell us the category, date range, and the
            context.
          </li>
          <li>
            The right you are seeking to exercise or protect, and a brief explanation of how the
            record is required for that right (section 50 of PAIA).
          </li>
          <li>The form in which you would like to receive the record (email, printed copy).</li>
          <li>
            Whether you need any assistance to complete the form (we must help under section 18(2)
            of PAIA if English is not your first language or if you have a disability that makes
            written requests impracticable).
          </li>
        </ul>
        <p className="mb-4">
          We will acknowledge the request within a reasonable period and respond with a decision
          within thirty (30) days as required by section 56 of PAIA. We may extend the period once
          by a further thirty days in the circumstances described in section 57.
        </p>
      </section>

      <section id="fees">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">Fees</h2>
        <p className="mb-4">
          PAIA prescribes two kinds of fees. The rates below are the Regulations as they stood at
          the effective date of this manual; if the Regulations are updated, the current gazetted
          amounts apply.
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-text-primary">Request fee</strong>{' '}
            — a fixed fee payable when you submit the request, set by the Regulations. We will
            tell you the exact amount when we acknowledge your request. The request fee is not
            payable for a request made in terms of POPIA for a record of personal information
            about yourself.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Access fee</strong>{' '}
            — payable if the request is granted. It covers the reasonable cost of searching for,
            reproducing, and (if applicable) preparing the record. We will send you a written
            estimate before we start the work; if the access fee is likely to exceed the threshold
            set in the Regulations, we will require a deposit before proceeding.
          </li>
        </ul>
        <p className="mb-4">
          The fee schedule in the Regulations also prescribes rates for photocopying,
          transcription, computer readable output, postage, and search-and-preparation time. We
          follow those rates and do not add any mark-up.
        </p>
      </section>

      <section id="grounds-for-refusal">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          Grounds for refusal
        </h2>
        <p className="mb-4">
          Chapter 4 of PAIA sets out the grounds on which a private body must or may refuse access
          to a record. The grounds most often relevant in our context are:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-text-primary">
              Protection of personal information about a third party
            </strong>{' '}
            (section 63) — we must refuse if disclosure would unreasonably disclose a third
            party's personal information.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">
              Protection of commercial information about a third party
            </strong>{' '}
            (section 64) — for example, a brand's trade secrets, pricing, or commercial strategy.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">
              Protection of our own commercial information
            </strong>{' '}
            (section 68) — trade secrets, financial, commercial, scientific, or technical
            information the disclosure of which would likely harm our competitive position.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">
              Protection of confidential information
            </strong>{' '}
            (section 65) — information we received in confidence under an obligation to keep it
            confidential.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">
              Protection of research information
            </strong>{' '}
            (section 69).
          </li>
          <li>
            <strong className="font-semibold text-text-primary">
              Protection of the safety of individuals and property
            </strong>{' '}
            (section 66).
          </li>
          <li>
            <strong className="font-semibold text-text-primary">
              Protection of records privileged from production in legal proceedings
            </strong>{' '}
            (section 67).
          </li>
          <li>
            <strong className="font-semibold text-text-primary">
              Mandatory disclosure in the public interest
            </strong>{' '}
            (section 70) — even if a ground for refusal applies, access must still be granted if
            the public-interest override in section 70 is engaged.
          </li>
        </ul>
        <p className="mb-4">
          Where part of a record falls under a ground for refusal and part does not, section 28 of
          PAIA requires us to sever the protected part and disclose the rest.
        </p>
      </section>

      <section id="internal-appeal">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          Internal appeal
        </h2>
        <p className="mb-4">
          PAIA does not provide an internal appeal against a private body's refusal. If you are
          dissatisfied with our decision you may either (a) ask us to reconsider by writing to the
          Information Officer with any additional reasons or information, or (b) approach the
          Information Regulator under section 77A of PAIA, or (c) apply to the Magistrate's Court
          or High Court under section 78.
        </p>
        <p className="mb-4">
          We prefer (a) in the first instance — it is usually faster and costs you nothing. Write
          to{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.informationOfficer.email}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.informationOfficer.email}
          </a>{' '}
          explaining why you think the original decision was wrong.
        </p>
      </section>

      <section id="ir-escalation">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          Escalation to the Information Regulator
        </h2>
        <p className="mb-4">
          Under section 77A of PAIA, you may lodge a complaint with the Information Regulator if
          we refuse access or fail to respond within the statutory time period.
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-text-primary">Regulator:</strong>{' '}
            {LEGAL_ENTITY.informationRegulator.name}
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Website:</strong>{' '}
            <a
              href={LEGAL_ENTITY.informationRegulator.url}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.informationRegulator.url}
            </a>
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Complaints email:</strong>{' '}
            <a
              href={`mailto:${LEGAL_ENTITY.informationRegulator.email}`}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.informationRegulator.email}
            </a>
          </li>
        </ul>
        <p className="mb-4">
          A complaint to the Regulator must be lodged on the prescribed form and within one
          hundred and eighty (180) days of becoming aware of the matter, subject to the Regulator's
          discretion to allow a late complaint under section 77B.
        </p>
      </section>

      <section id="availability">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          Availability of this manual
        </h2>
        <p className="mb-4">This manual is available:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            online at{' '}
            <a
              href={`${LEGAL_ENTITY.websiteUrl}/legal/paia-manual`}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.domain}/legal/paia-manual
            </a>
            ;
          </li>
          <li>
            as a printed copy at our registered office, {LEGAL_ENTITY.registeredAddress.formatted};
            and
          </li>
          <li>
            by email on request to{' '}
            <a
              href={`mailto:${LEGAL_ENTITY.informationOfficer.email}`}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.informationOfficer.email}
            </a>
            .
          </li>
        </ul>
        <p className="mb-4">
          The manual has also been lodged with the Information Regulator as required by section
          51(3) of PAIA.
        </p>
        <p className="mb-4">
          Current version: {LEGAL_VERSION}, effective {LEGAL_EFFECTIVE_DATE}. We review this
          manual at least annually and update it when our records, structure, or practice
          changes.
        </p>
      </section>
    </LegalDocLayout>
  );
}
