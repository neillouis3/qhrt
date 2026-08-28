export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-lighter border-t-primary dark:border-accent/30 dark:border-t-primary-light" />
        <p className="text-sm font-medium text-muted">Loading…</p>
      </div>
    </div>
  );
}
