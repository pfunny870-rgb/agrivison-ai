import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { Upload, Loader2, Trophy, ArrowRight, Sparkles, Volume2 } from "lucide-react";
import { analyzeTwinCompare, type TwinAnalysis } from "@/lib/twin-compare.functions";
import { toast } from "sonner";
import { speak } from "@/lib/voice";

export const Route = createFileRoute("/_authenticated/twin-compare")({
  head: () => ({ meta: [{ title: "Twin Compare · AgriVision AI" }] }),
  component: TwinComparePage,
});

function TwinComparePage() {
  const refA = useRef<HTMLInputElement>(null);
  const refB = useRef<HTMLInputElement>(null);
  const [imgA, setImgA] = useState<string | null>(null);
  const [imgB, setImgB] = useState<string | null>(null);
  const [hint, setHint] = useState<string>("banana");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<TwinAnalysis | null>(null);
  const [source, setSource] = useState<"ai" | "fallback" | null>(null);
  const runTwin = useServerFn(analyzeTwinCompare);

  async function downscale(file: File): Promise<string> {
    const raw = await new Promise<string>((res) => {
      const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file);
    });
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 640 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = img.width * scale; c.height = img.height * scale;
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.src = raw;
    });
  }

  async function pickA(f: File) { setImgA(await downscale(f)); setResult(null); }
  async function pickB(f: File) { setImgB(await downscale(f)); setResult(null); }

  async function analyze() {
    if (!imgA || !imgB) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const r = await runTwin({ data: { imageA: imgA, imageB: imgB, produceHint: hint } });
      const { source: src, error, ...data } = r as any;
      setResult(data as TwinAnalysis);
      setSource(src);
      if (src === "fallback") toast.warning("AI vision unavailable — heuristic fallback");
      // Auto-announce the winner
      const winner = (data as TwinAnalysis).items[(data as TwinAnalysis).winnerIndex];
      speak(`Twin comparison complete. Winner: ${(data as TwinAnalysis).winnerLabel}. ${winner.label} ripeness ${winner.ripenessScore} percent. ${(data as TwinAnalysis).summary.slice(0, 180)}`).catch(() => {});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Comparison failed");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-7">
        <div>
          <div className="text-sm text-accent font-medium uppercase tracking-widest">Twin Compare</div>
          <h1 className="text-3xl md:text-4xl font-semibold mt-1">Two look alike. We find the difference.</h1>
          <p className="text-muted-foreground mt-2">Upload two similar produce images (e.g. two bananas). AI tells you which one wins — and exactly why.</p>
        </div>

        <div className="glass-strong rounded-3xl p-5 flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">What is it?</span>
          <input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="banana, banana bunch, apple…"
            className="flex-1 min-w-[180px] bg-card border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {([
            ["A", imgA, refA, pickA],
            ["B", imgB, refB, pickB],
          ] as const).map(([letter, img, ref, set]) => (
            <div key={letter} className="glass-strong rounded-3xl p-2 aspect-square relative overflow-hidden">
              {img ? (
                <img src={img} alt={`Image ${letter}`} className="h-full w-full object-cover rounded-[1.4rem]" />
              ) : (
                <button onClick={() => ref.current?.click()} className="h-full w-full rounded-[1.4rem] border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground hover:border-primary transition group">
                  <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-glass group-hover:scale-110 transition">
                    <Upload className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="font-medium">Upload image {letter}</div>
                </button>
              )}
              <div className="absolute top-3 left-3 bg-foreground/70 text-background rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm">{letter}</div>
              <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && set(e.target.files[0])} />
              {img && (
                <button onClick={() => ref.current?.click()} className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-card border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                  <Upload className="h-3 w-3" /> Replace
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={analyze}
          disabled={!imgA || !imgB || analyzing}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl gradient-primary text-primary-foreground py-4 font-semibold shadow-elevated hover:scale-[1.005] transition disabled:opacity-50 disabled:hover:scale-100"
        >
          {analyzing ? <><Loader2 className="h-5 w-5 animate-spin" /> AI comparing…</> : <><Sparkles className="h-5 w-5" /> Run twin comparison <ArrowRight className="h-5 w-5" /></>}
        </button>

        {result && (
          <div className="space-y-4">
            <div className="glass-strong rounded-3xl p-6">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center shrink-0 shadow-glass">
                  <Trophy className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Winner · {Math.round(result.confidence * 100)}% confidence{source === "fallback" && " · Fallback"}</div>
                  <div className="text-2xl font-semibold mt-1">{result.winnerLabel} — {result.produceName}</div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
                </div>
                <button
                  onClick={() => {
                    const w = result.items[result.winnerIndex];
                    speak(`Winner: ${result.winnerLabel}. ${w.label} ripeness ${w.ripenessScore} percent. ${result.summary.slice(0, 200)}`).catch(() => {});
                  }}
                  className="rounded-full bg-card border border-border h-10 w-10 flex items-center justify-center hover:bg-muted"
                  title="Hear result"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {result.items.map((it, idx) => {
                const isWinner = idx === result.winnerIndex;
                return (
                  <div key={idx} className={`rounded-3xl p-5 ${isWinner ? "glass-strong ring-2 ring-accent" : "glass"}`}>
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">{it.label}</div>
                      {isWinner && <span className="text-[10px] font-bold uppercase tracking-widest bg-accent text-accent-foreground rounded-full px-2 py-0.5">Pick</span>}
                    </div>
                    <div className="text-lg font-semibold mt-1 capitalize">{it.ripeness.replace(/_/g, " ")} · {it.ripenessScore}%</div>
                    <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full gradient-primary" style={{ width: `${it.ripenessScore}%` }} />
                    </div>
                    <div className="mt-4">
                      <div className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-1">Strengths</div>
                      <ul className="space-y-1 text-sm">
                        {it.strengths.map((s, i) => <li key={i} className="text-muted-foreground">+ {s}</li>)}
                      </ul>
                    </div>
                    {it.weaknesses.length > 0 && (
                      <div className="mt-3">
                        <div className="text-[10px] uppercase tracking-widest text-destructive font-semibold mb-1">Weaknesses</div>
                        <ul className="space-y-1 text-sm">
                          {it.weaknesses.map((s, i) => <li key={i} className="text-muted-foreground">− {s}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="glass-strong rounded-3xl p-6">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Why A vs B — differential breakdown</div>
              <div className="space-y-3">
                {result.differences.map((d, i) => (
                  <div key={i} className="rounded-2xl bg-secondary border border-border p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm">{d.aspect}</div>
                      <div className={`text-[10px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5 ${d.betterIndex === 0 ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}`}>
                        {d.betterIndex === 0 ? "A wins" : "B wins"} · {Math.round(d.weight * 100)}% weight
                      </div>
                    </div>
                    <div className="mt-2 grid sm:grid-cols-2 gap-3 text-sm">
                      <div className={`rounded-xl p-3 ${d.betterIndex === 0 ? "bg-primary/10" : "bg-card"}`}>
                        <div className="text-[10px] uppercase text-muted-foreground tracking-widest mb-1">Image A</div>
                        <div>{d.a}</div>
                      </div>
                      <div className={`rounded-xl p-3 ${d.betterIndex === 1 ? "bg-accent/10" : "bg-card"}`}>
                        <div className="text-[10px] uppercase text-muted-foreground tracking-widest mb-1">Image B</div>
                        <div>{d.b}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
