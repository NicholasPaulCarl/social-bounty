import { LegalDocLayout } from '@/components/legal/LegalDocLayout';
import { LEGAL_ENTITY, LEGAL_EFFECTIVE_DATE, LEGAL_VERSION } from '@/content/legal/entity';
import Link from 'next/link';

export const metadata = {
  title: 'Consumer Rights Notice — Social Bounty',
  description:
    'A plain-English summary of your rights under the South African Consumer Protection Act when you use Social Bounty as a hunter or individual brand.',
};

const TOC = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'who-counts-as-a-consumer', label: 'Who counts as a consumer' },
  { id: 'right-to-fair-value-good-quality-safety', label: 'Fair value, good quality and safety' },
  { id: 'right-to-disclosure', label: 'Disclosure and information' },
  { id: 'right-to-fair-just-reasonable-terms', label: 'Fair, just and reasonable terms' },
  { id: 'right-to-honest-dealing', label: 'Honest dealing' },
  { id: 'right-to-accountability', label: 'Accountability from suppliers' },
  { id: 'right-to-be-heard', label: 'Being heard and escalating' },
  { id: 'cooling-off-position', label: 'Cooling-off rights' },
  { id: 'how-to-exercise-your-rights', label: 'How to exercise your rights' },
  { id: 'related-documents', label: 'Related documents' },
];

