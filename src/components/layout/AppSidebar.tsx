import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, FolderKanban, ShieldCheck, FileBarChart2,
  Activity, FileCheck2, Code2, Bug, Scale, Sparkles, UserPlus,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/StoreContext";
import { Button } from "@/components/ui/button";

const NAV_CORE = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["consultant","client"] },
  { to: "/projects", label: "Projects", icon: FolderKanban, roles: ["consultant","client"] },
  { to: "/tprm", label: "TPRM", icon: ShieldCheck, badge: "Core", roles: ["consultant","client"] },
  { to: "/reports", label: "Reports", icon: FileBarChart2, roles: ["consultant","client"] },
  { to: "/invites", label: "Invitations", icon: UserPlus, roles: ["consultant"] },
];

const NAV_PLACEHOLDER = [
  { to: "/modules/risk-analysis", label: "Risk Analysis", icon: Activity },
  { to: "/modules/security-requirements", label: "Security Requirements", icon: FileCheck2 },
  { to: "/modules/secure-code-review", label: "Secure Code Review", icon: Code2 },
  { to: "/modules/security-testing", label: "Security Testing", icon: Bug },
  { to: "/modules/compliance", label: "Compliance", icon: Scale },
];

export function AppSidebar() {
  const { currentUser, logout } = useStore();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 px-5 border-b border-sidebar-border">
        <Logo />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/50">
          Workspace
        </div>
        <ul className="space-y-0.5">
          {NAV_CORE.filter(n => !currentUser || n.roles.includes(currentUser.role)).map(({ to, label, icon: Icon, badge }) => (
            <li key={to}>
              <NavLink to={to} className={({ isActive }) => cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white"
              )}>
                <Icon className="h-4 w-4" />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className="rounded-sm bg-sidebar-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-sidebar-primary">
                    {badge}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="px-2 mt-7 mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/50">
          Modules
        </div>
        <ul className="space-y-0.5">
          {NAV_PLACEHOLDER.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink to={to} className={({ isActive }) => cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                isActive
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent/40 hover:text-white"
              )}>
                <Icon className="h-4 w-4" />
                <span className="flex-1">{label}</span>
                <Sparkles className="h-3 w-3 opacity-50" />
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-4">
        {currentUser && (
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-white">
              {currentUser.name.split(" ").map(n => n[0]).join("").slice(0,2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">{currentUser.name}</div>
              <div className="truncate text-[11px] uppercase tracking-wider text-sidebar-primary">{currentUser.role}</div>
            </div>
          </div>
        )}
        <Button onClick={() => { logout(); }} variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white">
          Sign out
        </Button>
      </div>
    </aside>
  );
}
