'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────

type Category = 'support' | 'sales' | 'general';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

interface FormData {
  name: string;
  email: string;
  category: Category;
  message: string;
}

// ─── Fade-up hook ──────────────────────────────────────────────────────────

function useFadeUp(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return {
    ref,
    style: {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'opacity 500ms ease, transform 500ms ease',
    },
  };
}

// ─── Category cards ─────────────────────────────────────────────────────────

const CONTACT_CARDS: {
  title: string;
  body: string;
  cta: string;
  category: Category;
  icon: string;
}[] = [
  {
    title: "I'm a Hunter",
    body: 'Submission questions, account issues, payment help — we\'ve got you.',
    cta: 'Get Help',
    category: 'support',
    icon: '🎯',
  },
  {
    title: "I'm a Brand",
    body: "Sales questions, partnerships, or help getting started? Let's chat.",
    cta: 'Talk to Us',
    category: 'sales',
    icon: '🏢',
  },
  {
    title: 'Something else',
    body: 'Press, partnerships, feedback, or just saying hi.',
    cta: 'Reach Out',
    category: 'general',
    icon: '✉️',
  },
];

// ─── FAQ data ────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: 'How fast do you respond?',
    answer:
      'Usually within 24 hours on weekdays. We monitor our inbox closely and aim to respond to every message — no ticket queue, no bots.',
  },
  {
    question: 'I have a billing issue.',
    answer:
      "Select 'Support' in the form above and describe the issue. Include your email address on file and any relevant transaction details. We'll resolve it as fast as possible.",
  },
  {
    question: 'Can I partner with Social Bounty?',
    answer:
      "Absolutely. Whether you're a brand, creator platform, or agency — we're open to creative partnerships. Select 'Sales' in the form and tell us what you have in mind.",
  },
];

