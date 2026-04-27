import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

const styles: Record<RiskLevel, string> = {
  low: "bg-risk-low-soft text-risk-low ring-1 ring-inset ring-risk-low/30",
  medium: "bg-risk-medium-soft text-risk-medium ring-1 ring-inset ring-risk-medium/30",
  high: "bg-risk-high-soft text-risk-high ring-1 ring-inset ring-risk-high/30",
};

const labels: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", styles[level], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", level === "low" && "bg-risk-low", level === "medium" && "bg-risk-medium", level === "high" && "bg-risk-high")} />
      {labels[level]}
    </span>
  );
}
