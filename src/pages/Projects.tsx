import { useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useStore } from "@/store/StoreContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, FolderKanban, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Projects() {
  const { projects, organizations, assessments, suppliers, currentUser, createProject, createOrganization } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [orgId, setOrgId] = useState(organizations[0]?.id ?? "");
  const [newOrgName, setNewOrgName] = useState("");

  // Clients only see their assigned projects (RLS already filters, but keep UX consistent)
  const visibleProjects = currentUser?.role === "client"
    ? projects.filter(p => currentUser.assignedProjectIds?.includes(p.id) || p.organizationId === currentUser.organizationId)
    : projects;

  const isConsultant = currentUser?.role === "consultant";

  async function submit() {
    if (!name.trim()) { toast.error("Project name required"); return; }
    let useOrg = orgId;
    if (!useOrg && newOrgName.trim()) {
      const o = await createOrganization({ name: newOrgName.trim() });
      if (!o) return;
      useOrg = o.id;
    }
    if (!useOrg) { toast.error("Please select or create a client organization"); return; }
    const p = await createProject({ name: name.trim(), description: description.trim(), organizationId: useOrg });
    if (!p) return;
    toast.success("Project created");
    setName(""); setDescription(""); setNewOrgName(""); setOpen(false);
  }

  return (
    <AppShell
      title="Projects"
      description="Engagements grouped by client organization"
      actions={isConsultant && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground"><Plus className="mr-1.5 h-4 w-4" />New Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create project</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Q3 Vendor Risk Review" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Client organization</Label>
                {organizations.length > 0 ? (
                  <Select value={orgId} onValueChange={setOrgId}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {organizations.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} placeholder="New client organization name" />
                )}
                {organizations.length === 0 && (
                  <p className="text-[11px] text-muted-foreground">No organizations yet — one will be created.</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    >
      {visibleProjects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleProjects.map(p => {
            const org = organizations.find(o => o.id === p.organizationId);
            const projectAssessments = assessments.filter(a => a.projectId === p.id);
            const suppliersInProject = new Set(projectAssessments.map(a => a.supplierId));
            return (
              <Link key={p.id} to={`/projects/${p.id}`} className="panel group p-5 transition hover:border-accent hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-soft text-accent">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${p.status === "active" ? "bg-risk-low-soft text-risk-low" : "bg-muted text-muted-foreground"}`}>
                    {p.status}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold leading-tight">{p.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">{org?.name}</div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="flex gap-4">
                    <span><span className="font-mono font-semibold text-foreground">{projectAssessments.length}</span> assessments</span>
                    <span><span className="font-mono font-semibold text-foreground">{suppliersInProject.size}</span> suppliers</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:text-accent" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function EmptyState() {
  return (
    <div className="panel flex flex-col items-center justify-center py-20 text-center">
      <FolderKanban className="h-10 w-10 text-muted-foreground/50" />
      <h3 className="mt-4 text-base font-semibold">No projects yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">Create your first engagement to start tracking risk.</p>
    </div>
  );
}
