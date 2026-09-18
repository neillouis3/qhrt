export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
        checked ? 'bg-foreground' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
        style={{ transform: checked ? 'translateX(16px)' : 'translateX(0px)' }}
      />
    </button>
  );
}
