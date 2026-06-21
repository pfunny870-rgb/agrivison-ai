import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { ScanLine, GitCompare, History, BookOpen, ArrowRight, TrendingUp, Sparkles } from "lucide-react";
import { RECOMMENDATION_LABELS, type Recommendation } from "@/lib/ai-analysis";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · AgriVision AI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: scans = [] } = useQuery({
    queryKey: ["scans-recent"],
    queryFn: async () => {
      const { data } = await supabase.from("scans").select("*").order("created_at", { ascending: false }).limit(6);
      return data ?? [];
    },
  });
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      return data;
    },
  });

  const bestPicks = scans.filter((s) => s.recommendation === "best_pick").length;

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <div className="text-sm text-muted-foreground">Welcome back</div>
          <h1 className="text-3xl md:text-4xl font-semibold mt-1">
            {profile?.display_name ?? "Explorer"} <span className="text-gradient">·</span> {new Date().toLocaleDateString("en", { weekday: "long" })}
          </h1>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <StatCard icon={ScanLine} label="Total scans" value={scans.length} hint="last 6 shown" />
          <StatCard icon={Sparkles} label="Best picks" value={bestPicks} hint="ideal matches" tone="accent" />
          <StatCard icon={TrendingUp} label="Avg confidence" value={`${Math.round((scans.reduce((a, s) => a + Number(s.confidence), 0) / Math.max(1, scans.length)) * 100)}%`} />
        </div>

        {/* Quick actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <QuickAction to="/scan" icon={ScanLine} title="New scan" desc="Analyze any fruit or vegetable in seconds" />
          <QuickAction to="/compare" icon={GitCompare} title="Compare produce" desc="Rank multiple items by your intent" />
          <QuickAction to="/history" icon={History} title="Scan history" desc="Revisit past analyses" />
          <QuickAction to="/learn" icon={BookOpen} title="Learning mode" desc="The science behind every decision" />
        </div>

        {/* Recent scans */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent scans</h2>
            <Link to="/history" className="text-sm text-primary hover:underline">View all →</Link>
          </div>
          {scans.length === 0 ? (
            <div className="glass-strong rounded-3xl p-12 text-center">
              <div className="text-lg font-medium">No scans yet</div>
              <p className="text-sm text-muted-foreground mt-1">Start your first produce analysis.</p>
              <Link to="/scan" className="mt-5 inline-flex items-center gap-2 rounded-full gradient-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">
                Scan now <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scans.map((s) => (
                <div key={s.id} className="glass rounded-2xl p-5 hover:shadow-elevated transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.intent.replace(/_/g, " ")}</div>
                      <div className="text-lg font-semibold mt-0.5">{s.produce_name}</div>
                    </div>
                    <RecBadge rec={s.recommendation as Recommendation} />
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Ripeness {Number(s.ripeness_score).toFixed(0)}%</span>
                    <span>·</span>
                    <span>{Math.round(Number(s.confidence) * 100)}% confidence</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, hint, tone }: { icon: any; label: string; value: any; hint?: string; tone?: "accent" }) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${tone === "accent" ? "bg-accent text-accent-foreground" : "gradient-primary text-primary-foreground"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, desc }: { to: string; icon: any; title: string; desc: string }) {
  return (
    <Link to={to} className="group glass rounded-2xl p-6 hover:shadow-elevated transition flex items-center gap-4">
      <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shadow-glass shrink-0">
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition" />
    </Link>
  );
}

export function RecBadge({ rec }: { rec: Recommendation }) {
  const cls = rec === "best_pick" ? "bg-accent text-accent-foreground"
    : rec === "use_soon" ? "bg-warning text-warning-foreground"
    : rec === "store_later" ? "bg-primary text-primary-foreground"
    : "bg-destructive text-destructive-foreground";
  return <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-semibold ${cls}`}>{RECOMMENDATION_LABELS[rec]}</span>;
}
