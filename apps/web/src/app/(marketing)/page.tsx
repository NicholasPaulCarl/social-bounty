'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Quote } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════════ */

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function useCountUp(target: number, duration = 1200, active = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);
  return value;
}

/* ═══════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════ */

const STEPS = [
  { num: '01', title: 'Post a bounty', desc: 'Define the bounty, set the reward, hit publish. Hunters see it instantly.' },
  { num: '02', title: 'Hunters deliver', desc: 'Real people complete your bounty and submit proof. Submissions roll in daily.' },
  { num: '03', title: 'Review and pay', desc: 'Approve what you love. Pay only for results.' },
];

const BOUNTIES = [
  { brand: 'Fresh Roast', task: 'Instagram reel — summer coffee challenge', reward: 'R 500', tag: 'Social' },
  { brand: 'UrbanFit Gym', task: 'TikTok gym transformation video', reward: 'R 750', tag: 'Content' },
  { brand: 'Vivid Media', task: 'Brand campaign — summer push', reward: 'R 2,500', tag: 'Campaign' },
  { brand: 'Fresh Roast', task: 'Product photography — new blend', reward: 'R 1,500', tag: 'Creative' },
  { brand: 'UrbanFit Gym', task: 'Unboxing video — merch drop', reward: 'R 600', tag: 'Content' },
];

const TESTIMONIALS = [
  { quote: 'I make an extra R300 a month picking up bounties on my commute. No interviews, no contracts — just proof and pay.', name: 'Jess M.', role: 'Hunter' },
  { quote: 'We got 40 pieces of UGC in a week for less than what our agency charged for five.', name: 'Tom K.', role: 'Marketing Lead' },
  { quote: 'Finally, a platform that doesn\u2019t care how many followers I have. I just do the work and earn.', name: 'Amira R.', role: 'Hunter' },
];

/* ═══════════════════════════════════════════════════════════════
   ANIMATION WRAPPER
   ═══════════════════════════════════════════════════════════════ */

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useInView(0.12);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function MarketingHomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <DualSplitSection />
      <StatsSection />
      <BountiesPreviewSection />
      <TestimonialsSection />
      <FinalCTASection />
    </>
  );
}

/* ─── SECTION 1: HERO ─── */

function HeroSection() {
  const { ref, visible } = useInView(0.05);
  const count = useCountUp(2000, 1400, visible);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center overflow-hidden bg-slate-50"
    >
      {/* Soft decorative blobs at low opacity (texture only — under DS gradient budget) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-10 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, #DB2777, transparent 70%)',
            animation: 'heroFloat 20s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-10 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, #DB2777, transparent 70%)',
            animation: 'heroFloat 25s ease-in-out infinite reverse',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-0 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">
          {/* Copy — 3/5 */}
          <div className="lg:col-span-3">
            <Reveal>
              <p className="eyebrow mb-4">The bounty board for the internet</p>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-bold text-slate-900 leading-[1.05] tracking-tight">
                Post a task.
                <br />
                <span className="gradient-text">
                  Pay for results.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={200}>
              <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-xl leading-relaxed">
                Brands post bounties. Hunters deliver. Real rewards, no agencies, no gatekeepers.
              </p>
            </Reveal>

            <Reveal delay={400}>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="btn btn-primary btn-lg rounded-full"
                >
                  Start hunting
                  <ArrowRight size={18} strokeWidth={2} />
                </Link>
                <Link
                  href="/join/business"
                  className="btn btn-secondary btn-lg rounded-full"
                >
                  Post a bounty
                </Link>
              </div>
            </Reveal>

            <Reveal delay={600}>
              <p className="mt-8 text-sm text-slate-500">
                <span className="font-mono tabular-nums font-bold text-pink-600 text-base">{visible ? count.toLocaleString() : '0'}+</span> hunters earning daily.
              </p>
            </Reveal>
          </div>

          {/* Visual — 2/5: floating bounty card mockup */}
          <div className="lg:col-span-2 flex justify-center">
            <Reveal delay={300}>
              <div
                className="relative"
                style={{ animation: 'cardFloat 4s ease-in-out infinite' }}
              >
                <div className="w-72 sm:w-80 bg-white rounded-xl shadow-2xl shadow-slate-900/10 border border-slate-200/60 p-6 transform rotate-2">
                  <div className="flex items-center justify-between mb-4">
                    <span className="badge badge-success">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      Live
                    </span>
                    <span className="text-xs text-slate-400">2h ago</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mb-1">Fresh Roast Coffee</p>
                  <h3 className="font-heading font-bold text-slate-900 text-sm leading-snug mb-3">
                    Instagram reel — summer coffee challenge
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="badge badge-neutral">Social</span>
                    <span className="font-mono tabular-nums font-bold text-pink-600 text-lg">R 500</span>
                  </div>
                </div>
                {/* Second card behind */}
                <div className="absolute -bottom-4 -left-4 w-72 sm:w-80 bg-white/60 rounded-xl border border-slate-200/40 p-6 -z-10 transform -rotate-3 blur-[1px]">
                  <div className="h-4 bg-slate-100 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-slate-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Inline keyframes */}
      <style jsx>{`
        @keyframes heroFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.04); }
          66% { transform: translate(-20px, 30px) scale(0.96); }
        }
        @keyframes cardFloat {
          0%, 100% { transform: translateY(0) rotate(2deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
      `}</style>
    </section>
  );
}

