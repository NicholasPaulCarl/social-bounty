'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  Plus,
  ShieldCheck,
  Landmark,
  ArrowRight,
  Wallet,
  Lock,
  FileCheck,
  Repeat2,
  Banknote,
  CreditCard,
  Smartphone,
  Store,
  Calendar,
} from 'lucide-react';

/* ── FadeUp helper (same pattern as other marketing pages) ── */
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

const FLOW_STEPS = [
  {
    n: '01',
    Icon: Wallet,
    title: 'Brand funds the bounty',
    body: 'Brand pays the per-claim reward \u00d7 number of claims, plus fees, at TradeSafe\u2019s hosted checkout. The funds leave the brand\u2019s account and settle into TradeSafe escrow \u2014 not into Social Bounty.',
  },
  {
    n: '02',
    Icon: Lock,
    title: 'TradeSafe holds the escrow',
    body: 'TradeSafe Escrow (Pty) Ltd, a registered South African digital-escrow service, holds the funds in a regulated escrow account until delivery is accepted. We cannot touch the money.',
  },
  {
    n: '03',
    Icon: FileCheck,
    title: 'Brand approves a submission',
    body: 'The hunter submits proof. The brand reviews against the brief. On approval, Social Bounty (acting as AGENT) instructs TradeSafe to release payout.',
  },
  {
    n: '04',
    Icon: Banknote,
    title: 'Hunter is paid by EFT',
    body: 'TradeSafe releases the hunter\u2019s net payout directly to their registered South African bank account. Platform fees are deducted at release and settled to Social Bounty.',
  },
];

const TRADESAFE_BENEFITS = [
  {
    Icon: ShieldCheck,
    title: 'Regulated escrow partner',
    body: 'TradeSafe is a registered digital-escrow service supervised under South African law. Your money is held under rules we do not write.',
  },
  {
    Icon: Landmark,
    title: 'Funds never sit with us',
    body: 'Social Bounty is not a bank. We never hold, store, or re-transmit bounty funds. The money flows brand \u2192 TradeSafe \u2192 hunter.',
  },
  {
    Icon: Repeat2,
    title: 'Reversible when it should be',
    body: 'If a submission is rejected, a bounty is cancelled, or a post disappears after payout, the ledger reverses cleanly \u2014 no chasing, no grey area.',
  },
  {
    Icon: FileCheck,
    title: 'Double-entry audit trail',
    body: 'Every rand is booked into an append-only ledger with matched debits and credits, tied to a TradeSafe transaction and an audit-log row.',
  },
];

const PAYMENT_METHODS = [
  { Icon: CreditCard, label: 'Visa & Mastercard', body: 'Debit or credit card at TradeSafe\u2019s hosted checkout.' },
  { Icon: Banknote, label: 'Instant EFT (Ozow)', body: 'Pay direct from your bank via Ozow\u2019s secure gateway.' },
  { Icon: Smartphone, label: 'SnapScan', body: 'Scan, approve, done \u2014 mobile-first payment.' },
  { Icon: Store, label: 'Manual EFT', body: 'Bank-deposit reference for slower but no-fee transfers.' },
  { Icon: Calendar, label: 'PayJustNow', body: 'Split a bounty deposit into instalments (subject to approval).' },
  { Icon: CreditCard, label: 'Ecentric', body: 'Card-present flows for in-person scenarios.' },
];

