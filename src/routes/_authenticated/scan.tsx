import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { Upload, Loader2, RotateCcw, Save, Sparkles, AlertCircle, FileDown, Cpu } from "lucide-react";
import { recommendFor, INTENT_LABELS, type Intent, type ProduceAnalysis } from "@/lib/ai-analysis";
import { analyzeProduceAI } from "@/lib/ai-inference.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RecBadge } from "./dashboard";
import { useQueryClient } from "@tanstack/react-query";
import { SignalsBreakdown } from "@/components/SignalsBreakdown";
import { exportScanPdf } from "@/lib/pdf-export";

export const Route = createFileRoute("/_authenticated/scan")({
  head: () => ({ meta: [{ title: "Scan · AgriVision AI" }] }),
  component: ScanPage,
});

function ScanPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ProduceAnalysis | null>(null);
  const [source, setSource] = useState<"ai" | "fallback" | null>(null);
  const [intent, setIntent] = useState<Intent>("eat_today");
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const runAnalyze = useServerFn(analyzeProduceAI);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("default_intent")
        .eq("id", u.user.id)
        .maybeSingle();
      if (p?.default_intent) setIntent(p.default_intent as Intent);
    })();
  }, []);

  function readFile(file: File) {
    return new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  async function downscale(dataUrl: string, max = 640): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.src = dataUrl;
    });
  }

  async function handleFile(file: File) {
    setAnalysis(null);
    setSource(null);
    setAnalyzing(true);
    try {
      const raw = await readFile(file);
      const small = await downscale(raw);
      setImgUrl(small);
      const { data: u } = await supabase.auth.getUser();
      let prefs: string[] = [];
      if (u.user) {
        const { data: p } = await supabase
          .from("profiles")
          .select("dietary_preferences")
          .eq("id", u.user.id)
          .maybeSingle();
        prefs = (p?.dietary_preferences as string[]) ?? [];
      }
      const result = await runAnalyze({ data: { imageDataUrl: small, dietaryPreferences: prefs } });
      const { source: src, error, ...a } = result as any;
      setAnalysis(a as ProduceAnalysis);
      setSource(src);
      if (src === "fallback") toast.warning("AI vision unavailable — using heuristic fallback");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not analyze image");
    } finally {
      setAnalyzing(false);
    }
  }

  function reset() { setImgUrl(null); setAnalysis(null); setSource(null); }

  async function save() {
    if (!analysis || !imgUrl) return;
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const rec = recommendFor(analysis, intent);
      const { error } = await supabase.from("scans").insert({
        user_id: u.user.id,
        produce_name: analysis.produceName,
        image_url: imgUrl,
        intent,
        ripeness: analysis.ripeness,
        ripeness_score: analysis.ripenessScore,
        confidence: analysis.confidence,
        recommendation: rec.recommendation,
        reasoning: rec.reasoning,
        analysis: analysis as any,
      });
      if (error) throw error;
      toast.success("Scan saved to history");
      qc.invalidateQueries({ queryKey: ["scans-recent"] });
      qc.invalidateQueries({ queryKey: ["scans-all"] });
      navigate({ to: "/history" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function exportPdf() {
    if (!analysis || !imgUrl) return;
    const rec = recommendFor(analysis, intent);
    exportScanPdf({
      produce_name: analysis.produceName,
      intent, ripeness: analysis.ripeness,
      ripeness_score: analysis.ripenessScore,
      confidence: analysis.confidence,
      recommendation: rec.recommendation,
      reasoning: rec.reasoning,
      image_url: imgUrl,
      analysis,
      created_at: new Date().toISOString(),
    });
  }

  const rec = analysis ? recommendFor(analysis, intent) : null;

  return (
    <AppShell>
      <div className="space-y-7">
        <div>
          <div className="text-sm text-accent font-medium uppercase tracking-widest">Scan</div>
          <h1 className="text-3xl md:text-4xl font-semibold mt-1">Analyze produce</h1>
          <p className="text-muted-foreground mt-2">Upload a photo. Our AI evaluates ripeness, freshness and intent-fit.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-strong rounded-3xl p-2 aspect-square relative overflow-hidden">
              {imgUrl ? (
                <>
                  <img src={imgUrl} alt="Uploaded produce" className="h-full w-full object-cover rounded-[1.4rem]" />
                  {analyzing && (
                    <div className="absolute inset-2 rounded-[1.4rem] bg-foreground/40 backdrop-blur-sm flex items-center justify-center">
                      <div className="glass-strong rounded-2xl px-5 py-3 flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-accent" />
                        <span className="text-sm font-medium">AI analyzing image…</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <button onClick={() => inputRef.current?.click()}
                  className="h-full w-full rounded-[1.4rem] border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground hover:border-primary transition group">
                  <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glass group-hover:scale-110 transition">
                    <Upload className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="font-medium">Upload produce image</div>
                  <div className="text-xs">PNG, JPG up to 10MB</div>
                </button>
              )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {imgUrl && (
              <div className="flex gap-2">
                <button onClick={reset} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-medium hover:bg-muted">
                  <RotateCcw className="h-4 w-4" /> New image
                </button>
                <button onClick={() => inputRef.current?.click()} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-card border border-border py-2.5 text-sm font-medium hover:bg-muted">
                  <Upload className="h-4 w-4" /> Replace
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="glass-strong rounded-3xl p-6">
              <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Your intent</div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(INTENT_LABELS) as Intent[]).map((k) => (
                  <button key={k} onClick={() => setIntent(k)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      intent === k ? "gradient-primary text-primary-foreground shadow-glass" : "bg-card border border-border hover:bg-muted"
                    }`}>
                    {INTENT_LABELS[k]}
                  </button>
                ))}
              </div>
            </div>

            {!analysis ? (
              <div className="glass rounded-3xl p-10 text-center text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-3 text-accent opacity-70" />
                Upload an image to see AI analysis here.
              </div>
            ) : (
              <>
                <div className="glass-strong rounded-3xl p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        Detected
                        {source && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${source === "ai" ? "bg-accent/15 text-accent" : "bg-warning/20 text-warning-foreground"}`}>
                            <Cpu className="h-3 w-3" /> {source === "ai" ? "Live AI" : "Fallback"}
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-semibold mt-1">{analysis.produceName}</div>
                      <div className="text-sm text-muted-foreground mt-1 capitalize">{analysis.ripeness.replace(/_/g, " ")} · {analysis.shelfLifeDays}d shelf life</div>
                    </div>
                    {rec && <RecBadge rec={rec.recommendation} />}
                  </div>

                  {rec && (
                    <div className="mt-5 rounded-2xl bg-secondary p-4 border border-border">
                      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">For "{INTENT_LABELS[intent]}"</div>
                      <div className="text-base font-medium leading-relaxed">{rec.reasoning}</div>
                      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{rec.score}% match</span> · <span>{Math.round(analysis.confidence * 100)}% confidence</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Metric label="Ripeness" value={`${analysis.ripenessScore}%`} />
                    <Metric label="Vibrancy" value={`${analysis.colorProfile.vibrancy}%`} />
                    <Metric label="Firmness" value={`${analysis.texture.firmness}%`} />
                    <Metric label="Spots" value={analysis.spots} />
                  </div>

                  {analysis.notes.length > 0 && (
                    <div className="mt-5 space-y-2">
                      {analysis.notes.map((n, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <AlertCircle className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                          <span>{n}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <SignalsBreakdown analysis={analysis} recommendation={rec?.recommendation} />

                <div className="grid sm:grid-cols-2 gap-3">
                  <button onClick={exportPdf} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 font-medium hover:bg-muted">
                    <FileDown className="h-4 w-4" /> Export PDF
                  </button>
                  <button onClick={save} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl gradient-primary text-primary-foreground py-3 font-medium shadow-elevated hover:scale-[1.01] transition disabled:opacity-60">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save to history
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl bg-card border border-border p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold mt-0.5">{value}</div>
    </div>
  );
}
