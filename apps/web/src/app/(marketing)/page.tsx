'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';

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
  { num: '01', icon: '01', title: 'Post a bounty', desc: 'Define the bounty, set the reward, hit publish. Hunters see it instantly.' },
  { num: '02', icon: '02', title: 'Hunters deliver', desc: 'Real people complete your bounty and submit proof. Submissions roll in daily.' },
  { num: '03', icon: '03', title: 'Review & reward', desc: 'Approve what you love. Pay only for results. That\'s it.' },
];

const BOUNTIES = [
  { brand: 'Fresh Roast', task: 'Instagram Reel — Summer Coffee Challenge', reward: 'R 500', tag: 'Social Media' },
  { brand: 'UrbanFit Gym', task: 'TikTok Gym Transformation Video', reward: 'R 750', tag: 'Content' },
  { brand: 'Vivid Media', task: 'Brand Campaign — Summer Push', reward: 'R 2,500', tag: 'Campaign' },
  { brand: 'Fresh Roast', task: 'Product Photography — New Blend', reward: 'R 1,500', tag: 'Creative' },
  { brand: 'UrbanFit Gym', task: 'Unboxing Video — Merch Drop', reward: 'R 600', tag: 'Content' },
];

const TESTIMONIALS = [
  { quote: 'I make an extra R300 a month just picking up bounties on my commute. No interviews, no contracts — just proof and pay.', name: 'Jess M.', role: 'Hunter' },
  { quote: 'We got 40 pieces of UGC in a week for less than what our agency charged for five. Game changer.', name: 'Tom K.', role: 'Marketing Lead' },
  { quote: 'Finally, a platform that doesn\'t care how many followers I have. I just do the work and earn.', name: 'Amira R.', role: 'Hunter' },
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
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #fdf2f8 0%, #eff6ff 40%, #fce7f3 70%, #dbeafe 100%)',
      }}
    >
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-30 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, #DB2777, transparent 70%)',
            animation: 'heroFloat 20s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-25 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, #2563EB, transparent 70%)',
            animation: 'heroFloat 25s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-15 blur-[80px]"
          style={{
            background: 'radial-gradient(circle, #DB2777, transparent 60%)',
            animation: 'heroFloat 18s ease-in-out infinite',
            animationDelay: '-8s',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-0 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">
          {/* Copy — 3/5 */}
          <div className="lg:col-span-3">
            <Reveal>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-bold text-slate-900 leading-[1.05] tracking-tight">
                The bounty board
                <br />
                <span className="bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                  for the internet.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={200}>
              <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-xl leading-relaxed">
                Brands post tasks. Hunters complete them. Real rewards, no gatekeepers, no agencies. Just results.
              </p>
            </Reveal>

            <Reveal delay={400}>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-pink-600 rounded-full hover:bg-pink-700 hover:scale-[1.03] hover:shadow-xl hover:shadow-pink-600/25 transition-all duration-200"
                >
                  Start Hunting
                  <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
                <Link
                  href="/join/business"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-pink-600 border-2 border-pink-600 rounded-full hover:bg-pink-50 hover:scale-[1.02] transition-all duration-200"
                >
                  Post a Bounty
                </Link>
              </div>
            </Reveal>

            <Reveal delay={600}>
              <p className="mt-8 text-sm text-slate-500">
                Join <span className="font-mono font-bold text-pink-600 text-base">{visible ? count.toLocaleString() : '0'}+</span> Hunters already earning daily.
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
                <div className="w-72 sm:w-80 bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-200/60 p-6 transform rotate-2">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      Live
                    </span>
                    <span className="text-xs text-slate-400">2h ago</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mb-1">Fresh Roast Coffee</p>
                  <h3 className="font-heading font-bold text-slate-900 text-sm leading-snug mb-3">
                    Instagram Reel — Summer Coffee Challenge
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Social Media</span>
                    <span className="font-mono font-bold text-pink-600 text-lg">R 500</span>
                  </div>
                </div>
                {/* Second card behind */}
                <div className="absolute -bottom-4 -left-4 w-72 sm:w-80 bg-white/60 rounded-2xl border border-slate-200/40 p-6 -z-10 transform -rotate-3 blur-[1px]">
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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-slate-900 text-center">
            Three steps. <span className="text-pink-600">Zero agencies.</span>
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {STEPS.map((step, i) => (
            <Reveal key={step.num} delay={i * 120}>
              <div className="relative text-center group">
                {/* Step number */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-pink-50 text-pink-600 font-heading font-bold text-lg mb-6 group-hover:scale-110 group-hover:bg-pink-100 transition-all duration-300">
                  {step.icon}
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 text-[10px] font-mono font-bold text-pink-400 tracking-widest">
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
            <div className="relative bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl p-8 sm:p-10 border border-pink-100 hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-600/5 transition-all duration-300 group overflow-hidden">
              <div className="absolute top-4 right-4 text-[80px] leading-none text-pink-100 font-heading font-bold select-none opacity-50 group-hover:opacity-70 transition-opacity">
                &#x2605;
              </div>
              <span className="text-xs font-semibold text-pink-600 uppercase tracking-wider">For Hunters</span>
              <h3 className="mt-3 text-2xl sm:text-3xl font-heading font-bold text-slate-900">
                Earn daily. No followers required.
              </h3>
              <ul className="mt-6 space-y-3">
                {[
                  'Pick up bounties that match your vibe',
                  'Complete small tasks from your phone or laptop',
                  'Get paid for results, not clout',
                  'Build your track record with every approved bounty',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-600 text-sm">
                    <span className="mt-1 w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/join/hunter"
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-pink-600 rounded-full hover:bg-pink-700 hover:scale-[1.02] transition-all duration-200"
              >
                Browse Bounties
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </Reveal>

          {/* Brand card */}
          <Reveal delay={150}>
            <div className="relative bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-600/5 transition-all duration-300 group overflow-hidden">
              <div className="absolute top-4 right-4 text-[80px] leading-none text-blue-50 font-heading font-bold select-none opacity-60 group-hover:opacity-80 transition-opacity">
                &#x25CF;
              </div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">For Brands</span>
              <h3 className="mt-3 text-2xl sm:text-3xl font-heading font-bold text-slate-900">
                UGC without the agency.
              </h3>
              <ul className="mt-6 space-y-3">
                {[
                  'Post a bounty in minutes, not weeks',
                  'Hunters start submitting the same day',
                  'Review everything before you pay a cent',
                  'Scale up or down instantly — no contracts',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-600 text-sm">
                    <span className="mt-1 w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/join/business"
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 hover:scale-[1.02] transition-all duration-200"
              >
                Post Your First Bounty
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
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
    { value: '24hrs', label: 'Average first submission' },
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
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white text-center mb-16">
            The numbers don&apos;t lie.
          </h2>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 100}>
              <div className="text-center">
                <p className="font-mono font-bold text-3xl sm:text-4xl lg:text-5xl text-pink-500">
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
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 text-center mb-4">
            Fresh bounties. <span className="text-pink-600">Updated daily.</span>
          </h2>
          <p className="text-center text-slate-500 mb-12">Real tasks from real brands — waiting for you right now.</p>
        </Reveal>

        <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent -mx-4 px-4">
          {BOUNTIES.map((b, i) => (
            <Reveal key={i} delay={i * 80} className="snap-start shrink-0 w-72">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Live
                  </span>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{b.tag}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mb-1">{b.brand}</p>
                <h3 className="font-heading font-bold text-slate-900 text-sm leading-snug mb-4 line-clamp-2">{b.task}</h3>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">Reward</span>
                  <span className="font-mono font-bold text-pink-600 text-lg group-hover:scale-105 transition-transform">{b.reward}</span>
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
              See All Bounties
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
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
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 text-center mb-16">
            Don&apos;t take our word for it.
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={i} delay={i * 120}>
              <div className="bg-white rounded-2xl p-6 sm:p-8 border-l-4 border-pink-500 shadow-sm hover:shadow-md transition-shadow duration-300">
                <p className="text-pink-300 text-4xl font-heading leading-none mb-4">&ldquo;</p>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-blue-100 flex items-center justify-center text-sm font-bold text-pink-600">
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
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Animated gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #DB2777, #7C3AED, #2563EB)',
          backgroundSize: '300% 300%',
          animation: 'gradientShift 15s ease infinite',
        }}
      />

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Reveal>
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
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-pink-600 bg-white rounded-full hover:scale-[1.03] hover:shadow-xl hover:shadow-white/20 transition-all duration-200"
            >
              Start Hunting
            </Link>
            <Link
              href="/join/business"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white border-2 border-white/60 rounded-full hover:bg-white/10 hover:border-white hover:scale-[1.02] transition-all duration-200"
            >
              Post a Bounty
            </Link>
          </div>
        </Reveal>
      </div>

      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </section>
  );
}
