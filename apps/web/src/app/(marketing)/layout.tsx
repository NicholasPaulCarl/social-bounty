'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_LINKS = [
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'For Hunters', href: '/join/hunter' },
  { label: 'For Brands', href: '/join/business' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
];

const FOOTER_HUNTERS = [
  { label: 'Browse Bounties', href: '/join/hunter' },
  { label: 'Join as Hunter', href: '/signup' },
  { label: 'How It Works', href: '/#how-it-works' },
];

const FOOTER_BRANDS = [
  { label: 'Post a Bounty', href: '/join/business' },
  { label: 'Join as Business', href: '/signup' },
];

const FOOTER_COMPANY = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
                Log In
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2 text-sm font-semibold text-white bg-pink-600 rounded-full hover:bg-pink-700 hover:scale-[1.02] hover:shadow-lg transition-all duration-200"
              >
                Sign Up
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-slate-600"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <i className={`pi ${mobileOpen ? 'pi-times' : 'pi-bars'} text-xl`} />
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
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="block w-full text-center px-5 py-3 text-sm font-semibold text-white bg-pink-600 rounded-full"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign Up
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
                {['pi-twitter', 'pi-instagram', 'pi-hashtag'].map((icon) => (
                  <a key={icon} href="#" className="text-slate-500 hover:text-pink-400 hover:scale-[1.12] transition-all duration-200">
                    <i className={`pi ${icon} text-lg`} />
                  </a>
                ))}
              </div>
            </div>

            {/* Hunters */}
            <div>
              <p className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Hunters</p>
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
              <p className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Brands</p>
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
              <p className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Company</p>
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
