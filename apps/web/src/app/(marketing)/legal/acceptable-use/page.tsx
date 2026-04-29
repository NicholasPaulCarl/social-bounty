import { LegalDocLayout } from '@/components/legal/LegalDocLayout';
import { LEGAL_ENTITY, LEGAL_EFFECTIVE_DATE, LEGAL_VERSION } from '@/content/legal/entity';
import Link from 'next/link';

export const metadata = {
  title: 'Acceptable Use Policy — Social Bounty',
  description: 'What you can and cannot do on the Social Bounty platform.',
};

const TOC = [
  { id: 'scope', label: 'Scope' },
  { id: 'general-principles', label: 'General principles' },
  { id: 'prohibited-content', label: 'Prohibited content' },
  { id: 'prohibited-behaviour', label: 'Prohibited behaviour' },
  { id: 'platform-only', label: 'Authenticity of submissions' },
  { id: 'reporting', label: 'Reporting a violation' },
  { id: 'enforcement', label: 'Enforcement' },
  { id: 'appeals', label: 'Appeals' },
  { id: 'law-enforcement', label: 'Law enforcement cooperation' },
  { id: 'related', label: 'Related documents' },
];

export default function AcceptableUsePage() {
  return (
    <LegalDocLayout
      title="Acceptable Use Policy"
      category="Platform Rules"
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      lastUpdated={LEGAL_EFFECTIVE_DATE}
      version={LEGAL_VERSION}
      summary="What you can and cannot do on Social Bounty — the rules that keep the platform safe, fair, and lawful for everyone who uses it."
      toc={TOC}
    >
      <section id="scope">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          1. Scope
        </h2>
        <p className="mb-4">
          This Acceptable Use Policy (<strong className="font-semibold text-text-primary">AUP</strong>) forms part of the{' '}
          <Link href="/legal/terms-of-service" className="text-pink-600 hover:text-pink-700 font-medium">
            Terms of Service
          </Link>{' '}
          of {LEGAL_ENTITY.registeredName} (registration number {LEGAL_ENTITY.cipcRegNumber}, the{' '}
          <strong className="font-semibold text-text-primary">Platform</strong>, <strong className="font-semibold text-text-primary">we</strong>,{' '}
          <strong className="font-semibold text-text-primary">us</strong>, or <strong className="font-semibold text-text-primary">Social Bounty</strong>). It applies
          to every person who accesses or uses {LEGAL_ENTITY.domain}, whether as a brand,
          a hunter (participant), a visitor, an administrator, or any other role.
        </p>
        <p className="mb-4">
          By using the Platform you agree to follow this AUP. If you are using the
          Platform on behalf of a company or other juristic person, you warrant that
          you have authority to bind that entity to these rules. Breach of this AUP
          is a breach of the Terms of Service and may result in the consequences
          described in the <a href="#enforcement" className="text-pink-600 hover:text-pink-700 font-medium">Enforcement</a>{' '}
          section.
        </p>
        <p className="mb-4">
          Capitalised terms not defined here have the meanings given to them in the
          Terms of Service.
        </p>
      </section>

      <section id="general-principles">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          2. General principles
        </h2>
        <p className="mb-4">
          Social Bounty exists so that brands can publish bounty briefs and hunters
          can earn by delivering genuine, high-quality social-media content. The
          rules below follow from three simple principles:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-text-primary">Act in good faith.</strong> Be honest with the brands, hunters, and
            Platform team you interact with. Do not try to game the system.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Respect other people.</strong> Treat fellow users, third parties who
            appear in your content, and the Platform team with basic dignity. No
            harassment, no abuse, no bullying.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Follow the law.</strong> Obey South African law, the law of any
            jurisdiction that applies to you, and the terms of service of any
            third-party platform (Instagram, TikTok, Facebook, X, etc.) that your
            content appears on.
          </li>
        </ul>
        <p className="mb-4">
          If something is not expressly listed below but clearly violates one of
          these principles, we still reserve the right to act on it.
        </p>
      </section>

      <section id="prohibited-content">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          3. Prohibited content
        </h2>
        <p className="mb-4">
          You may not upload, submit, publish, link to, or otherwise make available
          through the Platform any content that:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong className="font-semibold text-text-primary">Is unlawful under South African law</strong> or the law of any
            jurisdiction where the content is produced, hosted, or likely to be
            viewed, including content that breaches the Films and Publications Act
            65 of 1996, the Cybercrimes Act 19 of 2020, or any statute regulating
            advertising, medicines, tobacco, alcohol, gambling, or financial
            services.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Infringes intellectual property rights</strong> of any third party, including
            copyright, trade marks, trade-dress, trade secrets, performers' rights,
            or rights in confidential information. See our{' '}
            <Link href="/legal/ip-policy" className="text-pink-600 hover:text-pink-700 font-medium">
              IP & Copyright Takedown Policy
            </Link>{' '}
            for how we handle infringement reports.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Constitutes child sexual abuse material (CSAM)</strong> in any form, or
            sexualises anyone under the age of 18. We operate a zero-tolerance
            stance: such content will be removed immediately, the offending account
            terminated, and the matter reported to the South African Police Service
            and, where required, preserved and referred under the Films and
            Publications Act and the Cybercrimes Act.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Is hate speech.</strong> Content that advocates hatred based on race,
            ethnicity, gender, religion, sexual orientation, disability, HIV status,
            or any other ground protected under section 9 of the Constitution, and
            that constitutes incitement to cause harm, is prohibited. We apply the
            test set out in section 10 of the Promotion of Equality and Prevention
            of Unfair Discrimination Act 4 of 2000 and relevant Constitutional
            Court authority.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Harasses, bullies, intimidates, or threatens</strong> any person, including
            sustained campaigns, pile-on behaviour, or targeted content intended to
            humiliate.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Doxxes or exposes personal information</strong> of another person
            (including home or work address, private phone number, ID or passport
            number, financial account details, or real name where the person uses a
            pseudonym) without their informed consent and a lawful basis.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Contains malware, phishing links, or malicious code</strong>, including
            keyloggers, credential harvesters, cryptominers, or URLs that redirect
            to any of the above.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Makes misleading brand or product claims</strong>, including unsubstantiated
            health, financial, performance, or endorsement claims. Brands are
            responsible for the factual accuracy of their briefs; hunters are
            responsible for executing briefs honestly.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Depicts a deepfake or synthetic impersonation</strong> of a real, identifiable
            person without their prior written consent. Satire that is clearly
            labelled and does not seek to deceive may be permitted at our
            discretion.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Breaches the terms of service of the target social platform.</strong> A
            bounty brief must be lawful and permissible on the platform where it
            will be published. If Instagram, TikTok, Facebook, or X would remove
            the content under their policies, we treat it as unfit for the Platform.
          </li>
        </ul>
      </section>

      <section id="prohibited-behaviour">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          4. Prohibited behaviour
        </h2>
        <p className="mb-4">
          Beyond prohibited content, the following conduct is not allowed on or
          through the Platform:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong className="font-semibold text-text-primary">Sybil and multi-account fraud.</strong> Creating multiple accounts to
            increase submission limits, circumvent suspensions, manipulate
            reputation, or otherwise evade Platform controls.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Metric manipulation.</strong> Buying, selling, exchanging, or otherwise
            inflating likes, views, comments, followers, or other engagement. Use
            of bots, click farms, or automated engagement services to satisfy
            bounty metric thresholds.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Impersonation.</strong> Pretending to be a brand, another hunter, a member
            of the Platform team, or a public figure. Creating accounts that
            imitate an existing account's name or branding in a manner likely to
            deceive.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Collusion.</strong> Coordinating with a brand reviewer, another hunter, or
            a Platform team member to manipulate approvals, reviews, or payouts.
            Offering or accepting side payments to influence a review decision.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Scraping or unauthorised data extraction.</strong> Using crawlers, automated
            harvesters, or scripted access to extract data from the Platform beyond
            what our public API and product interfaces permit.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Unauthorised access attempts.</strong> Trying to access any account,
            system, or data you are not authorised to access, including probing for
            vulnerabilities without prior written authorisation. This includes
            conduct that would breach sections 2, 3, 5, 6, or 7 of the Cybercrimes
            Act 19 of 2020.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Reverse engineering.</strong> Decompiling, disassembling, or otherwise
            attempting to derive source code from the Platform except to the
            extent expressly permitted by law.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Denial of service.</strong> Conduct intended to degrade, disrupt, or
            overload the Platform, including volumetric attacks, application-layer
            flooding, or deliberate abuse of expensive endpoints.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Rate-limit evasion.</strong> Rotating IPs, spoofing headers, or otherwise
            circumventing Platform rate limits or anti-abuse measures.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Purchasing engagement.</strong> Paying for fake followers, comments, or
            other engagement on accounts used to satisfy bounty requirements.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Using non-consenting third parties.</strong> Featuring identifiable people
            in bounty content (friends, family, minors, bystanders, strangers
            filmed in public) without having obtained the lawful consent or
            release appropriate to the jurisdiction and the use. Minors require a
            parent or guardian's informed consent.
          </li>
        </ul>
      </section>

      <section id="platform-only">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          5. Authenticity of submissions
        </h2>
        <p className="mb-4">
          Social Bounty's value depends on submissions coming from real people
          working with real audiences. The following authenticity rules apply:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            Submissions must originate from the real social-media accounts you
            declared at signup and that are linked to your Platform profile. Content
            published from a different account (for example, one that does not
            match the handles on your profile) will not pass verification and may be
            flagged as fraudulent.
          </li>
          <li>
            You must be the actual operator of the declared accounts. Submitting
            content published by someone else, under someone else's handle, or
            through a re-seller arrangement is not permitted.
          </li>
          <li>
            If the bounty brief requires human-made content (original photography,
            voice-over, on-camera performance, etc.), you may not substitute
            AI-generated content for it.
          </li>
          <li>
            If the bounty brief does not expressly require human-made content, you
            may use AI-generated or AI-assisted content, but you must disclose the
            use of AI inside the submission (for example, by noting "generated with
            AI" in the submission notes) so the brand can make an informed review
            decision. The social platform's own disclosure rules for AI content
            also apply.
          </li>
          <li>
            Edited, composited, or touched-up content is permitted for normal
            creative reasons (colour, sound, pacing). Content edited to misrepresent
            the performance of a post (fake view counts, fabricated metrics, altered
            comments) is not.
          </li>
        </ul>
      </section>

      <section id="reporting">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          6. Reporting a violation
        </h2>
        <p className="mb-4">
          If you see something on the Platform that breaches this AUP, please tell
          us. The more specific your report, the faster we can act.
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-text-primary">General abuse reports:</strong>{' '}
            <a
              href={`mailto:abuse@${LEGAL_ENTITY.domain}`}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              abuse@{LEGAL_ENTITY.domain}
            </a>
            . Until this mailbox is live, please use{' '}
            <a
              href={`mailto:${LEGAL_ENTITY.emails.general}`}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.emails.general}
            </a>{' '}
            with the subject line "Abuse report".
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Intellectual property infringement:</strong> follow our{' '}
            <Link href="/legal/ip-policy" className="text-pink-600 hover:text-pink-700 font-medium">
              IP & Copyright Takedown Policy
            </Link>
            .
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Structured complaints (including CPA-protected rights):</strong>{' '}
            see{' '}
            <Link href="/legal/complaints" className="text-pink-600 hover:text-pink-700 font-medium">
              Complaints & Dispute Resolution
            </Link>
            .
          </li>
          <li>
            <strong className="font-semibold text-text-primary">CSAM or imminent physical-harm threats:</strong> also report
            directly to the South African Police Service (10111) and, where
            appropriate, to the Film and Publication Board. We will cooperate with
            valid law-enforcement process.
          </li>
        </ul>
        <p className="mb-4">
          Useful information to include: the URL or identifier of the offending
          bounty, submission, or profile; a description of the conduct; any
          screenshots or other evidence; and your own contact details in case we
          need to follow up.
        </p>
      </section>

      <section id="enforcement">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          7. Enforcement
        </h2>
        <p className="mb-4">
          We enforce this AUP using a tiered ladder. What action we take depends on
          the severity of the breach, whether it is a first offence, and whether it
          puts other users, the Platform, or third parties at risk.
        </p>
        <ol className="list-decimal pl-6 mb-4 space-y-2">
          <li>
            <strong className="font-semibold text-text-primary">Warning.</strong> For a first or low-severity breach we may issue a
            written warning explaining what is wrong and asking you to correct it
            within a defined timeframe.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Temporary suspension.</strong> We may suspend your account for a defined
            period. Pending submissions may be put on hold; pending rewards may be
            held in escrow until the suspension is lifted.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Termination.</strong> For severe or repeated breaches, or a single breach
            that creates material risk (CSAM, fraud, malware, a serious security
            event), we may terminate your account.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Forfeiture of pending rewards.</strong> Where a submission was obtained
            through fraud, bot engagement, plagiarised or infringing content, or
            other material breach, rewards associated with that submission may be
            forfeited or reversed. Financial penalties and any deduction rights are
            set out in the Terms of Service.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Audit trail.</strong> Every enforcement decision is logged. The audit
            trail records who took the decision, when, why, and what material was
            considered. You may request a copy of the record concerning your own
            account through our{' '}
            <Link href="/legal/information-officer" className="text-pink-600 hover:text-pink-700 font-medium">
              Information Officer
            </Link>
            .
          </li>
        </ol>
      </section>

      <section id="appeals">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          8. Appeals
        </h2>
        <p className="mb-4">
          If you believe an enforcement decision against you was wrong, you have a
          right to appeal. Appeals are handled through our{' '}
          <Link href="/legal/complaints" className="text-pink-600 hover:text-pink-700 font-medium">
            Complaints & Dispute Resolution
          </Link>{' '}
          process. An appeal must be submitted within 30 days of the enforcement
          decision being communicated to you and must explain, briefly, why you
          think the decision was wrong and what outcome you are seeking.
        </p>
        <p className="mb-4">
          Appeals are reviewed by a Platform team member who was not involved in the
          original decision. We aim to respond substantively within 10 business
          days. Where the appeal raises a dispute about a payment, the{' '}
          <Link href="/legal/escrow-terms" className="text-pink-600 hover:text-pink-700 font-medium">
            Payout & Escrow Terms
          </Link>{' '}
          govern the money-movement side while the content question is resolved.
        </p>
      </section>

      <section id="law-enforcement">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          9. Law enforcement cooperation
        </h2>
        <p className="mb-4">
          We cooperate with valid legal process and report to the South African
          Police Service where we are required to do so (for example, suspected
          child sexual abuse material under the Films and Publications Act, or
          reportable cyber-offences under section 54 of the Cybercrimes Act 19 of
          2020 to the extent applicable to us).
        </p>
        <p className="mb-4">
          Beyond mandatory reporting, we disclose user data to a third party
          (including law enforcement) only where we are compelled to do so by a
          court order, subpoena, or other lawful and enforceable instruction, or
          where a narrowly scoped disclosure is necessary to protect a person from
          imminent harm. Routine "information requests" are refused unless
          accompanied by lawful process.
        </p>
        <p className="mb-4">
          Where we receive a lawful disclosure request, we will, where legally
          permitted, notify the affected user before disclosure so they have an
          opportunity to respond. Gag provisions in the request override this
          commitment.
        </p>
      </section>

      <section id="related">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          10. Related documents
        </h2>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <Link href="/legal/terms-of-service" className="text-pink-600 hover:text-pink-700 font-medium">
              Terms of Service
            </Link>{' '}
            — the master agreement between you and the Platform.
          </li>
          <li>
            <Link href="/legal/complaints" className="text-pink-600 hover:text-pink-700 font-medium">
              Complaints & Dispute Resolution
            </Link>{' '}
            — how to raise a formal complaint or appeal.
          </li>
          <li>
            <Link href="/legal/ip-policy" className="text-pink-600 hover:text-pink-700 font-medium">
              IP & Copyright Takedown Policy
            </Link>{' '}
            — how to report copyright or trade-mark infringement.
          </li>
          <li>
            <Link href="/legal/disclaimer" className="text-pink-600 hover:text-pink-700 font-medium">
              Disclaimer
            </Link>{' '}
            — the limits of our role as a facilitator.
          </li>
          <li>
            <Link href="/legal/privacy-policy" className="text-pink-600 hover:text-pink-700 font-medium">
              Privacy Policy
            </Link>{' '}
            — how we handle your personal information under POPIA.
          </li>
        </ul>
        <p className="mb-4">
          Questions about this AUP can be directed to{' '}
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
