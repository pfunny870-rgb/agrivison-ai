import { CheckCircle2, MinusCircle, AlertTriangle } from "lucide-react";
import type { ProduceAnalysis } from "@/lib/ai-analysis";
import { deriveSignals, type SignalImpact } from "@/lib/signals";

function IconFor({ impact }: { impact: SignalImpact }) {
  if (impact === "positive") return <CheckCircle2 className="h-4 w-4 text-accent" />;
  if (impact === "neutral") return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
  return <AlertTriangle className="h-4 w-4 text-destructive" />;
}

function barColor(impact: SignalImpact) {
  if (impact === "positive") return "bg-accent";
  if (impact === "neutral") return "bg-primary/60";
  return "bg-destructive";
}

export function SignalsBreakdown({ analysis, recommendation }: { analysis: ProduceAnalysis; recommendation?: string }) {
  const signals = deriveSignals(analysis);
  return (
    <div className="glass-strong rounded-3xl p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Why this recommendation</div>
        {recommendation && (
          <div className="text-xs text-muted-foreground">Final → <span className="font-semibold text-foreground capitalize">{recommendation.replace(/_/g, " ")}</span></div>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Each signal below contributes to the final pick. Stronger green bars push toward "best pick"; red bars push toward "avoid".
      </p>
      <div className="space-y-4">
        {signals.map((s) => (
          <div key={s.label}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <IconFor impact={s.impact} />
                <div className="text-sm font-semibold">{s.label}</div>
              </div>
              <div className="text-xs text-muted-foreground">{s.value}</div>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full ${barColor(s.impact)} transition-all`} style={{ width: `${s.score}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{s.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
