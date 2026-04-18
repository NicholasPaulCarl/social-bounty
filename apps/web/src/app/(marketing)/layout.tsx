'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Twitter, Instagram, Hash } from 'lucide-react';

const NAV_LINKS = [
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'For hunters', href: '/join/hunter' },
  { label: 'For brands', href: '/join/business' },
  { label: 'Pricing', href: '/pricing' },
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
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy policy', href: '/privacy' },
  { label: 'Terms of service', href: '/terms' },
];

const SOCIAL_ICONS: { label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { label: 'Twitter', Icon: Twitter },
  { label: 'Instagram', Icon: Instagram },
  { label: 'Hashtag', Icon: Hash },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-body">
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
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Log in
              </Link>
              <Link
                href="/signup"
                className="btn btn-cta btn-sm"
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
                  className="btn btn-cta w-full"
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
