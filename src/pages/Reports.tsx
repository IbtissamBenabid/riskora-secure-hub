import { AppShell } from "@/components/layout/AppShell";
import { useStore } from "@/store/StoreContext";
import { RiskBadge } from "@/components/RiskBadge";
import type { RiskLevel } from "@/types";
import { Link } from "react-router-dom";

export default function Reports() {
  const { riskScores, assessments, suppliers, projects, decisions } = useStore();

  const dist = { low: 0, medium: 0, high: 0 };
  for (const r of riskScores) dist[r.level]++;
  const total = riskScores.length || 1;

  const rows = riskScores.map(rs => {
    const a = assessments.find(x => x.id === rs.assessmentId)!;
    const supplier = suppliers.find(s => s.id === a.supplierId);
    const project = projects.find(p => p.id === a.projectId);
    const decision = decisions.find(d => d.assessmentId === a.id);
    return { rs, a, supplier, project, decision };
  }).sort((a, b) => a.rs.score - b.rs.score);

  return (
    <AppShell title="Reports" description="Aggregate risk view across all scored assessments">
      <div className="grid gap-4 md:grid-cols-3">
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
      </div>
    </AppShell>
  );
}
