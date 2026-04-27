import { Link } from "react-router-dom";
import { useStore } from "@/store/StoreContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { ShieldCheck, ArrowRight, LogOut } from "lucide-react";

export default function SupplierPortal() {
  const { currentUser, suppliers, assessments, projects, organizations, logout } = useStore();
  const supplier = suppliers.find(s => s.id === currentUser?.supplierId);
  const myAssessments = assessments.filter(a => a.supplierId === supplier?.id && a.status !== "draft");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-white">{currentUser?.name}</div>
              <div className="text-[11px] uppercase tracking-wider text-sidebar-primary">Supplier portal</div>
            </div>
            <Button onClick={logout} variant="ghost" size="sm" className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-white">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight">Welcome, {supplier?.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Below are the security questionnaires you've been requested to complete.</p>

        <div className="mt-8 space-y-3">
          {myAssessments.length === 0 && (
            <div className="panel flex flex-col items-center justify-center py-16 text-center">
              <ShieldCheck className="h-10 w-10 text-muted-foreground/50" />
              <h3 className="mt-4 text-sm font-semibold">No active questionnaires</h3>
              <p className="mt-1 text-xs text-muted-foreground">You'll see them here once a consultant sends one.</p>
            </div>
          )}

          {myAssessments.map(a => {
            const project = projects.find(p => p.id === a.projectId);
            const org = organizations.find(o => o.id === project?.organizationId);
            const canFill = a.status === "sent";
            return (
              <div key={a.id} className="panel flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-soft text-accent">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{org?.name} • {project?.name}</div>
                </div>
                <StatusBadge status={a.status} />
                {canFill ? (
                  <Button asChild size="sm" className="bg-accent hover:bg-accent/90">
                    <Link to={`/supplier/questionnaire/${a.id}`}>Fill out <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled>Submitted</Button>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
