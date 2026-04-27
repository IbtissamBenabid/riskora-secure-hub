import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useStore } from "@/store/StoreContext";
import { RiskBadge } from "@/components/RiskBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowUpRight, Building2, FolderKanban, ShieldCheck, AlertTriangle } from "lucide-react";
import type { RiskLevel } from "@/types";

export default function Dashboard() {
  const { projects, suppliers, assessments, riskScores, organizations } = useStore();

  const dist = { low: 0, medium: 0, high: 0 };
  for (const r of riskScores) dist[r.level]++;
  const totalScored = riskScores.length || 1;

  const recent = [...assessments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  const stats = [
    { label: "Active Projects", value: projects.filter(p => p.status === "active").length, icon: FolderKanban },
    { label: "Suppliers Tracked", value: suppliers.length, icon: Building2 },
    { label: "Assessments", value: assessments.length, icon: ShieldCheck },
    { label: "High-Risk Findings", value: dist.high, icon: AlertTriangle, accent: true },
  ];

  return (
    <AppShell title="Dashboard" description="Security posture across all engagements">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="panel p-5">
            <div className="flex items-start justify-between">
              <div className="stat-label">{label}</div>
              <Icon className={`h-4 w-4 ${accent ? "text-risk-high" : "text-muted-foreground"}`} />
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight font-mono">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Risk distribution */}
        <div className="panel p-6 lg:col-span-1">
          <h3 className="text-sm font-semibold">Risk Distribution</h3>
          <p className="text-xs text-muted-foreground">Scored assessments across portfolio</p>
          <div className="mt-6 space-y-4">
            {(["low", "medium", "high"] as RiskLevel[]).map((lvl) => {
              const pct = Math.round((dist[lvl] / totalScored) * 100);
              return (
                <div key={lvl}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <RiskBadge level={lvl} />
                    <span className="font-mono text-xs text-muted-foreground">{dist[lvl]} • {pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${lvl === "low" ? "bg-risk-low" : lvl === "medium" ? "bg-risk-medium" : "bg-risk-high"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent assessments */}
        <div className="panel lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h3 className="text-sm font-semibold">Recent Assessments</h3>
              <p className="text-xs text-muted-foreground">Latest TPRM activity</p>
            </div>
            <Link to="/tprm" className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {recent.map((a) => {
              const supplier = suppliers.find(s => s.id === a.supplierId);
              const project = projects.find(p => p.id === a.projectId);
              const score = riskScores.find(r => r.assessmentId === a.id);
              return (
                <li key={a.id}>
                  <Link to={`/tprm/assessments/${a.id}`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-surface-muted">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{supplier?.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{project?.name} • {organizations.find(o => o.id === project?.organizationId)?.name}</div>
                    </div>
                    {score && (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">{score.score}</span>
                        <RiskBadge level={score.level} />
                      </div>
                    )}
                    <StatusBadge status={a.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
