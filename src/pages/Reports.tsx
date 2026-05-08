import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useStore } from "@/store/StoreContext";
import { supabase } from "@/integrations/supabase/client";
import { RiskBadge } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import type { RiskLevel } from "@/types";
import { Link } from "react-router-dom";
import { Download, AlertTriangle, ClipboardList, Code2, Bug, BookCheck } from "lucide-react";

interface AggRow {
  module: string;
  total: number;
  highlight: string;
}

export default function Reports() {
  const { riskScores, assessments, suppliers, projects, decisions, organizations } = useStore();
  const [agg, setAgg] = useState<AggRow[]>([]);

  useEffect(() => {
    (async () => {
      const [
        { data: risks },
        { count: reqCount },
        { data: codeFindings },
        { data: pf },
        { data: ctrls },
      ] = await Promise.all([
        supabase.from("risk_registers").select("id, risk_score"),
        supabase.from("security_requirements").select("id", { count: "exact", head: true }),
        supabase.from("code_review_findings").select("id, severity"),
        supabase.from("pentest_findings").select("id, status"),
        supabase.from("compliance_controls").select("id, status"),
      ]);
      const high = (risks ?? []).filter((r: any) => (r.risk_score ?? 0) >= 15).length;
      const critCode = (codeFindings ?? []).filter((c: any) => c.severity === "critical" || c.severity === "high").length;
      const openP = (pf ?? []).filter((c: any) => c.status === "open").length;
      const implPct = ctrls && ctrls.length
        ? Math.round((ctrls.filter((c: any) => c.status === "implemented" || c.status === "verified").length / ctrls.length) * 100)
        : 0;
      setAgg([
        { module: "Risk Register", total: risks?.length ?? 0, highlight: `${high} high-risk` },
        { module: "Security Requirements", total: reqCount ?? 0, highlight: "tracked" },
        { module: "Code Review Findings", total: codeFindings?.length ?? 0, highlight: `${critCode} high/critical` },
        { module: "Pentest Findings", total: pf?.length ?? 0, highlight: `${openP} open` },
        { module: "Compliance Controls", total: ctrls?.length ?? 0, highlight: `${implPct}% implemented` },
      ]);
    })();
  }, []);

  const dist = { low: 0, medium: 0, high: 0 };
  for (const r of riskScores) dist[r.level]++;
  const total = riskScores.length || 1;

  const rows = riskScores.map(rs => {
    const a = assessments.find(x => x.id === rs.assessmentId)!;
    const supplier = suppliers.find(s => s.id === a?.supplierId);
    const project = projects.find(p => p.id === a?.projectId);
    const org = organizations.find(o => o.id === project?.organizationId);
    const decision = decisions.find(d => d.assessmentId === a?.id);
    return { rs, a, supplier, project, org, decision };
  }).sort((a, b) => a.rs.score - b.rs.score);

  function exportCsv() {
    const header = ["Supplier", "Project", "Organization", "Assessment", "Score", "Risk Level", "Decision", "Decided At"];
    const lines = [header.join(",")];
    for (const r of rows) {
      const cells = [
        r.supplier?.name ?? "",
        r.project?.name ?? "",
        r.org?.name ?? "",
        r.a?.title ?? "",
        String(r.rs.score),
        r.rs.level,
        r.decision?.decision ?? "pending",
        r.decision?.decidedAt ?? "",
      ].map(v => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(cells.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `riskora-tprm-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const ICONS: Record<string, any> = {
    "Risk Register": AlertTriangle,
    "Security Requirements": ClipboardList,
    "Code Review Findings": Code2,
    "Pentest Findings": Bug,
    "Compliance Controls": BookCheck,
  };

  return (
    <AppShell
      title="Reports"
      description="Aggregate view across all security modules"
      actions={
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> Export TPRM CSV
        </Button>
      }
    >
      {/* Cross-module summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {agg.map(({ module, total, highlight }) => {
          const Icon = ICONS[module];
          return (
            <div key={module} className="panel p-5">
              <div className="flex items-start justify-between">
                <div className="stat-label">{module}</div>
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="mt-3 font-mono text-3xl font-bold">{total}</div>
              <div className="text-xs text-muted-foreground">{highlight}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {(["low", "medium", "high"] as RiskLevel[]).map(lvl => {
          const pct = Math.round((dist[lvl] / total) * 100);
          return (
            <div key={lvl} className="panel p-5">
              <div className="flex items-center justify-between">
                <RiskBadge level={lvl} />
                <span className="font-mono text-xs text-muted-foreground">{pct}%</span>
              </div>
              <div className="mt-3 font-mono text-3xl font-bold">{dist[lvl]}</div>
              <div className="text-xs text-muted-foreground">suppliers in this band</div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 panel overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-sm font-semibold">Scored Assessments</h3>
          <p className="text-xs text-muted-foreground">Sorted by risk — investigate the lowest scores first</p>
        </div>
        {rows.length === 0 ? (
          <div className="py-14 text-center text-sm text-muted-foreground">No scored assessments yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Supplier</th>
                <th className="px-5 py-3 font-semibold">Project</th>
                <th className="px-5 py-3 font-semibold">Score</th>
                <th className="px-5 py-3 font-semibold">Risk</th>
                <th className="px-5 py-3 font-semibold">Decision</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(({ rs, a, supplier, project, decision }) => (
                <tr key={rs.id} className="hover:bg-surface-muted">
                  <td className="px-5 py-3 font-medium">{supplier?.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{project?.name}</td>
                  <td className="px-5 py-3 font-mono font-semibold">{rs.score}</td>
                  <td className="px-5 py-3"><RiskBadge level={rs.level} /></td>
                  <td className="px-5 py-3 text-muted-foreground capitalize">{decision ? decision.decision.replace(/_/g, " ") : "Pending"}</td>
                  <td className="px-5 py-3 text-right">
                    <Link to={`/tprm/assessments/${a.id}`} className="text-xs font-medium text-accent hover:underline">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
