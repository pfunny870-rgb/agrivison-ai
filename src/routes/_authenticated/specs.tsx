import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Glasses, Eye, Zap, ShieldCheck, Sparkles } from "lucide-react";
import specsImg from "@/assets/smart-specs.jpg";

export const Route = createFileRoute("/_authenticated/specs")({
  head: () => ({ meta: [{ title: "Smart Specs · AgriVision AI" }] }),
  component: SpecsPage,
});

function SpecsPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <div className="text-sm text-accent font-medium uppercase tracking-widest">Future-ready</div>
          <h1 className="text-3xl md:text-4xl font-semibold mt-1">AgriVision <span className="text-gradient">Smart Specs</span></h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">Hands-free, in-aisle decisions. A real-time HUD that ranks every fruit and vegetable you look at.</p>
        </div>

        <div className="glass-strong rounded-3xl overflow-hidden grid lg:grid-cols-2">
          <div className="relative min-h-[340px]">
            <img src={specsImg} alt="AgriVision Smart Specs" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-tr from-foreground/20 to-transparent" />
          </div>
          <div className="p-10 md:p-12 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs font-medium w-fit">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" /> In R&D · Concept preview
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold mt-4 tracking-tight">A grocery aisle that <span className="text-gradient">talks back.</span></h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Walk up to a produce shelf and see ripeness, freshness and best-pick scores hover over every item. Set your intent in the morning; let the day decide.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { i: Eye, t: "Glance-to-Insight", d: "Sub-second contextual overlay on any produce in view." },
            { i: Sparkles, t: "Intent Sync", d: "Set goals in the app, see them surface on the lens." },
            { i: Zap, t: "On-device AI", d: "Edge-deployed models keep latency near-zero." },
            { i: ShieldCheck, t: "Private by design", d: "Images never leave the device unless you save them." },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="glass rounded-2xl p-6">
              <div className="h-11 w-11 rounded-xl gradient-primary flex items-center justify-center mb-4 shadow-glass">
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold">{t}</h3>
              <p className="text-sm text-muted-foreground mt-2">{d}</p>
            </div>
          ))}
        </div>

        <div className="glass rounded-3xl p-8 text-center">
          <Glasses className="h-10 w-10 mx-auto text-accent" />
          <h3 className="mt-3 text-xl font-semibold">Join the early-access program</h3>
          <p className="text-sm text-muted-foreground mt-1">Be first in line when Smart Specs ship.</p>
          <button className="mt-5 rounded-full gradient-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-glass">Request invite</button>
        </div>
      </div>
    </AppShell>
  );
}
