interface BrandMarkProps {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { icon: "h-7 w-7", text: "text-base" },
  md: { icon: "h-9 w-9", text: "text-lg" },
  lg: { icon: "h-12 w-12", text: "text-2xl" },
};

export function BrandMark({
  className = "",
  showWordmark = true,
  size = "md",
}: BrandMarkProps) {
  const { icon, text } = sizes[size];
  
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`.trim()}>
      <div className={`${icon} flex shrink-0 items-center justify-center rounded-lg bg-brand-gradient shadow-sm`}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className={size === "lg" ? "h-6 w-6" : size === "sm" ? "h-4 w-4" : "h-5 w-5"}
        >
          {/* QR code pattern */}
          <rect x="2" y="2" width="6" height="6" rx="1" fill="white" />
          <rect x="12" y="2" width="6" height="6" rx="1" fill="white" fillOpacity="0.7" />
          <rect x="2" y="12" width="6" height="6" rx="1" fill="white" fillOpacity="0.7" />
          <rect x="12" y="12" width="3" height="3" rx="0.5" fill="white" />
          <rect x="15" y="15" width="3" height="3" rx="0.5" fill="white" />
          <rect x="12" y="15" width="2" height="2" rx="0.25" fill="white" fillOpacity="0.5" />
        </svg>
      </div>
      {showWordmark ? (
        <span className={`font-display ${text} font-semibold tracking-tight text-foreground`}>
          QRShift
        </span>
      ) : null}
    </div>
  );
}
