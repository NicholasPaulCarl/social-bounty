'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Hash } from 'lucide-react';

/* Lucide dropped Twitter/Instagram brand glyphs per their trademark policy.
   Following ICONS.md — use tiny inline SVGs at Lucide visual weight (24×24,
   2px strokes or currentColor fill). */
const TwitterIcon = ({ size = 20, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const InstagramIcon = ({ size = 20, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const NAV_LINKS = [
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'For hunters', href: '/join/hunter' },
  { label: 'For brands', href: '/join/business' },
  { label: 'Payment', href: '/payment' },
  { label: 'Contact', href: '/contact' },
];

const FOOTER_HUNTERS = [
  { label: 'Browse bounties', href: '/join/hunter' },
  { label: 'Join as hunter', href: '/signup' },
  { label: 'How it works', href: '/#how-it-works' },
];

const FOOTER_BRANDS = [
  { label: 'Post a bounty', href: '/join/business' },
  { label: 'Join as business', href: '/signup' },
];

const FOOTER_COMPANY = [
  { label: 'Payment', href: '/payment' },
  { label: 'Contact', href: '/contact' },
  { label: 'Legal', href: '/legal' },
];

const SOCIAL_ICONS: { label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { label: 'Twitter', Icon: TwitterIcon },
  { label: 'Instagram', Icon: InstagramIcon },
  { label: 'Hashtag', Icon: Hash },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-text-primary font-body">
      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-heading font-bold text-pink-600">
              Social Bounty
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative text-sm font-medium text-slate-600 hover:text-pink-600 transition-colors group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-600 transition-all duration-200 group-hover:w-full" />
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-text-primary transition-colors">
                Log in
              </Link>
              <Link
                href="/signup"
                className="btn btn-primary btn-sm rounded-full"
              >
                Sign up
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-slate-600"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} strokeWidth={2} /> : <Menu size={24} strokeWidth={2} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 animate-[slideDown_300ms_ease-out]">
            <div className="px-4 py-6 space-y-4">
              {NAV_LINKS.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-lg font-medium text-slate-700 hover:text-pink-600 transition-colors"
                  style={{ animationDelay: `${i * 60}ms` }}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <Link href="/login" className="block text-lg font-medium text-slate-600" onClick={() => setMobileOpen(false)}>
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="btn btn-primary w-full rounded-full"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Main Content ── */}
      <main>{children}</main>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div>
              <p className="text-xl font-heading font-bold text-white mb-2">Social Bounty</p>
              <p className="text-sm text-slate-500 mb-4">The bounty board for the internet.</p>
              <div className="flex gap-4">
                {SOCIAL_ICONS.map(({ label, Icon }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="text-slate-500 hover:text-pink-400 hover:scale-[1.12] transition-all duration-200"
                  >
                    <Icon size={20} strokeWidth={2} />
                  </a>
                ))}
              </div>
            </div>

            {/* Hunters */}
            <div>
              <p className="eyebrow text-white mb-4">Hunters</p>
              {FOOTER_HUNTERS.map((link) => (
                <Link key={link.href} href={link.href} className="block text-sm text-slate-500 hover:text-pink-400 mb-2 group transition-colors">
                  <span className="relative">
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-pink-400 group-hover:w-full transition-all duration-200" />
                  </span>
                </Link>
              ))}
            </div>

            {/* Brands */}
            <div>
              <p className="eyebrow text-white mb-4">Brands</p>
              {FOOTER_BRANDS.map((link) => (
                <Link key={link.href} href={link.href} className="block text-sm text-slate-500 hover:text-pink-400 mb-2 group transition-colors">
                  <span className="relative">
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-pink-400 group-hover:w-full transition-all duration-200" />
                  </span>
                </Link>
              ))}
            </div>

            {/* Company */}
            <div>
              <p className="eyebrow text-white mb-4">Company</p>
              {FOOTER_COMPANY.map((link) => (
                <Link key={link.href} href={link.href} className="block text-sm text-slate-500 hover:text-pink-400 mb-2 group transition-colors">
                  <span className="relative">
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-pink-400 group-hover:w-full transition-all duration-200" />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 text-center text-xs text-slate-600">
            &copy; 2026 Social Bounty. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