export default function ConsumerRightsPage() {
  return (
    <LegalDocLayout
      title="Consumer Rights Notice"
      category="Consumer"
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      lastUpdated={LEGAL_EFFECTIVE_DATE}
      version={LEGAL_VERSION}
      summary="A plain-English summary of the rights you have under the South African Consumer Protection Act 68 of 2008 (CPA) and the Electronic Communications and Transactions Act 25 of 2002 (ECTA) when you use Social Bounty. These rights exist by law. Nothing in our Terms of Service, our Acceptable Use Policy or any other agreement with us can take them away."
      toc={TOC}
    >
      <section id="introduction">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">Introduction</h2>
        <p className="mb-4">
          This is a plain-English summary of your consumer rights when you use Social Bounty. It
          is written for the non-lawyer who wants to know, in real terms, what you are entitled to
          expect from us and what you can do if something goes wrong. It is not the whole of the
          law, and it does not replace the text of the{' '}
          <strong className="font-semibold text-slate-900">
            Consumer Protection Act 68 of 2008 (CPA)
          </strong>
          , the{' '}
          <strong className="font-semibold text-slate-900">
            Electronic Communications and Transactions Act 25 of 2002 (ECTA)
          </strong>{' '}
          or the{' '}
          <strong className="font-semibold text-slate-900">
            Protection of Personal Information Act 4 of 2013 (POPIA)
          </strong>
          . Where a right comes from a specific section, we cite it so you can look it up.
        </p>
        <p className="mb-4">
          Social Bounty is operated by{' '}
          <strong className="font-semibold text-slate-900">{LEGAL_ENTITY.registeredName}</strong>{' '}
          (CIPC registration number {LEGAL_ENTITY.cipcRegNumber}), a South African private company
          with its registered address at {LEGAL_ENTITY.registeredAddress.formatted}. When this
          notice says "we", "us" or "Social Bounty", that is who we mean.
        </p>
        <p className="mb-4">
          If anything in this notice conflicts with a right the CPA gives you, the CPA wins. That
          is not a concession — section 48 of the CPA makes unfair, unjust or unreasonable terms
          void, and section 51 lists the terms that can never appear in a consumer agreement at
          all. We have tried to be careful about those, and we will not try to walk you out of
          rights you cannot sign away.
        </p>
      </section>

      <section id="who-counts-as-a-consumer">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          Who counts as a consumer
        </h2>
        <p className="mb-4">
          The CPA protects two groups of people who use Social Bounty:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-slate-900">Hunters</strong> — you are a natural
            person (an individual human being) who signs up to complete bounties and earn payouts.
            The CPA always applies to you in your dealings with us.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">
              Small-business brands and individual brand users
            </strong>{' '}
            — you are a natural person who funds bounties on the platform, or you are a juristic
            person (a company, close corporation, partnership or trust) whose asset value or
            annual turnover is below the threshold currently set under the CPA (at the time of
            writing, R2 million). If you meet that test, the CPA applies to you as well.
          </li>
        </ul>
        <p className="mb-4">
          If you are a larger business (above the R2 million threshold), the CPA does not apply
          to your use of Social Bounty. You still have the full protection of South African
          contract law, ECTA where we transact electronically, and POPIA for any personal
          information we hold about you or your staff.
        </p>
        <p className="mb-4">
          Throughout this notice, when we say{' '}
          <strong className="font-semibold text-slate-900">"you"</strong> we mean whichever of
          these categories applies to you.
        </p>
      </section>

      <section id="right-to-fair-value-good-quality-safety">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          You have a right to fair value, good quality and safety
        </h2>
        <p className="mb-4">
          Sections 54 to 61 of the CPA give you the right to services that are performed with
          reasonable skill, care and diligence, that are reasonably fit for the purpose they
          were supposed to serve, and that are delivered within a reasonable time. For a
          platform like ours that means:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            Our website and app should work as described. If the payout rail, the submission flow
            or the verification layer is broken in a way that prevents you from getting value,
            you have the right to a remedy under section 54 — typically a refund, a re-performance
            or a credit, at your election, subject to what the CPA allows in the circumstances.
          </li>
          <li>
            Where we take your money (a bounty budget or a subscription charge), you have the
            right to the corresponding service. If we fail to deliver, section 56 gives you the
            right to cancel and be repaid for the portion we failed to deliver.
          </li>
          <li>
            Where we rely on a third-party processor — for example the social-media verification
            service we use to check submissions — we remain accountable to you under the CPA. You
            do not need to chase that third party yourself.
          </li>
        </ul>
        <p className="mb-4">
          We will not pretend to give you a "warranty" shorter than the statutory{' '}
          <strong className="font-semibold text-slate-900">six months</strong> that section 56
          creates. If someone tries to sell you a clause that says otherwise on this platform,
          that clause is unenforceable.
        </p>
      </section>

      <section id="right-to-disclosure">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          You have a right to know what you are buying and what it costs
        </h2>
        <p className="mb-4">
          Sections 22 to 28 of the CPA give you the right to information in plain and
          understandable language, to accurate pricing, to an itemised account, and to a written
          record of the transaction. ECTA section 43 adds an online-specific layer: before you
          place an order on a website we have to tell you who we are, where we are, what you
          are buying, what it costs including all fees, and how to cancel.
        </p>
        <p className="mb-4">In practice, that means on Social Bounty you have the right to:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            See the total cost of a bounty — including any platform fee, payment-processing fee
            and, separately disclosed, the global 3.5% platform fee — before you confirm it.
          </li>
          <li>
            See the rules for payout, approval and refund{' '}
            <em>before</em> you submit to a bounty, not after.
          </li>
          <li>
            Receive a written record (in your account history and by email) of every charge,
            payout and refund that moves through your account.
          </li>
          <li>
            Ask for anything we say to be explained again, in plainer language, if it is not clear
            the first time.
          </li>
        </ul>
        <p className="mb-4">
          If you ever feel you did not get the information you needed before you committed, that
          is a complaint we want to hear. Email us at{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.complaints}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.complaints}
          </a>
          .
        </p>
      </section>

      <section id="right-to-fair-just-reasonable-terms">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          You have a right to fair, just and reasonable terms
        </h2>
        <p className="mb-4">
          Sections 48 to 52 of the CPA police the contents of consumer agreements:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-slate-900">Section 48</strong> makes it unlawful
            for us to offer goods or services, or to enter into an agreement, on terms that are
            unfair, unreasonable or unjust. If a clause in our Terms does that, the clause is
            void.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Section 49</strong> requires terms
            that limit our liability, that create risk for you or that require you to waive a
            right to be drawn to your attention in plain, understandable language — not buried.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Section 50</strong> prohibits
            unconscionable conduct — using physical force, coercion, undue influence, pressure,
            duress, harassment or unfair tactics against you.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Section 51</strong> sets out terms
            that can never appear in a consumer agreement. Among them: terms that ask you to waive
            any right you have under the CPA, that exempt us from liability for gross negligence,
            that assume facts about you which are not true, or that sign away the jurisdiction of
            the South African courts. None of those will appear in our documents. If you spot
            something that looks like one, please tell us and we will correct it.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Section 52</strong> gives a court
            power to declare a term unconscionable, unjust or unreasonable and to refuse to
            enforce it. It also preserves your right to approach the National Consumer
            Commission directly — more on that below.
          </li>
        </ul>
      </section>

      <section id="right-to-honest-dealing">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          You have a right to honest dealing
        </h2>
        <p className="mb-4">
          Sections 40 to 47 of the CPA make it unlawful for us to use unfair tactics, to make
          false or misleading representations, to bait-and-switch you, or to charge a price other
          than the one we advertised. In the context of Social Bounty, that cashes out as:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            We will not exaggerate what the platform does or what your odds of earning are.
          </li>
          <li>
            We will not change the deal on you after you have started work on a bounty (for
            example, reducing the payout or adding a new requirement mid-flight) without clear,
            up-front consent and a right for you to withdraw.
          </li>
          <li>
            We will not use dark patterns to push you into a subscription tier or an add-on you
            did not want.
          </li>
          <li>
            Our marketing and our product copy will match the rules and fees that actually apply
            when you transact.
          </li>
        </ul>
      </section>

      <section id="right-to-accountability">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          You have a right to accountability from us
        </h2>
        <p className="mb-4">
          Sections 53 to 61 of the CPA make suppliers accountable for the quality of the services
          they provide. If something on the platform goes wrong in a way that causes you loss,
          you have the right to ask us to put it right. Depending on the problem, the CPA allows
          for any combination of:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>A refund of the fee paid.</li>
          <li>Re-performance of the service — for example, re-running a submission verification if it failed for reasons on our side.</li>
          <li>Repair of the defect where possible.</li>
          <li>Replacement where a credit or an alternative is appropriate.</li>
        </ul>
        <p className="mb-4">
          We note one specific case expressly: we operate an automated post-visibility check that
          can trigger a refund to a brand if a hunter's approved post appears to have been taken
          down (see ADR 0010 in our engineering documentation). If you believe that check fired
          incorrectly on your content — the post is still live, the URL is reachable, and the
          scraper misread the page — you can contest the outcome through our{' '}
          <Link
            href="/legal/complaints"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Complaints & Dispute Resolution
          </Link>{' '}
          process. That is a live, human route, not an automated reply.
        </p>
      </section>

      <section id="right-to-be-heard">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          You have a right to be heard, and to escalate
        </h2>
        <p className="mb-4">
          Sections 69 to 76 of the CPA give you the right to complain and to have your complaint
          considered seriously, and they give you a specific escalation route to the National
          Consumer Commission (NCC) and the consumer tribunal. Importantly,{' '}
          <strong className="font-semibold text-slate-900">
            section 52 of the CPA means we cannot contract you out of that route
          </strong>
          . Even if you have agreed to an internal complaints process, or to arbitration, or to
          any other mechanism, your right to approach the NCC directly remains intact.
        </p>
        <p className="mb-4">
          We have written out our internal complaints process so you can use it if you want to.
          It is meant to be the quick route — most issues can be resolved at the support level.
          If it is not fixed to your satisfaction, the external channels remain open:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            The{' '}
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
            </a>{' '}
            for CPA-type complaints.
          </li>
          <li>
            The{' '}
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
            </a>{' '}
            for personal-information and POPIA complaints, or{' '}
            <a
              href={`mailto:${LEGAL_ENTITY.informationRegulator.email}`}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.informationRegulator.email}
            </a>
            .
          </li>
          <li>
            Voluntary arbitration under the Arbitration Foundation of Southern Africa (AFSA) if
            both you and we agree to use it — this is an alternative, not a substitute, for the
            NCC route.
          </li>
          <li>
            The {LEGAL_ENTITY.governingLawDivision} for matters that fall outside the above.
          </li>
        </ul>
        <p className="mb-4">
          Step-by-step details, our response-time commitments and the investigation process are
          set out in our{' '}
          <Link
            href="/legal/complaints"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Complaints & Dispute Resolution
          </Link>{' '}
          policy.
        </p>
      </section>

      <section id="cooling-off-position">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          Cooling-off rights: what they are, and where they do not apply
        </h2>
        <p className="mb-4">
          South African law gives consumers a "cooling-off" right in two specific situations,
          and we want to be honest about which applies to Social Bounty.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          ECTA section 44 — the general 7-day rule
        </h3>
        <p className="mb-4">
          Section 44 of ECTA gives a consumer who bought goods or services through an electronic
          transaction the right to cancel, without reason and without penalty, within{' '}
          <strong className="font-semibold text-slate-900">
            seven (7) days of receiving the goods or concluding the services agreement
          </strong>
          , and to a refund within 30 days. That is a powerful right and we respect it. It is the
          default position for our subscription and platform-fee charges.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          The carve-out for services you asked us to start
        </h3>
        <p className="mb-4">
          Section 42(2)(a) of ECTA carves a specific exception out of the 7-day rule: where the
          service has already begun{' '}
          <strong className="font-semibold text-slate-900">
            with your express consent, and before the 7-day period is up
          </strong>
          , the cooling-off right does not apply to the portion of the service already rendered.
        </p>
        <p className="mb-4">
          A lot of what happens on Social Bounty falls into this exception. When you fund a
          bounty and it goes live, when hunters submit work against it, and when verification
          runs against those submissions, real work has started. We cannot unring that bell. The
          fair position is:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            For a bounty that has{' '}
            <strong className="font-semibold text-slate-900">not yet gone live</strong>, you can
            cancel and receive a full refund. That is your ECTA s44 right and we honour it.
          </li>
          <li>
            For a bounty that{' '}
            <strong className="font-semibold text-slate-900">has gone live but has received
            no submissions and no verification work has run</strong>, you can cancel and receive a
            full refund, net of any bank or payment-processor fee that is non-recoverable.
          </li>
          <li>
            For a bounty that has received submissions or incurred verification costs, we can
            refund the portion of the budget that is still uncommitted, but not the portion that
            has already been applied to work that is effectively done.
          </li>
          <li>
            For subscription charges (Pro tier), you can cancel your subscription at any time; the
            ECTA 7-day cooling-off right applies to the initial charge.
          </li>
        </ul>
        <p className="mb-4">
          We will not dress this up as a "no refunds" policy. It is an honest carve-out that
          tracks what the law actually says. If you disagree with how we have applied it in your
          case, that is a complaint and we will look at it.
        </p>
      </section>

      <section id="how-to-exercise-your-rights">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          How to exercise your rights
        </h2>
        <p className="mb-4">
          You do not need to quote sections of the CPA at us to be taken seriously. The easiest
          route is:
        </p>
        <ol className="list-decimal pl-6 mb-4 space-y-1">
          <li>
            Email{' '}
            <a
              href={`mailto:${LEGAL_ENTITY.emails.complaints}`}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.emails.complaints}
            </a>{' '}
            with what happened, when, and what you would like us to do about it. We will
            acknowledge within 3 business days and aim for a substantive response within 14
            days.
          </li>
          <li>
            For personal-information and data-subject rights requests (access, correction,
            deletion), see our{' '}
            <Link
              href="/legal/information-officer"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Information Officer & Data Subject Rights
            </Link>{' '}
            page.
          </li>
          <li>
            If our internal response does not fix the issue, you can escalate to the NCC or
            Information Regulator. You do not need our permission to do that.
          </li>
        </ol>
      </section>

      <section id="related-documents">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          Related documents
        </h2>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <Link
              href="/legal/complaints"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Complaints & Dispute Resolution
            </Link>{' '}
            — the step-by-step process, SLAs, remedies and escalation routes.
          </li>
          <li>
            <Link
              href="/legal/privacy-policy"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Privacy Policy
            </Link>{' '}
            — your POPIA rights and how we handle personal information.
          </li>
          <li>
            <Link
              href="/legal/information-officer"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Information Officer & Data Subject Rights
            </Link>{' '}
            — who to contact for access, correction or deletion requests.
          </li>
          <li>
            <Link
              href="/legal/terms-of-service"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Terms of Service
            </Link>{' '}
            — the full agreement between you and Social Bounty.
          </li>
        </ul>
        <p className="mb-4">
          General enquiries about your rights on this platform can go to{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.legal}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.legal}
          </a>
          .
        </p>
      </section>
    </LegalDocLayout>
  );
}
