import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { RecBadge } from "./dashboard";
import { type Recommendation } from "@/lib/ai-analysis";
import { Trash2, ScanLine } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History · AgriVision AI" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const qc = useQueryClient();
  const { data: scans = [], isLoading } = useQuery({
    queryKey: ["scans-all"],
    queryFn: async () => {
      const { data } = await supabase.from("scans").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function del(id: string) {
    const { error } = await supabase.from("scans").delete().eq("id", id);
    if (error) { toast.error("Delete failed"); return; }
    toast.success("Removed");
    qc.invalidateQueries({ queryKey: ["scans-all"] });
    qc.invalidateQueries({ queryKey: ["scans-recent"] });
  }

  return (
    <AppShell>
      <div className="space-y-7">
        <div>
          <div className="text-sm text-accent font-medium uppercase tracking-widest">History</div>
          <h1 className="text-3xl md:text-4xl font-semibold mt-1">Your scans</h1>
        </div>

        {isLoading ? (
          <div className="glass rounded-3xl p-10 text-center text-muted-foreground">Loading…</div>
        ) : scans.length === 0 ? (
          <div className="glass-strong rounded-3xl p-12 text-center">
            <ScanLine className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <div className="text-lg font-medium">No scans yet</div>
            <Link to="/scan" className="mt-5 inline-flex rounded-full gradient-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">Start scanning</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scans.map((s) => (
              <div key={s.id} className="glass rounded-2xl overflow-hidden hover:shadow-elevated transition">
                {s.image_url && <img src={s.image_url} alt={s.produce_name} className="w-full aspect-[4/3] object-cover" />}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.intent.replace(/_/g, " ")}</div>
                      <div className="text-lg font-semibold mt-0.5">{s.produce_name}</div>
                    </div>
                    <RecBadge rec={s.recommendation as Recommendation} />
                  </div>
                  {s.reasoning && <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{s.reasoning}</p>}
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(s.created_at).toLocaleDateString()}</span>
                    <button onClick={() => del(s.id)} className="hover:text-destructive transition flex items-center gap-1">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
