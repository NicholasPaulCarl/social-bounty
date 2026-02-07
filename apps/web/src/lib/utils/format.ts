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
  const curr = currency || 'USD';
  const locale = CURRENCY_LOCALE_MAP[curr] || 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: curr,
  }).format(num);
}

export function formatEnumLabel(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
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
