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

type ReqRow = Tables<"security_requirements">;

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-risk-high/15 text-risk-high",
  high: "bg-orange-500/15 text-orange-400",
  medium: "bg-yellow-500/15 text-yellow-400",
  low: "bg-green-500/15 text-green-400",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-blue-500/15 text-blue-400",
  implemented: "bg-green-500/15 text-green-400",
  verified: "bg-accent/15 text-accent",
};

const FRAMEWORKS = ["NIST 800-53", "ISO 27002", "OWASP ASVS", "CIS Controls", "PCI DSS", "Custom"];

export default function SecurityRequirementsModule() {
  const { projects, currentUser } = useStore();
  const isConsultant = currentUser?.role === "consultant";
  const [rows, setRows] = useState<ReqRow[]>([]);
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("all");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ReqRow | null>(null);
  const [form, setForm] = useState({ title: "", description: "", framework: "", reference_id: "", priority: "medium" as string, status: "draft" as string, assigned_to: "", project_id: "" });

  async function load() {
    const { data } = await supabase.from("security_requirements").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter(r => {
    if (filterProject !== "all" && r.project_id !== filterProject) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.title.toLowerCase().includes(q) || r.framework?.toLowerCase().includes(q) || r.reference_id?.toLowerCase().includes(q);
  }), [rows, search, filterProject]);

  function openCreate() {
    setEditing(null);
    setForm({ title: "", description: "", framework: "", reference_id: "", priority: "medium", status: "draft", assigned_to: "", project_id: projects[0]?.id ?? "" });
    setOpen(true);
  }
  function openEdit(r: ReqRow) {
    setEditing(r);
    setForm({ title: r.title, description: r.description ?? "", framework: r.framework ?? "", reference_id: r.reference_id ?? "", priority: r.priority, status: r.status, assigned_to: r.assigned_to ?? "", project_id: r.project_id });
    setOpen(true);
  }

  async function save() {
    if (!form.title.trim() || !form.project_id) { toast.error("Title and project required"); return; }
    const payload = { title: form.title.trim(), description: form.description, framework: form.framework, reference_id: form.reference_id, priority: form.priority as any, status: form.status as any, assigned_to: form.assigned_to, project_id: form.project_id };
    if (editing) {
      const { error } = await supabase.from("security_requirements").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Requirement updated");
    } else {
      const { error } = await supabase.from("security_requirements").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Requirement added");
    }
    setOpen(false); load();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("security_requirements").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted"); load();
  }

  return (
    <AppShell title="Security Requirements" description="Maintain a catalog of security requirements mapped to frameworks"
      actions={isConsultant && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="bg-accent hover:bg-accent/90" onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" />Add Requirement</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Edit Requirement" : "Add Requirement"}</DialogTitle></DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-1.5"><Label>Project</Label>
                <Select value={form.project_id} onValueChange={v => setForm(f => ({ ...f, project_id: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Framework</Label>
                  <Select value={form.framework} onValueChange={v => setForm(f => ({ ...f, framework: v }))}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{FRAMEWORKS.map(fw => <SelectItem key={fw} value={fw}>{fw}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Reference ID</Label><Input value={form.reference_id} onChange={e => setForm(f => ({ ...f, reference_id: e.target.value }))} placeholder="e.g. AC-2" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Priority</Label>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["critical","high","medium","low"].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["draft","approved","implemented","verified"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Assigned To</Label><Input value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} /></div>
            </div>
            <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>{editing ? "Update" : "Add"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    >
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search requirements…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={filterProject} onValueChange={setFilterProject}><SelectTrigger className="w-48"><SelectValue placeholder="All projects" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All projects</SelectItem>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-semibold">Requirement</th>
              <th className="px-5 py-3 font-semibold">Framework</th>
              <th className="px-5 py-3 font-semibold">Ref</th>
              <th className="px-5 py-3 font-semibold">Priority</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Assigned</th>
              {isConsultant && <th className="px-5 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-surface-muted">
                <td className="px-5 py-3 font-medium max-w-xs truncate">{r.title}</td>
                <td className="px-5 py-3 text-muted-foreground">{r.framework}</td>
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{r.reference_id}</td>
                <td className="px-5 py-3"><Badge variant="outline" className={`${PRIORITY_COLORS[r.priority]} border-0 text-[10px] uppercase`}>{r.priority}</Badge></td>
                <td className="px-5 py-3"><Badge variant="outline" className={`${STATUS_COLORS[r.status]} border-0 text-[10px] uppercase`}>{r.status}</Badge></td>
                <td className="px-5 py-3 text-muted-foreground">{r.assigned_to}</td>
                {isConsultant && (
                  <td className="px-5 py-3 text-right space-x-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">No requirements found</td></tr>}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