// ─── FAQ Item ────────────────────────────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-slate-50 transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-slate-800">{question}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-slate-400 flex-shrink-0 transition-transform duration-300"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div
        style={{
          maxHeight: open ? '200px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 300ms ease',
        }}
      >
        <p className="px-5 py-4 text-sm text-slate-600 bg-slate-50 border-t border-slate-100 font-body">
          {answer}
        </p>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ContactPage() {
  const formRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    category: 'general',
    message: '',
  });
  const [formState, setFormState] = useState<FormState>('idle');

  // Fade-up refs
  const hero = useFadeUp(80);
  const cards = useFadeUp(200);
  const form = useFadeUp(320);
  const info = useFadeUp(400);

  function scrollToForm(category: Category) {
    setFormData((prev) => ({ ...prev, category }));
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState('submitting');

    // Simulated submission — replace with real API call when backend is ready
    setTimeout(() => {
      const shouldSucceed = Math.random() > 0.05; // 95% simulated success
      setFormState(shouldSucceed ? 'success' : 'error');
    }, 1500);
  }

  const inputClass =
    'w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-400 outline-none transition text-slate-900 font-body text-sm bg-white placeholder:text-slate-400';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

  return (
    <>
      {/* ── Section 1: Hero ─────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={hero.ref} style={hero.style} className="max-w-2xl">
            <h1 className="text-4xl font-heading font-bold text-slate-900 mb-4">
              Let&apos;s talk.
            </h1>
            <p className="text-lg text-slate-600 font-body leading-relaxed">
              Whether you&apos;re a Hunter, a brand, or just curious — we&apos;re here and we
              respond fast.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 2: Contact Cards ─────────────────────────────────────────── */}
      <section className="pb-16 sm:pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={cards.ref} style={cards.style}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {CONTACT_CARDS.map((card) => (
                <div
                  key={card.category}
                  className="bg-white border border-slate-200 rounded-xl p-6 hover:border-pink-300 transition flex flex-col gap-4 group"
                >
                  <div className="text-3xl" aria-hidden="true">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">
                      {card.title}
                    </h3>
                    <p className="text-sm text-slate-600 font-body leading-relaxed">{card.body}</p>
                  </div>
                  <div className="mt-auto">
                    <button
                      onClick={() => scrollToForm(card.category)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-pink-600 hover:text-pink-700 transition-colors group-hover:underline underline-offset-2"
                    >
                      {card.cta}
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
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Contact Form ──────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={formRef}>
            <div ref={form.ref} style={form.style} className="max-w-xl mx-auto">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-2 text-center">
                Send us a message
              </h2>
              <p className="text-sm text-slate-500 font-body text-center mb-10">
                We read every message and respond within 24 hours.
              </p>

              {/* Success state */}
              <div
                style={{
                  opacity: formState === 'success' ? 1 : 0,
                  transform: formState === 'success' ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'opacity 400ms ease, transform 400ms ease',
                  pointerEvents: formState === 'success' ? 'auto' : 'none',
                  position: formState === 'success' ? 'relative' : 'absolute',
                }}
              >
                {formState === 'success' && (
                  <div className="text-center py-12 px-6 bg-white border border-slate-200 rounded-2xl">
                    <div className="text-4xl mb-4">🎉</div>
                    <h3 className="text-xl font-heading font-semibold text-slate-900 mb-3">
                      Sent! We&apos;ll be in touch within 24 hours.
                    </h3>
                    <p className="text-sm text-slate-600 font-body mb-6">
                      In the meantime, maybe hunt a bounty?
                    </p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-pink-600 hover:text-pink-700 transition-colors"
                    >
                      Browse bounties
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

              {/* Form */}
              {formState !== 'success' && (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className={labelClass}>
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="category" className={labelClass}>
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="support">Support</option>
                      <option value="sales">Sales</option>
                      <option value="general">General</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className={labelClass}>
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      minLength={10}
                      rows={5}
                      placeholder="Tell us what's on your mind..."
                      value={formData.message}
                      onChange={handleChange}
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  {/* Error banner */}
                  {formState === 'error' && (
                    <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                      <span className="text-red-500 mt-0.5" aria-hidden="true">
                        ⚠️
                      </span>
                      <p className="text-sm text-red-700 font-body">
                        Something tripped up. Try again, or email us directly at{' '}
                        <a
                          href="mailto:hello@socialbounty.com"
                          className="font-semibold underline underline-offset-2"
                        >
                          hello@socialbounty.com
                        </a>
                        .
                      </p>
                    </div>
                  )}

                  {/* Submit */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={formState === 'submitting'}
                      className="w-full bg-pink-600 text-white rounded-full px-8 py-3 text-sm font-semibold hover:bg-pink-700 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                    >
                      {formState === 'submitting' ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg
                            className="animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                          </svg>
                          Sending...
                        </span>
                      ) : (
                        'Send It'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Quick Links & FAQ ─────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={info.ref} style={info.style}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
              {/* Left: Contact details */}
              <div>
                <h2 className="text-xl font-heading font-bold text-slate-900 mb-6">
                  Reach us directly
                </h2>

                <div className="space-y-5">
                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-pink-600"
                        aria-hidden="true"
                      >
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                        Email
                      </p>
                      <a
                        href="mailto:hello@socialbounty.com"
                        className="text-sm font-medium text-slate-800 hover:text-pink-600 transition-colors"
                      >
                        hello@socialbounty.com
                      </a>
                    </div>
                  </div>

                  {/* Social links */}
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-pink-600"
                        aria-hidden="true"
                      >
                        <path d="M18 20.7c-2.1 0-3.8-1.7-3.8-3.8V7.1c0-2.1 1.7-3.8 3.8-3.8s3.8 1.7 3.8 3.8v9.8c0 2.1-1.7 3.8-3.8 3.8z" />
                        <path d="M6 20.7c-2.1 0-3.8-1.7-3.8-3.8V7.1c0-2.1 1.7-3.8 3.8-3.8s3.8 1.7 3.8 3.8v9.8c0 2.1-1.7 3.8-3.8 3.8z" />
                        <path d="M12 20.7a8.7 8.7 0 0 1-8.7-8.7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Follow us
                      </p>
                      <div className="flex items-center gap-4">
                        <a
                          href="https://twitter.com/socialbounty"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-slate-600 hover:text-pink-600 transition-colors flex items-center gap-1.5"
                          aria-label="Social Bounty on Twitter"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                          @socialbounty
                        </a>
                        <a
                          href="https://instagram.com/socialbounty"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-slate-600 hover:text-pink-600 transition-colors flex items-center gap-1.5"
                          aria-label="Social Bounty on Instagram"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                          </svg>
                          Instagram
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Response time badge */}
                  <div className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" aria-hidden="true" />
                    <span className="text-xs font-medium text-slate-600">
                      Typical response within 24 hours
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: FAQ */}
              <div>
                <h2 className="text-xl font-heading font-bold text-slate-900 mb-6">
                  Common questions
                </h2>
                <div className="space-y-3">
                  {FAQ_ITEMS.map((item) => (
                    <FaqItem key={item.question} question={item.question} answer={item.answer} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
