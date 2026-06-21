import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ScanLine, GitCompare, Copy, History, BookOpen, Glasses, Settings, LogOut, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "./Logo";
import { useQueryClient } from "@tanstack/react-query";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/scan", label: "Scan", icon: ScanLine },
  { to: "/compare", label: "Compare", icon: GitCompare },
  { to: "/twin-compare", label: "Twin Compare", icon: Copy },
  { to: "/history", label: "History", icon: History },
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/specs", label: "Smart Specs", icon: Glasses },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 z-40 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-full glass-strong border-r border-border flex flex-col p-5">
          <div className="flex items-center justify-between mb-8">
            <Logo />
            <button onClick={() => setOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 space-y-1">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = pathname === to || pathname.startsWith(to + "/");
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    active
                      ? "bg-primary text-primary-foreground shadow-glass"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-destructive transition"
          >
            <LogOut className="h-4.5 w-4.5" /> Sign out
          </button>
        </div>
      </aside>

      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30 lg:hidden" />}

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-20 glass border-b border-border px-4 py-3 flex items-center justify-between">
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-muted"><Menu className="h-5 w-5" /></button>
          <Logo size="sm" />
          <div className="w-9" />
        </header>
        <main className="p-5 md:p-8 lg:p-12 max-w-7xl mx-auto animate-(--animate-fade-in)">
          {children}
        </main>
      </div>
    </div>
  );
}
