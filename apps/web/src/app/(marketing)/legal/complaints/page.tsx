import { LegalDocLayout } from '@/components/legal/LegalDocLayout';
import { LEGAL_ENTITY, LEGAL_EFFECTIVE_DATE, LEGAL_VERSION } from '@/content/legal/entity';
import Link from 'next/link';

export const metadata = {
  title: 'Complaints & Dispute Resolution — Social Bounty',
  description:
    'How to raise a complaint with Social Bounty, our response-time commitment, and where to escalate if we do not fix the issue.',
};

const TOC = [
  { id: 'our-commitment', label: 'Our commitment' },
  { id: 'scope', label: 'What this policy covers' },
  { id: 'how-to-complain', label: 'How to complain' },
  { id: 'acknowledgement-sla', label: 'Acknowledgement' },
  { id: 'investigation-sla', label: 'Investigation and response' },
  { id: 'remedies', label: 'Remedies we can offer' },
  { id: 'internal-escalation', label: 'Internal escalation' },
  { id: 'external-escalation', label: 'External escalation' },
  { id: 'auto-refund-dispute', label: 'Contesting an auto-refund' },
  { id: 'no-waiver', label: 'No waiver of your rights' },
  { id: 'retaliation', label: 'No retaliation' },
  { id: 'contact', label: 'Contact' },
];