const IMPORTANT_TERMS: { title: string; body: React.ReactNode }[] = [
  {
    title: 'Platform custody',
    body: (
      <>
        All bounty funds flow through TradeSafe escrow. Social Bounty never holds your balance in
        its own account. See the{' '}
        <Link href="/legal/escrow-terms" className="text-pink-600 hover:text-pink-700 font-medium">
          Payout &amp; Escrow Terms
        </Link>
        .
      </>
    ),
  },
  {
    title: 'Fees snapshotted at approval',
    body: (
      <>
        The fee rates in force at the moment a submission is approved are the ones that apply —
        even if plans change later. Full fee schedule in the{' '}
        <Link href="/legal/terms-of-service#fees" className="text-pink-600 hover:text-pink-700 font-medium">
          Terms of Service
        </Link>
        .
      </>
    ),
  },
  {
    title: 'Integer minor units',
    body: 'All amounts are stored as integer cents \u2014 never as floating-point \u2014 to eliminate rounding drift. You see the same number we bill.',
  },
  {
    title: 'Refunds & reversals',
    body: (
      <>
        Rejected, cancelled, or (after payout) auto-flagged-invisible bounties refund to the original
        payment method less non-recoverable TradeSafe fees. Details in the{' '}
        <Link
          href="/legal/escrow-terms#refunds-and-reversals"
          className="text-pink-600 hover:text-pink-700 font-medium"
        >
          refunds clause
        </Link>
        .
      </>
    ),
  },
  {
    title: 'South African banking only',
    body: 'Hunter payouts settle by EFT to a South African bank account. No mobile-money wallets, no foreign accounts, no crypto.',
  },
  {
    title: 'Tax is yours',
    body: (
      <>
        Hunter payouts are payments for services — not employment income. No PAYE is withheld.
        Your tax is your responsibility; details in the{' '}
        <Link
          href="/legal/escrow-terms#tax"
          className="text-pink-600 hover:text-pink-700 font-medium"
        >
          tax section
        </Link>
        .
      </>
    ),
  },
];

const FAQS = [
  {
    q: 'Who holds my money?',
    a: 'TradeSafe Escrow (Pty) Ltd holds every rand from the moment a brand deposits it to the moment it releases to a hunter. Social Bounty is the AGENT on the transaction \u2014 we instruct release but we do not take custody.',
  },
  {
    q: 'How much does the brand pay on a R500 bounty?',
    a: 'On a single-claim R500 bounty: R500 reward + R75 brand admin fee (15%) + R25 transaction fee (5%) + R17.50 global platform fee (3.5%) = R617.50 at checkout. For multi-claim bounties, the per-claim total multiplies through — a 10-claim R500 bounty escrows R6,175 up front so all 10 approved hunters can be paid. Each hunter receives R500 minus 20% commission and 3.5% global platform fee = R382.50 net per approved submission.',
  },
  {
    q: 'Why does the brand pay up front for every claim?',
    a: 'TradeSafe escrows the full pot at funding time so each approved hunter is guaranteed payable. Reducing claim count after funding is not supported — to change capacity, the brand cancels the bounty (refund follows TradeSafe’s refund channel) and creates a new one. We made this trade-off for ledger integrity: every approved submission must have escrowed funds waiting.',
  },
  {
    q: 'When does the hunter get paid?',
    a: 'After the brand approves the submission, Social Bounty instructs TradeSafe to release. TradeSafe typically settles to the hunter\u2019s bank the same business day. Weekends and public holidays push to the next business day.',
  },
  {
    q: 'What happens if the brand rejects every submission?',
    a: 'The escrowed funds refund to the brand\u2019s original payment method, less any non-recoverable payment-method fees charged by TradeSafe or the paying bank. Refunds follow TradeSafe\u2019s refund channel and typically take 2\u20137 business days.',
  },
  {
    q: 'Is Social Bounty VAT-registered?',
    a: 'Not yet. Our turnover is below the R1 million compulsory-registration threshold under the Value-Added Tax Act 89 of 1991, so no VAT is charged on our fees. We will display a VAT number and give 30 days\u2019 notice before adding VAT if we register.',
  },
  {
    q: 'Can I dispute a decision?',
    a: 'Yes. Every approval, reversal, and super-admin correction is audit-logged. Raise a dispute through the in-app flow or our Complaints & Dispute Resolution process and we investigate on a defined response window.',
  },
];

/* ── Page ── */

