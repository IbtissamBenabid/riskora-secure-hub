import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useStore } from "@/store/StoreContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Send, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function Invites() {
  const { organizations, projects, suppliers, createInvite, invites, loadInvites } = useStore();
  const [tab, setTab] = useState<"client" | "supplier">("client");
  const [email, setEmail] = useState("");
  const [orgId, setOrgId] = useState("");
  const [projectId, setProjectId] = useState<string>("__none");
  const [supplierId, setSupplierId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { loadInvites(); }, [loadInvites]);
  useEffect(() => { if (!orgId && organizations[0]) setOrgId(organizations[0].id); }, [organizations, orgId]);
  useEffect(() => { if (!supplierId && suppliers[0]) setSupplierId(suppliers[0].id); }, [suppliers, supplierId]);

  async function send() {
    if (!email.trim()) { toast.error("Email required"); return; }
    setBusy(true);
    const res = await createInvite({
      email,
      role: tab,
      orgId: tab === "client" ? orgId : undefined,
      projectId: tab === "client" && projectId !== "__none" ? projectId : undefined,
      supplierId: tab === "supplier" ? supplierId : undefined,
    });
    setBusy(false);
    if (!res) return;
    const link = `${window.location.origin}/login?invite=${res.token}`;
    await navigator.clipboard.writeText(link).catch(() => {});
    toast.success("Invite created — link copied to clipboard");
    setEmail("");
    loadInvites();
  }

  const projectsForOrg = projects.filter(p => p.organizationId === orgId);

  return (
    <AppShell title="Invitations" description="Invite clients and suppliers to your workspace">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="panel p-6 lg:col-span-1">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold">New invitation</h3>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="client">Client</TabsTrigger>
              <TabsTrigger value="supplier">Supplier</TabsTrigger>
            </TabsList>

            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="person@company.com" />
              </div>

              <TabsContent value="client" className="mt-0 space-y-4">
                <div className="space-y-1.5">
                  <Label>Organization</Label>
                  <Select value={orgId} onValueChange={setOrgId}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {organizations.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Specific project (optional)</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">All projects in org</SelectItem>
                      {projectsForOrg.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="supplier" className="mt-0">
                <div className="space-y-1.5">
                  <Label>Supplier record</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">The invitee will be linked to this supplier on signup.</p>
                </div>
              </TabsContent>

              <Button onClick={send} disabled={busy} className="w-full bg-accent hover:bg-accent/90">
                <Send className="mr-1.5 h-4 w-4" />Create invite
              </Button>
            </div>
          </Tabs>
        </div>

        <div className="panel lg:col-span-2 overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-sm font-semibold">Recent invitations</h3>
            <p className="text-xs text-muted-foreground">Share the invite link with the recipient — they'll join with the assigned role.</p>
          </div>
          {invites.length === 0 ? (
            <div className="py-14 text-center text-sm text-muted-foreground">No invitations yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invites.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-muted">
                    <td className="px-5 py-3 font-medium">{inv.email}</td>
                    <td className="px-5 py-3 capitalize text-muted-foreground">{inv.role}</td>
                    <td className="px-5 py-3 capitalize text-muted-foreground">{inv.status}</td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const link = `${window.location.origin}/login?invite=${inv.token}`;
                          navigator.clipboard.writeText(link);
                          toast.success("Link copied");
                        }}
                      >
                        <Copy className="mr-1.5 h-3 w-3" />Copy link
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
