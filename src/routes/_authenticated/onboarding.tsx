import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { INTENT_LABELS, type Intent } from "@/lib/ai-analysis";
import { toast } from "sonner";
import { Loader2, Leaf, Sparkles, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Welcome · AgriVision AI" }] }),
  component: Onboarding,
});

const DIETARY = [
  "Vegan", "Vegetarian", "Gluten-free", "Low sugar", "Organic-preferred",
  "Keto", "Paleo", "No restrictions",
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [diet, setDiet] = useState<string[]>([]);
  const [intents, setIntents] = useState<Intent[]>([]);
  const [defaultIntent, setDefaultIntent] = useState<Intent>("eat_today");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: p } = await supabase.from("profiles").select("onboarded_at").eq("id", u.user.id).maybeSingle();
      if (p?.onboarded_at) navigate({ to: "/dashboard", replace: true });
    })();
  }, [navigate]);

  function toggle<T>(list: T[], v: T): T[] {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  }

  async function finish() {
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("profiles").update({
        dietary_preferences: diet,
        preferred_intents: intents,
        default_intent: defaultIntent,
        onboarded_at: new Date().toISOString(),
      }).eq("id", u.user.id);
      if (error) throw error;
      toast.success("Preferences saved");
      navigate({ to: "/scan", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 text-accent px-3 py-1 text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" /> Step {step} of 3
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold mt-3">
            {step === 1 && "Tell us how you eat"}
            {step === 2 && "What do you usually shop for?"}
            {step === 3 && "Pick your default mode"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {step === 1 && "We'll tailor recommendations to your dietary needs."}
            {step === 2 && "Choose the intents you use most often."}
            {step === 3 && "We'll preselect this every time you scan."}
          </p>
        </div>

        <div className="glass-strong rounded-3xl p-8">
          {step === 1 && (
            <div className="flex flex-wrap gap-2">
              {DIETARY.map((d) => {
                const on = diet.includes(d);
                return (
                  <button key={d} onClick={() => setDiet(toggle(diet, d))}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium border transition flex items-center gap-2 ${
                      on ? "gradient-primary text-primary-foreground border-transparent shadow-glass" : "bg-card border-border hover:bg-muted"
                    }`}>
                    {on && <Check className="h-3.5 w-3.5" />}<Leaf className="h-3.5 w-3.5" /> {d}
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="grid sm:grid-cols-2 gap-3">
              {(Object.keys(INTENT_LABELS) as Intent[]).map((k) => {
                const on = intents.includes(k);
                return (
                  <button key={k} onClick={() => setIntents(toggle(intents, k))}
                    className={`text-left p-4 rounded-2xl border transition ${
                      on ? "bg-primary text-primary-foreground border-transparent shadow-glass" : "bg-card border-border hover:bg-muted"
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{INTENT_LABELS[k]}</div>
                      {on && <Check className="h-4 w-4" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              {(Object.keys(INTENT_LABELS) as Intent[]).map((k) => (
                <button key={k} onClick={() => setDefaultIntent(k)}
                  className={`w-full text-left p-4 rounded-2xl border transition flex items-center justify-between ${
                    defaultIntent === k ? "bg-accent text-accent-foreground border-transparent" : "bg-card border-border hover:bg-muted"
                  }`}>
                  <span className="font-semibold">{INTENT_LABELS[k]}</span>
                  {defaultIntent === k && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between gap-3">
          <button onClick={() => (step > 1 ? setStep(step - 1) : navigate({ to: "/dashboard" }))}
            className="px-5 py-2.5 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted">
            {step > 1 ? "Back" : "Skip for now"}
          </button>
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-medium shadow-glass">
              Continue
            </button>
          ) : (
            <button onClick={finish} disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-medium shadow-glass disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Finish setup
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
