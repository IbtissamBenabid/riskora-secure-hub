import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
        <Shield className="h-4 w-4" strokeWidth={2.5} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-base font-bold tracking-tight">Riskora</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Security Platform</div>
        </div>
      )}
    </div>
  );
}
