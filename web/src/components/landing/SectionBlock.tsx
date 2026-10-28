import type { ReactNode } from "react";

interface SectionBlockProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SectionBlock({
  eyebrow,
  title,
  description,
  children,
  className = "",
}: SectionBlockProps) {
  return (
    <section
      className={`rounded-[36px] border border-surfacestroke bg-surface/95 p-6 shadow-[var(--shadow-panel)] sm:p-8 ${className}`.trim()}
    >
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-3xl font-bold tracking-[-0.05em] text-foreground sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}
