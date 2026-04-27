import { AppShell } from "@/components/layout/AppShell";
import { Sparkles, type LucideIcon } from "lucide-react";

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
  highlights: string[];
}

export function ModulePlaceholder({ title, description, icon: Icon, highlights }: Props) {
  return (
    <AppShell title={title} description={description}>
      <div className="panel relative overflow-hidden p-10">
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(hsl(var(--accent))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--accent))_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="relative grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
              <Sparkles className="h-3 w-3" /> Coming soon
            </div>
            <h2 className="mt-5 text-3xl font-bold tracking-tight">{title}</h2>
            <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">{description}</p>

            <ul className="mt-6 space-y-2.5">
              {highlights.map(h => (
                <li key={h} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-6 rounded-3xl bg-accent/10 blur-2xl" />
              <div className="relative flex h-48 w-48 items-center justify-center rounded-3xl border border-border bg-card">
                <Icon className="h-20 w-20 text-accent" strokeWidth={1.25} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
