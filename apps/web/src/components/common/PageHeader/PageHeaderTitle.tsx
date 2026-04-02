interface PageHeaderTitleProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeaderTitle({ title, subtitle, actions }: PageHeaderTitleProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-bold text-text-primary">{title}</h1>
        {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  );
}