export default function ComplaintsPage() {
  return (
    <LegalDocLayout
      title="Complaints & Dispute Resolution"
      category="Consumer"
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      lastUpdated={LEGAL_EFFECTIVE_DATE}
      version={LEGAL_VERSION}
      summary="If something has gone wrong on Social Bounty, here is how you tell us, what we commit to do about it, and where to go if we have not fixed it to your satisfaction. Using this policy does not take away your right to approach the National Consumer Commission, the Information Regulator or the courts at any point."
      toc={TOC}
    >
      <section id="our-commitment">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          Our commitment
        </h2>
        <p className="mb-4">
          We take complaints seriously. This policy sets out a clear path for raising an issue,
          a clear commitment on how quickly you will hear back, and a clear route to escalate if
          our first response does not resolve things. It is written so that you can use it
          without needing a lawyer.
        </p>
        <p className="mb-4">
          Social Bounty is operated by{' '}
          <strong className="font-semibold text-slate-900">{LEGAL_ENTITY.registeredName}</strong>{' '}
          (CIPC registration number {LEGAL_ENTITY.cipcRegNumber}). When this policy says "we" or
          "us", that is who we mean. When it says "you", we mean any hunter, brand user, visitor
          or applicant raising a complaint with us.
        </p>
      </section>

      <section id="scope">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          What this policy covers
        </h2>
        <p className="mb-4">This policy covers complaints about:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-slate-900">Commercial matters</strong> — fees,
            charges, subscriptions, refunds, bounty funding, payouts, or anything about how money
            moves.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">
              Personal information and privacy
            </strong>{' '}
            — how we collected, used, stored, shared, corrected or deleted your personal
            information under POPIA.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Service quality</strong> — the
            platform not working as described, submissions not verifying correctly, approval
            delays, broken notifications.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Platform conduct</strong> — how we
            have moderated your content, enforced our Acceptable Use Policy, suspended or
            restricted your account, or otherwise exercised editorial or enforcement discretion.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Team conduct</strong> — how anyone
            at Social Bounty has treated you.
          </li>
        </ul>
        <p className="mb-4">This policy does not cover:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-slate-900">Criminal matters.</strong> If you
            believe a crime has been committed (fraud, threats, harassment amounting to a
            criminal offence), report it to the South African Police Service (SAPS) directly.
            We will assist an SAPS investigation where we lawfully can, but we are not a
            substitute for one.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">
              Disputes between a brand and a hunter that are unrelated to the platform.
            </strong>{' '}
            If you have a private disagreement with another user about something that happened
            off-platform, that is not ours to adjudicate. If a platform interaction is at the
            heart of it — a submission, a payout, a bounty rule — then it does fall within this
            policy and we will look at it.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">
              Intellectual-property and copyright takedown notices.
            </strong>{' '}
            Those follow the specific procedure in our{' '}
            <Link
              href="/legal/ip-policy"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              IP & Copyright Takedown Policy
            </Link>{' '}
            rather than this one. The outcomes of a takedown decision can still be complained
            about under this policy if you think we got it wrong.
          </li>
        </ul>
      </section>

      <section id="how-to-complain">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          How to complain
        </h2>
        <p className="mb-4">
          The primary channel for all complaints is email to{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.complaints}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.complaints}
          </a>
          . If you would prefer to start on a general legal thread, you can also use{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.legal}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.legal}
          </a>
          . For data-subject rights (access, correction, deletion under POPIA), use{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.privacy}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.privacy}
          </a>
          . Where in-app messaging with our support team is available in your account, you can
          open a case there and we will treat it the same way.
        </p>
        <p className="mb-4">
          To help us get to the point quickly, please include in your first message:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Who you are — the email address on your account, or your username.</li>
          <li>What happened — a short factual description.</li>
          <li>When it happened — a date and, if relevant, a time.</li>
          <li>
            Any reference numbers you already have — a bounty ID, submission ID, payout ID or
            support-ticket reference.
          </li>
          <li>What you would like us to do to put it right.</li>
        </ul>
        <p className="mb-4">
          That is all. We will not ask you for personal information we do not need to
          investigate. If we do need something further — for example a screenshot, a URL, or a
          copy of a receipt — we will ask for it specifically and explain why.
        </p>
      </section>

      <section id="acknowledgement-sla">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          Acknowledgement — within 3 business days
        </h2>
        <p className="mb-4">
          We commit to acknowledging every complaint{' '}
          <strong className="font-semibold text-slate-900">
            within 3 business days of receipt
          </strong>
          . The acknowledgement will include:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>A case reference number you can quote in any follow-up.</li>
          <li>
            A short confirmation of what we understood you to be complaining about — so you can
            correct us early if we have misunderstood.
          </li>
          <li>The name of the person now handling the case.</li>
          <li>An estimate of when you can expect a substantive response.</li>
        </ul>
        <p className="mb-4">
          If you do not receive an acknowledgement within 3 business days, something has gone
          wrong on our side. Please nudge us at{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.legal}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.legal}
          </a>
          .
        </p>
      </section>

      <section id="investigation-sla">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          Investigation and response
        </h2>
        <p className="mb-4">We then investigate. Our response-time commitments are:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-slate-900">
              Commercial, service-quality and platform-conduct complaints:
            </strong>{' '}
            a substantive response, including any proposed resolution, within{' '}
            <strong className="font-semibold text-slate-900">14 calendar days</strong> of your
            original message.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">
              POPIA data-subject rights requests:
            </strong>{' '}
            up to{' '}
            <strong className="font-semibold text-slate-900">30 calendar days</strong>, as
            permitted by section 23(2) of POPIA. In many cases we will be faster, but we will
            not take longer without telling you in advance and explaining why.
          </li>
        </ul>
        <p className="mb-4">
          Investigations can be straightforward (check the logs, confirm the outcome, refund the
          charge) or they can require input from a third party — for example our payments
          partner, our verification processor or an external regulator. Where that happens we
          will keep you updated with the case reference at least once every 7 calendar days until
          the matter is resolved.
        </p>
      </section>

      <section id="remedies">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          Remedies we can offer
        </h2>
        <p className="mb-4">
          What we can put right depends on what went wrong. The range of remedies we can offer
          includes:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-slate-900">Refund.</strong> Full or partial
            reversal of a charge, a subscription fee, or a bounty-budget portion, in line with
            the rules set out in our{' '}
            <Link
              href="/legal/consumer-rights"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Consumer Rights Notice
            </Link>{' '}
            and the ECTA / CPA rights discussed there.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Resubmission.</strong> For hunters
            whose submission was rejected because of a verification failure that turned out to
            be a false positive, we can reopen the submission and let you resubmit the affected
            URLs without penalty.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">
              Account reinstatement or review.
            </strong>{' '}
            If we have suspended or restricted your account and our review shows the action was
            wrong (or the response was disproportionate), we will reinstate the account and
            correct any follow-on effects.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Correction.</strong> Fixing
            personal-information errors, updating public content we got wrong, or correcting a
            ledger entry.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Apology and explanation.</strong>{' '}
            Where we got something wrong but the loss is not financial — for example a
            communication failure or a usability bug that cost you time — a clear apology and a
            root-cause explanation is sometimes the fair remedy.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Process improvement.</strong> For
            the kind of complaint that reveals a structural problem (a misleading screen, a
            confusing fee disclosure, a policy that is not working as intended), we will change
            the underlying practice and tell you what we changed.
          </li>
        </ul>
        <p className="mb-4">
          If the remedy you asked for is not the one we think is appropriate, we will tell you
          why and propose an alternative. You do not have to accept our proposal. Accepting or
          rejecting it does not close off your right to escalate externally.
        </p>
      </section>

      <section id="internal-escalation">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          Internal escalation — if the first response does not resolve the issue
        </h2>
        <p className="mb-4">
          If the response you receive at the support level does not resolve the complaint to
          your satisfaction, reply to the same email thread and say so. Quote your case
          reference. The matter will then be escalated within Social Bounty to our Complaints
          Officer, and — if still unresolved — to a director of the company. We aim to complete
          an internal escalation within a further 10 business days.
        </p>
        <p className="mb-4">
          Internal escalation is optional. You can go to an external channel (below) at any
          point, without using our internal process first.
        </p>
      </section>

      <section id="external-escalation">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          External escalation — the rights we preserve for you
        </h2>
        <p className="mb-4">
          Whatever the outcome of our internal process, the following external channels remain
          available to you. We will cooperate with any of them.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          National Consumer Commission (consumer complaints)
        </h3>
        <p className="mb-4">
          For complaints about your rights under the Consumer Protection Act — unfair terms,
          pricing, refunds, service quality, misleading representations — you may approach the{' '}
          <strong className="font-semibold text-slate-900">
            {LEGAL_ENTITY.nationalConsumerCommission.name}
          </strong>{' '}
          at{' '}
          <a
            href={LEGAL_ENTITY.nationalConsumerCommission.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.nationalConsumerCommission.url}
          </a>
          . Your right to do this is protected by section 52 of the CPA and cannot be contracted
          away.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Information Regulator (data-privacy complaints)
        </h3>
        <p className="mb-4">
          For complaints about how we have handled your personal information under POPIA, you
          may approach the{' '}
          <strong className="font-semibold text-slate-900">
            {LEGAL_ENTITY.informationRegulator.name}
          </strong>{' '}
          at{' '}
          <a
            href={LEGAL_ENTITY.informationRegulator.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.informationRegulator.url}
          </a>
          , by email to{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.informationRegulator.email}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.informationRegulator.email}
          </a>
          . Our{' '}
          <Link
            href="/legal/privacy-policy"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link
            href="/legal/information-officer"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Information Officer & Data Subject Rights
          </Link>{' '}
          page set out how to raise a POPIA issue with us directly first, but that step is not
          a precondition — you can approach the Regulator whenever you choose.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Consumer Goods and Services Ombud
        </h3>
        <p className="mb-4">
          Social Bounty is{' '}
          <strong className="font-semibold text-slate-900">
            not currently a participant in the Consumer Goods and Services Ombud (CGSO) scheme
          </strong>
          . We are reviewing membership and will update this page if that changes. In the
          meantime, the CGSO is not an available escalation route for complaints about our
          platform; the NCC is.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Voluntary arbitration
        </h3>
        <p className="mb-4">
          Where both you and we agree in writing, a dispute can be referred to arbitration under
          the rules of the{' '}
          <strong className="font-semibold text-slate-900">
            Arbitration Foundation of Southern Africa (AFSA)
          </strong>
          . This is a voluntary alternative, not a requirement. Agreeing to arbitration does not
          take away your right to approach the NCC under CPA section 52.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          The courts
        </h3>
        <p className="mb-4">
          For matters that fall outside the above channels, the{' '}
          {LEGAL_ENTITY.governingLawDivision} has jurisdiction. Depending on the amount in
          dispute, the Magistrates' Courts and Small Claims Courts may be more accessible and
          less expensive starting points.
        </p>
      </section>

      <section id="auto-refund-dispute">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          Contesting an auto-refund
        </h2>
        <p className="mb-4">
          Social Bounty runs an automated post-visibility check on approved hunter content. Under
          the rules described in our engineering decision record (ADR 0010), if a post that has
          been paid out appears to have been taken down or made inaccessible, the platform can
          automatically refund the brand and recover the payout. This is intended to protect the
          brand against a hunter removing content after being paid — but an automated check can
          make a mistake (an Apify false positive, a transient social-network outage, a
          geo-restriction misread as a removal).
        </p>
        <p className="mb-4">
          If you are a hunter who believes an auto-refund was wrongly triggered — the post is
          still live, the URL is reachable, and the platform has got it wrong — please email{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.complaints}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.complaints}
          </a>{' '}
          with:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>The submission ID (from your account).</li>
          <li>The public URL of the post at issue.</li>
          <li>A recent screenshot showing the post is live, with a visible timestamp.</li>
          <li>
            The approximate date and time the auto-refund fired (we will have this on our side
            too).
          </li>
        </ul>
        <p className="mb-4">
          We commit to reviewing contested auto-refunds{' '}
          <strong className="font-semibold text-slate-900">
            within 7 business days of receiving the information above
          </strong>
          . If the check was wrong, we reverse the refund and restore the payout. If we agree
          with the check, we will explain in writing what the verification layer saw, so you
          understand the reasoning — even if we end up disagreeing with you, you will know why.
        </p>
        <p className="mb-4">
          This specific subsection does not limit your general rights. If the outcome of our
          review is not acceptable, the internal and external escalation routes above still
          apply.
        </p>
      </section>

      <section id="no-waiver">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          No waiver of your statutory rights
        </h2>
        <p className="mb-4">
          Using this complaints procedure does not waive any right you have under South African
          law. In particular, section 52 of the Consumer Protection Act preserves your right to
          approach the National Consumer Commission directly at any time, whether or not you
          have first used our internal process. If anything in this policy reads as though it
          takes that away, read it the other way — it does not and it cannot.
        </p>
        <p className="mb-4">
          If we propose a resolution and you accept it, we may ask you to confirm in writing
          that the specific complaint is closed. That is about the specific complaint only. It
          does not bind you on any future issue, and it does not take away your statutory rights
          going forward.
        </p>
      </section>

      <section id="retaliation">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          No retaliation
        </h2>
        <p className="mb-4">
          We do not retaliate against users who raise a complaint in good faith. Filing a
          complaint — whether with us, the NCC, the Information Regulator or anyone else — will
          not cause your account to be suspended, your reputation score to be adjusted, your
          submissions to be deprioritised, or your future bounties to be treated differently.
        </p>
        <p className="mb-4">
          The only exception, and it is not retaliation: if a complaint itself contains content
          that breaches our Acceptable Use Policy (harassment, threats, abusive language
          directed at staff or at other users), we may decline to engage with that specific
          communication and ask you to resubmit it without the problematic content. The
          underlying complaint is still investigated.
        </p>
      </section>

      <section id="contact">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">Contact</h2>
        <p className="mb-4">Complaints and escalations:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            Complaints:{' '}
            <a
              href={`mailto:${LEGAL_ENTITY.emails.complaints}`}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.emails.complaints}
            </a>
          </li>
          <li>
            Legal and internal escalation:{' '}
            <a
              href={`mailto:${LEGAL_ENTITY.emails.legal}`}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.emails.legal}
            </a>
          </li>
          <li>
            Privacy / POPIA requests:{' '}
            <a
              href={`mailto:${LEGAL_ENTITY.emails.privacy}`}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.emails.privacy}
            </a>
          </li>
          <li>
            Postal:{' '}
            <span className="text-slate-700">
              {LEGAL_ENTITY.registeredName}, {LEGAL_ENTITY.registeredAddress.formatted}
            </span>
          </li>
        </ul>
        <p className="mb-4">
          Related reading:{' '}
          <Link
            href="/legal/consumer-rights"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Consumer Rights Notice
          </Link>
          ,{' '}
          <Link
            href="/legal/privacy-policy"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Privacy Policy
          </Link>
          ,{' '}
          <Link
            href="/legal/information-officer"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Information Officer & Data Subject Rights
          </Link>
          ,{' '}
          <Link
            href="/legal/terms-of-service"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Terms of Service
          </Link>
          .
        </p>
      </section>
    </LegalDocLayout>
  );
}
