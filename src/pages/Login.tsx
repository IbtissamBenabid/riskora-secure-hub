import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/StoreContext";
import { toast } from "sonner";
import { ArrowRight, ShieldCheck, Users, Building2 } from "lucide-react";

const DEMO_ACCOUNTS = [
  { email: "alex@riskora.io", role: "Consultant", icon: ShieldCheck, desc: "Full platform access" },
  { email: "priya@northwind.com", role: "Client", icon: Building2, desc: "Northwind Bank — read-only & approvals" },
  { email: "security@cloudfleet.io", role: "Supplier", icon: Users, desc: "CloudFleet — questionnaire only" },
];

export default function Login() {
  const { login, currentUser } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (currentUser) return <Navigate to={destinationFor(currentUser.role)} replace />;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const user = login(email.trim());
    if (!user) { toast.error("No account found for that email."); return; }
    toast.success(`Welcome, ${user.name}`);
    navigate(destinationFor(user.role), { replace: true });
  }

  function quickLogin(e: string) {
    const user = login(e);
    if (user) navigate(destinationFor(user.role), { replace: true });
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between bg-sidebar p-12 text-sidebar-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(hsl(var(--accent))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--accent))_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="relative">
          <Logo />
        </div>
        <div className="relative space-y-8">
          <h2 className="max-w-md text-4xl font-bold leading-tight text-white">
            Manage third-party risk like a security team, not a spreadsheet.
          </h2>
          <p className="max-w-md text-sidebar-foreground/70">
            Riskora unifies vendor assessments, scoring and decisions across every engagement — purpose-built for cybersecurity consulting firms.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-md pt-4 border-t border-sidebar-border">
            <Stat value="120+" label="Suppliers" />
            <Stat value="14" label="Frameworks" />
            <Stat value="SOC 2" label="Aligned" />
          </div>
        </div>
        <div className="relative text-xs text-sidebar-foreground/50">© 2025 Riskora — Cybersecurity Consulting Platform</div>
      </div>

      {/* Right — auth card */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo /></div>
          <h1 className="text-2xl font-bold tracking-tight">Sign in to your workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use one of the demo accounts below or enter credentials.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              <p className="text-[11px] text-muted-foreground">Demo mode — password is not validated.</p>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              Sign in <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="my-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Demo accounts</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2">
            {DEMO_ACCOUNTS.map(({ email: e, role, icon: Icon, desc }) => (
              <button
                key={e}
                onClick={() => quickLogin(e)}
                className="group flex w-full items-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-left transition hover:border-accent hover:shadow-sm"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-soft text-accent">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{role}</div>
                  <div className="truncate text-xs text-muted-foreground">{desc}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-accent" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function destinationFor(role: string) {
  if (role === "supplier") return "/supplier/portal";
  return "/dashboard";
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60">{label}</div>
    </div>
  );
}
