import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line px-6 py-12 text-center">
      <Icon size={48} strokeWidth={1.5} className="text-line" aria-hidden />
      <p className="font-display text-subtitle font-semibold text-ink">{title}</p>
      <p className="max-w-sm text-body text-slate">{description}</p>
      {action}
    </div>
  );
}
