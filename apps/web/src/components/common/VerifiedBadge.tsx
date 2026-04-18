interface VerifiedBadgeProps {
  className?: string;
}

export function VerifiedBadge({ className }: VerifiedBadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className ?? ''}`}
      title="Pro Hunter — Verified"
    >
      <i className="pi pi-verified text-pink-600 text-xs" />
    </span>
  );
}