export default function PaymentPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-white text-text-primary font-body">

      {/* ══ HERO ══ */}
      <section className="pt-16 pb-12 sm:pt-24 sm:pb-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeUp>
            <p className="eyebrow mb-3">Payment</p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight tracking-tight mb-6">
              Transparent payments. <span className="gradient-text">Held in escrow.</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Every bounty is funded up-front and held by TradeSafe until the brand approves the work.
              No agencies, no middlemen, no funds sitting with us.
            </p>
          </FadeUp>

          <FadeUp delay={100}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <span className="badge badge-success">
                <ShieldCheck size={14} strokeWidth={2} />
                TradeSafe escrow
              </span>
              <span className="badge badge-neutral">
                <Lock size={14} strokeWidth={2} />
                Regulated SA partner
              </span>
              <span className="badge badge-neutral">
                <Banknote size={14} strokeWidth={2} />
                Pay on approval
              </span>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══ PAYMENT FLOW ══ */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-12">
            <p className="eyebrow mb-3">How it flows</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary">
              Four steps from deposit to payout.
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FLOW_STEPS.map(({ n, Icon, title, body }, i) => (
              <FadeUp key={n} delay={i * 80}>
                <div className="h-full card flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600 shrink-0">
                      <Icon size={20} strokeWidth={2} />
                    </div>
                    <span className="font-mono tabular-nums text-xs font-bold text-pink-600 tracking-widest">STEP {n}</span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-text-primary mb-2">{title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEE BREAKDOWN ══ */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-12">
            <p className="eyebrow mb-3">Fee breakdown</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary">
              Worked example on a single-claim R500 bounty.
            </h2>
            <p className="mt-4 text-base text-slate-600 max-w-xl mx-auto">
              Current rates under our Free plan. Multi-claim bounties multiply this through &mdash;
              a 5-claim bounty escrows 5&times; this total at checkout. Pro rates are coming soon
              and will be published here before launch.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Brand breakdown */}
            <FadeUp delay={0}>
              <div className="h-full card card-feature flex flex-col">
                <p className="eyebrow mb-3">Brand pays</p>
                <h3 className="font-heading text-xl font-bold text-text-primary mb-6">At checkout</h3>

                <dl className="space-y-3 mb-6">
                  <FeeRow label="Reward per claim" amount="R500.00" note="you set it" />
                  <FeeRow label="Brand admin fee" amount="R75.00" note="15%" />
                  <FeeRow label="Transaction fee" amount="R25.00" note="5%" />
                  <FeeRow label="Global platform fee" amount="R17.50" note="3.5%" />
                </dl>

                <div className="mt-auto pt-5 border-t-2 border-slate-900 flex items-center justify-between">
                  <span className="font-heading font-bold text-text-primary">Per-claim total</span>
                  <span className="font-mono tabular-nums text-2xl font-bold text-text-primary">R617.50</span>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Multiply by your claim count at checkout: 5 claims = R3,087.50; 10 claims = R6,175.00.
                </p>
              </div>
            </FadeUp>

            {/* Hunter breakdown */}
            <FadeUp delay={100}>
              <div className="h-full card card-feature flex flex-col border-2 border-pink-300 shadow-lg shadow-pink-100/50">
                <p className="eyebrow mb-3" style={{ color: '#db2777' }}>Hunter earns</p>
                <h3 className="font-heading text-xl font-bold text-text-primary mb-6">On approval</h3>

                <dl className="space-y-3 mb-6">
                  <FeeRow label="Reward per claim" amount="R500.00" note="face value" />
                  <FeeRow label="Hunter commission" amount="−R100.00" note="20%" negative />
                  <FeeRow label="Global platform fee" amount="−R17.50" note="3.5%" negative />
                </dl>

                <div className="mt-auto pt-5 border-t-2 border-pink-600 flex items-center justify-between">
                  <span className="font-heading font-bold text-pink-700">Net per approval</span>
                  <span className="font-mono tabular-nums text-2xl font-bold text-pink-700">R382.50</span>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Each approved submission earns the hunter R382.50 — brands can approve up to the bounty&rsquo;s claim count.
                </p>
              </div>
            </FadeUp>
          </div>

          <FadeUp delay={200}>
            <p className="text-center text-sm text-slate-500 mt-8">
              Amounts stored as integer cents. No rounding drift. Full numeric example in the{' '}
              <Link href="/legal/terms-of-service#fees" className="text-pink-600 hover:text-pink-700 font-medium">
                Terms of Service
              </Link>
              .
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ══ TRADESAFE BENEFITS ══ */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-12">
            <p className="eyebrow mb-3">Why TradeSafe</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary">
              Safer than a handshake. Cleaner than a wallet.
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {TRADESAFE_BENEFITS.map(({ Icon, title, body }, i) => (
              <FadeUp key={title} delay={i * 80}>
                <div className="h-full card flex gap-5">
                  <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center text-pink-600 shrink-0">
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-text-primary mb-2">{title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{body}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={320}>
            <p className="text-center text-sm text-slate-500 mt-8">
              Read TradeSafe’s own service terms and fee schedule at{' '}
              <a
                href="https://www.tradesafe.co.za"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-600 hover:text-pink-700 font-medium"
              >
                tradesafe.co.za
              </a>
              .
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ══ PAYMENT METHODS ══ */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-12">
            <p className="eyebrow mb-3">Payment methods</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary">
              Pay however you like.
            </h2>
            <p className="mt-4 text-base text-slate-600 max-w-xl mx-auto">
              Inbound payments captured through TradeSafe’s hosted checkout. The list at checkout
              is controlled by TradeSafe and may change without notice.
            </p>
          </FadeUp>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {PAYMENT_METHODS.map(({ Icon, label, body }, i) => (
              <FadeUp key={label} delay={i * 50}>
                <div className="h-full rounded-xl border border-slate-200 p-5 hover:border-pink-200 transition-colors">
                  <Icon size={20} strokeWidth={2} className="text-pink-600 mb-3" />
                  <p className="font-heading font-bold text-text-primary text-sm mb-1">{label}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={400}>
            <p className="text-center text-sm text-slate-500 mt-8">
              Hunter payouts settle by EFT to a South African bank account only.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ══ SUBSCRIPTIONS COMING SOON ══ */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-12">
            <p className="eyebrow mb-3">Subscriptions</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary">
              Pro tiers are <span className="text-pink-600">coming soon.</span>
            </h2>
            <p className="mt-4 text-base text-slate-600 max-w-xl mx-auto">
              Right now, everyone’s on the Free plan. We’re wiring up a TradeSafe-backed
              subscription rail before Pro Hunter and Pro Brand go live. Pricing will be published
              here before launch.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Pro Hunter teaser */}
            <FadeUp delay={0}>
              <div className="h-full card card-feature flex flex-col relative opacity-75">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge badge-neutral px-4 py-1 uppercase">
                  Coming soon
                </div>
                <h3 className="font-heading text-xl font-bold text-text-primary mb-1">Pro Hunter</h3>
                <p className="text-sm text-slate-500 mb-6">For serious earners</p>

                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    'Lower platform commission',
                    'Faster payouts',
                    'Access to closed (invite-only) bounties',
                    'Verified hunter badge',
                    'Priority support',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-slate-500">
                      <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Lock size={10} strokeWidth={2} className="text-slate-400" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  disabled
                  className="btn btn-secondary rounded-full text-center justify-center cursor-not-allowed"
                  aria-disabled="true"
                >
                  Pro upgrade coming soon
                </button>
              </div>
            </FadeUp>

            {/* Pro Brand teaser */}
            <FadeUp delay={100}>
              <div className="h-full card card-feature flex flex-col relative opacity-75">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge badge-neutral px-4 py-1 uppercase">
                  Coming soon
                </div>
                <h3 className="font-heading text-xl font-bold text-text-primary mb-1">Pro Brand</h3>
                <p className="text-sm text-slate-500 mb-6">For brands that post regularly</p>

                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    'Lower brand admin fee',
                    'Closed (invite-only) bounties',
                    'Application and invitation management',
                    'Priority support',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-slate-500">
                      <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Lock size={10} strokeWidth={2} className="text-slate-400" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  disabled
                  className="btn btn-secondary rounded-full text-center justify-center cursor-not-allowed"
                  aria-disabled="true"
                >
                  Pro upgrade coming soon
                </button>
              </div>
            </FadeUp>
          </div>

          <FadeUp delay={200}>
            <p className="text-center text-sm text-slate-500 mt-8">
              Everyone starts on Free. No credit card, no trial — just sign up and start.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ══ IMPORTANT TERMS ══ */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-12">
            <p className="eyebrow mb-3">Important terms</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary">
              The short version.
            </h2>
            <p className="mt-4 text-base text-slate-600 max-w-xl mx-auto">
              The full story lives in the legal docs — but these are the rules that shape every
              transaction.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {IMPORTANT_TERMS.map(({ title, body }, i) => (
              <FadeUp key={title} delay={i * 50}>
                <div className="h-full card">
                  <h3 className="font-heading text-base font-bold text-text-primary mb-2">{title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={360}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/legal/escrow-terms"
                className="inline-flex items-center gap-2 text-sm font-semibold text-pink-600 hover:text-pink-700 transition-colors group"
              >
                Payout &amp; Escrow Terms
                <ArrowRight size={14} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <span className="text-slate-300" aria-hidden="true">•</span>
              <Link
                href="/legal/terms-of-service"
                className="inline-flex items-center gap-2 text-sm font-semibold text-pink-600 hover:text-pink-700 transition-colors group"
              >
                Terms of Service
                <ArrowRight size={14} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <span className="text-slate-300" aria-hidden="true">•</span>
              <Link
                href="/legal/consumer-rights"
                className="inline-flex items-center gap-2 text-sm font-semibold text-pink-600 hover:text-pink-700 transition-colors group"
              >
                Consumer Rights
                <ArrowRight size={14} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <span className="text-slate-300" aria-hidden="true">•</span>
              <Link
                href="/legal/complaints"
                className="inline-flex items-center gap-2 text-sm font-semibold text-pink-600 hover:text-pink-700 transition-colors group"
              >
                Complaints &amp; Disputes
                <ArrowRight size={14} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-12">
            <p className="eyebrow mb-3">Questions</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary">
              Frequently asked questions
            </h2>
          </FadeUp>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FadeUp key={i} delay={i * 50}>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <button
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span className="font-heading font-semibold text-text-primary text-sm sm:text-base pr-4">{faq.q}</span>
                    <Plus
                      size={18}
                      strokeWidth={2}
                      className={`shrink-0 text-slate-400 transition-transform duration-200 ${openFaq === i ? 'rotate-45' : ''}`}
                    />
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: openFaq === i ? '240px' : '0px', opacity: openFaq === i ? 1 : 0 }}
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
              Funded up-front. Paid on approval.
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              No agencies. No wallets. No credit needed.
            </p>
          </FadeUp>
          <FadeUp delay={100}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="btn btn-primary btn-lg rounded-full">
                Start hunting
              </Link>
              <Link
                href="/join/business"
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

/* ── Helpers ── */

function FeeRow({ label, amount, note, negative = false }: { label: string; amount: string; note?: string; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <dt className="text-sm font-medium text-slate-700">{label}</dt>
        {note && <dd className="text-xs text-slate-400 mt-0.5">{note}</dd>}
      </div>
      <dd className={`font-mono tabular-nums text-base font-semibold ${negative ? 'text-rose-600' : 'text-text-primary'}`}>{amount}</dd>
    </div>
  );
}
