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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Pencil, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type ReviewRow = Tables<"code_reviews">;
type FindingRow = Tables<"code_review_findings">;

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-muted text-muted-foreground",
  in_progress: "bg-yellow-500/15 text-yellow-400",
  completed: "bg-green-500/15 text-green-400",
};
const SEV_COLORS: Record<string, string> = {
  critical: "bg-risk-high/15 text-risk-high",
  high: "bg-orange-500/15 text-orange-400",
  medium: "bg-yellow-500/15 text-yellow-400",
  low: "bg-blue-500/15 text-blue-400",
  info: "bg-muted text-muted-foreground",
};
const FSTATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500/15 text-yellow-400",
  confirmed: "bg-orange-500/15 text-orange-400",
  fixed: "bg-green-500/15 text-green-400",
  false_positive: "bg-muted text-muted-foreground",
};

export default function SecureCodeReviewModule() {
  const { projects, currentUser } = useStore();
  const isConsultant = currentUser?.role === "consultant";
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [findings, setFindings] = useState<FindingRow[]>([]);
  const [selectedReview, setSelectedReview] = useState<ReviewRow | null>(null);
  const [search, setSearch] = useState("");

  // Review dialog
  const [rOpen, setROpen] = useState(false);
  const [rEditing, setREditing] = useState<ReviewRow | null>(null);
  const [rForm, setRForm] = useState({ title: "", repository_url: "", scope: "", status: "planned" as string, reviewer: "", project_id: "" });

  // Finding dialog
  const [fOpen, setFOpen] = useState(false);
  const [fEditing, setFEditing] = useState<FindingRow | null>(null);
  const [fForm, setFForm] = useState({ title: "", description: "", severity: "medium" as string, cwe_id: "", file_path: "", line_number: "" as string, status: "open" as string, remediation: "" });

  async function loadReviews() {
    const { data } = await supabase.from("code_reviews").select("*").order("created_at", { ascending: false });
    setReviews(data ?? []);
  }
  async function loadFindings(reviewId: string) {
    const { data } = await supabase.from("code_review_findings").select("*").eq("review_id", reviewId).order("created_at", { ascending: false });
    setFindings(data ?? []);
  }
  useEffect(() => { loadReviews(); }, []);
  useEffect(() => { if (selectedReview) loadFindings(selectedReview.id); }, [selectedReview]);

  function openCreateReview() {
    setREditing(null);
    setRForm({ title: "", repository_url: "", scope: "", status: "planned", reviewer: "", project_id: projects[0]?.id ?? "" });
    setROpen(true);
  }
  function openEditReview(r: ReviewRow) {
    setREditing(r);
    setRForm({ title: r.title, repository_url: r.repository_url ?? "", scope: r.scope ?? "", status: r.status, reviewer: r.reviewer ?? "", project_id: r.project_id });
    setROpen(true);
  }

  async function saveReview() {
    if (!rForm.title.trim() || !rForm.project_id) { toast.error("Title and project required"); return; }
    const payload = { title: rForm.title.trim(), repository_url: rForm.repository_url, scope: rForm.scope, status: rForm.status as any, reviewer: rForm.reviewer, project_id: rForm.project_id };
    if (rEditing) {
      const { error } = await supabase.from("code_reviews").update(payload).eq("id", rEditing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Review updated");
    } else {
      const { error } = await supabase.from("code_reviews").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Review created");
    }
    setROpen(false); loadReviews();
  }

  async function removeReview(id: string) {
    const { error } = await supabase.from("code_reviews").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (selectedReview?.id === id) { setSelectedReview(null); setFindings([]); }
    toast.success("Deleted"); loadReviews();
  }

  function openCreateFinding() {
    setFEditing(null);
    setFForm({ title: "", description: "", severity: "medium", cwe_id: "", file_path: "", line_number: "", status: "open", remediation: "" });
    setFOpen(true);
  }
  function openEditFinding(f: FindingRow) {
    setFEditing(f);
    setFForm({ title: f.title, description: f.description ?? "", severity: f.severity, cwe_id: f.cwe_id ?? "", file_path: f.file_path ?? "", line_number: f.line_number ? String(f.line_number) : "", status: f.status, remediation: f.remediation ?? "" });
    setFOpen(true);
  }

  async function saveFinding() {
    if (!fForm.title.trim() || !selectedReview) { toast.error("Title required"); return; }
    const payload = { title: fForm.title.trim(), description: fForm.description, severity: fForm.severity as any, cwe_id: fForm.cwe_id, file_path: fForm.file_path, line_number: fForm.line_number ? Number(fForm.line_number) : null, status: fForm.status as any, remediation: fForm.remediation, review_id: selectedReview.id };
    if (fEditing) {
      const { error } = await supabase.from("code_review_findings").update(payload).eq("id", fEditing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Finding updated");
    } else {
      const { error } = await supabase.from("code_review_findings").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Finding added");
    }
    setFOpen(false); loadFindings(selectedReview.id);
  }

  async function removeFinding(id: string) {
    if (!selectedReview) return;
    const { error } = await supabase.from("code_review_findings").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted"); loadFindings(selectedReview.id);
  }

  return (
    <AppShell title="Secure Code Review" description="Plan, conduct and report code reviews with finding triage"
      actions={isConsultant && !selectedReview && (
        <Button size="sm" className="bg-accent hover:bg-accent/90" onClick={openCreateReview}><Plus className="mr-1.5 h-4 w-4" />New Review</Button>
      )}
    >
      {!selectedReview ? (
        <>
          <div className="mb-4 relative max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search reviews…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
          <div className="panel overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-3 font-semibold">Review</th><th className="px-5 py-3 font-semibold">Repo</th><th className="px-5 py-3 font-semibold">Reviewer</th><th className="px-5 py-3 font-semibold">Status</th>{isConsultant && <th className="px-5 py-3" />}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reviews.filter(r => !search.trim() || r.title.toLowerCase().includes(search.toLowerCase())).map(r => (
                  <tr key={r.id} className="hover:bg-surface-muted cursor-pointer" onClick={() => setSelectedReview(r)}>
                    <td className="px-5 py-3 font-medium flex items-center gap-2">{r.title}<ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /></td>
                    <td className="px-5 py-3 text-muted-foreground font-mono text-xs truncate max-w-xs">{r.repository_url}</td>
                    <td className="px-5 py-3 text-muted-foreground">{r.reviewer}</td>
                    <td className="px-5 py-3"><Badge variant="outline" className={`${STATUS_COLORS[r.status]} border-0 text-[10px] uppercase`}>{r.status.replace("_", " ")}</Badge></td>
                    {isConsultant && (
                      <td className="px-5 py-3 text-right space-x-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditReview(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeReview(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </td>
                    )}
                  </tr>
                ))}
                {reviews.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No code reviews yet</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Review create/edit dialog */}
          <Dialog open={rOpen} onOpenChange={setROpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{rEditing ? "Edit Review" : "New Code Review"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5"><Label>Project</Label><Select value={rForm.project_id} onValueChange={v => setRForm(f => ({ ...f, project_id: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>Title</Label><Input value={rForm.title} onChange={e => setRForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Repository URL</Label><Input value={rForm.repository_url} onChange={e => setRForm(f => ({ ...f, repository_url: e.target.value }))} placeholder="https://github.com/…" /></div>
                <div className="space-y-1.5"><Label>Scope</Label><Textarea value={rForm.scope} onChange={e => setRForm(f => ({ ...f, scope: e.target.value }))} rows={2} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Reviewer</Label><Input value={rForm.reviewer} onChange={e => setRForm(f => ({ ...f, reviewer: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>Status</Label><Select value={rForm.status} onValueChange={v => setRForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["planned","in_progress","completed"].map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_"," ")}</SelectItem>)}</SelectContent></Select></div>
                </div>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setROpen(false)}>Cancel</Button><Button onClick={saveReview}>{rEditing ? "Update" : "Create"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setSelectedReview(null); setFindings([]); }}>← Back</Button>
            <div>
              <h2 className="text-lg font-semibold">{selectedReview.title}</h2>
              <p className="text-xs text-muted-foreground font-mono">{selectedReview.repository_url}</p>
            </div>
            <Badge variant="outline" className={`${STATUS_COLORS[selectedReview.status]} border-0 text-[10px] uppercase ml-auto`}>{selectedReview.status.replace("_"," ")}</Badge>
            {isConsultant && <Button size="sm" className="bg-accent hover:bg-accent/90" onClick={openCreateFinding}><Plus className="mr-1.5 h-4 w-4" />Add Finding</Button>}
          </div>

          <div className="panel overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-3 font-semibold">Finding</th><th className="px-5 py-3 font-semibold">Severity</th><th className="px-5 py-3 font-semibold">CWE</th><th className="px-5 py-3 font-semibold">File</th><th className="px-5 py-3 font-semibold">Status</th>{isConsultant && <th className="px-5 py-3" />}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {findings.map(f => (
                  <tr key={f.id} className="hover:bg-surface-muted">
                    <td className="px-5 py-3 font-medium max-w-xs truncate">{f.title}</td>
                    <td className="px-5 py-3"><Badge variant="outline" className={`${SEV_COLORS[f.severity]} border-0 text-[10px] uppercase`}>{f.severity}</Badge></td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{f.cwe_id}</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground truncate max-w-[200px]">{f.file_path}{f.line_number ? `:${f.line_number}` : ""}</td>
                    <td className="px-5 py-3"><Badge variant="outline" className={`${FSTATUS_COLORS[f.status]} border-0 text-[10px] uppercase`}>{f.status.replace("_"," ")}</Badge></td>
                    {isConsultant && (
                      <td className="px-5 py-3 text-right space-x-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditFinding(f)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFinding(f.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </td>
                    )}
                  </tr>
                ))}
                {findings.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">No findings yet</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Finding dialog */}
          <Dialog open={fOpen} onOpenChange={setFOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{fEditing ? "Edit Finding" : "Add Finding"}</DialogTitle></DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-1.5"><Label>Title</Label><Input value={fForm.title} onChange={e => setFForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Description</Label><Textarea value={fForm.description} onChange={e => setFForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Severity</Label><Select value={fForm.severity} onValueChange={v => setFForm(f => ({ ...f, severity: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["critical","high","medium","low","info"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label>CWE ID</Label><Input value={fForm.cwe_id} onChange={e => setFForm(f => ({ ...f, cwe_id: e.target.value }))} placeholder="CWE-79" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>File Path</Label><Input value={fForm.file_path} onChange={e => setFForm(f => ({ ...f, file_path: e.target.value }))} placeholder="src/auth.ts" /></div>
                  <div className="space-y-1.5"><Label>Line #</Label><Input type="number" value={fForm.line_number} onChange={e => setFForm(f => ({ ...f, line_number: e.target.value }))} /></div>
                </div>
                <div className="space-y-1.5"><Label>Status</Label><Select value={fForm.status} onValueChange={v => setFForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["open","confirmed","fixed","false_positive"].map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_"," ")}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>Remediation</Label><Textarea value={fForm.remediation} onChange={e => setFForm(f => ({ ...f, remediation: e.target.value }))} rows={2} /></div>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setFOpen(false)}>Cancel</Button><Button onClick={saveFinding}>{fEditing ? "Update" : "Add"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </AppShell>
  );
}
