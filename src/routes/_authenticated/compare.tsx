import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { Plus, X, Trophy, Loader2, Save, FileDown, Share2 } from "lucide-react";
import { recommendFor, INTENT_LABELS, type Intent, type ProduceAnalysis, type Recommendation_Output } from "@/lib/ai-analysis";
import { analyzeProduceAI } from "@/lib/ai-inference.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RecBadge } from "./dashboard";
import { exportComparisonPdf, exportComparisonPdfBlob, comparisonPdfFilename } from "@/lib/pdf-export";
import { uploadAndShareScanPdf, copyToClipboard } from "@/lib/share-pdf";

export const Route = createFileRoute("/_authenticated/compare")({
  head: () => ({ meta: [{ title: "Compare · AgriVision AI" }] }),
  component: ComparePage,
});

interface Item { id: string; imageUrl: string; analysis: ProduceAnalysis; }

function ComparePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [intent, setIntent] = useState<Intent>("eat_today");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

  const runAnalyze = useServerFn(analyzeProduceAI);

  async function downscale(file: File): Promise<string> {
    const raw = await new Promise<string>((res) => {
      const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file);
    });
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 512 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = img.width * scale; c.height = img.height * scale;
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.src = raw;
    });
  }

  async function add(files: FileList) {
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      let prefs: string[] = [];
      if (u.user) {
        const { data: p } = await supabase.from("profiles").select("dietary_preferences").eq("id", u.user.id).maybeSingle();
        prefs = (p?.dietary_preferences as string[]) ?? [];
      }
      const next: Item[] = [];
      for (const f of Array.from(files)) {
        const imageUrl = await downscale(f);
        const result = await runAnalyze({ data: { imageDataUrl: imageUrl, dietaryPreferences: prefs } });
        const { source, error, ...analysis } = result as any;
        next.push({ id: crypto.randomUUID(), imageUrl, analysis: analysis as ProduceAnalysis });
      }
      setItems((cur) => [...cur, ...next].slice(0, 6));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  function remove(id: string) { setItems((cur) => cur.filter((i) => i.id !== id)); }

  const ranked = items
    .map((it) => ({ ...it, rec: recommendFor(it.analysis, intent) }))
    .sort((a, b) => b.rec.score - a.rec.score);

  async function save() {
    if (ranked.length < 2) return;
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("comparisons").insert({
        user_id: u.user.id,
        intent,
        items: ranked.map((r, i) => ({
          rank: i + 1, produceName: r.analysis.produceName,
          ripeness: r.analysis.ripeness, ripenessScore: r.analysis.ripenessScore,
          confidence: r.analysis.confidence, recommendation: r.rec.recommendation,
          reasoning: r.rec.reasoning, score: r.rec.score,
        })) as any,
        winner_index: 0,
      });
      if (error) throw error;
      toast.success("Comparison saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  }

  return (
    <AppShell>
      <div className="space-y-7">
        <div>
          <div className="text-sm text-accent font-medium uppercase tracking-widest">Comparison Intelligence</div>
          <h1 className="text-3xl md:text-4xl font-semibold mt-1">Pick the best one.</h1>
          <p className="text-muted-foreground mt-2">Upload 2–6 items, set your intent, and we'll rank them.</p>
        </div>

        {/* Intent */}
        <div className="glass-strong rounded-3xl p-5 flex flex-wrap gap-2">
          {(Object.keys(INTENT_LABELS) as Intent[]).map((k) => (
            <button key={k} onClick={() => setIntent(k)} className={`px-4 py-2 rounded-full text-sm font-medium ${intent === k ? "gradient-primary text-primary-foreground shadow-glass" : "bg-card border border-border hover:bg-muted"}`}>
              {INTENT_LABELS[k]}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ranked.map((it, idx) => (
            <CompareCard key={it.id} item={it} rec={it.rec} rank={idx + 1} onRemove={() => remove(it.id)} />
          ))}
          {items.length < 6 && (
            <button onClick={() => fileRef.current?.click()} disabled={loading} className="glass rounded-3xl p-10 border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground hover:border-primary transition min-h-[280px] disabled:opacity-60">
              {loading ? <Loader2 className="h-8 w-8 animate-spin text-accent" /> : (
                <>
                  <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-glass"><Plus className="h-6 w-6 text-primary-foreground" /></div>
                  <div className="font-medium">Add produce</div>
                  <div className="text-xs">You can compare up to 6 items</div>
                </>
              )}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && add(e.target.files)} />

        {ranked.length >= 2 && (
          <div className="grid sm:grid-cols-3 gap-3">
            <button
              onClick={() => exportComparisonPdf(intent, ranked.map((r, i) => ({
                rank: i + 1, produceName: r.analysis.produceName,
                ripeness: r.analysis.ripeness, ripenessScore: r.analysis.ripenessScore,
                confidence: r.analysis.confidence, recommendation: r.rec.recommendation,
                reasoning: r.rec.reasoning, score: r.rec.score,
              })))}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 font-medium hover:bg-muted"
            >
              <FileDown className="h-4 w-4" /> Export PDF
            </button>
            <button
              onClick={async () => {
                setSharing(true);
                try {
                  const items = ranked.map((r, i) => ({
                    rank: i + 1, produceName: r.analysis.produceName,
                    ripeness: r.analysis.ripeness, ripenessScore: r.analysis.ripenessScore,
                    confidence: r.analysis.confidence, recommendation: r.rec.recommendation,
                    reasoning: r.rec.reasoning, score: r.rec.score,
                  }));
                  const blob = exportComparisonPdfBlob(intent, items);
                  const url = await uploadAndShareScanPdf(blob, comparisonPdfFilename());
                  const ok = await copyToClipboard(url);
                  toast.success(ok ? "Share link copied" : "Link ready", { description: url });
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Share failed");
                } finally { setSharing(false); }
              }}
              disabled={sharing}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 font-medium hover:bg-muted disabled:opacity-60"
            >
              {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />} Share link
            </button>
            <button onClick={save} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl gradient-primary text-primary-foreground py-3.5 font-medium shadow-elevated">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save comparison
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function CompareCard({ item, rec, rank, onRemove }: { item: Item; rec: Recommendation_Output; rank: number; onRemove: () => void }) {
  const isWinner = rank === 1;
  return (
    <div className={`relative rounded-3xl overflow-hidden transition ${isWinner ? "glass-strong shadow-elevated ring-2 ring-accent" : "glass"}`}>
      {isWinner && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-accent text-accent-foreground rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest shadow-glass">
          <Trophy className="h-3.5 w-3.5" /> Winner
        </div>
      )}
      <button onClick={onRemove} className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-foreground/60 text-background flex items-center justify-center hover:bg-foreground transition">
        <X className="h-4 w-4" />
      </button>
      <img src={item.imageUrl} alt={item.analysis.produceName} className="w-full aspect-[4/3] object-cover" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Rank #{rank}</div>
            <div className="text-lg font-semibold mt-0.5">{item.analysis.produceName}</div>
          </div>
          <RecBadge rec={rec.recommendation} />
        </div>
        <div className="mt-3 text-sm text-muted-foreground leading-relaxed">{rec.reasoning}</div>
        <div className="mt-4 flex items-center justify-between text-xs">
          <div className="font-semibold text-foreground">{rec.score}% match</div>
          <div className="text-muted-foreground">{Math.round(item.analysis.confidence * 100)}% confidence</div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full gradient-primary transition-all" style={{ width: `${rec.score}%` }} />
        </div>
      </div>
    </div>
  );
}
