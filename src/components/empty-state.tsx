import Link from "next/link";

// An empty state says what is (not) here, why, and what to do next.
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-box border border-dashed border-rule px-5 py-6">
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 max-w-prose text-sm text-muted">{children}</div>}
      {action && (
        <Link href={action.href} className="btn btn-sm btn-primary mt-4">
          {action.label}
        </Link>
      )}
    </div>
  );
}
