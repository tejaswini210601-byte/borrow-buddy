import { LendingTag } from "@/components/brand/lending-tag";

/** The centred card that wraps every account page (log in, sign up…). */
export function AuthCard({
  tag,
  title,
  description,
  children,
  footer,
}: {
  tag?: string;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:py-20">
      <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        {tag && (
          <LendingTag tone="fresh" className="mb-4">
            {tag}
          </LendingTag>
        )}
        <h1 className="text-[clamp(1.75rem,4vw,2.25rem)]">{title}</h1>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-6 text-center text-sm text-charcoal/80">{footer}</div>}
    </div>
  );
}
