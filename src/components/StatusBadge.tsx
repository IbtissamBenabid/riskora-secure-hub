import { cn } from "@/lib/utils";
import type { AssessmentStatus } from "@/types";

const map: Record<AssessmentStatus, { label: string; cls: string }> = {
  draft:     { label: "Draft",     cls: "bg-muted text-muted-foreground ring-1 ring-inset ring-border" },
  sent:      { label: "Sent",      cls: "bg-accent-soft text-accent ring-1 ring-inset ring-accent/30" },
  completed: { label: "Completed", cls: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200" },
  reviewed:  { label: "Reviewed",  cls: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200" },
  approved:  { label: "Approved",  cls: "bg-risk-low-soft text-risk-low ring-1 ring-inset ring-risk-low/30" },
  rejected:  { label: "Rejected",  cls: "bg-risk-high-soft text-risk-high ring-1 ring-inset ring-risk-high/30" },
};

export function StatusBadge({ status, className }: { status: AssessmentStatus; className?: string }) {
  const m = map[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", m.cls, className)}>
      {m.label}
    </span>
  );
}
