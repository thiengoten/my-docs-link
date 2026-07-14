import { ChevronDown } from "lucide-react";

export function FilterChip({
  label,
  active,
  onClick,
  expanded,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  /** Set when this chip discloses a panel (e.g. date range) instead of toggling
   * the filter directly — renders a chevron so it reads as "open", not "select". */
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className={`flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 text-caption transition ${
        active
          ? "border-ink bg-ink text-white"
          : "border-line bg-paper-raised text-ink-soft hover:bg-paper"
      }`}
    >
      {label}
      {expanded !== undefined && (
        <ChevronDown
          size={14}
          strokeWidth={2}
          aria-hidden
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      )}
    </button>
  );
}
