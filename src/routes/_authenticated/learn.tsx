import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { BookOpen, Apple, Droplets, Sun, ThermometerSun, Sparkles, Leaf } from "lucide-react";

export const Route = createFileRoute("/_authenticated/learn")({
  head: () => ({ meta: [{ title: "Learning · AgriVision AI" }] }),
  component: LearnPage,
});

const LESSONS = [
  { icon: Apple, title: "Ripeness curve", body: "Fruit ripeness follows a predictable curve from starch to sugar. AgriVision pinpoints where on this curve a fruit sits — and projects its trajectory over the next days." },
  { icon: Droplets, title: "Color & vibrancy", body: "Hue and saturation reveal pigment maturity. Anthocyanins, carotenoids and chlorophyll levels shift as fruits ripen — color is one of the strongest cues." },
  { icon: ThermometerSun, title: "Texture cues", body: "Firmness, smoothness and surface tension signal cellular breakdown. Soft spots mark accelerated ripening or microbial activity." },
  { icon: Sun, title: "Spots & spoilage", body: "Dark spots can indicate bruising, mold or natural sugar concentration. Context — paired with texture — separates flavor-rich from spoiled." },
  { icon: Sparkles, title: "Intent matching", body: "The same fruit ranks differently for 'eat today' vs 'store for a week'. AgriVision evaluates the same data through five intent lenses." },
  { icon: Leaf, title: "Confidence scoring", body: "Every recommendation includes a confidence rating so you can trust — or verify — the AI's call." },
];

function LearnPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <div className="text-sm text-accent font-medium uppercase tracking-widest">Learning mode</div>
          <h1 className="text-3xl md:text-4xl font-semibold mt-1">The science behind every decision.</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">A quick tour of how AgriVision turns light, color and texture into smart grocery choices.</p>
        </div>

        <div className="glass-strong rounded-3xl p-8 md:p-10 grid md:grid-cols-[auto_1fr] gap-6 items-center">
          <div className="h-20 w-20 rounded-3xl gradient-primary flex items-center justify-center shadow-glass">
            <BookOpen className="h-9 w-9 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Why context beats detection</h2>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              Most computer-vision tools tell you what a fruit <em>is</em>. AgriVision tells you what to <em>do</em> with it. By blending visual analysis with your stated intent, every scan becomes a contextual decision — not a label.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LESSONS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="glass rounded-2xl p-6 hover:shadow-elevated transition">
              <div className="h-11 w-11 rounded-xl gradient-primary flex items-center justify-center mb-4 shadow-glass">
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
