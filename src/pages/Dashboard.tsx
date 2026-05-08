import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useStore } from "@/store/StoreContext";
import { supabase } from "@/integrations/supabase/client";
import { RiskBadge } from "@/components/RiskBadge";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ArrowUpRight, Building2, FolderKanban, ShieldCheck, AlertTriangle,
  ClipboardList, Code2, Bug, BookCheck, ListChecks,
} from "lucide-react";
import type { RiskLevel } from "@/types";

interface ModuleCounts {
  risks: number;
  highRisks: number;
  requirements: number;
  codeFindings: number;
  pentestFindings: number;
  openPentest: number;
  frameworks: number;
  controlsImplemented: number;
  controlsTotal: number;
}

const EMPTY: ModuleCounts = {
  risks: 0, highRisks: 0, requirements: 0, codeFindings: 0,
  pentestFindings: 0, openPentest: 0, frameworks: 0,
  controlsImplemented: 0, controlsTotal: 0,
};

export default function Dashboard() {
  const { projects, suppliers, assessments, riskScores, organizations, currentUser } = useStore();
  const [m, setM] = useState<ModuleCounts>(EMPTY);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    (async () => {
      const [
        { data: risks },
        { count: reqCount },
        { count: cfCount },
        { data: pf },
        { count: fwCount },
        { data: ctrls },
      ] = await Promise.all([
        supabase.from("risk_registers").select("id, risk_score"),
        supabase.from("security_requirements").select("id", { count: "exact", head: true }),
        supabase.from("code_review_findings").select("id", { count: "exact", head: true }),
        supabase.from("pentest_findings").select("id, status"),
        supabase.from("compliance_frameworks").select("id", { count: "exact", head: true }),
        supabase.from("compliance_controls").select("id, status"),
      ]);
      if (!active) return;
      setM({
        risks: risks?.length ?? 0,
        highRisks: (risks ?? []).filter((r: any) => (r.risk_score ?? 0) >= 15).length,
        requirements: reqCount ?? 0,
        codeFindings: cfCount ?? 0,
        pentestFindings: pf?.length ?? 0,
        openPentest: (pf ?? []).filter((x: any) => x.status === "open").length,
        frameworks: fwCount ?? 0,
        controlsTotal: ctrls?.length ?? 0,
        controlsImplemented: (ctrls ?? []).filter((c: any) => c.status === "implemented" || c.status === "verified").length,
      });
    })();
    return () => { active = false; };
  }, [currentUser]);

  const dist = { low: 0, medium: 0, high: 0 };
  for (const r of riskScores) dist[r.level]++;
  const totalScored = riskScores.length || 1;

  const recent = [...assessments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  const stats = [
    { label: "Active Projects", value: projects.filter(p => p.status === "active").length, icon: FolderKanban },
    { label: "Suppliers Tracked", value: suppliers.length, icon: Building2 },
    { label: "Assessments", value: assessments.length, icon: ShieldCheck },
    { label: "High-Risk Findings", value: dist.high + m.highRisks, icon: AlertTriangle, accent: true },
  ];

  const compliancePct = m.controlsTotal ? Math.round((m.controlsImplemented / m.controlsTotal) * 100) : 0;

  const moduleStats = [
    { label: "Risk Register", value: m.risks, sub: `${m.highRisks} high`, to: "/modules/risk-analysis", icon: AlertTriangle },
    { label: "Security Reqs", value: m.requirements, sub: "tracked", to: "/modules/security-requirements", icon: ClipboardList },
    { label: "Code Findings", value: m.codeFindings, sub: "across reviews", to: "/modules/secure-code-review", icon: Code2 },
    { label: "Pentest Findings", value: m.pentestFindings, sub: `${m.openPentest} open`, to: "/modules/security-testing", icon: Bug },
    { label: "Compliance", value: `${compliancePct}%`, sub: `${m.frameworks} framework${m.frameworks === 1 ? "" : "s"}`, to: "/modules/compliance", icon: BookCheck },
    { label: "TPRM Assessments", value: assessments.length, sub: `${riskScores.length} scored`, to: "/tprm", icon: ListChecks },
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

      {/* Module overview */}
      <div className="mt-6 panel">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-sm font-semibold">Modules Overview</h3>
          <p className="text-xs text-muted-foreground">Activity across all six security modules</p>
        </div>
        <div className="grid grid-cols-2 divide-border md:grid-cols-3 md:divide-x lg:grid-cols-6">
          {moduleStats.map(({ label, value, sub, to, icon: Icon }) => (
            <Link
              key={label}
              to={to}
              className="group flex flex-col gap-1 px-5 py-4 hover:bg-surface-muted"
            >
              <div className="flex items-center justify-between">
                <span className="stat-label">{label}</span>
                <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-accent" />
              </div>
              <div className="font-mono text-2xl font-bold">{value}</div>
              <div className="text-[11px] text-muted-foreground">{sub}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Risk distribution */}
        <div className="panel p-6 lg:col-span-1">
          <h3 className="text-sm font-semibold">Risk Distribution</h3>
          <p className="text-xs text-muted-foreground">Scored TPRM assessments</p>
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

          {m.controlsTotal > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">Compliance readiness</span>
                <span className="font-mono text-muted-foreground">{compliancePct}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-accent" style={{ width: `${compliancePct}%` }} />
              </div>
            </div>
          )}
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
            {recent.length === 0 && (
              <li className="px-6 py-8 text-center text-sm text-muted-foreground">No assessments yet.</li>
            )}
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
