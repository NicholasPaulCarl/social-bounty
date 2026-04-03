interface ProBadgeProps {
  size?: 'sm' | 'md';
}

export function ProBadge({ size = 'sm' }: ProBadgeProps) {
  const sizeClasses = size === 'sm'
    ? 'text-[9px] px-1.5 py-0.5'
    : 'text-[10px] px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center font-bold tracking-wider uppercase rounded ${sizeClasses} bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30`}
      title="Pro Subscription"
    >
      PRO
    </span>
  );
}
