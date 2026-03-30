import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Social Bounty',
  description: 'Read the terms and conditions governing your use of the Social Bounty platform.',
};

const SECTIONS = [
  {
    id: 'acceptance',
    heading: 'Acceptance of Terms',
    body: [
      'By accessing or using Social Bounty ("the Platform"), you agree to be bound by these Terms of Service ("Terms") and our Privacy Policy. If you do not agree, you must not use the Platform.',
      'We reserve the right to update these Terms at any time. Continued use of the Platform after changes are posted constitutes acceptance of the revised Terms. We will notify registered users of material changes via email or an in-app notification.',
    ],
  },
  {
    id: 'eligibility',
    heading: 'Eligibility',
    body: [
      'You must be at least 18 years old and capable of forming a legally binding contract to use Social Bounty. By creating an account you represent that you meet these requirements.',
      'The Platform is not available to persons previously removed from Social Bounty or to residents of jurisdictions where the service is prohibited by applicable law.',
    ],
  },
  {
    id: 'account-registration',
    heading: 'Account Registration',
    body: [
      'You must provide accurate, complete, and current information when creating your account. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.',
      'You must notify us immediately of any unauthorised access or suspected breach of your account. Social Bounty is not liable for losses arising from unauthorised use of your credentials.',
      'Each person may hold one account. Creating multiple accounts to circumvent limits, suspensions, or bans is prohibited and may result in permanent removal from the Platform.',
    ],
  },
  {
    id: 'bounty-participation',
    heading: 'Bounty Participation',
    body: [
      'Businesses ("Brands") may create bounties that specify tasks, eligibility requirements, reward amounts, and submission deadlines. Brands are solely responsible for the accuracy and legality of the bounty details they post.',
      'Participants ("Hunters") may submit proof of task completion as required by each bounty. Submissions must be genuine, accurate, and created by the Hunter. Fraudulent, plagiarised, or AI-generated submissions that misrepresent actual task completion are strictly prohibited.',
      'Social Bounty reserves the right to review submissions and to overturn a Brand\'s acceptance decision where fraud or policy violations are identified. Our decision in such cases is final.',
    ],
  },
  {
    id: 'payments-rewards',
    heading: 'Payments & Rewards',
    body: [
      'Brands must fund their bounty reward pool before a bounty goes live. Funds are held in escrow by Social Bounty and released to approved Hunters upon submission acceptance.',
      'Social Bounty charges a platform fee on each successful payout, as disclosed on the pricing page at time of bounty creation. Fees are non-refundable once a payout has been processed.',
      'Hunters are responsible for any taxes applicable to rewards they receive. Social Bounty may be required to collect tax identification information and to report payments to relevant tax authorities in accordance with applicable law.',
      'Disputes regarding payments should be raised within 14 days of the disputed transaction through the in-app dispute resolution centre.',
    ],
  },
  {
    id: 'content-ownership',
    heading: 'Content Ownership',
    body: [
      'You retain ownership of content you submit to the Platform. By submitting content, you grant Social Bounty a worldwide, non-exclusive, royalty-free licence to use, display, and distribute that content for the purpose of operating the Platform.',
      'You grant the Brand who posted the bounty a licence to use your submission for the purpose described in the bounty brief. Any broader usage rights must be negotiated separately between you and the Brand.',
      'Social Bounty does not claim ownership of content you submit and will not sell your submissions to third parties without your consent.',
    ],
  },
  {
    id: 'prohibited-conduct',
    heading: 'Prohibited Conduct',
    body: [
      'You agree not to: (a) submit fraudulent, misleading, or plagiarised content; (b) manipulate platform metrics such as view counts or engagement figures; (c) harass, threaten, or abuse other users; (d) attempt to gain unauthorised access to any part of the Platform or its infrastructure; (e) use automated tools to scrape, crawl, or extract data from the Platform without prior written consent; or (f) use the Platform for any unlawful purpose.',
      'Violation of these prohibitions may result in immediate account suspension or permanent ban, forfeiture of pending rewards, and referral to law enforcement where applicable.',
    ],
  },
  {
    id: 'dispute-resolution',
    heading: 'Dispute Resolution',
    body: [
      'If you have a dispute with another user, you agree to attempt to resolve it directly first. If resolution is not possible, you may escalate through Social Bounty\'s dispute resolution process available in your account dashboard.',
      'For disputes with Social Bounty itself, both parties agree to attempt informal resolution via written notice before initiating any formal proceedings. Unresolved disputes will be submitted to binding arbitration in accordance with the rules of a recognised arbitration body, unless prohibited by applicable law in your jurisdiction.',
      'These Terms are governed by the laws of the jurisdiction in which Social Bounty is incorporated, without regard to conflict of law provisions.',
    ],
  },
  {
    id: 'limitation-of-liability',
    heading: 'Limitation of Liability',
    body: [
      'To the fullest extent permitted by law, Social Bounty and its directors, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Platform.',
      'Our total liability to you for any claim arising under these Terms shall not exceed the greater of the fees you paid to Social Bounty in the twelve months preceding the claim or USD $100.',
      'The Platform is provided "as is" and "as available" without warranties of any kind, express or implied. We do not warrant that the Platform will be uninterrupted, error-free, or free of harmful components.',
    ],
  },
  {
    id: 'modifications',
    heading: 'Modifications to the Service',
    body: [
      'Social Bounty reserves the right to modify, suspend, or discontinue any part of the Platform at any time, with or without notice. We are not liable to you or any third party for any such modification, suspension, or discontinuation.',
      'We will endeavour to provide reasonable notice of significant changes that affect active bounties or pending payouts.',
    ],
  },
  {
    id: 'contact',
    heading: 'Contact',
    body: [
      'If you have questions about these Terms of Service, please contact us through our contact page or email legal@socialbounty.com.',
    ],
    cta: true,
  },
];

export default function TermsPage() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-heading font-bold text-slate-900 mb-3">Terms of Service</h1>
          <p className="text-sm text-slate-400">Last updated: March 2026</p>
          <p className="mt-4 text-slate-600 leading-relaxed">
            These Terms of Service govern your access to and use of the Social Bounty platform.
            Please read them carefully before creating an account or participating in any bounty.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <div key={section.id} id={section.id}>
              <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
                {section.heading}
              </h2>
              <div className="space-y-3">
                {section.body.map((paragraph, i) => (
                  <p key={i} className="text-slate-600 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
              {section.cta && (
                <div className="mt-5">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-pink-600 hover:text-pink-700 transition-colors"
                  >
                    Go to Contact page
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-400 text-center">
            &copy; 2026 Social Bounty. All rights reserved. &mdash;{' '}
            <Link href="/privacy" className="hover:text-pink-500 transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
