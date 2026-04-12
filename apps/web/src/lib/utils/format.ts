export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const CURRENCY_LOCALE_MAP: Record<string, string> = {
  ZAR: 'en-ZA',
  USD: 'en-US',
  GBP: 'en-GB',
  EUR: 'de-DE',
};

export function formatCurrency(value: string | number | null, currency?: string): string {
  if (value === null || value === undefined) return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  const curr = currency || 'ZAR'; // Default to ZAR (platform default currency)
  const locale = CURRENCY_LOCALE_MAP[curr] || 'en-ZA';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: curr,
  }).format(num);
}

export function formatPayoutMethod(method: string | null | undefined): string {
  if (!method) return '';
  const labels: Record<string, string> = {
    PAYPAL: 'PayPal',
    BANK_TRANSFER: 'Bank Transfer',
    E_WALLET: 'E-Wallet',
  };
  return labels[method] || formatEnumLabel(method);
}

export function formatEnumLabel(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diffMs)) return '';
  if (diffMs < 0) return 'just now';
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatCount(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function timeRemaining(endDate: string): string | null {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 7) return `${days} days left`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  return `${hours} hour${hours > 1 ? 's' : ''} left`;
}
