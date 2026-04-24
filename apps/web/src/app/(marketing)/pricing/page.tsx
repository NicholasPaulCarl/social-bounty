'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';

/* ── FadeUp helper ── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: `opacity 600ms cubic-bezier(0,0,0.2,1) ${delay}ms, transform 600ms cubic-bezier(0,0,0.2,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

/* ── Data ── */

const HUNTER_FREE = [
  '20% platform commission',
  '3-day payout clearance',
  'Access to all public bounties',
  'Standard support',
];

const HUNTER_PRO = [
  '10% platform commission (save 10%)',
  'Same-day payouts',
  'Apply to any closed bounty',
  'Verified badge on your profile',
  'Priority support',
];

const BRAND_FREE = [
  '15% admin fee on bounties',
  'Public bounties only',
  'Standard support',
];

const BRAND_PRO = [
  '5% admin fee (save 10%)',
  'Create closed (invite-only) bounties',
  'Application and invitation management',
  'Priority support',
];

const FAQS = [
  { q: 'Is there a free trial?', a: 'No trial needed. Start on the Free plan with full access to core features. Upgrade when the savings make sense for you.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel anytime and keep your Pro perks until the end of your billing period. No pro-rata refunds, no hassle.' },
  { q: 'How does the commission saving work?', a: 'Free Hunters pay 20% platform commission on each bounty reward. Pro Hunters pay only 10%. If you earn R3,500/month in bounties, Pro pays for itself.' },
  { q: 'What happens to my closed bounties if I downgrade?', a: 'Existing closed bounties stay as-is. You can still manage them, review applications, and handle invitations. You just can\u2019t create new closed ones.' },
  { q: 'Is the Brand subscription per-user or per-brand?', a: 'Per-brand. When your brand subscribes, all members get Pro features.' },
  { q: 'What payment methods do you accept?', a: 'We accept instant EFT and major credit and debit cards via our secure checkout. All prices are in ZAR.' },
];

