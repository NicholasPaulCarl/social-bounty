import { LegalDocLayout } from '@/components/legal/LegalDocLayout';
import { LEGAL_ENTITY, LEGAL_EFFECTIVE_DATE, LEGAL_VERSION } from '@/content/legal/entity';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Social Bounty',
  description:
    'The agreement between you and Social Bounty — bounties, fees, licences, and your rights.',
};

const TOC = [
  { id: 'acceptance', label: 'Acceptance' },
  { id: 'who-we-are', label: 'Who we are' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'roles', label: 'Roles on the platform' },
  { id: 'bounties', label: 'Bounties' },
  { id: 'submissions-and-licence', label: 'Submissions & content licence' },
  { id: 'fees', label: 'Fees & charges' },
  { id: 'custody', label: 'Custody of funds' },
  { id: 'verification', label: 'Verification' },
  { id: 'approval-and-payout', label: 'Approval & payout' },
  { id: 'post-visibility', label: 'Post visibility & auto-refund' },
  { id: 'reversals', label: 'Reversals & corrections' },
  { id: 'acceptable-use', label: 'Acceptable use' },
  { id: 'intellectual-property', label: 'Intellectual property' },
  { id: 'suspension-and-termination', label: 'Suspension & termination' },
  { id: 'disputes', label: 'Disputes & governing law' },
  { id: 'warranties-and-liability', label: 'Warranties & liability' },
  { id: 'force-majeure', label: 'Force majeure' },
  { id: 'general', label: 'General' },
  { id: 'contact', label: 'Contact' },
];

