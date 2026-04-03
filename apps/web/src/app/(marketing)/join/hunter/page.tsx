'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

/* ─────────────────────────────────────────────
   useInView — fade-up on scroll
   ───────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ─────────────────────────────────────────────
   FadeUp wrapper
   ───────────────────────────────────────────── */
function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 600ms cubic-bezier(0,0,0.2,1) ${delay}ms, transform 600ms cubic-bezier(0,0,0.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Data
   ───────────────────────────────────────────── */
const HOW_STEPS = [
  {
    n: 1,
    icon: '1',
    title: 'Browse the board',
    body: 'Scroll through live bounties from real brands. Filter by platform, reward size, or category — and find what suits you.',
  },
  {
    n: 2,
    icon: '2',
    title: 'Claim a bounty',
    body: 'Lock in your spot on a bounty with one tap. Each claim gives you a clear brief, deadline, and exact payout.',
  },
  {
    n: 3,
    icon: '3',
    title: 'Submit your proof',
    body: 'Upload your screenshot, link, or video. Our submission flow is fast — most Hunters are done in under three minutes.',
  },
  {
    n: 4,
    icon: '4',
    title: 'Get your reward',
    body: 'Brand reviews your work, approves it, and your reward lands in your account. No chasing. No ambiguity.',
  },
];

const WHY_CARDS = [
  {
    icon: '$',
    title: 'Real daily income',
    body: 'New bounties drop every day. Stack small wins into a meaningful side income — or go full-time.',
  },
  {
    icon: '0',
    title: 'No follower minimums',
    body: "You don't need an audience. Zero followers, full access. Your effort is what gets rewarded.",
  },
  {
    icon: '=',
    title: 'Transparent requirements',
    body: "Every bounty spells out exactly what's needed. No guesswork, no surprise rejections.",
  },
  {
    icon: '\u2713',
    title: 'Fair review process',
    body: 'Structured brand reviews with clear criteria. Dispute any decision — we have your back.',
  },
  {
    icon: '\u2192',
    title: 'Work from anywhere',
    body: 'Your phone, your laptop, your couch. If you have internet, you can hunt.',
  },
  {
    icon: '\u2605',
    title: 'Build your portfolio',
    body: 'Every approved submission is proof of your content skills. Build a reputation, unlock bigger bounties.',
  },
];

const BOUNTY_EXAMPLES = [
  { task: 'Post a TikTok review', platform: 'TikTok', amount: 150 },
  { task: 'Share a story with a tag', platform: 'Instagram', amount: 50 },
  { task: 'Write a Google review', platform: 'Google', amount: 75 },
];

/* ─────────────────────────────────────────────
   Phone Mockup
   ───────────────────────────────────────────── */
function PhoneMockup() {
  return (
    <div className="relative flex justify-center items-center">
      {/* Glow blob */}
      <div className="absolute inset-0 flex justify-center items-center">
        <div className="w-72 h-72 bg-pink-200 rounded-full blur-3xl opacity-40" />
      </div>

      {/* Phone frame */}
      <div className="relative w-64 h-[520px] bg-slate-900 rounded-[2.5rem] shadow-2xl border-4 border-slate-700 overflow-hidden">
        {/* Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-800 rounded-full z-10" />

        {/* Screen */}
        <div className="absolute inset-0 bg-white pt-12 px-3 pb-3 flex flex-col gap-2 overflow-hidden">
          {/* App header */}
          <div className="flex items-center justify-between py-2 px-1">
            <span className="text-xs font-heading font-bold text-pink-600">Social Bounty</span>
            <span className="text-xs text-slate-400 font-mono">3 new</span>
          </div>

          {/* Bounty cards */}
          {[
            { brand: 'Nando\'s SA', task: 'TikTok review', reward: 'R150', tag: 'Food' },
            { brand: 'Superbalist', task: 'Instagram story', reward: 'R85', tag: 'Fashion' },
            { brand: 'Takealot', task: 'Google review', reward: 'R60', tag: 'Retail' },
            { brand: 'Vida e Caffè', task: 'Reel + tag', reward: 'R200', tag: 'Coffee' },
          ].map((b, i) => (
            <div
              key={i}
              className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex items-center gap-2"
              style={{
                opacity: 1 - i * 0.12,
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-xs font-bold text-pink-600 shrink-0">
                {b.tag[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{b.brand}</p>
                <p className="text-[10px] text-slate-500 truncate">{b.task}</p>
              </div>
              <span className="text-xs font-mono font-bold text-pink-600 shrink-0">{b.reward}</span>
            </div>
          ))}

          {/* Bottom bar */}
          <div className="mt-auto flex justify-around pt-2 border-t border-slate-100">
            {['\u2302', '\u2315', '\u2709', '\u2022'].map((icon, i) => (
              <span key={i} className={`text-lg ${i === 1 ? 'opacity-100' : 'opacity-30'}`}>
                {icon}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page
   ───────────────────────────────────────────── */
export default function JoinHunterPage() {
  return (
    <div className="bg-white text-slate-900 font-body">

      {/* ══════════════════════════════════════════
          HERO
          ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — copy */}
            <div>
              <FadeUp>
                <div className="inline-flex items-center gap-2 bg-pink-50 text-pink-700 text-sm font-semibold px-4 py-2 rounded-full mb-6">
                  <span className="w-4 h-4 rounded-full bg-pink-600 inline-block" />
                  <span>For Hunters</span>
                </div>
              </FadeUp>

              <FadeUp delay={80}>
                <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight tracking-tight mb-6">
                  Your internet time, finally worth{' '}
                  <span className="text-pink-600">something.</span>
                </h1>
              </FadeUp>

              <FadeUp delay={160}>
                <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-8 max-w-lg">
                  Pick up bounties from real brands, complete small tasks, and earn rewards — every day, from anywhere.{' '}
                  <strong className="text-slate-800 font-semibold">No followers required.</strong>
                </p>
              </FadeUp>

              <FadeUp delay={240}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Link
                    href="/signup"
                    className="inline-block bg-pink-600 text-white font-semibold px-8 py-4 rounded-full hover:bg-pink-700 hover:scale-[1.03] hover:shadow-lg transition-all duration-200 text-base"
                  >
                    Create Your Hunter Account
                  </Link>
                  <p className="text-sm text-slate-500">Free to join. Takes 30 seconds.</p>
                </div>
              </FadeUp>
            </div>

            {/* Right — phone mockup */}
            <FadeUp delay={200} className="lg:justify-self-end w-full">
              <PhoneMockup />
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
          ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-16">
            <p className="text-sm font-semibold text-pink-600 uppercase tracking-wider mb-3">The process</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
              How it works{' '}
              <span className="text-slate-400 font-normal">(spoiler: it's dead simple)</span>
            </h2>
          </FadeUp>

          <div className="space-y-12">
            {HOW_STEPS.map((step, i) => (
              <FadeUp key={step.n} delay={i * 80}>
                <div className={`flex flex-col md:flex-row items-center gap-8 ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                  {/* Icon block */}
                  <div className="shrink-0 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-pink-600 flex items-center justify-center text-white font-heading font-bold text-xl shadow-lg">
                      {step.n}
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`flex-1 max-w-xl ${i % 2 === 1 ? 'md:text-right' : ''}`}>
                    <h3 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 text-base leading-relaxed">{step.body}</p>
                  </div>

                  {/* Connector line (hidden on last) */}
                  {i < HOW_STEPS.length - 1 && (
                    <div className="hidden md:block w-px h-12 bg-slate-200 self-end mx-4" />
                  )}
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WHY HUNTERS LOVE IT
          ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-16">
            <p className="text-sm font-semibold text-pink-600 uppercase tracking-wider mb-3">Why it works</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
              Built for Hunters,{' '}
              <span className="text-slate-400 font-normal">not influencers.</span>
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_CARDS.map((card, i) => (
              <FadeUp key={card.title} delay={i * 60}>
                <div className="h-full bg-white border border-slate-200 rounded-2xl p-6 hover:border-pink-200 hover:shadow-md transition-all duration-200 group">
                  <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center text-lg font-bold text-pink-600 mb-4 group-hover:bg-pink-100 transition-colors">
                    {card.icon}
                  </div>
                  <h3 className="font-heading text-lg font-bold text-slate-900 mb-2">{card.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{card.body}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          EARNING POTENTIAL
          ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-16">
            <p className="text-sm font-semibold text-pink-400 uppercase tracking-wider mb-3">Earning potential</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              What could you earn this week?
            </h2>
          </FadeUp>

          <div className="max-w-lg mx-auto">
            <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Example week</span>
                <span className="text-xs text-pink-400 font-mono">3 bounties</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-700">
                {BOUNTY_EXAMPLES.map((b, i) => (
                  <FadeUp key={b.task} delay={i * 100}>
                    <div className="flex items-center justify-between px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-white">{b.task}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{b.platform}</p>
                      </div>
                      <span className="font-mono text-lg font-bold text-pink-400">R{b.amount}</span>
                    </div>
                  </FadeUp>
                ))}
              </div>

              {/* Total */}
              <div className="bg-pink-600 px-6 py-5 flex items-center justify-between">
                <span className="font-heading font-bold text-white text-base">Weekly Total</span>
                <span className="font-mono text-2xl font-bold text-white">
                  R{BOUNTY_EXAMPLES.reduce((s, b) => s + b.amount, 0)}
                </span>
              </div>
            </div>

            <FadeUp delay={300}>
              <p className="text-center text-sm text-slate-500 mt-4">
                Based on typical bounty values. Actual earnings depend on available bounties and your activity.
              </p>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FREE vs PRO COMPARISON
          ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-12">
            <p className="text-sm font-semibold text-pink-600 uppercase tracking-wider mb-3">Plans</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
              Free is great.{' '}
              <span className="text-pink-600">Pro is better.</span>
            </h2>
            <p className="text-lg text-slate-600 mt-4 max-w-xl mx-auto">
              Start free and upgrade when the savings make sense.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Free */}
            <FadeUp delay={0}>
              <div className="h-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
                <h3 className="font-heading text-xl font-bold text-slate-900 mb-1">Free Hunter</h3>
                <p className="text-3xl font-heading font-bold text-slate-900 mt-4 mb-6">R0<span className="text-base font-normal text-slate-400">/month</span></p>
                <ul className="space-y-3 mb-6">
                  {[
                    '20% platform commission',
                    '3-day payout clearance',
                    'All public bounties',
                    'Standard support',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="text-slate-400 mt-0.5">{'\u2014'}</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="block text-center border border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-full hover:border-slate-400 transition-all duration-200">
                  Get Started Free
                </Link>
              </div>
            </FadeUp>

            {/* Pro */}
            <FadeUp delay={100}>
              <div className="h-full bg-white border-2 border-pink-300 rounded-2xl p-6 sm:p-8 relative shadow-lg shadow-pink-100/50">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pink-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                  Recommended
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900 mb-1">Pro Hunter</h3>
                <p className="text-3xl font-heading font-bold text-slate-900 mt-4 mb-6">R350<span className="text-base font-normal text-slate-400">/month</span></p>
                <ul className="space-y-3 mb-6">
                  {[
                    '10% commission (save 10%)',
                    'Same-day payouts',
                    'Apply to any closed bounty',
                    'Verified badge on your profile',
                    'Priority support',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                      <span className="text-pink-600 mt-0.5 font-bold">{'\u2713'}</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="block text-center bg-pink-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-pink-700 hover:scale-[1.02] hover:shadow-lg transition-all duration-200">
                  Upgrade to Pro
                </Link>
              </div>
            </FadeUp>
          </div>

          <FadeUp delay={200}>
            <p className="text-center mt-8">
              <Link href="/pricing" className="text-sm text-pink-600 font-semibold hover:underline">
                View full feature comparison {'\u2192'}
              </Link>
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA
          ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeUp>
            <div className="w-16 h-16 rounded-2xl bg-pink-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-pink-600">\u2605</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              The board's open.{' '}
              <span className="text-pink-600">Let's get you earning.</span>
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Join thousands of Hunters already picking up bounties every day.
            </p>
          </FadeUp>

          <FadeUp delay={100}>
            <Link
              href="/signup"
              className="inline-block bg-pink-600 text-white font-semibold px-8 py-4 rounded-full hover:bg-pink-700 hover:scale-[1.03] hover:shadow-xl transition-all duration-200 text-base mb-4"
            >
              Create Your Hunter Account
            </Link>
            <p className="text-sm text-slate-500">Free forever. No credit card. No follower count check.</p>
          </FadeUp>
        </div>
      </section>
    </div>
  );
}