/* ─── SECTION 2: HOW IT WORKS ─── */

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="eyebrow text-center mb-3">How it works</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-slate-900 text-center">
            Three steps. Zero agencies.
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {STEPS.map((step, i) => (
            <Reveal key={step.num} delay={i * 120}>
              <div className="relative text-center group">
                {/* Step number */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-pink-100 text-pink-700 font-heading font-bold text-lg mb-6 group-hover:scale-110 transition-all duration-300">
                  {step.num}
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 font-mono tabular-nums font-bold text-[10px] text-pink-600 tracking-widest">
                  STEP {step.num}
                </div>
                <h3 className="text-xl font-heading font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── SECTION 3: DUAL SPLIT ─── */

function DualSplitSection() {
  return (
    <section className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Hunter card */}
          <Reveal>
            <div className="relative card card-feature card-interactive bg-pink-50 border-pink-100">
              <p className="eyebrow">For hunters</p>
              <h3 className="mt-3 text-2xl sm:text-3xl font-heading font-bold text-slate-900">
                Earn daily. No followers required.
              </h3>
              <ul className="mt-6 space-y-3">
                {[
                  'Pick up bounties that match your vibe',
                  'Complete small tasks from your phone',
                  'Get paid for results, not clout',
                  'Build a track record with every approval',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-600 text-sm">
                    <span className="mt-1 w-5 h-5 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-xs shrink-0">{'\u2713'}</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/join/hunter"
                className="btn btn-primary mt-8 rounded-full"
              >
                Browse bounties
                <ArrowRight size={16} strokeWidth={2} />
              </Link>
            </div>
          </Reveal>

          {/* Brand card */}
          <Reveal delay={150}>
            <div className="relative card card-feature card-interactive">
              <p className="eyebrow">For brands</p>
              <h3 className="mt-3 text-2xl sm:text-3xl font-heading font-bold text-slate-900">
                UGC without the agency.
              </h3>
              <ul className="mt-6 space-y-3">
                {[
                  'Post a bounty in minutes, not weeks',
                  'Hunters start submitting the same day',
                  'Review everything before you pay',
                  'Scale up or down — no contracts',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-600 text-sm">
                    <span className="mt-1 w-5 h-5 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-xs shrink-0">{'\u2713'}</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/join/business"
                className="btn btn-primary mt-8 rounded-full"
              >
                Post your first bounty
                <ArrowRight size={16} strokeWidth={2} />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─── SECTION 4: STATS BAND ─── */

function StatsSection() {
  const { ref, visible } = useInView(0.2);
  const hunters = useCountUp(2000, 1200, visible);
  const bounties = useCountUp(10000, 1400, visible);
  const rewards = useCountUp(250, 1200, visible);

  const stats = [
    { value: `${hunters.toLocaleString()}+`, label: 'Hunters on the platform' },
    { value: `${bounties.toLocaleString()}+`, label: 'Bounties completed' },
    { value: `$${rewards}K+`, label: 'Rewards earned' },
    { value: '24h', label: 'Average first submission' },
  ];

  return (
    <section ref={ref} className="py-20 sm:py-24 bg-slate-900 relative overflow-hidden">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="eyebrow text-center mb-3">By the numbers</p>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white text-center mb-16">
            The numbers don&apos;t lie.
          </h2>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 100}>
              <div className="text-center">
                <p className="font-mono tabular-nums font-bold text-3xl sm:text-4xl lg:text-5xl text-pink-500">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── SECTION 5: FEATURED BOUNTIES ─── */

function BountiesPreviewSection() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="eyebrow text-center mb-3">Live now</p>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 text-center mb-4">
            Fresh bounties. Updated daily.
          </h2>
          <p className="text-center text-slate-500 mb-12">Real tasks from real brands — waiting for you right now.</p>
        </Reveal>

        <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent -mx-4 px-4">
          {BOUNTIES.map((b, i) => (
            <Reveal key={i} delay={i * 80} className="snap-start shrink-0 w-72">
              <div className="card card-interactive">
                <div className="flex items-center justify-between mb-3">
                  <span className="badge badge-success">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Live
                  </span>
                  <span className="badge badge-neutral">{b.tag}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mb-1">{b.brand}</p>
                <h3 className="font-heading font-bold text-slate-900 text-sm leading-snug mb-4 line-clamp-2">{b.task}</h3>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">Reward</span>
                  <span className="font-mono tabular-nums font-bold text-pink-600 text-lg group-hover:scale-105 transition-transform">{b.reward}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={400}>
          <div className="text-center mt-10">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 text-sm font-semibold text-pink-600 hover:text-pink-700 transition-colors group"
            >
              See all bounties
              <ArrowRight size={16} strokeWidth={2} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── SECTION 6: TESTIMONIALS ─── */

function TestimonialsSection() {
  return (
    <section className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="eyebrow text-center mb-3">In their words</p>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 text-center mb-16">
            Don&apos;t take our word for it.
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={i} delay={i * 120}>
              <div className="card border-l-4 border-l-pink-500">
                <Quote size={24} strokeWidth={2} className="text-pink-300 mb-4" />
                <p className="text-slate-600 text-sm leading-relaxed mb-6">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="avatar bg-pink-100 text-pink-700">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── SECTION 7: FINAL CTA ─── */

function FinalCTASection() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden bg-pink-600">
      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Reveal>
          <p className="eyebrow text-white/80 mb-3">Ready when you are</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
            Ready to hunt?
          </h2>
        </Reveal>
        <Reveal delay={150}>
          <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
            Whether you&apos;re here to earn or here to grow your brand — the board&apos;s open.
          </p>
        </Reveal>
        <Reveal delay={300}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-pink-700 bg-white rounded-full hover:scale-[1.03] hover:shadow-xl transition-all duration-200"
            >
              Start hunting
            </Link>
            <Link
              href="/join/business"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white border-2 border-white/60 rounded-full hover:bg-white/10 hover:border-white hover:scale-[1.02] transition-all duration-200"
            >
              Post a bounty
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
