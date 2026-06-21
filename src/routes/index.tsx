import { createFileRoute, Link } from "@tanstack/react-router";
import { ScanLine, GitCompare, Sparkles, ShieldCheck, Glasses, ArrowRight, Apple, Leaf, Zap } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import scanImg from "@/assets/produce-scan.jpg";
import specsImg from "@/assets/smart-specs.jpg";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriVision AI — See Smarter. Eat Fresher." },
      { name: "description", content: "AI-powered grocery decision intelligence. Scan produce, compare picks, get intent-matched recommendations — built for a future of smart wearables." },
      { property: "og:title", content: "AgriVision AI" },
      { property: "og:description", content: "Smart grocery decision intelligence for the wearable era." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#how" className="hover:text-foreground transition">How it works</a>
            <a href="#specs" className="hover:text-foreground transition">Smart Specs</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition">Sign in</Link>
            <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-full gradient-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-glass hover:shadow-elevated transition">
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-5 pt-16 md:pt-24 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-7 animate-(--animate-fade-in)">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" /> Aggnite 6.0 · Smart Wearable Edition
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]">
              See smarter. <br />
              <span className="text-gradient">Eat fresher.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              AgriVision AI turns any glance at produce into a decision. Ripeness, freshness, intent-matched recommendations — instant, contextual, and built for the wearable era.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/auth" className="inline-flex items-center gap-2 rounded-full gradient-primary px-7 py-3.5 text-base font-medium text-primary-foreground shadow-elevated hover:scale-[1.02] transition">
                Start scanning <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how" className="inline-flex items-center gap-2 rounded-full glass-strong px-7 py-3.5 text-base font-medium hover:bg-muted transition">
                See how it works
              </a>
            </div>
            <div className="flex items-center gap-8 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> Privacy-first AI</div>
              <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-accent" /> Instant analysis</div>
            </div>
          </div>
          <div className="relative animate-(--animate-scale-in)">
            <div className="absolute -inset-8 gradient-mesh blur-3xl opacity-60" />
            <div className="relative rounded-3xl overflow-hidden shadow-elevated border border-border">
              <img src={heroImg} alt="AgriVision smart wearable scanning fresh produce" width={1920} height={1280} className="w-full h-auto" />
            </div>
            <div className="absolute -bottom-6 -left-6 glass-strong rounded-2xl p-4 shadow-elevated max-w-[220px] hidden md:block animate-(--animate-float)">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Recommendation</div>
              <div className="mt-1 text-lg font-semibold text-success">Best Pick</div>
              <div className="text-xs text-muted-foreground mt-1">94% match for "Eat Today"</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-5 pb-20">
        <div className="max-w-7xl mx-auto glass-strong rounded-3xl p-8 md:p-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { v: "98.2%", l: "Recommendation accuracy" },
            { v: "<1.2s", l: "Analysis time" },
            { v: "12+", l: "Produce categories" },
            { v: "5", l: "Intent profiles" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-3xl md:text-4xl font-semibold text-gradient">{s.v}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-5 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-14">
            <div className="text-sm font-medium text-accent uppercase tracking-widest mb-3">The platform</div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">Not detection. <span className="text-gradient">Decision.</span></h2>
            <p className="mt-4 text-lg text-muted-foreground">AgriVision goes beyond labeling fruit. It understands why you're picking it, then ranks your options.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { i: ScanLine, t: "Contextual Scanning", d: "Color, texture, ripeness, spots and spoilage — analyzed in one glance." },
              { i: Sparkles, t: "Intent Matching", d: "Tell us if you want to eat today, store, cook, or blend. We rank accordingly." },
              { i: GitCompare, t: "Comparison Intelligence", d: "Stack produce side-by-side and surface the best pick for your goal." },
              { i: ShieldCheck, t: "Confidence Scoring", d: "Every recommendation carries a transparent confidence rating." },
              { i: Apple, t: "Learning Mode", d: "Tap any insight to understand the science of ripeness." },
              { i: Glasses, t: "Wearable-Ready", d: "Designed from day one for hands-free smart specs." },
            ].map(({ i: Icon, t, d }) => (
              <div key={t} className="group glass rounded-2xl p-7 hover:shadow-elevated transition-all hover:-translate-y-1">
                <div className="h-11 w-11 rounded-xl gradient-primary flex items-center justify-center mb-5 shadow-glass">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-5 py-20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div className="relative">
            <div className="absolute -inset-6 gradient-mesh blur-3xl opacity-40" />
            <img src={scanImg} alt="Produce being scanned" width={1024} height={1024} loading="lazy" className="relative rounded-3xl shadow-elevated w-full" />
          </div>
          <div>
            <div className="text-sm font-medium text-accent uppercase tracking-widest mb-3">Workflow</div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-8">From glance to <span className="text-gradient">guidance</span> in seconds.</h2>
            <div className="space-y-4">
              {[
                ["Capture", "Snap or scan any fruit or vegetable through the app or smart specs."],
                ["Analyze", "AI inspects color, texture, spots, ripeness curve and spoilage signals."],
                ["Match Intent", "Pick your goal — eat, store, cook, blend."],
                ["Recommend", "Get Best Pick · Use Soon · Store Later · Avoid with reasoning."],
              ].map(([t, d], idx) => (
                <div key={t} className="flex gap-4 glass rounded-2xl p-5">
                  <div className="h-10 w-10 shrink-0 rounded-full gradient-primary text-primary-foreground flex items-center justify-center font-semibold">{idx + 1}</div>
                  <div>
                    <div className="font-semibold">{t}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Smart Specs */}
      <section id="specs" className="px-5 py-20">
        <div className="max-w-7xl mx-auto glass-strong rounded-3xl overflow-hidden grid lg:grid-cols-2">
          <div className="p-10 md:p-14 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-accent uppercase tracking-widest mb-4">
              <Leaf className="h-3.5 w-3.5" /> Future-ready
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">Built for the <span className="text-gradient">wearable era.</span></h2>
            <p className="mt-5 text-lg text-muted-foreground">AgriVision Smart Specs project a contextual recommendation over every produce aisle, hands-free.</p>
            <Link to="/auth" className="mt-8 inline-flex items-center gap-2 rounded-full gradient-primary px-6 py-3 text-sm font-medium text-primary-foreground w-fit shadow-glass">
              Preview the experience <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative min-h-[320px]">
            <img src={specsImg} alt="AgriVision Smart Specs" width={1536} height={1024} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        </div>
      </section>

      <footer className="px-5 py-12 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="text-sm text-muted-foreground">© 2026 AgriVision AI · Built for Aggnite 6.0</div>
        </div>
      </footer>
    </div>
  );
}