export default function TermsOfServicePage() {
  return (
    <LegalDocLayout
      title="Terms of Service"
      category="Commercial"
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      lastUpdated={LEGAL_EFFECTIVE_DATE}
      version={LEGAL_VERSION}
      summary="The agreement between you and Social Bounty — how bounties work, what we charge, how money moves, what rights you grant when you submit content, and how we handle disputes."
      toc={TOC}
    >
      <section id="acceptance">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          1. Acceptance of these Terms
        </h2>
        <p className="mb-4">
          These Terms of Service (<strong className="font-semibold text-slate-900">Terms</strong>)
          govern your use of {LEGAL_ENTITY.tradingName} (<strong className="font-semibold text-slate-900">the Platform</strong>),
          operated by {LEGAL_ENTITY.registeredName} (<strong className="font-semibold text-slate-900">we</strong>,{' '}
          <strong className="font-semibold text-slate-900">us</strong>, or{' '}
          <strong className="font-semibold text-slate-900">Social Bounty</strong>). By creating an
          account, funding a bounty, submitting a claim, or otherwise using the Platform, you
          confirm that you have read and accepted these Terms. If you do not accept them, do not
          use the Platform.
        </p>
        <p className="mb-4">
          These Terms are a written agreement concluded electronically under section 22 of the
          Electronic Communications and Transactions Act 25 of 2002 (<strong className="font-semibold text-slate-900">ECTA</strong>).
          Acceptance may be indicated by any conduct that reasonably shows your intention to be
          bound, including clicking an "I agree" control, completing account signup, or using the
          Platform after these Terms have been published.
        </p>
        <p className="mb-4">
          We may amend these Terms from time to time. Material changes — changes that affect your
          rights, fees, data handling, or dispute routes — will be notified to you at least{' '}
          <strong className="font-semibold text-slate-900">14 days before they take effect</strong>,
          by email to the address on your account and by a prominent notice on the Platform. Non-material
          changes (typos, clarifications, updated contact details) take effect on publication. You
          remain free to close your account at any time if you do not accept a change.
        </p>
      </section>

      <section id="who-we-are">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">2. Who we are</h2>
        <p className="mb-4">
          Social Bounty is operated by {LEGAL_ENTITY.registeredName}, a private company
          incorporated in the Republic of South Africa.
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
            <strong className="font-semibold text-slate-900">Registered office (domicilium citandi et executandi):</strong>{' '}
            {LEGAL_ENTITY.registeredAddress.formatted}
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Website:</strong>{' '}
            <a
              href={LEGAL_ENTITY.websiteUrl}
              className="text-pink-600 hover:text-pink-700 font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              {LEGAL_ENTITY.domain}
            </a>
          </li>
          <li>
            <strong className="font-semibold text-slate-900">General contact:</strong>{' '}
            <a
              href={`mailto:${LEGAL_ENTITY.emails.general}`}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.emails.general}
            </a>
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Legal contact:</strong>{' '}
            <a
              href={`mailto:${LEGAL_ENTITY.emails.legal}`}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.emails.legal}
            </a>
          </li>
        </ul>
        <p className="mb-4">
          This information is published in compliance with section 43 of ECTA. Our Information
          Officer, appointed under the Protection of Personal Information Act 4 of 2013 (<strong className="font-semibold text-slate-900">POPIA</strong>),
          is listed in our{' '}
          <Link
            href="/legal/information-officer"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Information Officer notice
          </Link>
          .
        </p>
      </section>

      <section id="eligibility">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">3. Eligibility</h2>
        <p className="mb-4">To use the Platform you must:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            be <strong className="font-semibold text-slate-900">18 years or older</strong> and have
            the legal capacity to enter into a binding contract under South African law;
          </li>
          <li>
            not have been previously suspended or terminated by us for breach of these Terms or any
            related policy;
          </li>
          <li>
            if acting for a business, have authority to bind that business to these Terms.
          </li>
        </ul>
        <p className="mb-4">
          To <strong className="font-semibold text-slate-900">receive payouts</strong> as a hunter,
          you must additionally be a <strong className="font-semibold text-slate-900">South African resident</strong> with
          a South African bank account in your own name. Our escrow partner, TradeSafe Escrow (Pty) Ltd,
          disburses funds only to verified South African bank accounts. Non-resident brands may fund
          bounties subject to our escrow partner's acceptance of their payment method.
        </p>
        <p className="mb-4">
          We may require identity verification (including know-your-client checks through our escrow
          partner) before enabling payouts or releasing funds, in line with the Financial Intelligence
          Centre Act 38 of 2001 and our escrow partner's onboarding requirements.
        </p>
      </section>

      <section id="accounts">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">4. Accounts</h2>
        <p className="mb-4">
          <strong className="font-semibold text-slate-900">One person, one account.</strong> You
          may hold a single individual account on the Platform. A natural person may additionally
          act for one or more brands as a brand administrator; your individual account and your
          administrative access to a brand are governed by the same credentials.
        </p>
        <p className="mb-4">
          You are responsible for keeping your login credentials secure and for all activity on your
          account. If you believe your account has been accessed without your permission, email{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.legal}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.legal}
          </a>{' '}
          immediately so we can suspend the account.
        </p>
        <p className="mb-4">
          You must provide accurate information during signup and keep it current. Impersonating
          another person, creating multiple accounts to circumvent our rules, or sharing an account
          with a person who would not themselves be eligible all breach these Terms.
        </p>
      </section>

      <section id="roles">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          5. Roles on the platform
        </h2>
        <p className="mb-4">The Platform connects three kinds of participant:</p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          5.1 Brands
        </h3>
        <p className="mb-4">
          A <strong className="font-semibold text-slate-900">brand</strong> is a business, agency,
          or individual that posts a bounty — a brief with a defined reward — and funds it in advance.
          Brands approve or reject completed submissions and decide which submissions earn a payout.
          A brand is acting in the course of its trade and is generally not a "consumer" under the
          Consumer Protection Act 68 of 2008 (<strong className="font-semibold text-slate-900">CPA</strong>),
          unless the brand is a juristic person with an annual turnover below R2 million.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          5.2 Hunters
        </h3>
        <p className="mb-4">
          A <strong className="font-semibold text-slate-900">hunter</strong> is a natural person who
          claims a bounty, produces the content the brief asks for, and submits proof of delivery
          through the Platform. Hunters are treated as{' '}
          <strong className="font-semibold text-slate-900">consumers under the CPA</strong> in
          respect of their use of the Platform, and the protections of the CPA apply in full (see
          clause 17).
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          5.3 Social Bounty
        </h3>
        <p className="mb-4">
          Social Bounty is a <strong className="font-semibold text-slate-900">facilitator</strong> —
          we provide the software, verification, payment-orchestration, and dispute channels that
          let brands and hunters transact with each other. We are{' '}
          <strong className="font-semibold text-slate-900">not</strong> the buyer of the hunter's
          content, not the employer of the hunter, not a party to any contract the brand forms with
          its own downstream audiences, and not a custodian of the funds in play. In the
          three-party escrow arrangement with TradeSafe Escrow (Pty) Ltd we act as{' '}
          <strong className="font-semibold text-slate-900">AGENT</strong> (see clause 9).
        </p>
      </section>

      <section id="bounties">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">6. Bounties</h2>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          6.1 What a brand must do
        </h3>
        <p className="mb-4">A brand creating a bounty agrees:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            to write an <strong className="font-semibold text-slate-900">accurate, complete, and
            lawful brief</strong> — including channel, format, reward, duration, eligibility filters,
            content rules, and any post-visibility requirement;
          </li>
          <li>
            to <strong className="font-semibold text-slate-900">fund the bounty in full</strong> via
            our escrow partner before the bounty goes live — bounties do not accept submissions
            until the funding deposit is confirmed;
          </li>
          <li>
            to review submitted work within the response window stated in the brief (and in any
            event within a reasonable time);
          </li>
          <li>
            not to use the Platform to procure content that is unlawful, misleading in a way that
            breaches the CPA's marketing provisions, or that infringes the rights of third parties.
          </li>
        </ul>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          6.2 What a hunter must do
        </h3>
        <p className="mb-4">A hunter claiming a bounty agrees:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            that the submission is <strong className="font-semibold text-slate-900">your own original
            work</strong>, or that you have all licences and permissions needed for the content you
            include in it;
          </li>
          <li>
            to follow the brief (channel, format, required hashtags, tags, or mentions);
          </li>
          <li>
            to comply with our{' '}
            <Link
              href="/legal/acceptable-use"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Acceptable Use Policy
            </Link>{' '}
            and the content policies of the host platform the content is posted on;
          </li>
          <li>
            if the bounty has a <strong className="font-semibold text-slate-900">post-visibility
            requirement</strong>, to keep the post publicly accessible for the duration stated in
            the brief (see clause 12).
          </li>
        </ul>
      </section>

      <section id="submissions-and-licence">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          7. Submissions & content licence
        </h2>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          7.1 You keep ownership
        </h3>
        <p className="mb-4">
          Copyright and all other intellectual-property rights in a submission remain with the
          hunter (or their licensors). Submitting a bounty does not transfer ownership of your work
          to Social Bounty or to the brand.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          7.2 Licence to Social Bounty and the brand
        </h3>
        <p className="mb-4">
          When you submit content through the Platform, you grant a{' '}
          <strong className="font-semibold text-slate-900">worldwide, non-exclusive, royalty-free,
          sublicensable licence</strong> to:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-slate-900">{LEGAL_ENTITY.registeredName}</strong>,
            for the purpose of operating the Platform, verifying your submission, displaying it in
            your account and in the brand's review tooling, and for internal analytics, audit, and
            dispute handling;
          </li>
          <li>
            <strong className="font-semibold text-slate-900">the brand that posted the bounty</strong>,
            for the specific commercial purpose described in the bounty brief — including the
            campaign or promotion the brand named in the brief, for the duration and territory
            stated or reasonably implied by it.
          </li>
        </ul>
        <p className="mb-4">
          This licence is granted <strong className="font-semibold text-slate-900">in writing</strong> for
          purposes of section 22(3) of the Copyright Act 98 of 1978: these Terms, together with the
          brief and your act of submission, are the written record of the licence.
        </p>
        <p className="mb-4">
          The brand's use of your content beyond the scope described in its own brief requires your
          separate written consent and typically a separate fee — that is a matter between you and
          the brand.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          7.3 AI training — our position
        </h3>
        <p className="mb-4">
          We do not use user submissions to train generative artificial-intelligence models,
          whether our own or third parties'. The licence in clause 7.2 is limited to the operational
          purposes described there and does not extend to model training.
        </p>
        <p className="mb-4">
          If we ever propose to use submissions for model training, we will change this clause, give
          you notice under clause 1, and offer an opt-out or renewed opt-in as required by the CPA
          and POPIA.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          7.4 Warranty of originality
        </h3>
        <p className="mb-4">
          You warrant that each submission is your own original work (or that you have all necessary
          licences for anything in it that is not), does not infringe the intellectual-property or
          privacy rights of anyone, and does not defame anyone. You indemnify us and the brand
          against third-party claims arising from a breach of that warranty, subject to the liability
          limits in clause 18.
        </p>
      </section>

      <section id="fees">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          8. Fees & charges
        </h2>
        <p className="mb-4">
          Social Bounty charges three platform fees on every bounty. All figures are in South
          African Rand (ZAR) and are disclosed on-screen before a brand confirms a bounty and before
          a hunter accepts one.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          8.1 Brand-side charges
        </h3>
        <p className="mb-4">
          On top of the face-value reward, the brand pays:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            a <strong className="font-semibold text-slate-900">15% brand admin fee</strong> (Free
            plan) — reduced on paid plans;
          </li>
          <li>
            a <strong className="font-semibold text-slate-900">5% transaction fee</strong>;
          </li>
          <li>
            a <strong className="font-semibold text-slate-900">3.5% global platform fee</strong>,
            charged as a separate line item.
          </li>
        </ul>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          8.2 Hunter-side deductions
        </h3>
        <p className="mb-4">
          From the face-value reward, the hunter has deducted:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            a <strong className="font-semibold text-slate-900">20% hunter commission</strong> (Free
            plan) — reduced on paid plans;
          </li>
          <li>
            the same <strong className="font-semibold text-slate-900">3.5% global platform fee</strong>.
          </li>
        </ul>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          8.3 Worked example — a R1,000 bounty on Free plans
        </h3>
        <p className="mb-4">
          For a bounty with a face-value reward of R1,000:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            The <strong className="font-semibold text-slate-900">brand is charged R1,235.00</strong>{' '}
            at checkout (R1,000 reward + R150 admin fee + R50 transaction fee + R35 global platform
            fee).
          </li>
          <li>
            The <strong className="font-semibold text-slate-900">hunter receives R765.00</strong> on
            payout (R1,000 less R200 commission less R35 global platform fee).
          </li>
          <li>
            Total platform take on the gross bounty value is{' '}
            <strong className="font-semibold text-slate-900">43.5%</strong>.
          </li>
          <li>
            Payment-processing or banking charges levied by our escrow partner or the paying bank
            are passed through at cost and disclosed at checkout.
          </li>
        </ul>
        <p className="mb-4">
          Plan-tier reductions (currently Pro Hunter / Pro Brand) may lower the commission or admin
          fee, but the 3.5% global platform fee applies to every transaction regardless of plan. The
          plan in force at the moment of bounty funding (for the brand) and at the moment of
          submission approval (for the hunter) is recorded on the transaction and is not changed by
          subsequent plan changes.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          8.4 VAT status
        </h3>
        <p className="mb-4">
          {LEGAL_ENTITY.registeredName} is{' '}
          <strong className="font-semibold text-slate-900">
            not currently registered for Value-Added Tax
          </strong>{' '}
          under the Value-Added Tax Act 89 of 1991, as our taxable supplies are below the R1 million
          compulsory-registration threshold. No VAT is charged on our fees and no VAT invoices are
          issued. If our turnover reaches the threshold we will register and give at least 30 days'
          notice before any VAT is added.
        </p>
      </section>

      <section id="custody">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          9. Custody of funds
        </h2>
        <p className="mb-4">
          <strong className="font-semibold text-slate-900">
            Bounty funds are held in escrow by TradeSafe Escrow (Pty) Ltd
          </strong>{' '}
          (<strong className="font-semibold text-slate-900">TradeSafe</strong>), a registered South
          African digital-escrow service. Funds move from the brand to the hunter via TradeSafe's
          escrow account. Social Bounty{' '}
          <strong className="font-semibold text-slate-900">does not take custody</strong> of the
          funds at any point, and bounty funds are not held in Social Bounty's own bank account.
        </p>
        <p className="mb-4">
          In TradeSafe's three-party model, the{' '}
          <strong className="font-semibold text-slate-900">brand is the BUYER</strong>, the{' '}
          <strong className="font-semibold text-slate-900">hunter is the SELLER</strong>, and{' '}
          <strong className="font-semibold text-slate-900">Social Bounty is the AGENT</strong> on
          the transaction. As AGENT we instruct TradeSafe to release funds from escrow to the
          hunter when the brand approves the submission; we do not receive, hold, or re-transmit the
          funds ourselves.
        </p>
        <p className="mb-4">
          TradeSafe's own service terms apply to the holding and release of funds in escrow. Full
          payout mechanics, payment methods, clearance times, and refund paths are set out in our{' '}
          <Link
            href="/legal/escrow-terms"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Payout & Escrow Terms
          </Link>
          . You can read TradeSafe's service terms at{' '}
          <a
            href={LEGAL_ENTITY.paymentPartner.url}
            className="text-pink-600 hover:text-pink-700 font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            tradesafe.co.za
          </a>
          .
        </p>
      </section>

      <section id="verification">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          10. Verification
        </h2>
        <p className="mb-4">
          To keep bounties honest, we verify submissions automatically where the bounty brief
          contains checkable rules (follower thresholds, required hashtags, required mentions, post
          format, engagement floors, and the like). Automated verification is performed by{' '}
          <strong className="font-semibold text-slate-900">Apify</strong>, a third-party
          social-media-scraping processor operating outside South Africa.
        </p>
        <p className="mb-4">
          Verification reads only information that the content platform makes publicly available,
          uses it to check the specific rules in the brief, and writes the result (pass, fail, with
          reasons) to your submission record. Details of this cross-border processing and the
          safeguards we apply under section 72 of POPIA are in our{' '}
          <Link
            href="/legal/privacy-policy"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <p className="mb-4">
          Automated verification is a first-pass filter, not a judgement. A failed check may reflect
          a transient issue with the scrape (platform rate limits, caching, a private account toggle)
          rather than a real breach of the brief. You can request a human re-review through the
          submission details page, and the brand retains the final decision on approval.
        </p>
      </section>

      <section id="approval-and-payout">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          11. Approval & payout
        </h2>
        <p className="mb-4">
          A submission moves to the brand's review queue once every required proof URL has been
          verified or manually reviewed. The brand then approves, rejects, or returns the submission
          with feedback. Only an approved submission earns a payout.
        </p>
        <p className="mb-4">
          On approval, Social Bounty instructs TradeSafe to release the hunter's net earnings from
          escrow to the hunter's registered bank account. TradeSafe's own settlement window applies.
          A clearance period set out in the hunter's plan may delay release — current plan terms are
          published on the Platform.
        </p>
        <p className="mb-4">
          If a brand does not review a submission within the response window stated in the bounty
          brief, we may escalate the submission to our review team and, where the submission
          objectively meets the brief, approve it on the brand's behalf. That escalation path is a
          fallback, not a substitute for timely review; brands that repeatedly miss response windows
          may have their posting rights suspended.
        </p>
      </section>

      <section id="post-visibility">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          12. Post visibility & auto-refund
        </h2>
        <p className="mb-4">
          Some bounty briefs require the hunter's post to stay publicly accessible for a defined
          duration after approval (for example "must remain live for 30 days"). Where that rule
          applies, it is disclosed in the brief and the hunter accepts it by claiming the bounty.
        </p>
        <p className="mb-4">
          We re-check the live post on a schedule after approval. If our scheduled re-checks find
          that the post is no longer publicly accessible on{' '}
          <strong className="font-semibold text-slate-900">
            two consecutive occasions at least six hours apart
          </strong>
          , and neither re-check was during a known third-party outage, we may treat the post as
          taken down and automatically reverse the payout back to the brand. We will notify both
          the brand and the hunter by email before and at the point of reversal, write a full audit
          record of the decision, and (where applicable) move the funds via a compensating ledger
          entry.
        </p>
        <p className="mb-4">
          The hunter may dispute an automatic reversal through our{' '}
          <Link
            href="/legal/complaints"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            complaints process
          </Link>
          . Where the underlying check was a false positive (for example the post is live but the
          scraper could not reach it), we reinstate the payout.
        </p>
      </section>

      <section id="reversals">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          13. Reversals & corrections
        </h2>
        <p className="mb-4">
          Social Bounty may reverse, hold, or re-route a payout in any of the following situations:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-slate-900">Financial Kill Switch.</strong> During
            a financial-integrity incident (suspected duplicate postings, reconciliation drift, or
            webhook storms) we may pause all payouts until the underlying cause is understood and
            corrected.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Auto-refund on post removal.</strong>{' '}
            As set out in clause 12.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Super-admin override.</strong> A
            super-admin may post a compensating ledger entry to correct a balance error, recover a
            mis-directed payout, or comply with a lawful demand. These overrides require a typed
            confirmation and a written reason, and are recorded in the platform audit log.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Dispute resolution.</strong> Where a
            dispute is decided in the brand's favour after review, the escrow release for that
            submission may be reversed.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Suspected breach.</strong> Where we
            reasonably suspect fraud, breach of these Terms, or breach of our Acceptable Use Policy,
            we may hold a payout pending investigation.
          </li>
        </ul>
        <p className="mb-4">
          Every reversal or correction is written to the audit log and, where it affects you, is
          communicated to you by email with a short reason and a link to raise a complaint. We do
          not adjust balances silently.
        </p>
      </section>

      <section id="acceptable-use">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          14. Acceptable use
        </h2>
        <p className="mb-4">
          You must not use the Platform to: post or promote unlawful content; harass, stalk, or
          defame another person; circumvent Platform verification (including by buying followers,
          views, or likes); use automated tools to scrape, replay, or reverse-engineer Platform
          functionality; or do anything that breaches applicable law in South Africa or the
          jurisdiction where the content is hosted.
        </p>
        <p className="mb-4">
          The full list of prohibitions and our enforcement escalations is in the{' '}
          <Link
            href="/legal/acceptable-use"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Acceptable Use Policy
          </Link>
          . A breach of that policy is a breach of these Terms.
        </p>
      </section>

      <section id="intellectual-property">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          15. Intellectual property
        </h2>
        <p className="mb-4">
          All rights in the Platform itself — including the software, database structure,
          user-interface design, Social Bounty word marks, and related branding — belong to{' '}
          {LEGAL_ENTITY.registeredName} or our licensors. Nothing in these Terms transfers those
          rights to you. You may use the Platform only for the purposes contemplated by these Terms.
        </p>
        <p className="mb-4">
          If you believe content on the Platform infringes your copyright, follow the process in our{' '}
          <Link
            href="/legal/ip-policy"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            IP & Copyright Takedown Policy
          </Link>
          . Valid takedown notices are actioned in line with ECTA section 77 (ISP liability
          limitation) and our internal escalation timelines.
        </p>
      </section>

      <section id="suspension-and-termination">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          16. Suspension & termination
        </h2>
        <p className="mb-4">
          We may suspend or terminate your account, withhold a payout, or remove a bounty if we
          reasonably conclude that you have materially breached these Terms, our Acceptable Use
          Policy, or applicable law — including where the underlying conduct is identified through
          our verification pipeline, a third-party report, or an order from a competent authority.
        </p>
        <p className="mb-4">
          Where a breach is deliberate, fraudulent, or repeat-offending, any rewards earned through
          the breaching conduct may be <strong className="font-semibold text-slate-900">forfeited</strong>{' '}
          and refunded to the affected brand. Forfeiture does not affect amounts owed to innocent
          third parties and is not applied to good-faith hunters whose submissions were objectively
          compliant.
        </p>
        <p className="mb-4">
          You may close your account at any time from your account settings or by emailing{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.legal}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.legal}
          </a>
          . Closure does not affect amounts already owed, reporting obligations we have in respect
          of past transactions, or the audit retention periods in clause 20.
        </p>
        <p className="mb-4">
          Suspended or terminated users may appeal through our{' '}
          <Link
            href="/legal/complaints"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            complaints process
          </Link>
          .
        </p>
      </section>

      <section id="disputes">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          17. Disputes & governing law
        </h2>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          17.1 Talk to us first
        </h3>
        <p className="mb-4">
          We try to resolve disputes informally. Before starting any formal proceeding, email us at{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.complaints}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.complaints}
          </a>{' '}
          with a short description of the issue and what you want us to do about it. We commit to
          the response timelines in our{' '}
          <Link
            href="/legal/complaints"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Complaints & Dispute Resolution
          </Link>{' '}
          policy.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          17.2 CPA acknowledgement (hunters and other consumers)
        </h3>
        <p className="mb-4">
          If you use the Platform as a natural person for your own purposes, you are a{' '}
          <strong className="font-semibold text-slate-900">consumer</strong> under the CPA and you
          have the rights the CPA gives you. Nothing in these Terms waives, limits, or deprives you
          of those rights. You remain free to lodge a complaint with the{' '}
          <strong className="font-semibold text-slate-900">
            National Consumer Commission
          </strong>{' '}
          (<a
            href={LEGAL_ENTITY.nationalConsumerCommission.url}
            className="text-pink-600 hover:text-pink-700 font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            thencc.gov.za
          </a>) under section 52 of the CPA, and that right cannot be contracted out.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          17.3 Arbitration is voluntary
        </h3>
        <p className="mb-4">
          We offer private arbitration as a{' '}
          <strong className="font-semibold text-slate-900">voluntary alternative</strong> to
          litigation, by mutual agreement and at our cost, through the Arbitration Foundation of
          Southern Africa or a comparable body. You are not required to arbitrate. If arbitration is
          not agreed, or if the dispute is unsuitable for arbitration, either party may pursue the
          matter in court.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          17.4 Governing law & jurisdiction
        </h3>
        <p className="mb-4">
          These Terms are governed by the laws of the Republic of South Africa. Subject to clause
          17.2, the parties consent to the{' '}
          <strong className="font-semibold text-slate-900">
            {LEGAL_ENTITY.governingLawDivision}
          </strong>{' '}
          as the court of first instance for any dispute that is not resolved informally or by
          arbitration.
        </p>
      </section>

      <section id="warranties-and-liability">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          18. Warranties & liability
        </h2>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          18.1 Facilitator warranties
        </h3>
        <p className="mb-4">
          We take reasonable care to run the Platform competently, keep it secure, and make the
          features described on it available in substance. We do not warrant that the Platform will
          be uninterrupted, error-free, free of third-party service failures, or that every
          automated verification will agree with every human review. Read our full{' '}
          <Link
            href="/legal/disclaimer"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Disclaimer
          </Link>{' '}
          for the detail.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          18.2 Liability cap
        </h3>
        <p className="mb-4">
          To the extent permitted by law, our total aggregate liability to any one user for all
          claims arising out of or in connection with the Platform in any rolling 12-month period is
          limited to the{' '}
          <strong className="font-semibold text-slate-900">
            greater of ZAR 10,000 (ten thousand Rand) and the fees actually paid to Social Bounty by
            that user in the preceding 12 months
          </strong>
          .
        </p>
        <p className="mb-4">
          We are not liable for indirect, special, consequential, or purely economic loss (including
          lost profit, lost marketing impact, or reputational harm) however arising. We are always
          liable for loss caused by our gross negligence, wilful misconduct, or fraud, and for any
          liability that cannot be limited by law.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          18.3 Consumer rights preserved
        </h3>
        <p className="mb-4">
          For hunters and other users who are consumers under the CPA, the liability cap in 18.2 does
          not apply where the CPA prescribes a different — and more favourable — outcome. Sections
          51 and 55–57 of the CPA (safe and quality services, implied warranties) apply with full
          force, and we do not purport to disclaim them.
        </p>
      </section>

      <section id="force-majeure">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          19. Force majeure
        </h2>
        <p className="mb-4">
          Neither party is liable for delay or failure in performance caused by events outside its
          reasonable control, including natural disaster, war, strike or industrial action, pandemic
          (including its mitigation measures),{' '}
          <strong className="font-semibold text-slate-900">
            load-shedding or other grid instability
          </strong>
          , failures of major telecoms or cloud providers, failures of the escrow partner or banking
          system, and lawful acts of government or a regulator. The affected party will give prompt
          notice and use reasonable efforts to mitigate and resume performance.
        </p>
      </section>

      <section id="general">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">20. General</h2>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          20.1 Entire agreement
        </h3>
        <p className="mb-4">
          These Terms, together with the other documents referenced in them — our Privacy Policy,
          Acceptable Use Policy, Payout & Escrow Terms, Complaints & Dispute Resolution policy,
          Consumer Rights notice, IP & Copyright Takedown Policy, and Disclaimer — are the entire
          agreement between you and {LEGAL_ENTITY.registeredName} on their subject matter.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          20.2 Severability
        </h3>
        <p className="mb-4">
          If any clause is held by a competent court or regulator to be invalid or unenforceable,
          the remaining clauses continue in force. Where possible the offending clause is read down
          to the extent needed to remove the defect.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          20.3 Assignment
        </h3>
        <p className="mb-4">
          You may not assign your rights under these Terms without our written consent. We may
          assign ours to a successor in the business (for example on a corporate restructure or
          sale), provided we give you notice and the successor accepts these Terms.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          20.4 Notice & address for service
        </h3>
        <p className="mb-4">
          Our address for formal service of legal notices (
          <em>domicilium citandi et executandi</em>) is our registered office:{' '}
          {LEGAL_ENTITY.registeredAddress.formatted}. Notices to you are sent to the email on your
          account. Notices are deemed received on the business day after sending.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          20.5 Relationship of the parties
        </h3>
        <p className="mb-4">
          Nothing in these Terms makes you and {LEGAL_ENTITY.registeredName} partners, joint
          venturers, employer and employee, or principal and agent in any sense beyond the AGENT
          role described in clause 9 for the narrow purpose of escrow with TradeSafe. Each party
          acts as an independent contractor in its dealings with the other.
        </p>
        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          20.6 Record retention
        </h3>
        <p className="mb-4">
          We retain financial records for at least five years from the date of the transaction (or
          longer where the Tax Administration Act 28 of 2011 or another Act requires), and
          account-lifecycle records for as long as your account is active plus a reasonable tail for
          dispute and regulatory purposes. See the Privacy Policy for detail.
        </p>
      </section>

      <section id="contact">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">21. Contact</h2>
        <p className="mb-4">
          Questions about these Terms? Email us at{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.legal}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.legal}
          </a>{' '}
          or write to us at {LEGAL_ENTITY.registeredAddress.formatted}.
        </p>
      </section>
    </LegalDocLayout>
  );
}
