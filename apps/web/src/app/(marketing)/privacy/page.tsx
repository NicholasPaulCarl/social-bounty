import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Social Bounty',
  description: 'Learn how Social Bounty collects, uses, and protects your personal data.',
};

const SECTIONS = [
  {
    id: 'information-we-collect',
    heading: 'Information We Collect',
    body: [
      'We collect information you provide directly when you create an account, post a bounty, or submit proof of completion. This includes your name, email address, payment details, and any content you upload to the platform.',
      'We also collect information automatically when you use Social Bounty, such as your IP address, browser type, device identifiers, pages visited, and actions taken on the platform. This data helps us maintain security and improve the experience for all users.',
      'If you connect a third-party account (e.g. Twitter or Instagram) to verify social actions on a bounty, we receive limited profile information from that provider as permitted by your settings with them.',
    ],
  },
  {
    id: 'how-we-use-it',
    heading: 'How We Use Your Information',
    body: [
      'We use your information to operate and improve the Social Bounty platform — including creating and managing your account, processing bounty submissions, facilitating payments, and providing customer support.',
      'We may use your email address to send you transactional notifications (e.g. submission status updates, payout confirmations) and, where you have opted in, product updates and promotional content. You can opt out of marketing emails at any time.',
      'Usage data helps us understand how people interact with the platform so we can fix issues, prioritise features, and prevent fraudulent activity.',
    ],
  },
  {
    id: 'data-sharing',
    heading: 'Data Sharing',
    body: [
      'We do not sell your personal data. We share information only as described in this policy or with your explicit consent.',
      'We work with trusted third-party service providers — including payment processors, cloud infrastructure providers, and analytics services — who access your data only to perform services on our behalf and are bound by confidentiality obligations.',
      'When you complete a bounty, the business that posted it receives your submission and the associated proof content. Your public profile information (display name, completion count) may be visible to other users on the platform.',
      'We may disclose information if required by law, to protect the rights and safety of Social Bounty and its users, or in connection with a merger, acquisition, or sale of company assets.',
    ],
  },
  {
    id: 'data-retention',
    heading: 'Data Retention',
    body: [
      'We retain your account information for as long as your account is active or as needed to provide services. If you close your account, we will delete or anonymise your personal data within 90 days, except where we are required by law to retain it longer.',
      'Submission records and transaction history may be retained for up to seven years for financial compliance purposes. Anonymised, aggregated data derived from your usage may be retained indefinitely for analytics.',
    ],
  },
  {
    id: 'your-rights',
    heading: 'Your Rights',
    body: [
      'Depending on your location, you may have rights regarding your personal data, including the right to access, correct, or delete information we hold about you; the right to restrict or object to certain processing; and the right to data portability.',
      'To exercise any of these rights, please contact us using the details at the bottom of this page. We will respond within 30 days. We may ask you to verify your identity before processing your request.',
      'If you believe we have not handled your data correctly, you have the right to lodge a complaint with your local data protection authority.',
    ],
  },
  {
    id: 'cookies',
    heading: 'Cookies',
    body: [
      'We use cookies and similar tracking technologies to keep you logged in, remember your preferences, and understand how the platform is used. Essential cookies are required for the service to function; other cookies are used only with your consent.',
      'You can manage cookie preferences through your browser settings. Disabling certain cookies may affect the functionality of Social Bounty. We do not currently respond to Do Not Track signals from browsers.',
    ],
  },
  {
    id: 'contact',
    heading: 'Contact Us',
    body: [
      'If you have questions about this Privacy Policy or how we handle your data, please reach out through our contact page or email us directly at privacy@socialbounty.com.',
      'We are committed to working with you to resolve any concerns promptly and transparently.',
    ],
    cta: true,
  },
];

export default function PrivacyPage() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-heading font-bold text-slate-900 mb-3">Privacy Policy</h1>
          <p className="text-sm text-slate-400">Last updated: March 2026</p>
          <p className="mt-4 text-slate-600 leading-relaxed">
            Social Bounty is committed to protecting your privacy. This policy explains what
            personal data we collect, how we use it, and the choices available to you. By using
            our platform you agree to the practices described here.
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

        {/* Divider + table of contents hint */}
        <div className="mt-16 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-400 text-center">
            &copy; 2026 Social Bounty. All rights reserved. &mdash;{' '}
            <Link href="/terms" className="hover:text-pink-500 transition-colors">
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
