import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useStore } from "@/store/StoreContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type EngRow = Tables<"pentest_engagements">;
type FindRow = Tables<"pentest_findings">;

const STATUS_COLORS: Record<string, string> = { scoping: "bg-muted text-muted-foreground", active: "bg-yellow-500/15 text-yellow-400", completed: "bg-green-500/15 text-green-400", reported: "bg-accent/15 text-accent" };
const TYPE_COLORS: Record<string, string> = { pentest: "bg-blue-500/15 text-blue-400", dast: "bg-purple-500/15 text-purple-400", red_team: "bg-risk-high/15 text-risk-high" };
const SEV_COLORS: Record<string, string> = { critical: "bg-risk-high/15 text-risk-high", high: "bg-orange-500/15 text-orange-400", medium: "bg-yellow-500/15 text-yellow-400", low: "bg-blue-500/15 text-blue-400", info: "bg-muted text-muted-foreground" };
const FSTATUS_COLORS: Record<string, string> = { open: "bg-yellow-500/15 text-yellow-400", confirmed: "bg-orange-500/15 text-orange-400", remediated: "bg-green-500/15 text-green-400", accepted: "bg-blue-500/15 text-blue-400" };
const RETEST_COLORS: Record<string, string> = { pending: "bg-muted text-muted-foreground", passed: "bg-green-500/15 text-green-400", failed: "bg-risk-high/15 text-risk-high" };

