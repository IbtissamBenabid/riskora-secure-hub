import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useStore } from "@/store/StoreContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskBadge } from "@/components/RiskBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Building2, Search } from "lucide-react";
import { toast } from "sonner";

export default function TPRM() {
  const store = useStore();
  const isConsultant = store.currentUser?.role === "consultant";
  const [tab, setTab] = useState("assessments");
  const [search, setSearch] = useState("");

  // Supplier dialog
  const [supOpen, setSupOpen] = useState(false);
  const [sName, setSName] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sCategory, setSCategory] = useState("");
  const [sOrg, setSOrg] = useState(store.organizations[0]?.id ?? "");

  // Assessment dialog
  const [assOpen, setAssOpen] = useState(false);
  const [aProj, setAProj] = useState(store.projects[0]?.id ?? "");
  const [aSup, setASup] = useState(store.suppliers[0]?.id ?? "");
  const [aTitle, setATitle] = useState("");

  const assessmentRows = useMemo(() => store.assessments.map(a => ({
    a,
    supplier: store.suppliers.find(s => s.id === a.supplierId),
    project: store.projects.find(p => p.id === a.projectId),
    score: store.riskScores.find(r => r.assessmentId === a.id),
  })).filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.supplier?.name.toLowerCase().includes(q) || r.project?.name.toLowerCase().includes(q) || r.a.title.toLowerCase().includes(q);
  }), [store.assessments, store.suppliers, store.projects, store.riskScores, search]);

  function createSupplier() {
    if (!sName.trim() || !sEmail.trim()) { toast.error("Name and email required"); return; }
    store.createSupplier({ name: sName.trim(), contactEmail: sEmail.trim(), category: sCategory.trim() || "General", organizationId: sOrg });
    toast.success("Supplier added");
    setSupOpen(false); setSName(""); setSEmail(""); setSCategory("");
  }

  function createAssessment() {
    if (!aTitle.trim()) { toast.error("Title required"); return; }
    store.createAssessment({ projectId: aProj, supplierId: aSup, title: aTitle.trim() });
    toast.success("Assessment created");
    setAssOpen(false); setATitle("");
  }

  return (
    <AppShell
      title="TPRM"
      description="Third-Party Risk Management — vendors, assessments, and decisions"
      actions={isConsultant && (
        <>
          <Dialog open={supOpen} onOpenChange={setSupOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Building2 className="mr-1.5 h-4 w-4" />Add Supplier</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add supplier</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5"><Label>Supplier name</Label><Input value={sName} onChange={(e) => setSName(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Contact email</Label><Input type="email" value={sEmail} onChange={(e) => setSEmail(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Category</Label><Input value={sCategory} onChange={(e) => setSCategory(e.target.value)} placeholder="Cloud Hosting" /></div>
                <div className="space-y-1.5">
                  <Label>Client organization</Label>
                  <Select value={sOrg} onValueChange={setSOrg}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{store.organizations.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setSupOpen(false)}>Cancel</Button><Button onClick={createSupplier}>Add</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={assOpen} onOpenChange={setAssOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-accent hover:bg-accent/90"><Plus className="mr-1.5 h-4 w-4" />New Assessment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create assessment</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5"><Label>Title</Label><Input value={aTitle} onChange={(e) => setATitle(e.target.value)} /></div>
                <div className="space-y-1.5">
                  <Label>Project</Label>
                  <Select value={aProj} onValueChange={setAProj}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{store.projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Supplier</Label>
                  <Select value={aSup} onValueChange={setASup}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{store.suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setAssOpen(false)}>Cancel</Button><Button onClick={createAssessment}>Create draft</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="assessments" className="mt-6">
          <div className="mb-4 relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search supplier, project, title…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="panel overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Supplier</th>
                  <th className="px-5 py-3 font-semibold">Project</th>
                  <th className="px-5 py-3 font-semibold">Title</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Score</th>
                  <th className="px-5 py-3 font-semibold">Risk</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assessmentRows.map(({ a, supplier, project, score }) => (
                  <tr key={a.id} className="hover:bg-surface-muted">
                    <td className="px-5 py-3 font-medium">{supplier?.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{project?.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{a.title}</td>
                    <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-5 py-3 font-mono">{score ? score.score : "—"}</td>
                    <td className="px-5 py-3">{score ? <RiskBadge level={score.level} /> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-5 py-3 text-right">
                      <Link to={`/tprm/assessments/${a.id}`} className="text-xs font-medium text-accent hover:underline">Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="mt-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {store.suppliers.map(s => {
              const org = store.organizations.find(o => o.id === s.organizationId);
              const count = store.assessments.filter(a => a.supplierId === s.id).length;
              return (
                <div key={s.id} className="panel p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-base font-semibold">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.category}</div>
                    </div>
                    <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">{org?.name}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                    <span className="text-muted-foreground">{s.contactEmail}</span>
                    <span><span className="font-mono font-semibold">{count}</span> <span className="text-muted-foreground">assessments</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
