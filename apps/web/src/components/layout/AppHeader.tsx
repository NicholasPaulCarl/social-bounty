'use client';

import { useRouter } from 'next/navigation';
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
        className="p-3 min-h-[44px] min-w-[44px] rounded-lg text-text-secondary hover:text-text-primary hover:bg-slate-100 transition-colors"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <i className="pi pi-bars text-lg" />
      </button>
      <div className="flex-1" />
      <button
        className="relative p-3 min-h-[44px] min-w-[44px] rounded-lg text-text-secondary hover:text-text-primary hover:bg-slate-100 transition-colors"
        onClick={() => router.push('/inbox')}
        aria-label="Inbox notifications"
      >
        <i className="pi pi-bell text-lg" />
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-accent-rose text-white text-[10px] font-bold leading-none px-1">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
    </header>
  );
}
