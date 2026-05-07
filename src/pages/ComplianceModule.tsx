import { useEffect, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Pencil, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type FwRow = Tables<"compliance_frameworks">;
type CtrlRow = Tables<"compliance_controls">;

const STATUS_COLORS: Record<string, string> = { not_started: "bg-muted text-muted-foreground", in_progress: "bg-yellow-500/15 text-yellow-400", ready: "bg-green-500/15 text-green-400", certified: "bg-accent/15 text-accent" };
const CTRL_STATUS_COLORS: Record<string, string> = { not_implemented: "bg-muted text-muted-foreground", partial: "bg-yellow-500/15 text-yellow-400", implemented: "bg-blue-500/15 text-blue-400", verified: "bg-green-500/15 text-green-400" };

const FRAMEWORK_TEMPLATES = ["ISO 27001", "SOC 2", "HIPAA", "NIS2", "PCI DSS", "GDPR", "Custom"];

export default function ComplianceModule() {
  const { projects, currentUser } = useStore();
  const isConsultant = currentUser?.role === "consultant";
  const [frameworks, setFrameworks] = useState<FwRow[]>([]);
  const [controls, setControls] = useState<CtrlRow[]>([]);
  const [selected, setSelected] = useState<FwRow | null>(null);
  const [search, setSearch] = useState("");

  const [fwOpen, setFwOpen] = useState(false);
  const [fwEditing, setFwEditing] = useState<FwRow | null>(null);
  const [fwForm, setFwForm] = useState({ framework_name: "", version: "", status: "not_started" as string, target_date: "", project_id: "" });

  const [cOpen, setCOpen] = useState(false);
  const [cEditing, setCEditing] = useState<CtrlRow | null>(null);
  const [cForm, setCForm] = useState({ control_id: "", title: "", description: "", status: "not_implemented" as string, evidence: "", notes: "" });

  async function loadFw() { const { data } = await supabase.from("compliance_frameworks").select("*").order("created_at", { ascending: false }); setFrameworks(data ?? []); }
  async function loadCtrls(fwId: string) { const { data } = await supabase.from("compliance_controls").select("*").eq("framework_id", fwId).order("control_id"); setControls(data ?? []); }
  useEffect(() => { loadFw(); }, []);
  useEffect(() => { if (selected) loadCtrls(selected.id); }, [selected]);

  function openCreateFw() { setFwEditing(null); setFwForm({ framework_name: "", version: "", status: "not_started", target_date: "", project_id: projects[0]?.id ?? "" }); setFwOpen(true); }
  function openEditFw(fw: FwRow) { setFwEditing(fw); setFwForm({ framework_name: fw.framework_name, version: fw.version ?? "", status: fw.status, target_date: fw.target_date ?? "", project_id: fw.project_id }); setFwOpen(true); }

  async function saveFw() {
    if (!fwForm.framework_name.trim() || !fwForm.project_id) { toast.error("Framework name and project required"); return; }
    const payload = { framework_name: fwForm.framework_name.trim(), version: fwForm.version, status: fwForm.status as any, target_date: fwForm.target_date || null, project_id: fwForm.project_id };
    if (fwEditing) { const { error } = await supabase.from("compliance_frameworks").update(payload).eq("id", fwEditing.id); if (error) { toast.error(error.message); return; } toast.success("Updated"); }
    else { const { error } = await supabase.from("compliance_frameworks").insert(payload); if (error) { toast.error(error.message); return; } toast.success("Created"); }
    setFwOpen(false); loadFw();
  }
  async function removeFw(id: string) { const { error } = await supabase.from("compliance_frameworks").delete().eq("id", id); if (error) { toast.error(error.message); return; } if (selected?.id === id) { setSelected(null); setControls([]); } toast.success("Deleted"); loadFw(); }

  function openCreateCtrl() { setCEditing(null); setCForm({ control_id: "", title: "", description: "", status: "not_implemented", evidence: "", notes: "" }); setCOpen(true); }
  function openEditCtrl(c: CtrlRow) { setCEditing(c); setCForm({ control_id: c.control_id ?? "", title: c.title, description: c.description ?? "", status: c.status, evidence: c.evidence ?? "", notes: c.notes ?? "" }); setCOpen(true); }

  async function saveCtrl() {
    if (!cForm.title.trim() || !selected) { toast.error("Title required"); return; }
    const payload = { control_id: cForm.control_id, title: cForm.title.trim(), description: cForm.description, status: cForm.status as any, evidence: cForm.evidence, notes: cForm.notes, framework_id: selected.id };
    if (cEditing) { const { error } = await supabase.from("compliance_controls").update(payload).eq("id", cEditing.id); if (error) { toast.error(error.message); return; } toast.success("Updated"); }
    else { const { error } = await supabase.from("compliance_controls").insert(payload); if (error) { toast.error(error.message); return; } toast.success("Added"); }
    setCOpen(false); loadCtrls(selected.id);
  }
  async function removeCtrl(id: string) { if (!selected) return; const { error } = await supabase.from("compliance_controls").delete().eq("id", id); if (error) { toast.error(error.message); return; } toast.success("Deleted"); loadCtrls(selected.id); }

  // Readiness score
  const readiness = controls.length > 0
    ? Math.round((controls.filter(c => c.status === "implemented" || c.status === "verified").length / controls.length) * 100)
    : 0;

  return (
    <AppShell title="Compliance" description="Track control implementation against frameworks"
      actions={isConsultant && !selected && <Button size="sm" className="bg-accent hover:bg-accent/90" onClick={openCreateFw}><Plus className="mr-1.5 h-4 w-4" />Add Framework</Button>}
    >
      {!selected ? (
        <>
          <div className="mb-4 relative max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search frameworks…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {frameworks.filter(fw => !search.trim() || fw.framework_name.toLowerCase().includes(search.toLowerCase())).map(fw => {
              const proj = projects.find(p => p.id === fw.project_id);
              return (
                <div key={fw.id} className="panel p-5 cursor-pointer hover:border-accent/50 transition-colors" onClick={() => setSelected(fw)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-base font-semibold flex items-center gap-2">{fw.framework_name}<ChevronRight className="h-4 w-4 text-muted-foreground" /></div>
                      <div className="text-xs text-muted-foreground">{fw.version}{proj ? ` · ${proj.name}` : ""}</div>
                    </div>
                    <Badge variant="outline" className={`${STATUS_COLORS[fw.status]} border-0 text-[10px] uppercase`}>{fw.status.replace("_"," ")}</Badge>
                  </div>
                  {fw.target_date && <div className="mt-3 text-xs text-muted-foreground">Target: {fw.target_date}</div>}
                  {isConsultant && (
                    <div className="mt-3 flex gap-1 border-t border-border pt-3" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditFw(fw)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFw(fw.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  )}
                </div>
              );
            })}
            {frameworks.length === 0 && <div className="col-span-full text-center py-10 text-muted-foreground">No compliance frameworks yet</div>}
          </div>
          <Dialog open={fwOpen} onOpenChange={setFwOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{fwEditing ? "Edit Framework" : "Add Framework"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5"><Label>Project</Label><Select value={fwForm.project_id} onValueChange={v => setFwForm(f => ({ ...f, project_id: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Framework</Label>
                    <Select value={fwForm.framework_name} onValueChange={v => setFwForm(f => ({ ...f, framework_name: v }))}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{FRAMEWORK_TEMPLATES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Version</Label><Input value={fwForm.version} onChange={e => setFwForm(f => ({ ...f, version: e.target.value }))} placeholder="e.g. 2022" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Status</Label><Select value={fwForm.status} onValueChange={v => setFwForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["not_started","in_progress","ready","certified"].map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_"," ")}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label>Target Date</Label><Input type="date" value={fwForm.target_date} onChange={e => setFwForm(f => ({ ...f, target_date: e.target.value }))} /></div>
                </div>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setFwOpen(false)}>Cancel</Button><Button onClick={saveFw}>{fwEditing ? "Update" : "Create"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => { setSelected(null); setControls([]); }}>← Back</Button>
            <div>
              <h2 className="text-lg font-semibold">{selected.framework_name} {selected.version}</h2>
              <p className="text-xs text-muted-foreground">Target: {selected.target_date ?? "—"}</p>
            </div>
            <Badge variant="outline" className={`${STATUS_COLORS[selected.status]} border-0 text-[10px] uppercase ml-auto`}>{selected.status.replace("_"," ")}</Badge>
            {isConsultant && <Button size="sm" className="bg-accent hover:bg-accent/90" onClick={openCreateCtrl}><Plus className="mr-1.5 h-4 w-4" />Add Control</Button>}
          </div>

          {controls.length > 0 && (
            <div className="mb-4 panel p-4 flex items-center gap-4">
              <span className="text-sm font-medium">Readiness</span>
              <Progress value={readiness} className="flex-1 h-2" />
              <span className="text-sm font-mono font-semibold">{readiness}%</span>
            </div>
          )}

          <div className="panel overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-3 font-semibold">ID</th><th className="px-5 py-3 font-semibold">Control</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Evidence</th>{isConsultant && <th className="px-5 py-3" />}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {controls.map(c => (
                  <tr key={c.id} className="hover:bg-surface-muted">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.control_id}</td>
                    <td className="px-5 py-3 font-medium max-w-xs truncate">{c.title}</td>
                    <td className="px-5 py-3"><Badge variant="outline" className={`${CTRL_STATUS_COLORS[c.status]} border-0 text-[10px] uppercase`}>{c.status.replace("_"," ")}</Badge></td>
                    <td className="px-5 py-3 text-muted-foreground truncate max-w-[200px]">{c.evidence || "—"}</td>
                    {isConsultant && (
                      <td className="px-5 py-3 text-right space-x-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditCtrl(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeCtrl(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </td>
                    )}
                  </tr>
                ))}
                {controls.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No controls yet</td></tr>}
              </tbody>
            </table>
          </div>
          <Dialog open={cOpen} onOpenChange={setCOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{cEditing ? "Edit Control" : "Add Control"}</DialogTitle></DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Control ID</Label><Input value={cForm.control_id} onChange={e => setCForm(f => ({ ...f, control_id: e.target.value }))} placeholder="e.g. A.5.1" /></div>
                  <div className="space-y-1.5"><Label>Status</Label><Select value={cForm.status} onValueChange={v => setCForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["not_implemented","partial","implemented","verified"].map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_"," ")}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="space-y-1.5"><Label>Title</Label><Input value={cForm.title} onChange={e => setCForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Description</Label><Textarea value={cForm.description} onChange={e => setCForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
                <div className="space-y-1.5"><Label>Evidence</Label><Textarea value={cForm.evidence} onChange={e => setCForm(f => ({ ...f, evidence: e.target.value }))} rows={2} placeholder="Link or description of evidence" /></div>
                <div className="space-y-1.5"><Label>Notes</Label><Textarea value={cForm.notes} onChange={e => setCForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setCOpen(false)}>Cancel</Button><Button onClick={saveCtrl}>{cEditing ? "Update" : "Add"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </AppShell>
  );
}
