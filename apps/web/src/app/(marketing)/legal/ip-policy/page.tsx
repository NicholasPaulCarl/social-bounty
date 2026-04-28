import { LegalDocLayout } from '@/components/legal/LegalDocLayout';
import { LEGAL_ENTITY, LEGAL_EFFECTIVE_DATE, LEGAL_VERSION } from '@/content/legal/entity';
import Link from 'next/link';

export const metadata = {
  title: 'IP & Copyright Takedown Policy — Social Bounty',
  description:
    'How to report content on Social Bounty that infringes your copyright or other intellectual property.',
};

const TOC = [
  { id: 'our-policy', label: 'Our policy' },
  { id: 'scope', label: 'Scope and legal framework' },
  { id: 'who-can-file', label: 'Who can file a notice' },
  { id: 'what-a-valid-notice-contains', label: 'What a valid notice contains' },
  { id: 'how-to-submit', label: 'How to submit a notice' },
  { id: 'what-happens-next', label: 'What happens next' },
  { id: 'counter-notice', label: 'Counter-notice' },
  { id: 'repeat-infringer', label: 'Repeat infringer policy' },
  { id: 'false-notices', label: 'False notices' },
  { id: 'trade-marks-and-other-ip', label: 'Trade marks and other IP' },
  { id: 'other-disputes', label: 'Other disputes (defamation, privacy)' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'contact', label: 'Contact' },
];

