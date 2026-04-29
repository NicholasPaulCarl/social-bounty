'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Zap, Check, Square, Triangle, Star } from 'lucide-react';

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
const COMPARISON_ROWS = [
  {
    label: 'Cost per piece of UGC',
    old: 'R1 500 \u2013 R5 000+ per asset',
    neo: 'You set the reward. Pay what it\u2019s worth.',
  },
  {
    label: 'Time to first submission',
    old: '2\u20134 weeks of briefing and back-and-forth',
    neo: 'First submissions within 24 hours of posting.',
  },
  {
    label: 'Content control',
    old: 'Agency interprets your brief their way',
    neo: 'Exact brief, exact requirements \u2014 your words.',
  },
  {
    label: 'Minimum commitment',
    old: 'Retainers, minimums, 90-day contracts',
    neo: 'No minimum. No contract. Post one bounty.',
  },
  {
    label: 'Payment model',
    old: 'Upfront fees, regardless of results',
    neo: 'Pay only for approved, quality submissions.',
  },
];

const HOW_STEPS = [
  {
    n: 1,
    title: 'Create a bounty',
    body: 'Write your brief: platform, bounty details, requirements, and reward. Takes five minutes.',
  },
  {
    n: 2,
    title: 'Hunters get to work',
    body: 'Your bounty goes live on the board instantly. Hunters browse, claim, and start creating. Submissions roll in within hours.',
  },
  {
    n: 3,
    title: 'Review and pay',
    body: 'Approve the content you love. Reject anything that misses the brief. You pay only for what passes your standards.',
  },
];

const BENEFIT_CARDS: {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  title: string;
  body: string;
}[] = [
  {
    Icon: Zap,
    title: 'First submissions in under 24 hours',
    body: 'Our active Hunter community moves fast. Post in the morning, have content to review by end of day.',
  },
  {
    Icon: Check,
    title: 'Pay only for approved results',
    body: 'Rewards are only released when you approve. Bad submissions? Reject them. Your budget, your call.',
  },
  {
    Icon: Square,
    title: 'Full creative control',
    body: 'Your brief, your requirements, your approval criteria. Every piece of UGC meets your standards before you pay.',
  },
  {
    Icon: Triangle,
    title: 'Scale without headcount',
    body: 'Need 5 pieces this week, 50 next month? Just post more bounties. No hiring, no agency negotiations.',
  },
];

