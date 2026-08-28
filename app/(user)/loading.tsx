export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700 dark:border-emerald-800 dark:border-t-emerald-400" />
        <p className="text-sm font-medium text-stone-500 dark:text-stone-400">
          Loading your space…
        </p>
      </div>
    </div>
  );
}
