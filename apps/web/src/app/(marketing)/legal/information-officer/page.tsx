import { LegalDocLayout } from '@/components/legal/LegalDocLayout';
import { LEGAL_ENTITY, LEGAL_EFFECTIVE_DATE, LEGAL_VERSION } from '@/content/legal/entity';
import Link from 'next/link';

export const metadata = {
  title: 'Information Officer & Data Subject Rights — Social Bounty',
  description:
    'Who Social Bounty\'s Information Officer is, and how to exercise your POPIA access, correction, and deletion rights.',
};

const TOC = [
  { id: 'information-officer', label: 'Information Officer' },
  { id: 'your-rights-summary', label: 'Your rights at a glance' },
  { id: 'how-to-request', label: 'How to make a request' },
  { id: 'fees', label: 'Fees' },
  { id: 'refusal-and-appeal', label: 'Refusal and appeal' },
  { id: 'ir-complaint', label: 'Complain to the Information Regulator' },
  { id: 'related-documents', label: 'Related documents' },
];

export default function InformationOfficerPage() {
  return (
    <LegalDocLayout
      title="Information Officer & Data Subject Rights"
      category="POPIA & Data"
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      lastUpdated={LEGAL_EFFECTIVE_DATE}
      version={LEGAL_VERSION}
      summary="The person responsible for data protection at Social Bounty, and a plain-English guide to exercising your POPIA rights to see, correct, or delete the personal information we hold about you."
      toc={TOC}
    >
      <section id="information-officer">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          Who our Information Officer is
        </h2>
        <p className="mb-4">
          Under sections 55 and 56 of the Protection of Personal Information Act 4 of 2013
          (POPIA), every responsible party must appoint an Information Officer. The role carries
          specific statutory duties: encouraging compliance with POPIA, dealing with data-subject
          requests, working with the Information Regulator on investigations, ensuring a Personal
          Information Impact Assessment is done, and developing and updating our internal POPIA
          compliance framework.
        </p>
        <p className="mb-4">
          At Social Bounty, the Information Officer is:
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
              href={`mailto:${LEGAL_ENTITY.informationOfficer.email}`}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.informationOfficer.email}
            </a>
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Postal address:</strong>{' '}
            {LEGAL_ENTITY.registeredAddress.formatted}
          </li>
        </ul>
        <p className="mb-4">
          POPIA makes the head of a private body the Information Officer by default (section
          1(1)(b) of PAIA, read with section 55(1) of POPIA). As{' '}
          {LEGAL_ENTITY.registeredName} is a small owner-managed company, the director holding
          that role is also the acting Information Officer. Registration of the Information
          Officer with the Information Regulator, as required by POPIA Regulation 4(1), has been
          completed (or is in progress — if that status changes we will update this page).
        </p>
        <p className="mb-4">
          We do not currently have a separate Deputy Information Officer. As the platform grows we
          will appoint one and publish their details here.
        </p>
      </section>

      <section id="your-rights-summary">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          Your rights at a glance
        </h2>
        <p className="mb-4">
          POPIA gives you a defined set of rights over the personal information a responsible
          party holds about you. Here they are in plain English.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          The right to know (section 18)
        </h3>
        <p className="mb-4">
          We must tell you what personal information we hold about you, why we collected it, and
          who we share it with. Our{' '}
          <Link
            href="/legal/privacy-policy"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Privacy Policy
          </Link>{' '}
          sets this out in detail and is treated as the section 18 notification for anyone who
          uses the platform.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          The right of access (section 23)
        </h3>
        <p className="mb-4">
          You can ask us whether we hold personal information about you and, if we do, to give you
          a copy. We will tell you what categories of data we hold, the purposes for which we use
          it, who we share it with, and how long we keep it.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          The right to correction and deletion (section 24)
        </h3>
        <p className="mb-4">
          You can ask us to correct personal information that is inaccurate, out of date,
          misleading, or incomplete, and to delete information that is no longer needed or that we
          no longer have authority to keep. We keep some categories — especially financial records
          — for the statutory period the Tax Administration Act 28 of 2011 requires (seven years),
          so a deletion request may be partially fulfilled rather than all-or-nothing.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          The right to data portability (section 25)
        </h3>
        <p className="mb-4">
          Where we process your personal information by automated means on the basis of your
          consent or a contract with you, you can ask us to give you the data in a structured,
          commonly used electronic format (typically JSON or CSV). We will do so for data you
          supplied to us directly.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          The right to object (section 11(3))
        </h3>
        <p className="mb-4">
          You can object to processing based on legitimate interest or direct marketing. We will
          stop unless we have a lawful ground to continue that overrides the objection.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          The right not to be subject to automated decision-making (section 71)
        </h3>
        <p className="mb-4">
          Social Bounty uses automated checks to verify social-post submissions against bounty
          rules. In rare cases — after two consecutive failed post-visibility checks — the
          platform will automatically refund a bounty payout. These are automated decisions that
          may affect you. You can ask us to review any such decision manually by emailing the
          Information Officer, and we will review it promptly. The rules that drive the automatic
          checks are set out in the bounty terms you see before you submit.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          The right to withdraw consent (section 11(2))
        </h3>
        <p className="mb-4">
          Where we process your data on the basis of consent (for example optional analytics
          cookies), you can withdraw consent at any time. Withdrawal does not affect the
          lawfulness of processing we did before you withdrew.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          The right to complain (section 74)
        </h3>
        <p className="mb-4">
          If you think we have mishandled your personal information you can complain to the
          Information Regulator — see the "Complain to the Information Regulator" section below.
        </p>
      </section>

      <section id="how-to-request">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          How to make a request
        </h2>
        <p className="mb-4">
          Send your request by email to{' '}
          <a
            href={`mailto:${LEGAL_ENTITY.emails.dataSubjectRights}`}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            {LEGAL_ENTITY.emails.dataSubjectRights}
          </a>
          . You can use the template below, or write your own — what matters is that we can
          identify you and understand what you are asking for.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Email template
        </h3>
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-slate-800 whitespace-pre-wrap">{`To: ${LEGAL_ENTITY.emails.dataSubjectRights}
Subject: POPIA data-subject request — [Access / Correction / Deletion / Portability / Objection]

Hello,

I am submitting a request under POPIA section [23 / 24 / 25 / 11(3)].

My details:
 - Full name:
 - Email address on my Social Bounty account:
 - User role (Hunter / Brand Admin):

Nature of the request:
 - [Describe what you want — a copy of your data, a specific correction, deletion of a particular
   category of data, etc.]

Preferred format for any records returned: [PDF / JSON / CSV]

Thank you.

[Your name]`}</div>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Information we need to verify your identity
        </h3>
        <p className="mb-4">
          Before releasing personal information we must be satisfied that you are who you say you
          are. In most cases we will ask you to send the request from the email address on your
          account, and to answer one or two questions only you would know (for example, the
          approximate date of your last bounty). For more sensitive requests we may ask for a
          government-issued identity document. We will minimise what we ask for — just enough to
          avoid releasing your data to the wrong person.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Our response time
        </h3>
        <p className="mb-4">
          We will respond within thirty (30) days, as required by POPIA Regulation 3 read with
          section 24 of PAIA (which POPIA adopts for these requests). If the request is complex we
          may extend the period once by a further thirty (30) days; we will tell you if we need
          to.
        </p>

        <h3 className="text-lg font-heading font-semibold text-slate-900 mt-6 mb-3">
          Requests on behalf of someone else
        </h3>
        <p className="mb-4">
          If you are submitting a request on behalf of another person — for example a parent for a
          minor, or an attorney for a client — please attach proof of your authority (birth
          certificate, court order, power of attorney, or signed mandate).
        </p>
      </section>

      <section id="fees">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">Fees</h2>
        <p className="mb-4">
          Your first access, correction, deletion, or portability request in any twelve-month
          period is free. For additional requests, or for requests that are manifestly excessive
          or repetitive, we may charge a reasonable fee to cover the cost of processing the
          request. We will give you a written estimate before we start the work, and you can
          decline or narrow the scope at that point.
        </p>
        <p className="mb-4">
          Objections and consent withdrawals are always free.
        </p>
        <p className="mb-4">
          For records held in paper form or requiring significant retrieval work (for example,
          historical audit records), the fees in the PAIA Regulations apply. See our{' '}
          <Link
            href="/legal/paia-manual"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            PAIA Manual
          </Link>{' '}
          for details.
        </p>
      </section>

      <section id="refusal-and-appeal">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          When we may refuse, and what to do if we do
        </h2>
        <p className="mb-4">
          We may refuse a request in a small number of situations, including:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            We cannot verify your identity with the information you have provided. In that case
            we will ask for additional verification before refusing.
          </li>
          <li>
            The request is manifestly unfounded or excessive (for example the same deletion
            request repeated multiple times with no change in circumstances).
          </li>
          <li>
            Complying would prejudice another person's personal information — for example if
            granting access would disclose information about a third party who has not consented.
          </li>
          <li>
            Complying would compromise an active fraud or abuse investigation, or would require us
            to destroy records we are legally required to retain (such as financial records under
            the Tax Administration Act 28 of 2011).
          </li>
          <li>
            The request falls within one of the grounds for refusal in Chapter 4 of PAIA — see
            our{' '}
            <Link
              href="/legal/paia-manual"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              PAIA Manual
            </Link>{' '}
            for the full list.
          </li>
        </ul>
        <p className="mb-4">
          If we refuse, we will tell you the reason and explain the appeal route. You can ask us
          to reconsider by replying to the refusal with any additional information or reasons,
          and you can escalate to the Information Regulator (see below).
        </p>
      </section>

      <section id="ir-complaint">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          Complain to the Information Regulator
        </h2>
        <p className="mb-4">
          If we have refused a request, failed to respond in time, or in your view mishandled your
          personal information, you may complain to the Information Regulator of South Africa
          under POPIA section 74.
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <strong className="font-semibold text-slate-900">Regulator:</strong>{' '}
            {LEGAL_ENTITY.informationRegulator.name}
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Website:</strong>{' '}
            <a
              href={LEGAL_ENTITY.informationRegulator.url}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.informationRegulator.url}
            </a>
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Email:</strong>{' '}
            <a
              href={`mailto:${LEGAL_ENTITY.informationRegulator.email}`}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {LEGAL_ENTITY.informationRegulator.email}
            </a>
          </li>
        </ul>
        <p className="mb-4">
          The Regulator publishes the complaint form and current procedures on its website. You do
          not need to exhaust our internal route before going to the Regulator, although we would
          appreciate the chance to put things right first. If you would prefer to raise a service
          complaint (rather than a POPIA complaint) with us directly, see our{' '}
          <Link
            href="/legal/complaints"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Complaints & Dispute Resolution
          </Link>{' '}
          page.
        </p>
      </section>

      <section id="related-documents">
        <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
          Related documents
        </h2>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>
            <Link
              href="/legal/privacy-policy"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Privacy Policy
            </Link>{' '}
            — what we collect, why, and how we protect it.
          </li>
          <li>
            <Link
              href="/legal/paia-manual"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              PAIA Manual
            </Link>{' '}
            — your statutory right to request records, and how to do it.
          </li>
          <li>
            <Link
              href="/legal/cookie-policy"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Cookie Policy
            </Link>{' '}
            — what cookies we set and how to control them.
          </li>
          <li>
            <Link
              href="/legal/complaints"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Complaints & Dispute Resolution
            </Link>{' '}
            — non-privacy service complaints.
          </li>
        </ul>
      </section>
    </LegalDocLayout>
  );
}