export default function SecurityTestingModule() {
  const { projects, currentUser } = useStore();
  const isConsultant = currentUser?.role === "consultant";
  const [engagements, setEngagements] = useState<EngRow[]>([]);
  const [findings, setFindings] = useState<FindRow[]>([]);
  const [selected, setSelected] = useState<EngRow | null>(null);
  const [search, setSearch] = useState("");

  const [eOpen, setEOpen] = useState(false);
  const [eEditing, setEEditing] = useState<EngRow | null>(null);
  const [eForm, setEForm] = useState({ title: "", type: "pentest" as string, scope: "", status: "scoping" as string, tester: "", project_id: "" });

  const [fOpen, setFOpen] = useState(false);
  const [fEditing, setFEditing] = useState<FindRow | null>(null);
  const [fForm, setFForm] = useState({ title: "", description: "", severity: "medium" as string, cvss_score: "", status: "open" as string, affected_asset: "", remediation: "", retest_status: "pending" as string });

  async function loadEng() { const { data } = await supabase.from("pentest_engagements").select("*").order("created_at", { ascending: false }); setEngagements(data ?? []); }
  async function loadFind(engId: string) { const { data } = await supabase.from("pentest_findings").select("*").eq("engagement_id", engId).order("created_at", { ascending: false }); setFindings(data ?? []); }
  useEffect(() => { loadEng(); }, []);
  useEffect(() => { if (selected) loadFind(selected.id); }, [selected]);

  function openCreateEng() { setEEditing(null); setEForm({ title: "", type: "pentest", scope: "", status: "scoping", tester: "", project_id: projects[0]?.id ?? "" }); setEOpen(true); }
  function openEditEng(e: EngRow) { setEEditing(e); setEForm({ title: e.title, type: e.type, scope: e.scope ?? "", status: e.status, tester: e.tester ?? "", project_id: e.project_id }); setEOpen(true); }

  async function saveEng() {
    if (!eForm.title.trim() || !eForm.project_id) { toast.error("Title and project required"); return; }
    const payload = { title: eForm.title.trim(), type: eForm.type as any, scope: eForm.scope, status: eForm.status as any, tester: eForm.tester, project_id: eForm.project_id };
    if (eEditing) { const { error } = await supabase.from("pentest_engagements").update(payload).eq("id", eEditing.id); if (error) { toast.error(error.message); return; } toast.success("Updated"); }
    else { const { error } = await supabase.from("pentest_engagements").insert(payload); if (error) { toast.error(error.message); return; } toast.success("Created"); }
    setEOpen(false); loadEng();
  }
  async function removeEng(id: string) { const { error } = await supabase.from("pentest_engagements").delete().eq("id", id); if (error) { toast.error(error.message); return; } if (selected?.id === id) { setSelected(null); setFindings([]); } toast.success("Deleted"); loadEng(); }

  function openCreateFind() { setFEditing(null); setFForm({ title: "", description: "", severity: "medium", cvss_score: "", status: "open", affected_asset: "", remediation: "", retest_status: "pending" }); setFOpen(true); }
  function openEditFind(f: FindRow) { setFEditing(f); setFForm({ title: f.title, description: f.description ?? "", severity: f.severity, cvss_score: f.cvss_score ? String(f.cvss_score) : "", status: f.status, affected_asset: f.affected_asset ?? "", remediation: f.remediation ?? "", retest_status: f.retest_status ?? "pending" }); setFOpen(true); }

  async function saveFind() {
    if (!fForm.title.trim() || !selected) { toast.error("Title required"); return; }
    const payload = { title: fForm.title.trim(), description: fForm.description, severity: fForm.severity as any, cvss_score: fForm.cvss_score ? Number(fForm.cvss_score) : 0, status: fForm.status as any, affected_asset: fForm.affected_asset, remediation: fForm.remediation, retest_status: fForm.retest_status as any, engagement_id: selected.id };
    if (fEditing) { const { error } = await supabase.from("pentest_findings").update(payload).eq("id", fEditing.id); if (error) { toast.error(error.message); return; } toast.success("Updated"); }
    else { const { error } = await supabase.from("pentest_findings").insert(payload); if (error) { toast.error(error.message); return; } toast.success("Added"); }
    setFOpen(false); loadFind(selected.id);
  }
  async function removeFind(id: string) { if (!selected) return; const { error } = await supabase.from("pentest_findings").delete().eq("id", id); if (error) { toast.error(error.message); return; } toast.success("Deleted"); loadFind(selected.id); }

  return (
    <AppShell title="Security Testing" description="Coordinate pentests, DAST and red-team engagements"
      actions={isConsultant && !selected && <Button size="sm" className="bg-accent hover:bg-accent/90" onClick={openCreateEng}><Plus className="mr-1.5 h-4 w-4" />New Engagement</Button>}
    >
      {!selected ? (
        <>
          <div className="mb-4 relative max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search engagements…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
          <div className="panel overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-3 font-semibold">Engagement</th><th className="px-5 py-3 font-semibold">Type</th><th className="px-5 py-3 font-semibold">Tester</th><th className="px-5 py-3 font-semibold">Status</th>{isConsultant && <th className="px-5 py-3" />}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {engagements.filter(e => !search.trim() || e.title.toLowerCase().includes(search.toLowerCase())).map(e => (
                  <tr key={e.id} className="hover:bg-surface-muted cursor-pointer" onClick={() => setSelected(e)}>
                    <td className="px-5 py-3 font-medium flex items-center gap-2">{e.title}<ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /></td>
                    <td className="px-5 py-3"><Badge variant="outline" className={`${TYPE_COLORS[e.type]} border-0 text-[10px] uppercase`}>{e.type.replace("_"," ")}</Badge></td>
                    <td className="px-5 py-3 text-muted-foreground">{e.tester}</td>
                    <td className="px-5 py-3"><Badge variant="outline" className={`${STATUS_COLORS[e.status]} border-0 text-[10px] uppercase`}>{e.status}</Badge></td>
                    {isConsultant && (
                      <td className="px-5 py-3 text-right space-x-1" onClick={ev => ev.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditEng(e)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeEng(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </td>
                    )}
                  </tr>
                ))}
                {engagements.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No engagements yet</td></tr>}
              </tbody>
            </table>
          </div>
          <Dialog open={eOpen} onOpenChange={setEOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{eEditing ? "Edit Engagement" : "New Engagement"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5"><Label>Project</Label><Select value={eForm.project_id} onValueChange={v => setEForm(f => ({ ...f, project_id: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>Title</Label><Input value={eForm.title} onChange={e => setEForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Type</Label><Select value={eForm.type} onValueChange={v => setEForm(f => ({ ...f, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["pentest","dast","red_team"].map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace("_"," ")}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label>Status</Label><Select value={eForm.status} onValueChange={v => setEForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["scoping","active","completed","reported"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="space-y-1.5"><Label>Scope</Label><Textarea value={eForm.scope} onChange={e => setEForm(f => ({ ...f, scope: e.target.value }))} rows={2} /></div>
                <div className="space-y-1.5"><Label>Tester</Label><Input value={eForm.tester} onChange={e => setEForm(f => ({ ...f, tester: e.target.value }))} /></div>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setEOpen(false)}>Cancel</Button><Button onClick={saveEng}>{eEditing ? "Update" : "Create"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setSelected(null); setFindings([]); }}>← Back</Button>
            <div><h2 className="text-lg font-semibold">{selected.title}</h2><p className="text-xs text-muted-foreground">{selected.scope}</p></div>
            <Badge variant="outline" className={`${TYPE_COLORS[selected.type]} border-0 text-[10px] uppercase ml-auto`}>{selected.type.replace("_"," ")}</Badge>
            <Badge variant="outline" className={`${STATUS_COLORS[selected.status]} border-0 text-[10px] uppercase`}>{selected.status}</Badge>
            {isConsultant && <Button size="sm" className="bg-accent hover:bg-accent/90" onClick={openCreateFind}><Plus className="mr-1.5 h-4 w-4" />Add Finding</Button>}
          </div>
          <div className="panel overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-3 font-semibold">Finding</th><th className="px-5 py-3 font-semibold">Severity</th><th className="px-5 py-3 font-semibold">CVSS</th><th className="px-5 py-3 font-semibold">Asset</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Retest</th>{isConsultant && <th className="px-5 py-3" />}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {findings.map(f => (
                  <tr key={f.id} className="hover:bg-surface-muted">
                    <td className="px-5 py-3 font-medium max-w-xs truncate">{f.title}</td>
                    <td className="px-5 py-3"><Badge variant="outline" className={`${SEV_COLORS[f.severity]} border-0 text-[10px] uppercase`}>{f.severity}</Badge></td>
                    <td className="px-5 py-3 font-mono">{f.cvss_score ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground truncate max-w-[160px]">{f.affected_asset}</td>
                    <td className="px-5 py-3"><Badge variant="outline" className={`${FSTATUS_COLORS[f.status]} border-0 text-[10px] uppercase`}>{f.status}</Badge></td>
                    <td className="px-5 py-3"><Badge variant="outline" className={`${RETEST_COLORS[f.retest_status ?? "pending"]} border-0 text-[10px] uppercase`}>{f.retest_status ?? "pending"}</Badge></td>
                    {isConsultant && (
                      <td className="px-5 py-3 text-right space-x-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditFind(f)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFind(f.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </td>
                    )}
                  </tr>
                ))}
                {findings.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">No findings yet</td></tr>}
              </tbody>
            </table>
          </div>
          <Dialog open={fOpen} onOpenChange={setFOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{fEditing ? "Edit Finding" : "Add Finding"}</DialogTitle></DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-1.5"><Label>Title</Label><Input value={fForm.title} onChange={e => setFForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Description</Label><Textarea value={fForm.description} onChange={e => setFForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Severity</Label><Select value={fForm.severity} onValueChange={v => setFForm(f => ({ ...f, severity: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["critical","high","medium","low","info"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label>CVSS Score</Label><Input type="number" step="0.1" min="0" max="10" value={fForm.cvss_score} onChange={e => setFForm(f => ({ ...f, cvss_score: e.target.value }))} /></div>
                </div>
                <div className="space-y-1.5"><Label>Affected Asset</Label><Input value={fForm.affected_asset} onChange={e => setFForm(f => ({ ...f, affected_asset: e.target.value }))} placeholder="e.g. api.example.com" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Status</Label><Select value={fForm.status} onValueChange={v => setFForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["open","confirmed","remediated","accepted"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label>Retest Status</Label><Select value={fForm.retest_status} onValueChange={v => setFForm(f => ({ ...f, retest_status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["pending","passed","failed"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="space-y-1.5"><Label>Remediation</Label><Textarea value={fForm.remediation} onChange={e => setFForm(f => ({ ...f, remediation: e.target.value }))} rows={2} /></div>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setFOpen(false)}>Cancel</Button><Button onClick={saveFind}>{fEditing ? "Update" : "Add"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </AppShell>
  );
}
