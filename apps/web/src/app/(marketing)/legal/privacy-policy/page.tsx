import { LegalDocLayout } from '@/components/legal/LegalDocLayout';
import { LEGAL_ENTITY, LEGAL_EFFECTIVE_DATE, LEGAL_VERSION } from '@/content/legal/entity';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Social Bounty',
  description:
    'How Social Bounty collects, uses, and protects your personal information under POPIA.',
};

const TOC = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'who-we-are', label: 'Who we are' },
  { id: 'what-we-collect', label: 'What we collect' },
  { id: 'how-we-use', label: 'How we use it' },
  { id: 'direct-marketing', label: 'Direct marketing (POPIA §69)' },
  { id: 'who-we-share-with', label: 'Who we share it with' },
  { id: 'cross-border-transfer', label: 'Cross-border transfer' },
  { id: 'retention', label: 'How long we keep it' },
  { id: 'your-rights', label: 'Your POPIA rights' },
  { id: 'security', label: 'How we protect it' },
  { id: 'children', label: 'Children' },
  { id: 'changes', label: 'Changes to this policy' },
  { id: 'contact', label: 'Contact us' },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalDocLayout
      title="Privacy Policy"
      category="POPIA & Data"
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      lastUpdated={LEGAL_EFFECTIVE_DATE}
      version={LEGAL_VERSION}
      summary="What personal information we collect when you use Social Bounty, why we collect it, who we share it with, how long we keep it, and the rights you have under the Protection of Personal Information Act (POPIA)."
      toc={TOC}
    >
      <section id="introduction">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">Introduction</h2>
        <p className="mb-4">
          This Privacy Policy explains how{' '}
          <strong className="font-semibold text-slate-900">{LEGAL_ENTITY.registeredName}</strong>{' '}
          (trading as {LEGAL_ENTITY.tradingName}) handles personal information about the people who
          use our platform at{' '}
          <a
            href={LEGAL_ENTITY.websiteUrl}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.domain}
          </a>
          . We are bound by the Protection of Personal Information Act 4 of 2013 (POPIA), and we
          take that responsibility seriously.
        </p>
        <p className="mb-4">
          Social Bounty is a bounty marketplace. Brands post tasks with cash rewards, hunters
          complete them and submit proof, and we sit in the middle — verifying the work, moving the
          money, and keeping an audit trail. Doing that requires handling personal information
          about both brands and hunters, and this document explains exactly what that means in
          practice.
        </p>
        <p className="mb-4">
          We have written this policy in plain English. Where we cite an Act or section, we do so
          to be precise, not to hide behind jargon. If anything here is unclear, email us at{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.privacy}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.privacy}
          </a>{' '}
          and we will explain it.
        </p>
        <p className="mb-4">
          This policy sits alongside our{' '}
          <Link
            href="/legal/cookie-policy"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Cookie Policy
          </Link>
          , our{' '}
          <Link
            href="/legal/paia-manual"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            PAIA Manual
          </Link>
          , our{' '}
          <Link
            href="/legal/information-officer"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Information Officer page
          </Link>
          , and our{' '}
          <Link
            href="/legal/terms-of-service"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Terms of Service
          </Link>
          . Read them together — this policy explains what we do with your data; the Terms explain
          the commercial relationship.
        </p>
      </section>

      <section id="who-we-are">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">Who we are</h2>
        <p className="mb-4">
          For POPIA purposes, Social Bounty is the{' '}
          <strong className="font-semibold text-slate-900">responsible party</strong> — the entity
          that decides why and how your personal information is processed.
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-slate-900">Registered name:</strong>{' '}
            {LEGAL_ENTITY.registeredName}
          </li>
          <li>
            <strong className="font-semibold text-slate-900">CIPC registration number:</strong>{' '}
            {LEGAL_ENTITY.cipcRegNumber}
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Registered office / domicilium:</strong>{' '}
            {LEGAL_ENTITY.registeredAddress.formatted}
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Trading domain:</strong>{' '}
            {LEGAL_ENTITY.domain}
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Information Officer:</strong>{' '}
            {LEGAL_ENTITY.informationOfficer.name} ({LEGAL_ENTITY.informationOfficer.role})
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Privacy contact:</strong>{' '}
            <a
              href={`mailto:${LEGAL_ENTITY.emails.privacy}`}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.emails.privacy}
            </a>
          </li>
        </ul>
        <p className="mb-4">
          See our{' '}
          <Link
            href="/legal/information-officer"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Information Officer page
          </Link>{' '}
          for the role's statutory responsibilities under POPIA sections 55 and 56.
        </p>
      </section>

      <section id="what-we-collect">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          Personal information we collect
        </h2>
        <p className="mb-4">
          We only collect what we need to run the platform. Here is the full list, grouped by why
          we collect it.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Account and authentication data
        </h3>
        <p className="mb-4">
          When you sign up as a hunter or a brand, we collect your name, email address, a
          cryptographic hash of your password (we never store the plain password), and any profile
          details you choose to add. We generate a unique user ID for our database. If you verify
          your email by one-time code, we store the fact that verification happened and when.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Brand verification data (KYB)
        </h3>
        <p className="mb-4">
          If you operate as a brand, we collect information about your business: the CIPC
          registration number, registered name, trading name, VAT number (if registered), and the
          name and role of the person administering the brand account. This is a{' '}
          <strong className="font-semibold text-slate-900">product-level</strong> KYB check — it is
          not the same as the statutory FICA due diligence, which our payment partner (TradeSafe
          Escrow) performs in its capacity as an accountable institution.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Hunter banking details (via TradeSafe)
        </h3>
        <p className="mb-4">
          To pay a hunter, we need their banking details. You supply those details directly to{' '}
          <a
            href={LEGAL_ENTITY.paymentPartner.url}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.paymentPartner.name}
          </a>
          , our registered digital escrow partner, through their token-registration flow. Social
          Bounty does not store your bank account number, branch code, or account holder details on
          our own servers — we store a TradeSafe-issued opaque token that lets us instruct
          TradeSafe to pay you without us ever seeing the underlying banking data. Social Bounty
          acts as an agent of the transaction; TradeSafe is the custodian of the funds and the
          banking information.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Submission content
        </h3>
        <p className="mb-4">
          When you submit proof for a bounty, we collect the URLs you submit, any supporting media
          you upload, any text notes you include, and any messages you exchange with the brand
          during the review. This content is visible to the brand reviewing the submission and to
          authorised platform admins investigating disputes.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Apify-scraped social post data
        </h3>
        <p className="mb-4">
          To verify a submission automatically, we send the URLs you submit to{' '}
          <a
            href={LEGAL_ENTITY.verificationProcessor.url}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Apify
          </a>
          , which retrieves the publicly accessible post data — scraped metrics (views, likes,
          comments), post metadata, and the public profile information attached to the post. We do
          this only for URLs you have submitted to us, and only for posts you have made public.
        </p>
        <p className="mb-4">
          We also re-scrape submission URLs on an ongoing basis to enforce the bounty's
          post-visibility rule. If a post that you were paid for stops being publicly accessible
          for two consecutive checks, the platform may automatically reverse the payment back to
          the brand in line with our auto-refund policy. The re-scrape activity is logged against
          your submission for auditability.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Device, usage, and technical data
        </h3>
        <p className="mb-4">
          When you use the platform, we automatically collect: your IP address, browser type and
          version, device type, operating system, referring URLs, pages visited, timestamps, and
          session identifiers. This is standard server-log data and is used to operate the service,
          detect abuse, and improve performance.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Communications with us
        </h3>
        <p className="mb-4">
          If you email us, submit a support ticket, or contact us through the platform, we retain a
          copy of the conversation so we can follow up and improve our service.
        </p>
      </section>

      <section id="how-we-use">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          How we use your information
        </h2>
        <p className="mb-4">
          POPIA section 11 lists the lawful bases on which a responsible party may process personal
          information. Every use of your data on Social Bounty falls under one of the following
          bases.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Performance of a contract (section 11(1)(b))
        </h3>
        <p className="mb-4">
          Most of what we do with your data is necessary to perform the contract between you and
          us. This includes: operating your account, posting and reviewing bounties, verifying
          submissions against bounty rules, instructing TradeSafe to pay hunters, applying platform
          fees, issuing refunds, and maintaining the audit trail every financial transaction needs.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Compliance with a legal obligation (section 11(1)(c))
        </h3>
        <p className="mb-4">
          We are required by law to retain financial and tax records for seven years (Tax
          Administration Act 28 of 2011 section 29). We also retain records we may need to produce
          for SARS, the Information Regulator, the South African Reserve Bank, or a court. We
          process personal information to the extent necessary to meet those obligations.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Legitimate interests (section 11(1)(f))
        </h3>
        <p className="mb-4">
          We rely on legitimate interests for activities that are not strictly contract performance
          but are necessary to run a safe, honest platform. These include: fraud prevention,
          abuse detection, reconciliation of our ledger against TradeSafe's records, incident
          investigation, aggregate analytics that let us understand usage patterns, and direct
          operational communications (e.g. "your payout was released"). We have weighed these uses
          against your rights and privacy interests and believe they are proportionate. You can
          object to processing based on legitimate interest — see "Your POPIA rights" below.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Consent (section 11(1)(a))
        </h3>
        <p className="mb-4">
          We rely on consent only where POPIA actually requires it, such as non-essential analytics
          cookies (see{' '}
          <Link
            href="/legal/cookie-policy"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Cookie Policy
          </Link>
          ) and optional marketing communications by email and SMS — see{' '}
          <a href="#direct-marketing" className="text-pink-600 hover:text-pink-700 font-medium">
            Direct marketing (POPIA §69)
          </a>{' '}
          below. You can withdraw consent at any time without affecting the lawfulness of what we
          did before.
        </p>
      </section>

      <section id="direct-marketing">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          Direct marketing communications (POPIA §69)
        </h2>
        <p className="mb-4">
          Direct marketing — sending you commercial messages to promote our service or third-party
          offers — is governed by section 69 of POPIA. The rule is simple: we may only send direct
          marketing by electronic communication if you have given specific, voluntary consent or if
          you are an existing customer receiving messages about similar services. We do not buy
          marketing lists, we do not pretext, and we do not opt you in by default.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Channels we use
        </h3>
        <p className="mb-4">
          At signup you choose which marketing channels we may use. Each is independent — ticking
          SMS does not enrol you in email, and vice versa. Today we send marketing by:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong>Email</strong> — product updates, bounty alerts, and offers.
          </li>
          <li>
            <strong>SMS</strong> — short text alerts to your registered mobile number.
          </li>
        </ul>
        <p className="mb-4">
          We do not currently send marketing by WhatsApp, instant messaging, or voice call. If we
          add a new channel, we will ask you again — your existing consents do not roll over to
          channels you did not opt into.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Who sends the messages
        </h3>
        <p className="mb-4">
          Our email and SMS are dispatched through{' '}
          <strong className="font-semibold text-slate-900">Brevo (Sendinblue SAS)</strong>, a French
          operator under POPIA sections 20 and 21. Brevo receives the minimum data needed to deliver
          each message: your name, the email address or mobile number, and the message body. Brevo
          does not use this data for its own purposes. SMS routed through international toll-free
          carriers may transit third-party infrastructure to reach your handset.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          How to opt out
        </h3>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong>Email</strong> — every marketing email contains an unsubscribe link. Click it
            and your email-marketing flag is cleared immediately.
          </li>
          <li>
            <strong>SMS</strong> — reply <strong>STOP</strong> to any marketing SMS to be removed,
            or <strong>HELP</strong> for assistance. Message frequency may vary. Standard message
            and data rates may apply. Your mobile information will not be sold or shared with third
            parties for promotional or marketing purposes.
          </li>
          <li>
            <strong>All channels at once</strong> — email{' '}
            <a
              href={`mailto:${LEGAL_ENTITY.emails.privacy}`}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.emails.privacy}
            </a>{' '}
            and we will withdraw all your marketing consents within seven days. You will continue
            to receive transactional messages — login codes, payout confirmations, dispute notices
            — because those are necessary to operate your account and are not direct marketing
            under section 69.
          </li>
        </ul>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Your record of consent
        </h3>
        <p className="mb-4">
          When you tick a marketing checkbox at signup, we record the date, the version of the
          consent text shown to you, and the IP address from which you ticked it. This is how we
          prove your consent if you or the Information Regulator ever ask. You can request a copy
          of your consent record at any time via{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.privacy}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.privacy}
          </a>
          .
        </p>
      </section>

      <section id="who-we-share-with">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          Who we share your information with
        </h2>
        <p className="mb-4">
          We do not sell your personal information. We share it only with the operators below, and
          only to the extent each one needs to perform its role. Each operator is bound by a
          written agreement that meets the requirements of POPIA sections 20 and 21.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          TradeSafe Escrow (Pty) Ltd — payment and escrow partner
        </h3>
        <p className="mb-4">
          TradeSafe is our registered South African digital escrow partner. They hold bounty funds
          between brand funding and hunter payout, perform the FICA due diligence on brands and
          hunters who transact, and execute the bank transfers that pay hunters. We share with
          TradeSafe: your name, email, relevant contact details, the transaction reference, and
          (for hunters) the opaque token that links your Social Bounty account to your TradeSafe
          party record. Banking details are captured by TradeSafe directly; we never see them.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Apify — social-post verification processor
        </h3>
        <p className="mb-4">
          Apify retrieves publicly available post data for URLs you submit so we can verify the
          work automatically. We share with Apify: the post URL you submitted. Apify returns the
          scraped public post data to us. Apify operates from the European Union and the United
          States — see "Cross-border transfer" below for how that transfer is protected under POPIA
          section 72.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Cloud hosting and infrastructure providers
        </h3>
        <p className="mb-4">
          The platform runs on commercial cloud infrastructure. The hosting provider stores
          encrypted copies of our database and file uploads on our behalf as an operator under
          POPIA. They do not access your data for their own purposes.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Email and SMS provider — Brevo (Sendinblue SAS)
        </h3>
        <p className="mb-4">
          Brevo (Sendinblue SAS) dispatches both our transactional messages — verification codes,
          payout confirmations, dispute notifications — and any marketing emails or SMS you have
          opted into. Brevo receives your name, email address, and (for SMS) mobile number, plus
          the message body. They act as our operator under POPIA sections 20 and 21 and may not
          use the data for their own purposes. See{' '}
          <a href="#direct-marketing" className="text-pink-600 hover:text-pink-700 font-medium">
            Direct marketing (POPIA §69)
          </a>{' '}
          for the specifics on when each channel is used and how to opt out.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Error monitoring
        </h3>
        <p className="mb-4">
          We use an error-monitoring service so we can investigate crashes and unexpected errors.
          Server-side errors may include user identifiers and request metadata; we filter out
          sensitive fields before sending the error to the service.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Legal and regulatory disclosures
        </h3>
        <p className="mb-4">
          We will disclose personal information to the South African Revenue Service, the
          Information Regulator, the Financial Intelligence Centre, a court, or another competent
          authority when required by a validly issued legal instrument (summons, subpoena,
          warrant, or statutory demand).
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Business transfers
        </h3>
        <p className="mb-4">
          If Social Bounty is acquired, merged, or sold as a going concern, personal information
          may be transferred to the acquirer as part of the transaction. We will give you
          reasonable notice and explain the practical effect on this Privacy Policy before the
          transfer takes effect.
        </p>
      </section>

      <section id="cross-border-transfer">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          Cross-border transfer of personal information
        </h2>
        <p className="mb-4">
          POPIA section 72 restricts the transfer of personal information to a third party in
          another country. Social Bounty is a South African company and our primary processing
          happens in South Africa. However, some of our operators process your data outside the
          Republic, so we rely on section 72(1)(b) — the recipient is bound by a law, binding
          corporate rules, or binding agreement that provides an adequate level of protection.
        </p>
        <p className="mb-4">The cross-border transfers we make are:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-slate-900">Apify</strong>{' '}
            ({LEGAL_ENTITY.verificationProcessor.jurisdiction}): post URLs and scraped post data.
            We rely on our data-processing agreement with Apify and their compliance with the EU
            General Data Protection Regulation, which the Information Regulator has indicated
            offers comparable protection to POPIA.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Cloud hosting provider</strong>{' '}
            (regions vary): encrypted database and file storage. We rely on the provider's data
            processing agreement and its ISO 27001 / SOC 2 certifications.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Transactional email provider</strong>:
            name and email address for message delivery.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Error monitoring service</strong>:
            request metadata and stack traces (with sensitive fields redacted).
          </li>
        </ul>
        <p className="mb-4">
          If you want a copy of the operator agreements that protect your cross-border transfer,
          email us at{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.privacy}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.privacy}
          </a>
          . We will give you a description of the safeguards — the agreements themselves contain
          commercially confidential terms we can redact.
        </p>
      </section>

      <section id="retention">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          How long we keep your information
        </h2>
        <p className="mb-4">
          POPIA section 14 requires us to keep personal information only for as long as necessary.
          We apply the following retention periods:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-slate-900">
              Financial, ledger, and tax records:
            </strong>{' '}
            seven (7) years from the date of the transaction. This matches the requirement in
            section 29 of the Tax Administration Act 28 of 2011 and section 24 of the Value-Added
            Tax Act (to the extent applicable). This retention period cannot be shortened by a
            deletion request — if you ask us to delete your account, we will delete or anonymise
            everything we can, but financial records tied to completed transactions remain for the
            statutory period.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">
              Account and profile data (after account closure):
            </strong>{' '}
            retained for ninety (90) days after you close your account, then anonymised or deleted
            unless a longer period is required for a specific legal purpose (for example an open
            dispute or regulatory inquiry).
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Server logs:</strong> ninety (90)
            days, after which they are automatically purged.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Support communications:</strong> two
            (2) years, so we can track recurring issues and honour any commitments we made.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Aggregated and anonymised data:</strong>{' '}
            retained indefinitely. Once data has been fully anonymised it is no longer personal
            information and POPIA does not apply.
          </li>
        </ul>
      </section>

      <section id="your-rights">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          Your rights under POPIA
        </h2>
        <p className="mb-4">
          POPIA gives you a set of rights over your personal information. You can exercise any of
          them free of charge (we may charge a reasonable fee for repeated or excessive requests,
          and will tell you before we do). We will respond within thirty (30) days as required by
          POPIA regulation 3 read with section 24.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Right of access (section 23)
        </h3>
        <p className="mb-4">
          You may ask us whether we hold personal information about you and, if we do, ask us to
          give you a copy of it. Our response will describe the categories of data, the purposes we
          use it for, who we share it with, and how long we keep it.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Right to correction or deletion (section 24)
        </h3>
        <p className="mb-4">
          You may ask us to correct personal information that is inaccurate, out of date,
          incomplete, misleading, or unlawfully obtained; or to delete or destroy personal
          information we no longer have authority to hold. If we cannot delete data because of a
          statutory retention obligation, we will tell you which obligation applies and delete
          whatever we can.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Right to object (section 11(3))
        </h3>
        <p className="mb-4">
          You may object to processing that relies on legitimate interest or direct marketing. We
          will stop unless we can show a lawful reason to continue.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Right to not be subject to automated decision-making (section 71)
        </h3>
        <p className="mb-4">
          The automatic verification checks we run on a submission, and the auto-refund that can
          follow two consecutive post-visibility failures, are automated decisions that affect you.
          You can ask us to review the decision manually, and we will review it promptly. The
          checks themselves are documented in the bounty rules you can see before you submit.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Right to complain to the Information Regulator
        </h3>
        <p className="mb-4">
          If you are not satisfied with how we have handled your personal information, you can
          complain to the Information Regulator of South Africa:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            Website:{' '}
            <a
              href={LEGAL_ENTITY.informationRegulator.url}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.informationRegulator.url}
            </a>
          </li>
          <li>
            Email:{' '}
            <a
              href={`mailto:${LEGAL_ENTITY.informationRegulator.email}`}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.informationRegulator.email}
            </a>
          </li>
        </ul>
        <p className="mb-4">
          We would appreciate the chance to resolve the issue with you first — email{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.privacy}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.privacy}
          </a>
          . You do not need to exhaust that route before going to the Regulator, but it is usually
          faster.
        </p>
        <p className="mb-4">
          For details on how to submit a POPIA rights request, see our{' '}
          <Link
            href="/legal/information-officer"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Information Officer & Data Subject Rights
          </Link>{' '}
          page.
        </p>
      </section>

      <section id="security">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          How we protect your information
        </h2>
        <p className="mb-4">
          POPIA section 19 requires us to take reasonable technical and organisational steps to
          secure your personal information. In practice that means:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Transport encryption (TLS) on every connection to the platform.</li>
          <li>Encryption at rest for databases and file uploads.</li>
          <li>
            Password hashing with a modern key-derivation function; we never store or log plaintext
            passwords.
          </li>
          <li>
            Role-based access control (RBAC) on every screen and API endpoint, with the principle
            of least privilege applied to staff access.
          </li>
          <li>
            An append-only audit log for every administrative action and financial state change,
            so we can reconstruct what happened and who did it.
          </li>
          <li>
            Segregation of banking information to TradeSafe's environment so our servers never
            hold the data.
          </li>
          <li>
            Documented incident response procedures and notifications to the Information Regulator
            and affected data subjects as POPIA section 22 requires in the event of a security
            compromise.
          </li>
        </ul>
        <p className="mb-4">
          No system is perfectly secure. If we become aware of a compromise affecting your data,
          we will notify you and the Information Regulator in line with section 22.
        </p>
      </section>

      <section id="children">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">Children</h2>
        <p className="mb-4">
          Social Bounty is an 18+ platform. You must be at least 18 years old to register, create
          bounties, or submit work. We do not knowingly collect personal information from anyone
          under 18. If we find out that we have collected personal information from a child, we
          will delete it promptly. If you believe a child has registered, email{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.privacy}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.privacy}
          </a>
          .
        </p>
      </section>

      <section id="changes">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          Changes to this Privacy Policy
        </h2>
        <p className="mb-4">
          We will update this Privacy Policy from time to time. Minor edits (clarifying wording,
          fixing typos, updating contact details) appear here with a new version number. Material
          changes — new categories of data, new operators, a new retention period, changes to your
          rights — will be notified to you by email and with a banner on the platform at least
          fourteen (14) days before they take effect, so you have time to review and decide whether
          to continue using the platform.
        </p>
        <p className="mb-4">
          The current version of this policy is Version {LEGAL_VERSION}, effective{' '}
          {LEGAL_EFFECTIVE_DATE}.
        </p>
      </section>

      <section id="contact">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">Contact us</h2>
        <p className="mb-4">
          For anything relating to your personal information or this policy, contact our
          Information Officer:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-slate-900">Name:</strong>{' '}
            {LEGAL_ENTITY.informationOfficer.name}
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Role:</strong>{' '}
            {LEGAL_ENTITY.informationOfficer.role}
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Email:</strong>{' '}
            <a
              href={`mailto:${LEGAL_ENTITY.emails.privacy}`}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.emails.privacy}
            </a>
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Postal address:</strong>{' '}
            {LEGAL_ENTITY.registeredAddress.formatted}
          </li>
        </ul>
        <p className="mb-4">
          To escalate, see our{' '}
          <Link
            href="/legal/information-officer"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Information Officer page
          </Link>
          . To file a formal record request, see our{' '}
          <Link
            href="/legal/paia-manual"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            PAIA Manual
          </Link>
          .
        </p>
      </section>
    </LegalDocLayout>
  );
}
