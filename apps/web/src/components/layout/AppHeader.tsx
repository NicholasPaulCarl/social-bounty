'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Bell } from 'lucide-react';
import { useUnreadCount } from '@/hooks/useInbox';

interface AppHeaderProps {
  onMenuToggle: () => void;
}

export function AppHeader({ onMenuToggle }: AppHeaderProps) {
  const router = useRouter();
  const { data: unread } = useUnreadCount();
  const count = unread?.total ?? 0;

  return (
    <header className="sticky top-0 z-20 flex items-center h-16 px-4 bg-white/80 backdrop-blur-md border-b border-slate-200 md:hidden">
      <button
        className="p-3 min-h-[44px] min-w-[44px] rounded-lg text-slate-600 hover:text-text-primary hover:bg-slate-100 transition-colors"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <Menu size={20} strokeWidth={2} />
      </button>

      <Link
        href="/"
        className="flex-1 flex items-center justify-center gap-2 font-heading font-bold tracking-tight text-[17px] text-text-primary"
        aria-label="Social Bounty home"
      >
        <span className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-lg bg-gradient-to-br from-pink-600 to-blue-600 text-white text-[13px] font-bold">
          S
        </span>
        <span>
          social<span className="text-pink-600">bounty</span>
        </span>
      </Link>

      <button
        className="relative p-3 min-h-[44px] min-w-[44px] rounded-lg text-slate-600 hover:text-text-primary hover:bg-slate-100 transition-colors"
        onClick={() => router.push('/inbox')}
        aria-label="Inbox notifications"
      >
        <Bell size={20} strokeWidth={2} />
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-danger-600 text-white text-[10px] font-bold leading-none px-1 border-2 border-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
    </header>
  );
}