/* ── Page ── */

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-white text-slate-900 font-body">

      {/* ══ HERO ══ */}
      <section className="pt-16 pb-12 sm:pt-24 sm:pb-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeUp>
            <p className="eyebrow mb-3">Pricing</p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight tracking-tight mb-6">
              Simple plans. <span className="gradient-text">Real savings.</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Start free. Upgrade when the math makes sense. No hidden fees, no lock-in, cancel anytime.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ══ HUNTER PLANS ══ */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-12">
            <p className="eyebrow mb-4">For hunters</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900">
              Earn more. Get paid faster.
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Free Hunter */}
            <FadeUp delay={0}>
              <div className="h-full card card-feature flex flex-col">
                <h3 className="font-heading text-xl font-bold text-slate-900 mb-1">Free</h3>
                <p className="text-sm text-slate-500 mb-6">Get started earning today</p>
                <p className="font-mono tabular-nums text-4xl font-bold text-slate-900 mb-1">R0<span className="text-lg font-normal text-slate-400">/month</span></p>
                <p className="text-xs text-slate-400 mb-8">No credit card needed</p>

                <ul className="space-y-3 mb-8 flex-1">
                  {HUNTER_FREE.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-slate-400 text-xs">{'\u2014'}</span>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className="btn btn-secondary rounded-full text-center justify-center"
                >
                  Get started free
                </Link>
              </div>
            </FadeUp>

            {/* Pro Hunter */}
            <FadeUp delay={100}>
              <div className="h-full card card-feature flex flex-col relative border-2 border-pink-300 shadow-lg shadow-pink-100/50">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge badge-brand px-4 py-1 uppercase">
                  Most popular
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900 mb-1">Pro Hunter</h3>
                <p className="text-sm text-pink-600 mb-6">For serious earners</p>
                <p className="font-mono tabular-nums text-4xl font-bold text-slate-900 mb-1">
                  R350<span className="text-lg font-normal text-slate-400">/month</span>
                </p>
                <p className="text-xs text-slate-400 mb-8">Pays for itself at ~R3,500/month in bounties</p>

                <ul className="space-y-3 mb-8 flex-1">
                  {HUNTER_PRO.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                      <span className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-pink-600 text-xs font-bold">{'\u2713'}</span>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className="btn btn-primary rounded-full text-center justify-center"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══ BRAND PLANS ══ */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-12">
            <p className="eyebrow mb-4">For brands</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900">
              Post smarter. Pay less.
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Free Brand */}
            <FadeUp delay={0}>
              <div className="h-full card card-feature flex flex-col">
                <h3 className="font-heading text-xl font-bold text-slate-900 mb-1">Free</h3>
                <p className="text-sm text-slate-500 mb-6">Start posting bounties</p>
                <p className="font-mono tabular-nums text-4xl font-bold text-slate-900 mb-1">R0<span className="text-lg font-normal text-slate-400">/month</span></p>
                <p className="text-xs text-slate-400 mb-8">15% admin fee per bounty</p>

                <ul className="space-y-3 mb-8 flex-1">
                  {BRAND_FREE.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-slate-400 text-xs">{'\u2014'}</span>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className="btn btn-secondary rounded-full text-center justify-center"
                >
                  Get started free
                </Link>
              </div>
            </FadeUp>

            {/* Pro Brand */}
            <FadeUp delay={100}>
              <div className="h-full card card-feature flex flex-col relative border-2 border-pink-300 shadow-lg shadow-pink-100/50">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge badge-brand px-4 py-1 uppercase">
                  Best value
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900 mb-1">Pro Brand</h3>
                <p className="text-sm text-pink-600 mb-6">For brands that post regularly</p>
                <p className="font-mono tabular-nums text-4xl font-bold text-slate-900 mb-1">
                  R950<span className="text-lg font-normal text-slate-400">/month</span>
                </p>
                <p className="text-xs text-slate-400 mb-8">Saves 10% on every bounty you post</p>

                <ul className="space-y-3 mb-8 flex-1">
                  {BRAND_PRO.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                      <span className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-pink-600 text-xs font-bold">{'\u2713'}</span>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className="btn btn-primary rounded-full text-center justify-center"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══ COMPARISON TABLE ══ */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-12">
            <p className="eyebrow mb-3">Feature comparison</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900">
              Full feature comparison
            </h2>
          </FadeUp>

          <FadeUp delay={100}>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Hunter comparison */}
              <div className="border-b border-slate-200 px-6 py-4 bg-pink-50/50">
                <h3 className="font-heading font-bold text-slate-900">Hunter plans</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-slate-500 font-medium">Feature</th>
                    <th className="text-center px-4 py-3 text-slate-500 font-medium w-28">Free</th>
                    <th className="text-center px-4 py-3 text-pink-600 font-semibold w-28">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ['Platform commission', '20%', '10%'],
                    ['Payout speed', '3 days', 'Same day'],
                    ['Public bounties', yes(), yes()],
                    ['Apply to closed bounties', no(), yes()],
                    ['Verified badge', no(), yes()],
                    ['Priority support', no(), yes()],
                    ['Price', 'Free', 'R350/mo'],
                  ].map(([feature, free, pro], i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 text-slate-700">{feature}</td>
                      <td className="px-4 py-3 text-center text-slate-500">{free}</td>
                      <td className="px-4 py-3 text-center font-medium text-slate-900">{pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Brand comparison */}
              <div className="border-t border-b border-slate-200 px-6 py-4 bg-pink-50/50">
                <h3 className="font-heading font-bold text-slate-900">Brand plans</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-slate-500 font-medium">Feature</th>
                    <th className="text-center px-4 py-3 text-slate-500 font-medium w-28">Free</th>
                    <th className="text-center px-4 py-3 text-pink-600 font-semibold w-28">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ['Admin fee per bounty', '15%', '5%'],
                    ['Public bounties', yes(), yes()],
                    ['Closed (invite-only) bounties', no(), yes()],
                    ['Application management', no(), yes()],
                    ['Priority support', no(), yes()],
                    ['Price', 'Free', 'R950/mo'],
                  ].map(([feature, free, pro], i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 text-slate-700">{feature}</td>
                      <td className="px-4 py-3 text-center text-slate-500">{free}</td>
                      <td className="px-4 py-3 text-center font-medium text-slate-900">{pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-12">
            <p className="eyebrow mb-3">Questions</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900">
              Frequently asked questions
            </h2>
          </FadeUp>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FadeUp key={i} delay={i * 50}>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-heading font-semibold text-slate-900 text-sm sm:text-base pr-4">{faq.q}</span>
                    <Plus
                      size={18}
                      strokeWidth={2}
                      className={`shrink-0 text-slate-400 transition-transform duration-200 ${openFaq === i ? 'rotate-45' : ''}`}
                    />
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: openFaq === i ? '200px' : '0px', opacity: openFaq === i ? 1 : 0 }}
                  >
                    <p className="px-6 pb-4 text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section className="py-16 sm:py-24 bg-slate-900">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeUp>
            <p className="eyebrow text-pink-400 mb-3">Ready when you are</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Ready to level up?
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Start free. Upgrade when you&apos;re ready. No lock-in.
            </p>
          </FadeUp>
          <FadeUp delay={100}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="btn btn-primary btn-lg rounded-full"
              >
                Start hunting
              </Link>
              <Link
                href="/signup"
                className="inline-block border border-slate-500 text-white font-semibold px-8 py-4 rounded-full hover:border-white hover:bg-white/5 transition-all duration-200"
              >
                Post a bounty
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>
    </div>
  );
}

/* ── Helpers for comparison table ── */
function yes() {
  return <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">{'\u2713'}</span>;
}
function no() {
  return <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-300 text-xs">{'\u2014'}</span>;
}
