'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { DollarSign, UserCheck, Eye, Check, Laptop, Star, Home, Search, Mail, Circle } from 'lucide-react';

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
    title: 'Browse the board',
    body: 'Scroll through live bounties from real brands. Filter by platform, reward size, or category.',
  },
  {
    n: 2,
    title: 'Claim a bounty',
    body: 'Lock in your spot with one tap. Each claim gives you a clear brief, deadline, and exact payout.',
  },
  {
    n: 3,
    title: 'Submit your proof',
    body: 'Upload your screenshot, link, or video. Most Hunters are done in under three minutes.',
  },
  {
    n: 4,
    title: 'Get your reward',
    body: 'Brand reviews your work, approves it, reward lands in your account. No chasing.',
  },
];

const WHY_CARDS: {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  title: string;
  body: string;
}[] = [
  {
    Icon: DollarSign,
    title: 'Real daily income',
    body: 'New bounties drop every day. Stack small wins into a meaningful side income \u2014 or go full-time.',
  },
  {
    Icon: UserCheck,
    title: 'No follower minimums',
    body: 'You don\u2019t need an audience. Zero followers, full access. Your effort is what gets rewarded.',
  },
  {
    Icon: Eye,
    title: 'Transparent requirements',
    body: 'Every bounty spells out exactly what\u2019s needed. No guesswork, no surprise rejections.',
  },
  {
    Icon: Check,
    title: 'Fair review process',
    body: 'Structured brand reviews with clear criteria. Dispute any decision \u2014 we have your back.',
  },
  {
    Icon: Laptop,
    title: 'Work from anywhere',
    body: 'Your phone, your laptop, your couch. If you have internet, you can hunt.',
  },
  {
    Icon: Star,
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
            <span className="text-xs text-slate-400 font-mono tabular-nums">3 new</span>
          </div>

          {/* Bounty cards */}
          {[
            { brand: 'Nando\u2019s SA', task: 'TikTok review', reward: 'R150', tag: 'F' },
            { brand: 'Superbalist', task: 'Instagram story', reward: 'R85', tag: 'F' },
            { brand: 'Takealot', task: 'Google review', reward: 'R60', tag: 'R' },
            { brand: 'Vida e Caff\u00e8', task: 'Reel + tag', reward: 'R200', tag: 'C' },
          ].map((b, i) => (
            <div
              key={i}
              className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex items-center gap-2"
              style={{
                opacity: 1 - i * 0.12,
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-xs font-bold text-pink-600 shrink-0">
                {b.tag}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{b.brand}</p>
                <p className="text-[10px] text-slate-500 truncate">{b.task}</p>
              </div>
              <span className="text-xs font-mono tabular-nums font-bold text-pink-600 shrink-0">{b.reward}</span>
            </div>
          ))}

          {/* Bottom bar */}
          <div className="mt-auto flex justify-around pt-2 border-t border-slate-100">
            {[
              { Icon: Home, active: false },
              { Icon: Search, active: true },
              { Icon: Mail, active: false },
              { Icon: Circle, active: false },
            ].map(({ Icon, active }, i) => (
              <Icon
                key={i}
                size={16}
                strokeWidth={2}
                className={active ? 'text-pink-600' : 'text-slate-300'}
              />
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
                <p className="eyebrow mb-6">For hunters</p>
              </FadeUp>

              <FadeUp delay={80}>
                <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight tracking-tight mb-6">
                  Your internet time, finally worth <span className="gradient-text">something.</span>
                </h1>
              </FadeUp>

              <FadeUp delay={160}>
                <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-8 max-w-lg">
                  Pick up bounties from real brands, complete small tasks, earn rewards &mdash; every day, from anywhere.{' '}
                  <strong className="text-slate-800 font-semibold">No followers required.</strong>
                </p>
              </FadeUp>

              <FadeUp delay={240}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Link
                    href="/signup"
                    className="btn btn-primary btn-lg rounded-full"
                  >
                    Create your hunter account
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
            <p className="eyebrow mb-3">The process</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
              How it works.
            </h2>
          </FadeUp>

          <div className="space-y-12">
            {HOW_STEPS.map((step, i) => (
              <FadeUp key={step.n} delay={i * 80}>
                <div className={`flex flex-col md:flex-row items-center gap-8 ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                  {/* Icon block */}
                  <div className="shrink-0 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-xl bg-pink-600 flex items-center justify-center text-white font-mono tabular-nums font-bold text-xl shadow-lg">
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
            <p className="eyebrow mb-3">Why it works</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
              Built for hunters, not influencers.
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_CARDS.map(({ Icon, title, body }, i) => (
              <FadeUp key={title} delay={i * 60}>
                <div className="h-full card card-interactive hover:border-pink-200">
                  <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center text-pink-600 mb-4">
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{body}</p>
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
            <p className="eyebrow text-pink-400 mb-3">Earning potential</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              What could you earn this week?
            </h2>
          </FadeUp>

          <div className="max-w-lg mx-auto">
            <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Example week</span>
                <span className="text-xs text-pink-400 font-mono tabular-nums">3 bounties</span>
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
                      <span className="font-mono tabular-nums text-lg font-bold text-pink-400">R{b.amount}</span>
                    </div>
                  </FadeUp>
                ))}
              </div>

              {/* Total */}
              <div className="bg-pink-600 px-6 py-5 flex items-center justify-between">
                <span className="font-heading font-bold text-white text-base">Weekly total</span>
                <span className="font-mono tabular-nums text-2xl font-bold text-white">
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
            <p className="eyebrow mb-3">Plans</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
              Free today. <span className="text-pink-600">Pro coming soon.</span>
            </h2>
            <p className="text-lg text-slate-600 mt-4 max-w-xl mx-auto">
              Every hunter starts on Free. Pro Hunter is on the way — pricing will land on the Payment page before launch.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Free */}
            <FadeUp delay={0}>
              <div className="h-full card card-feature">
                <h3 className="font-heading text-xl font-bold text-slate-900 mb-1">Free Hunter</h3>
                <p className="font-mono tabular-nums text-3xl font-bold text-slate-900 mt-4 mb-6">R0<span className="text-base font-normal text-slate-400">/month</span></p>
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
                <Link href="/signup" className="btn btn-primary rounded-full text-center justify-center">
                  Get started free
                </Link>
              </div>
            </FadeUp>

            {/* Pro — coming soon */}
            <FadeUp delay={100}>
              <div className="h-full card card-feature relative opacity-75">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge badge-neutral px-4 py-1 uppercase">
                  Coming soon
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900 mb-1">Pro Hunter</h3>
                <p className="text-sm text-slate-500 mt-4 mb-6">Pricing published before launch</p>
                <ul className="space-y-3 mb-6">
                  {[
                    'Lower platform commission',
                    'Faster payouts',
                    'Apply to closed (invite-only) bounties',
                    'Verified hunter badge',
                    'Priority support',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-slate-500">
                      <span className="text-slate-400 mt-0.5">{'\u2014'}</span>{f}
                    </li>
                  ))}
                </ul>
                <button
                  disabled
                  aria-disabled="true"
                  className="btn btn-secondary rounded-full text-center justify-center w-full cursor-not-allowed"
                >
                  Pro upgrade coming soon
                </button>
              </div>
            </FadeUp>
          </div>

          <FadeUp delay={200}>
            <p className="text-center mt-8">
              <Link href="/payment" className="text-sm text-pink-600 font-semibold hover:underline">
                See how payments &amp; fees work {'\u2192'}
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
            <div className="w-16 h-16 rounded-xl bg-pink-100 flex items-center justify-center mx-auto mb-6">
              <Star size={28} strokeWidth={2} className="text-pink-600" fill="currentColor" />
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              The board&rsquo;s open. <span className="text-pink-600">Let&rsquo;s get you earning.</span>
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Join thousands of Hunters already picking up bounties every day.
            </p>
          </FadeUp>

          <FadeUp delay={100}>
            <Link
              href="/signup"
              className="btn btn-primary btn-lg rounded-full"
            >
              Create your hunter account
            </Link>
            <p className="text-sm text-slate-500 mt-4">Free forever. No credit card. No follower check.</p>
          </FadeUp>
        </div>
      </section>
    </div>
  );
}
