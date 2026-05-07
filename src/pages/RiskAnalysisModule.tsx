import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useStore } from "@/store/StoreContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type RiskRow = Tables<"risk_registers">;

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500/15 text-yellow-400",
  mitigated: "bg-green-500/15 text-green-400",
  accepted: "bg-blue-500/15 text-blue-400",
  transferred: "bg-purple-500/15 text-purple-400",
};

function riskColor(score: number) {
  if (score >= 16) return "text-risk-high";
  if (score >= 9) return "text-risk-medium";
  return "text-risk-low";
}

export default function RiskAnalysisModule() {
  const { projects, currentUser } = useStore();
  const isConsultant = currentUser?.role === "consultant";
  const [rows, setRows] = useState<RiskRow[]>([]);
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("all");

  // Dialog state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RiskRow | null>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "", likelihood: 3, impact: 3, treatment: "", status: "open" as string, owner: "", project_id: "" });

  async function load() {
    const { data } = await supabase.from("risk_registers").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter(r => {
    if (filterProject !== "all" && r.project_id !== filterProject) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.title.toLowerCase().includes(q) || r.category?.toLowerCase().includes(q) || r.owner?.toLowerCase().includes(q);
  }), [rows, search, filterProject]);

  function openCreate() {
    setEditing(null);
    setForm({ title: "", description: "", category: "", likelihood: 3, impact: 3, treatment: "", status: "open", owner: "", project_id: projects[0]?.id ?? "" });
    setOpen(true);
  }

  function openEdit(r: RiskRow) {
    setEditing(r);
    setForm({ title: r.title, description: r.description ?? "", category: r.category ?? "", likelihood: r.likelihood, impact: r.impact, treatment: r.treatment ?? "", status: r.status, owner: r.owner ?? "", project_id: r.project_id });
    setOpen(true);
  }

  async function save() {
    if (!form.title.trim() || !form.project_id) { toast.error("Title and project required"); return; }
    const payload = {
      title: form.title.trim(), description: form.description, category: form.category,
      likelihood: form.likelihood, impact: form.impact, treatment: form.treatment,
      status: form.status as any, owner: form.owner, project_id: form.project_id,
    };
    if (editing) {
      const { error } = await supabase.from("risk_registers").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Risk updated");
    } else {
      const { error } = await supabase.from("risk_registers").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Risk added");
    }
    setOpen(false);
    load();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("risk_registers").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    load();
  }

  return (
    <AppShell title="Risk Analysis" description="Identify, score and prioritize risks across client engagements"
      actions={isConsultant && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-accent hover:bg-accent/90" onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" />Add Risk</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Edit Risk" : "Add Risk"}</DialogTitle></DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-1.5"><Label>Project</Label>
                <Select value={form.project_id} onValueChange={v => setForm(f => ({ ...f, project_id: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Category</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Operational" /></div>
                <div className="space-y-1.5"><Label>Owner</Label><Input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Likelihood (1-5)</Label>
                  <Select value={String(form.likelihood)} onValueChange={v => setForm(f => ({ ...f, likelihood: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Impact (1-5)</Label>
                  <Select value={String(form.impact)} onValueChange={v => setForm(f => ({ ...f, impact: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["open","mitigated","accepted","transferred"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Treatment Plan</Label><Textarea value={form.treatment} onChange={e => setForm(f => ({ ...f, treatment: e.target.value }))} rows={2} /></div>
            </div>
            <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>{editing ? "Update" : "Add"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    >
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search risks…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All projects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-semibold">Risk</th>
              <th className="px-5 py-3 font-semibold">Category</th>
              <th className="px-5 py-3 font-semibold">L × I</th>
              <th className="px-5 py-3 font-semibold">Score</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Owner</th>
              {isConsultant && <th className="px-5 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-surface-muted">
                <td className="px-5 py-3 font-medium max-w-xs truncate">{r.title}</td>
                <td className="px-5 py-3 text-muted-foreground">{r.category}</td>
                <td className="px-5 py-3 font-mono text-muted-foreground">{r.likelihood} × {r.impact}</td>
                <td className={`px-5 py-3 font-mono font-semibold ${riskColor(r.risk_score ?? 0)}`}>{r.risk_score}</td>
                <td className="px-5 py-3"><Badge variant="outline" className={`${STATUS_COLORS[r.status]} border-0 text-[10px] uppercase`}>{r.status}</Badge></td>
                <td className="px-5 py-3 text-muted-foreground">{r.owner}</td>
                {isConsultant && (
                  <td className="px-5 py-3 text-right space-x-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">No risks found</td></tr>}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
