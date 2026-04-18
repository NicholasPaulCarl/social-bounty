import { BadgeCheck } from 'lucide-react';

interface VerifiedBadgeProps {
  className?: string;
}

export function VerifiedBadge({ className }: VerifiedBadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className ?? ''}`}
      title="Pro Hunter — Verified"
    >
      <BadgeCheck size={14} strokeWidth={2} className="text-pink-600" />
    </span>
  );
}
