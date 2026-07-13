export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 shrink-0 whitespace-nowrap rounded-full border px-3 text-caption transition ${
        active
          ? "border-ink bg-ink text-white"
          : "border-line bg-paper-raised text-ink-soft hover:bg-paper"
      }`}
    >
      {label}
    </button>
  );
}
