import type { ProduceAnalysis } from "./ai-analysis";

export type SignalImpact = "positive" | "neutral" | "negative";

export interface Signal {
  label: string;
  value: string;
  score: number; // 0-100 quality contribution
  impact: SignalImpact;
  detail: string;
}

export function deriveSignals(a: ProduceAnalysis): Signal[] {
  const ripe = a.ripenessScore;
  const ripenessQuality = ripe < 30 ? 35 : ripe < 55 ? 65 : ripe < 80 ? 95 : ripe < 92 ? 55 : 10;
  const ripenessImpact: SignalImpact = ripenessQuality >= 80 ? "positive" : ripenessQuality >= 50 ? "neutral" : "negative";

  const color = Math.round((a.colorProfile.vibrancy + a.colorProfile.uniformity) / 2);
  const colorImpact: SignalImpact = color >= 70 ? "positive" : color >= 50 ? "neutral" : "negative";

  const firmness = a.texture.firmness;
  const firmnessImpact: SignalImpact = firmness >= 60 ? "positive" : firmness >= 35 ? "neutral" : "negative";

  const spotsScore = Math.max(0, 100 - a.spots * 12);
  const spotsImpact: SignalImpact = a.spots <= 1 ? "positive" : a.spots <= 4 ? "neutral" : "negative";

  const spoilageScore = Math.round((1 - a.spoilageRisk) * 100);
  const spoilageImpact: SignalImpact = a.spoilageRisk < 0.2 ? "positive" : a.spoilageRisk < 0.5 ? "neutral" : "negative";

  return [
    {
      label: "Ripeness curve",
      value: `${ripe}% · ${a.ripeness.replace(/_/g, " ")}`,
      score: ripenessQuality,
      impact: ripenessImpact,
      detail: ripe < 30
        ? "Underdeveloped sugars and pale pigment — needs more time on the counter."
        : ripe < 55
        ? "Approaching peak. Eating quality will improve over the next day or two."
        : ripe < 80
        ? "At ideal eating ripeness — peak flavor and aroma window."
        : ripe < 92
        ? "Past prime. Sugars are high but texture is breaking down."
        : "Spoilage threshold reached — chemical and microbial degradation likely.",
    },
    {
      label: "Color profile",
      value: `${a.colorProfile.hue} · ${color}% vibrant`,
      score: color,
      impact: colorImpact,
      detail: `Hue uniformity is ${a.colorProfile.uniformity}%. Vivid, even color is a strong indicator of healthy ripening.`,
    },
    {
      label: "Texture & firmness",
      value: `${firmness}% firm`,
      score: firmness,
      impact: firmnessImpact,
      detail: firmness >= 60
        ? "Surface holds shape under pressure — good structural integrity."
        : firmness >= 35
        ? "Slight softening detected — typical for ripe produce."
        : "Significant softening — texture breakdown in progress.",
    },
    {
      label: "Surface defects",
      value: `${a.spots} spot${a.spots === 1 ? "" : "s"}`,
      score: spotsScore,
      impact: spotsImpact,
      detail: a.spots === 0
        ? "Clean surface — no visible blemishes or bruising."
        : `Detected ${a.spots} dark spot${a.spots === 1 ? "" : "s"}. Localized blemishes don't always indicate spoilage but reduce shelf life.`,
    },
    {
      label: "Spoilage risk",
      value: `${Math.round(a.spoilageRisk * 100)}% risk`,
      score: spoilageScore,
      impact: spoilageImpact,
      detail: a.spoilageRisk < 0.2
        ? "Low spoilage indicators — safe to keep and consume."
        : a.spoilageRisk < 0.5
        ? "Moderate spoilage risk — use within a day or two."
        : "High spoilage risk — discard if texture, smell, or color confirm.",
    },
  ];
}