/* ─────────────────────────────────────────────
   Dashboard Mockup
   ───────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div className="relative flex justify-center items-center">
      {/* Glow blob (low opacity per DS gradient budget) */}
      <div className="absolute inset-0 flex justify-center items-center">
        <div className="w-80 h-64 bg-pink-100 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Dashboard frame */}
      <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 h-5 bg-slate-200 rounded mx-2 flex items-center justify-center">
            <span className="text-[9px] text-slate-500 font-mono">app.socialbounty.co.za</span>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-4 space-y-3">
          {/* Page heading */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-heading font-bold text-text-primary">New bounty</span>
            <span className="badge badge-brand">Draft</span>
          </div>

          {/* Form fields */}
          {[
            { label: 'Bounty title', value: 'TikTok product review \u2014 Nando\u2019s Sauce' },
            { label: 'Platform', value: 'TikTok' },
            { label: 'Task description', value: 'Film a 30-second honest review...' },
          ].map((f) => (
            <div key={f.label}>
              <p className="text-[9px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">{f.label}</p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <p className="text-xs text-slate-700 truncate">{f.value}</p>
              </div>
            </div>
          ))}

          {/* Reward row */}
          <div>
            <p className="text-[9px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Hunter reward</p>
            <div className="flex gap-2 items-center">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <p className="text-xs font-mono tabular-nums font-bold text-pink-600">R 150.00</p>
              </div>
              <span className="text-[9px] text-slate-400">per approval</span>
            </div>
          </div>

          {/* Publish button */}
          <button className="btn btn-primary btn-sm w-full mt-1">
            Publish bounty
          </button>

          {/* Stats row */}
          <div className="flex gap-2 pt-1">
            {[
              { label: 'Active', val: '12' },
              { label: 'Submissions', val: '47' },
              { label: 'Approved', val: '31' },
            ].map((s) => (
              <div key={s.label} className="flex-1 bg-slate-50 rounded-lg px-2 py-2 text-center">
                <p className="text-sm font-mono tabular-nums font-bold text-text-primary">{s.val}</p>
                <p className="text-[9px] text-slate-500">{s.label}</p>
              </div>
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
export default function JoinBusinessPage() {
  return (
    <div className="bg-white text-text-primary font-body">

      {/* ══════════════════════════════════════════
          HERO
          ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — copy */}
            <div>
              <FadeUp>
                <p className="eyebrow mb-6">For brands and businesses</p>
              </FadeUp>

              <FadeUp delay={80}>
                <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight tracking-tight mb-6">
                  UGC without <span className="gradient-text">the agency.</span>
                </h1>
              </FadeUp>

              <FadeUp delay={160}>
                <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-8 max-w-lg">
                  Post a bounty, set the reward, and get real user-generated content from thousands of Hunters.{' '}
                  <strong className="text-slate-800 font-semibold">You approve it, you pay for it.</strong>
                </p>
              </FadeUp>

              <FadeUp delay={240}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Link
                    href="/signup"
                    className="btn btn-primary btn-lg rounded-full"
                  >
                    Create your brand account
                  </Link>
                  <p className="text-sm text-slate-500">Free to start. No contracts.</p>
                </div>
              </FadeUp>
            </div>

            {/* Right — dashboard mockup */}
            <FadeUp delay={200} className="lg:justify-self-end w-full">
              <DashboardMockup />
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          COMPARISON TABLE
          ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-16">
            <p className="eyebrow mb-3">Why switch</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary">
              Same results. Fraction of the cost.
            </h2>
          </FadeUp>

          <FadeUp delay={80}>
            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              {/* Table header */}
              <div className="grid grid-cols-2 divide-x divide-slate-200">
                <div className="px-6 py-4 bg-slate-100">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">The old way (agencies)</p>
                </div>
                <div className="px-6 py-4 bg-pink-600">
                  <p className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Star size={14} strokeWidth={2} /> The Social Bounty way
                  </p>
                </div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-200">
                {COMPARISON_ROWS.map((row, i) => (
                  <FadeUp key={row.label} delay={i * 60}>
                    <div className="grid grid-cols-2 divide-x divide-slate-200 bg-white hover:bg-slate-50 transition-colors">
                      <div className="px-6 py-5">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{row.label}</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{row.old}</p>
                      </div>
                      <div className="px-6 py-5 bg-pink-50/40">
                        <p className="text-xs font-semibold text-pink-500 uppercase tracking-wider mb-1 opacity-0">{row.label}</p>
                        <p className="text-sm text-slate-800 font-medium leading-relaxed flex items-start gap-2">
                          <Check size={16} strokeWidth={2} className="text-pink-600 flex-none mt-0.5" />
                          <span>{row.neo}</span>
                        </p>
                      </div>
                    </div>
                  </FadeUp>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS FOR BRANDS
          ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-16">
            <p className="eyebrow mb-3">The process</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary">
              Three steps to your first UGC.
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {HOW_STEPS.map((step, i) => (
              <FadeUp key={step.n} delay={i * 100}>
                <div className="relative flex flex-col items-center text-center">
                  {/* Connector (between steps) */}
                  {i < HOW_STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[calc(50%+2.5rem)] w-[calc(100%-5rem)] h-px bg-slate-200" />
                  )}

                  {/* Number circle */}
                  <div className="w-16 h-16 rounded-xl bg-pink-600 text-white font-heading font-bold text-xl flex items-center justify-center shadow-md mb-4 shrink-0 relative z-10 font-mono tabular-nums">
                    {step.n}
                  </div>

                  <h3 className="font-heading text-xl font-bold text-text-primary mb-2">{step.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{step.body}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          KEY BENEFITS
          ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-16">
            <p className="eyebrow mb-3">Why brands choose us</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary">
              Why brands choose the board.
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {BENEFIT_CARDS.map(({ Icon, title, body }, i) => (
              <FadeUp key={title} delay={i * 80}>
                <div className="h-full card card-interactive hover:border-pink-200 flex gap-5">
                  <div className="w-14 h-14 bg-pink-50 rounded-xl flex items-center justify-center text-pink-600 shrink-0">
                    <Icon size={24} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-text-primary mb-2">{title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{body}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIAL
          ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="text-center mb-8">
              <p className="eyebrow text-pink-400">In their words</p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 sm:p-12 relative">
              {/* Quote mark */}
              <div className="absolute -top-5 left-10 text-7xl text-pink-600 font-serif leading-none select-none">
                &ldquo;
              </div>

              <blockquote className="text-xl sm:text-2xl text-white font-body leading-relaxed mb-8 pt-4">
                We got{' '}
                <span className="text-pink-400 font-semibold">40 pieces of UGC in a week</span>{' '}
                for less than what our agency charged for five. Game changer.
              </blockquote>

              <div className="flex items-center gap-4">
                <div className="avatar bg-pink-600 text-white">
                  T
                </div>
                <div>
                  <p className="font-semibold text-white">Tom K.</p>
                  <p className="text-sm text-slate-400">Marketing Lead</p>
                </div>

                {/* Stars */}
                <div className="ml-auto flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} strokeWidth={2} className="text-pink-400" fill="currentColor" />
                  ))}
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FREE vs PRO COMPARISON
          ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-12">
            <p className="eyebrow mb-3">Plans</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary">
              Start free. <span className="text-pink-600">Pro coming soon.</span>
            </h2>
            <p className="text-lg text-slate-600 mt-4 max-w-xl mx-auto">
              Every brand starts on Free. Pro Brand is on the way — pricing will land on the Payment page before launch.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Free */}
            <FadeUp delay={0}>
              <div className="h-full card card-feature">
                <h3 className="font-heading text-xl font-bold text-text-primary mb-1">Free Brand</h3>
                <p className="font-mono tabular-nums text-3xl font-bold text-text-primary mt-4 mb-6">R0<span className="text-base font-normal text-slate-400">/month</span></p>
                <ul className="space-y-3 mb-6">
                  {[
                    '15% admin fee per bounty',
                    '5% transaction fee',
                    'Public bounties only',
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
                <h3 className="font-heading text-xl font-bold text-text-primary mb-1">Pro Brand</h3>
                <p className="text-sm text-slate-500 mt-4 mb-6">Pricing published before launch</p>
                <ul className="space-y-3 mb-6">
                  {[
                    'Lower brand admin fee',
                    'Closed (invite-only) bounties',
                    'Application and invitation management',
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
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mb-4">
              Hunters are waiting for <span className="text-pink-600">your first bounty.</span>
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Join brands already getting UGC at a fraction of the traditional cost.
            </p>
          </FadeUp>

          <FadeUp delay={100}>
            <Link
              href="/signup"
              className="btn btn-primary btn-lg rounded-full"
            >
              Create your brand account
            </Link>
            <p className="text-sm text-slate-500 mt-4">Free to start. No contracts. No minimum spend.</p>
          </FadeUp>
        </div>
      </section>
    </div>
  );
}
