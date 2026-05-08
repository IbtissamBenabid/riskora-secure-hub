import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useStore } from "@/store/StoreContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RiskBadge } from "@/components/RiskBadge";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Plus, ChevronLeft, ShieldCheck, FileBarChart2,
  AlertTriangle, ClipboardList, Code2, Bug, BookCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function ProjectDetail() {
  const { id } = useParams();
  const store = useStore();
  const project = store.projects.find(p => p.id === id);
  if (!project) return <Navigate to="/projects" replace />;

  const org = store.organizations.find(o => o.id === project.organizationId);
  const projectAssessments = store.assessments.filter(a => a.projectId === project.id);
  const suppliers = store.suppliers.filter(s => s.organizationId === project.organizationId);

  const isConsultant = store.currentUser?.role === "consultant";

  const [createOpen, setCreateOpen] = useState(false);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [title, setTitle] = useState("");

  function createAssessment() {
    if (!supplierId || !title.trim()) { toast.error("Title and supplier required"); return; }
    const a = store.createAssessment({ projectId: project.id, supplierId, title: title.trim() });
    toast.success("Assessment created (draft)");
    setCreateOpen(false); setTitle("");
    return a;
  }

  const reportRows = useMemo(() => projectAssessments.map(a => ({
    a,
    supplier: store.suppliers.find(s => s.id === a.supplierId)!,
    score: store.riskScores.find(r => r.assessmentId === a.id),
    decision: store.decisions.find(d => d.assessmentId === a.id),
  })), [projectAssessments, store.suppliers, store.riskScores, store.decisions]);

  // Cross-module aggregates scoped to this project
  const [counts, setCounts] = useState({
    risks: 0, highRisks: 0, requirements: 0, codeFindings: 0,
    pentestFindings: 0, openPentest: 0, frameworks: 0,
    controlsTotal: 0, controlsImplemented: 0,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const [
        { data: risks },
        { count: reqCount },
        { data: reviews },
        { data: pentests },
        { data: frameworks },
      ] = await Promise.all([
        supabase.from("risk_registers").select("id, risk_score").eq("project_id", project.id),
        supabase.from("security_requirements").select("id", { count: "exact", head: true }).eq("project_id", project.id),
        supabase.from("code_reviews").select("id").eq("project_id", project.id),
        supabase.from("pentest_engagements").select("id").eq("project_id", project.id),
        supabase.from("compliance_frameworks").select("id").eq("project_id", project.id),
      ]);

      const reviewIds = (reviews ?? []).map((r: any) => r.id);
      const pentestIds = (pentests ?? []).map((r: any) => r.id);
      const fwIds = (frameworks ?? []).map((r: any) => r.id);

      const [
        { count: codeFindingsCount },
        { data: pf },
        { data: ctrls },
      ] = await Promise.all([
        reviewIds.length
          ? supabase.from("code_review_findings").select("id", { count: "exact", head: true }).in("review_id", reviewIds)
          : Promise.resolve({ count: 0 } as any),
        pentestIds.length
          ? supabase.from("pentest_findings").select("id, status").in("engagement_id", pentestIds)
          : Promise.resolve({ data: [] } as any),
        fwIds.length
          ? supabase.from("compliance_controls").select("id, status").in("framework_id", fwIds)
          : Promise.resolve({ data: [] } as any),
      ]);

      if (!active) return;
      setCounts({
        risks: risks?.length ?? 0,
        highRisks: (risks ?? []).filter((r: any) => (r.risk_score ?? 0) >= 15).length,
        requirements: reqCount ?? 0,
        codeFindings: codeFindingsCount ?? 0,
        pentestFindings: (pf ?? []).length,
        openPentest: (pf ?? []).filter((x: any) => x.status === "open").length,
        frameworks: fwIds.length,
        controlsTotal: (ctrls ?? []).length,
        controlsImplemented: (ctrls ?? []).filter((c: any) => c.status === "implemented" || c.status === "verified").length,
      });
    })();
    return () => { active = false; };
  }, [project.id]);

  const compliancePct = counts.controlsTotal
    ? Math.round((counts.controlsImplemented / counts.controlsTotal) * 100) : 0;

  const moduleCards = [
    { label: "Risks", value: counts.risks, sub: `${counts.highRisks} high`, to: "/modules/risk-analysis", icon: AlertTriangle },
    { label: "Requirements", value: counts.requirements, sub: "tracked", to: "/modules/security-requirements", icon: ClipboardList },
    { label: "Code Findings", value: counts.codeFindings, sub: "across reviews", to: "/modules/secure-code-review", icon: Code2 },
    { label: "Pentest Findings", value: counts.pentestFindings, sub: `${counts.openPentest} open`, to: "/modules/security-testing", icon: Bug },
    { label: "Compliance", value: `${compliancePct}%`, sub: `${counts.frameworks} fw`, to: "/modules/compliance", icon: BookCheck },
    { label: "TPRM", value: projectAssessments.length, sub: `${reportRows.filter(r => r.score).length} scored`, to: "/tprm", icon: ShieldCheck },
  ];

  return (
    <AppShell
      title={project.name}
      description={`${org?.name} • Created ${project.createdAt}`}
      actions={
        <Link to="/projects" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ChevronLeft className="h-3 w-3" /> All projects
        </Link>
      }
    >
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tprm">TPRM</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="panel p-6 lg:col-span-2">
              <div className="stat-label">Description</div>
              <p className="mt-2 text-sm leading-relaxed">{project.description || "No description provided."}</p>
              <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-4">
                <Stat label="Status" value={project.status.toUpperCase()} mono={false} />
                <Stat label="Suppliers" value={String(new Set(projectAssessments.map(a => a.supplierId)).size)} />
                <Stat label="Assessments" value={String(projectAssessments.length)} />
              </div>
            </div>
            <div className="panel p-6">
              <div className="stat-label">Client</div>
              <div className="mt-2 text-base font-semibold">{org?.name}</div>
              <p className="mt-1 text-xs text-muted-foreground">All assessments and suppliers in this project belong to this client.</p>
            </div>
          </div>

          <div className="panel">
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-sm font-semibold">Security Posture</h3>
              <p className="text-xs text-muted-foreground">Activity across every module for this project</p>
            </div>
            <div className="grid grid-cols-2 divide-border md:grid-cols-3 md:divide-x lg:grid-cols-6">
              {moduleCards.map(({ label, value, sub, to, icon: Icon }) => (
                <Link key={label} to={to} className="group flex flex-col gap-1 px-5 py-4 hover:bg-surface-muted">
                  <div className="flex items-center justify-between">
                    <span className="stat-label">{label}</span>
                    <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-accent" />
                  </div>
                  <div className="font-mono text-2xl font-bold">{value}</div>
                  <div className="text-[11px] text-muted-foreground">{sub}</div>
                </Link>
              ))}
            </div>
            {counts.controlsTotal > 0 && (
              <div className="border-t border-border px-6 py-4">
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
        </TabsContent>

        <TabsContent value="tprm" className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Assessments</h3>
              <p className="text-xs text-muted-foreground">Vendor risk assessments scoped to this project</p>
            </div>
            {isConsultant && (
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-accent hover:bg-accent/90"><Plus className="mr-1.5 h-4 w-4" />New Assessment</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create assessment</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Annual security review" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Supplier</Label>
                      <Select value={supplierId} onValueChange={setSupplierId}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button onClick={createAssessment}>Create draft</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {projectAssessments.length === 0 ? (
            <div className="panel flex flex-col items-center justify-center py-16 text-center">
              <ShieldCheck className="h-10 w-10 text-muted-foreground/50" />
              <h3 className="mt-4 text-sm font-semibold">No assessments yet</h3>
              <p className="mt-1 text-xs text-muted-foreground">Create one to begin scoring a supplier.</p>
            </div>
          ) : (
            <AssessmentTable rows={reportRows} />
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          {reportRows.filter(r => r.score).length === 0 ? (
            <div className="panel flex flex-col items-center justify-center py-16 text-center">
              <FileBarChart2 className="h-10 w-10 text-muted-foreground/50" />
              <h3 className="mt-4 text-sm font-semibold">No completed assessments yet</h3>
              <p className="mt-1 text-xs text-muted-foreground">Reports appear once assessments are scored.</p>
            </div>
          ) : (
            <AssessmentTable rows={reportRows.filter(r => r.score)} />
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Stat({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function AssessmentTable({ rows }: { rows: { a: any; supplier: any; score: any; decision: any }[] }) {
  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface-muted text-left text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-5 py-3 font-semibold">Supplier</th>
            <th className="px-5 py-3 font-semibold">Title</th>
            <th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 font-semibold">Score</th>
            <th className="px-5 py-3 font-semibold">Risk</th>
            <th className="px-5 py-3 font-semibold">Decision</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(({ a, supplier, score, decision }) => (
            <tr key={a.id} className="hover:bg-surface-muted">
              <td className="px-5 py-3 font-medium">{supplier?.name}</td>
              <td className="px-5 py-3 text-muted-foreground">{a.title}</td>
              <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
              <td className="px-5 py-3 font-mono">{score ? score.score : "—"}</td>
              <td className="px-5 py-3">{score ? <RiskBadge level={score.level} /> : <span className="text-muted-foreground">—</span>}</td>
              <td className="px-5 py-3 text-muted-foreground capitalize">{decision ? decision.decision.replace(/_/g, " ") : "—"}</td>
              <td className="px-5 py-3 text-right">
                <Link to={`/tprm/assessments/${a.id}`} className="text-xs font-medium text-accent hover:underline">Open</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
