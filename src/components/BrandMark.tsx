interface BrandMarkProps {
  className?: string;
  showWordmark?: boolean;
}

export function BrandMark({
  className = "",
  showWordmark = true,
}: BrandMarkProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`.trim()}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          aria-hidden="true"
        >
          <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" />
          <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
          <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
          <rect x="10" y="10" width="3" height="3" rx="0.75" fill="white" />
          <rect x="13" y="13" width="3" height="3" rx="0.75" fill="white" />
        </svg>
      </div>
      {showWordmark ? (
        <span className="font-display text-[17px] font-semibold tracking-[-0.02em] text-foreground">
          QRShift
        </span>
      ) : null}
    </div>
  );
}