export default function IpPolicyPage() {
  return (
    <LegalDocLayout
      title="IP & Copyright Takedown Policy"
      category="Platform Rules"
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      lastUpdated={LEGAL_EFFECTIVE_DATE}
      version={LEGAL_VERSION}
      summary="How to report content on Social Bounty that infringes your copyright or other intellectual property, and the procedure we follow to investigate and act on notices."
      toc={TOC}
    >
      <section id="our-policy">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          1. Our policy
        </h2>
        <p className="mb-4">
          {LEGAL_ENTITY.registeredName} (registration number {LEGAL_ENTITY.cipcRegNumber}) respects
          the intellectual property (<strong className="font-semibold text-text-primary">IP</strong>) rights of others and expects the
          users of {LEGAL_ENTITY.domain} (the <strong className="font-semibold text-text-primary">Platform</strong>) to do the same. We
          remove content that is shown, through a valid notice and our own review,
          to infringe the IP rights of another person. We terminate the accounts
          of users who repeatedly infringe.
        </p>
        <p className="mb-4">
          This policy sets out the notice-and-takedown procedure we follow. It is
          the primary route for reporting copyright infringement and trade-mark
          misuse. Content that does not implicate IP — for example, defamation,
          privacy, or personality-right claims — should be reported through our{' '}
          <Link href="/legal/complaints" className="text-pink-600 hover:text-pink-700 font-medium">
            Complaints & Dispute Resolution
          </Link>{' '}
          process instead. See <a href="#other-disputes" className="text-pink-600 hover:text-pink-700 font-medium">Other disputes</a> below.
        </p>
      </section>

      <section id="scope">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          2. Scope and legal framework
        </h2>
        <p className="mb-4">
          This policy applies to content hosted on the Platform. We do not host
          the underlying social-media posts published on Instagram, TikTok,
          Facebook, X, or other third-party platforms; infringement in those posts
          must be reported through the applicable third-party platform's own
          notice procedure. We can, however, remove references to infringing posts
          within bounty submissions and accompanying material stored on the
          Platform.
        </p>
        <p className="mb-4">
          The policy is drafted to align with:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            the <strong className="font-semibold text-text-primary">Copyright Act 98 of 1978</strong>, which confers and governs copyright
            in South Africa;
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Chapter XI of the Electronic Communications and Transactions Act 25 of 2002</strong>{' '}
            (<strong className="font-semibold text-text-primary">ECTA</strong>), in particular sections 77 to 79, which describe the
            take-down notice procedure and the limitations on service-provider
            liability that follow from complying with it;
          </li>
          <li>
            the <strong className="font-semibold text-text-primary">Trade Marks Act 194 of 1993</strong>, for trade-mark claims; and
          </li>
          <li>
            common-law principles of passing off, unlawful competition, and breach
            of confidence for adjacent claims.
          </li>
        </ul>
        <p className="mb-4">
          Where we qualify for the intermediary limitations in ECTA Chapter XI, we
          rely on them.
        </p>
      </section>

      <section id="who-can-file">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          3. Who can file a notice
        </h2>
        <p className="mb-4">
          A notice may be filed by:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>the owner of the IP right that is said to have been infringed; or</li>
          <li>
            a person authorised to act on the owner's behalf (for example, an
            attorney, a licensing agent, or an in-house legal officer).
          </li>
        </ul>
        <p className="mb-4">
          The person submitting the notice must have a genuine, good-faith belief
          that the identified use is not authorised by the owner, its agent, or
          the law (for example, by a statutory exception such as fair dealing
          under section 12 of the Copyright Act).
        </p>
      </section>

      <section id="what-a-valid-notice-contains">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          4. What a valid notice contains
        </h2>
        <p className="mb-4">
          To be processed as a valid take-down notice under section 77(1) of ECTA,
          your notice must include all of the following. Notices that are missing
          required elements will be rejected with guidance on what to add.
        </p>
        <ol className="list-decimal pl-6 mb-4 space-y-2">
          <li>
            <strong className="font-semibold text-text-primary">Your identity.</strong> Your full legal name, postal address, email
            address, and a telephone number where we can reach you during business
            hours.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Signature.</strong> A written or digital signature. A typed full name
            at the end of the notice is acceptable as an ordinary electronic
            signature in terms of section 13(1) of ECTA.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Identification of the work.</strong> A clear description of the copyrighted
            work or other IP that you say has been infringed — for example, "the
            photograph titled <em>Lightfall</em>, first published 14 June 2024 on my
            Instagram profile @example, a copy of which is attached". Attaching a
            copy (or providing a URL where the original can be seen) helps.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Identification of the infringing material and its location on the Platform.</strong>{' '}
            Enough information for us to find the material and understand why it
            infringes. Useful identifiers include the bounty ID, the submission
            ID, the URL of the relevant page on {LEGAL_ENTITY.domain}, or, where
            the material is referred to from an external post, the external URL
            and the Platform artefact that embeds or stores it.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Statement of good-faith belief.</strong> A statement that you have a
            good-faith belief that the identified use is not authorised by the
            owner, its agent, or the law.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Statement of accuracy and authority.</strong> A statement that the
            information in the notice is accurate and that, under penalty of
            perjury, you are the owner of the IP right in question or are
            authorised to act on the owner's behalf.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Contact for counter-notice correspondence.</strong> The email address you
            want us to use if the user whose content is being removed files a
            counter-notice.
          </li>
        </ol>
        <p className="mb-4">
          A single-page email that works through the list above, attaches any
          exhibits, and is signed with your typed name is usually enough. You do
          not need a formal affidavit to start the process, but we may ask for one
          later where the matter is contested.
        </p>
      </section>

      <section id="how-to-submit">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          5. How to submit a notice
        </h2>
        <p className="mb-4">
          <strong className="font-semibold text-text-primary">Primary channel (email):</strong>{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.takedown}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.takedown}
          </a>
          . Use a subject line beginning with "IP take-down notice" so the notice
          is routed correctly.
        </p>
        <p className="mb-4">
          <strong className="font-semibold text-text-primary">Postal alternative:</strong>{' '}
          {LEGAL_ENTITY.registeredName}, attention of the Information Officer,{' '}
          {LEGAL_ENTITY.registeredAddress.formatted}.
        </p>
        <p className="mb-4">
          <strong className="font-semibold text-text-primary">Our timeline commitment.</strong> We aim to acknowledge receipt of
          every notice within two business days, complete an initial review within
          five business days, and act on a notice we have verified as valid —
          removing or disabling access to the identified material — within 48
          hours of verification. Where a notice requires more information, we will
          come back to you promptly.
        </p>
      </section>

      <section id="what-happens-next">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          6. What happens next
        </h2>
        <p className="mb-4">
          When we receive a notice that looks valid on its face, we act
          expeditiously. In practice that means:
        </p>
        <ol className="list-decimal pl-6 mb-4 space-y-2">
          <li>
            <strong className="font-semibold text-text-primary">Validity check.</strong> We confirm that the notice contains the
            elements listed in section 4. Where something is missing or unclear,
            we ask for it.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Removal or disabling of access.</strong> Where the notice is valid on
            its face, we remove or disable access to the identified material. We
            also preserve a copy of the material and its metadata as evidence in
            case the matter escalates.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Notice to the affected user.</strong> We notify the user who uploaded the
            material that we have acted on a take-down notice, provide them with a
            copy of your notice (with any personal-information redactions we are
            obliged to make under POPIA), and tell them how to file a
            counter-notice if they believe the removal was wrong.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Record keeping.</strong> We keep a record of the notice, our
            verification, the action taken, and any subsequent correspondence, for
            the period required by our record-retention policy and in any event
            long enough to meet our obligations under POPIA and ECTA.
          </li>
        </ol>
      </section>

      <section id="counter-notice">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          7. Counter-notice
        </h2>
        <p className="mb-4">
          A user whose content has been taken down has the right to file a
          counter-notice. To be processed, a counter-notice must include:
        </p>
        <ol className="list-decimal pl-6 mb-4 space-y-2">
          <li>the user's full name, postal address, email address, and phone number;</li>
          <li>a signature (a typed name at the end is acceptable);</li>
          <li>identification of the material that was removed and where it was located before removal;</li>
          <li>
            a statement that the user has a good-faith belief that the material
            was removed as a result of a mistake or misidentification — including,
            where relevant, the basis on which the user says the use was
            authorised by the owner, the owner's agent, or the law;
          </li>
          <li>
            a statement consenting to the jurisdiction of the{' '}
            {LEGAL_ENTITY.governingLawDivision} for the purposes of any dispute
            between the user and the complainant relating to the notice and
            counter-notice; and
          </li>
          <li>
            a statement that the information in the counter-notice is accurate.
          </li>
        </ol>
        <p className="mb-4">
          Counter-notices should be sent to the same address as take-down notices
          (
          <a
            href={`mailto:${LEGAL_ENTITY.emails.takedown}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.takedown}
          </a>
          ), with a subject line beginning "IP counter-notice".
        </p>
        <p className="mb-4">
          Where we receive a counter-notice that looks valid on its face, we
          forward it to the original complainant. If, within 10 business days of
          that forwarding, the complainant has not informed us that it has
          commenced legal proceedings seeking to restrain the user from continuing
          the challenged use, we may restore the material. If proceedings have
          been commenced, the material remains down pending the outcome.
        </p>
      </section>

      <section id="repeat-infringer">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          8. Repeat infringer policy
        </h2>
        <p className="mb-4">
          Accounts that are the subject of three or more substantiated take-down
          notices within any rolling 12-month period are terminated. A notice is
          "substantiated" where the material was removed following our review and
          no successful counter-notice was filed, or where the matter was
          otherwise resolved on terms that accept the infringement.
        </p>
        <p className="mb-4">
          Termination may in appropriate cases be applied immediately for a single,
          serious infringement — for example, wholesale copying of a copyrighted
          work, or a pattern of infringement across multiple accounts operated by
          the same person. See the{' '}
          <Link href="/legal/acceptable-use" className="text-pink-600 hover:text-pink-700 font-medium">
            Acceptable Use Policy
          </Link>{' '}
          for the enforcement ladder.
        </p>
      </section>

      <section id="false-notices">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          9. False notices
        </h2>
        <p className="mb-4">
          Section 77(2) of ECTA recognises that a person who makes a materially
          false statement in a take-down notice is liable for any wrongful take
          down. Filing a notice you know to be false — for example, claiming to
          own content you do not own, or sending a notice whose real purpose is to
          suppress a competitor's legitimate content — may expose you to
          liability in damages to the affected user and to us.
        </p>
        <p className="mb-4">
          We reject notices that are clearly malicious, obviously outside the
          scope of our policy (for example, notices that relate solely to third-party
          platforms that we do not host), or submitted in bad faith. Repeat
          bad-faith complainants may be banned from using this procedure.
        </p>
      </section>

      <section id="trade-marks-and-other-ip">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          10. Trade marks and other IP
        </h2>
        <p className="mb-4">
          The procedure above also applies to trade-mark notices. A trade-mark
          notice must, in addition to the items listed in section 4, include:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>the registration number of the relevant trade-mark;</li>
          <li>the class or classes in which it is registered;</li>
          <li>the territory of registration (for example, South Africa);</li>
          <li>the goods or services for which the mark is registered; and</li>
          <li>
            where the claim is common-law passing off rather than registered
            trade-mark infringement, the basis on which the complainant asserts
            reputation, misrepresentation, and damage.
          </li>
        </ul>
        <p className="mb-4">
          The same procedure applies, with necessary adjustments, to claims based
          on registered designs, plant breeders' rights, performers' rights,
          breach of confidence, and unlawful competition.
        </p>
      </section>

      <section id="other-disputes">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          11. Other disputes (defamation, privacy, right of publicity)
        </h2>
        <p className="mb-4">
          This policy is for IP claims. Other types of complaint should be routed
          differently:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-text-primary">Defamation</strong>, insult, or injurious falsehood about you — use our{' '}
            <Link href="/legal/complaints" className="text-pink-600 hover:text-pink-700 font-medium">
              Complaints & Dispute Resolution
            </Link>{' '}
            process, or write to{' '}
            <a
              href={`mailto:${LEGAL_ENTITY.emails.complaints}`}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.emails.complaints}
            </a>
            .
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Privacy and personal-information concerns</strong> — contact our{' '}
            <Link href="/legal/information-officer" className="text-pink-600 hover:text-pink-700 font-medium">
              Information Officer
            </Link>
            .
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Right-of-publicity or personality-right claims</strong> (unauthorised
            use of a person's name or image for commercial purposes) — either the
            complaints route above, or, where the content also implicates
            copyright or trade marks, this take-down procedure.
          </li>
          <li>
            <strong className="font-semibold text-text-primary">Content that breaches the Acceptable Use Policy</strong> (hate speech,
            harassment, and similar) — see the reporting section of the{' '}
            <Link href="/legal/acceptable-use" className="text-pink-600 hover:text-pink-700 font-medium">
              Acceptable Use Policy
            </Link>
            .
          </li>
        </ul>
      </section>

      <section id="limitations">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          12. Limitations
        </h2>
        <p className="mb-4">
          We are not a court. We cannot make binding findings on ownership,
          authorisation, fair dealing, validity of a trade-mark registration, or
          comparable substantive questions. Our notice-and-takedown process is
          about protecting our neutrality as an intermediary and responding fairly
          to credible claims — not about adjudicating a dispute on the merits.
        </p>
        <p className="mb-4">
          Where a notice and a counter-notice describe a genuine dispute and both
          sides appear to have arguable positions, we may preserve the evidence,
          keep the material down pending counter-notice outcome, and invite the
          parties to seek determination from a court of competent jurisdiction.
        </p>
        <p className="mb-4">
          Nothing in this policy constitutes a waiver of any legal right of the
          Platform, the complainant, or the user whose content is the subject of a
          notice, and nothing in this policy constitutes legal advice to any
          party.
        </p>
      </section>

      <section id="contact">
        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-4">
          13. Contact
        </h2>
        <p className="mb-4">
          <strong className="font-semibold text-text-primary">IP take-down notices and counter-notices:</strong>{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.takedown}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.takedown}
          </a>
          .
        </p>
        <p className="mb-4">
          <strong className="font-semibold text-text-primary">General legal enquiries:</strong>{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.legal}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.legal}
          </a>
          .
        </p>
        <p className="mb-4">
          <strong className="font-semibold text-text-primary">Postal address for notices:</strong>{' '}
          {LEGAL_ENTITY.registeredName}, attention of the Information Officer,{' '}
          {LEGAL_ENTITY.registeredAddress.formatted}.
        </p>
        <p className="mb-4">
          Related documents:{' '}
          <Link href="/legal/terms-of-service" className="text-pink-600 hover:text-pink-700 font-medium">
            Terms of Service
          </Link>
          ,{' '}
          <Link href="/legal/acceptable-use" className="text-pink-600 hover:text-pink-700 font-medium">
            Acceptable Use Policy
          </Link>
          ,{' '}
          <Link href="/legal/complaints" className="text-pink-600 hover:text-pink-700 font-medium">
            Complaints & Dispute Resolution
          </Link>
          , and the{' '}
          <Link href="/legal/privacy-policy" className="text-pink-600 hover:text-pink-700 font-medium">
            Privacy Policy
          </Link>
          .
        </p>
      </section>
    </LegalDocLayout>
  );
}
