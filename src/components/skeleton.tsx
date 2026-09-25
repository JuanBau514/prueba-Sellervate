// Loading placeholders shaped like the content they stand for. The pulse only
// runs when the user has not asked for reduced motion.
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`rounded-field bg-base-200 motion-safe:animate-pulse ${className}`} />;
}

export function PageSkeleton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6" aria-busy="true">
      <p className="sr-only" role="status">
        {label}
      </p>
      {children}
    </main>
  );
}
