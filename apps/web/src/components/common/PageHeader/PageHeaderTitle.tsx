interface PageHeaderTitleProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeaderTitle({ title, subtitle, actions }: PageHeaderTitleProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="font-heading font-bold text-text-primary tracking-tight" style={{ fontSize: 'clamp(26px, 4vw, 36px)', lineHeight: 1.05 }}>
          {(() => {
            const spaceIdx = title.indexOf(' ');
            if (spaceIdx === -1) return <span className="gradient-text">{title}</span>;
            return (
              <>
                <span className="gradient-text">{title.slice(0, spaceIdx)}</span>
                {title.slice(spaceIdx)}
              </>
            );
          })()}
        </h1>
        {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  );
}
