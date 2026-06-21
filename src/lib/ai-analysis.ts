// Mock AI analysis engine for AgriVision AI
// Produces deterministic, realistic-looking analyses based on image bytes.

export type Intent = "eat_today" | "store_2_days" | "store_1_week" | "cooking" | "smoothie";
export type Recommendation = "best_pick" | "use_soon" | "store_later" | "avoid";
export type Ripeness = "unripe" | "near_ripe" | "ripe" | "overripe" | "spoiled";

export interface ProduceAnalysis {
  produceName: string;
  ripeness: Ripeness;
  ripenessScore: number; // 0-100
  confidence: number; // 0-1
  colorProfile: { hue: string; vibrancy: number; uniformity: number };
  texture: { firmness: number; smoothness: number };
  spots: number; // count
  spoilageRisk: number; // 0-1
  shelfLifeDays: number;
  notes: string[];
}

export interface Recommendation_Output {
  recommendation: Recommendation;
  reasoning: string;
  score: number; // 0-100 fit for intent
}

const PRODUCE_POOL = [
  "Tomato", "Apple", "Banana", "Avocado", "Mango", "Strawberry",
  "Bell Pepper", "Cucumber", "Spinach", "Lettuce", "Orange", "Pear",
];

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function seeded(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function analyzeImage(seedKey: string, hintName?: string): ProduceAnalysis {
  const rnd = seeded(hashString(seedKey));
  const produceName = hintName || PRODUCE_POOL[Math.floor(rnd() * PRODUCE_POOL.length)];
  const ripenessScore = Math.round(20 + rnd() * 75); // 20-95
  const confidence = 0.78 + rnd() * 0.2;

  let ripeness: Ripeness;
  if (ripenessScore < 30) ripeness = "unripe";
  else if (ripenessScore < 55) ripeness = "near_ripe";
  else if (ripenessScore < 80) ripeness = "ripe";
  else if (ripenessScore < 92) ripeness = "overripe";
  else ripeness = "spoiled";

  const spoilageRisk = Math.max(0, (ripenessScore - 70) / 30 + (rnd() - 0.5) * 0.2);
  const spots = ripeness === "overripe" || ripeness === "spoiled"
    ? Math.floor(rnd() * 8) + 2
    : Math.floor(rnd() * 3);

  const shelfLifeDays = ripeness === "unripe" ? 7 + Math.floor(rnd() * 5)
    : ripeness === "near_ripe" ? 4 + Math.floor(rnd() * 3)
    : ripeness === "ripe" ? 2 + Math.floor(rnd() * 2)
    : ripeness === "overripe" ? 1
    : 0;

  const notes: string[] = [];
  if (ripeness === "unripe") notes.push("Surface still firm and pale — needs more time.");
  if (ripeness === "near_ripe") notes.push("Color developing well, slight firmness remains.");
  if (ripeness === "ripe") notes.push("Optimal color saturation and aroma profile detected.");
  if (ripeness === "overripe") notes.push("Soft spots and darkening detected on surface.");
  if (ripeness === "spoiled") notes.push("Significant spoilage indicators — discoloration and texture breakdown.");
  if (spots > 3) notes.push(`${spots} dark spots detected across surface area.`);

  return {
    produceName,
    ripeness,
    ripenessScore,
    confidence: Math.round(confidence * 100) / 100,
    colorProfile: {
      hue: ripeness === "unripe" ? "green-yellow" : ripeness === "ripe" ? "deep red" : "dark crimson",
      vibrancy: Math.round((40 + rnd() * 55)),
      uniformity: Math.round(50 + rnd() * 45),
    },
    texture: {
      firmness: Math.round(100 - ripenessScore + (rnd() - 0.5) * 20),
      smoothness: Math.round(60 + rnd() * 35),
    },
    spots,
    spoilageRisk: Math.round(spoilageRisk * 100) / 100,
    shelfLifeDays,
    notes,
  };
}

export const INTENT_LABELS: Record<Intent, string> = {
  eat_today: "Eat Today",
  store_2_days: "Store for 2 Days",
  store_1_week: "Store for 1 Week",
  cooking: "Cooking",
  smoothie: "Smoothie",
};

export const RECOMMENDATION_LABELS: Record<Recommendation, string> = {
  best_pick: "Best Pick",
  use_soon: "Use Soon",
  store_later: "Store Later",
  avoid: "Avoid",
};

export function recommendFor(a: ProduceAnalysis, intent: Intent): Recommendation_Output {
  const r = a.ripenessScore;
  const shelf = a.shelfLifeDays;
  let score = 0;
  let recommendation: Recommendation = "use_soon";
  let reasoning = "";

  switch (intent) {
    case "eat_today":
      score = 100 - Math.abs(72 - r) * 1.5 - a.spots * 4;
      if (a.ripeness === "ripe") { recommendation = "best_pick"; reasoning = "Peak ripeness — flavor and texture are at their best for eating fresh today."; }
      else if (a.ripeness === "near_ripe") { recommendation = "use_soon"; reasoning = "Very close to peak — edible today but flavor will be fuller in a day."; }
      else if (a.ripeness === "overripe") { recommendation = "use_soon"; reasoning = "Past prime but still safe — eat today before quality drops further."; }
      else if (a.ripeness === "spoiled") { recommendation = "avoid"; reasoning = "Spoilage indicators present — not safe to eat."; }
      else { recommendation = "store_later"; reasoning = "Not yet ripe enough for fresh eating — wait a few days."; }
      break;
    case "store_2_days":
      score = 100 - Math.abs(55 - r) * 1.3 - a.spots * 3;
      if (a.ripeness === "near_ripe") { recommendation = "best_pick"; reasoning = "Ideal ripeness curve — will hit peak in about 2 days."; }
      else if (a.ripeness === "ripe") { recommendation = "use_soon"; reasoning = "Already ripe — won't hold for 2 days at peak quality."; }
      else if (a.ripeness === "unripe") { recommendation = "store_later"; reasoning = "Too unripe — store longer for best results."; }
      else { recommendation = "avoid"; reasoning = "Not suitable for 2-day storage."; }
      break;
    case "store_1_week":
      score = 100 - Math.abs(30 - r) * 1.4 - a.spots * 4 - a.spoilageRisk * 30;
      if (a.ripeness === "unripe" && shelf >= 7) { recommendation = "best_pick"; reasoning = "Firm and underripe — ideal for week-long storage."; }
      else if (a.ripeness === "near_ripe") { recommendation = "use_soon"; reasoning = "Will overripen before the week ends."; }
      else { recommendation = "avoid"; reasoning = "Will spoil well before the week mark."; }
      break;
    case "cooking":
      score = 70 + (a.ripeness === "ripe" || a.ripeness === "overripe" ? 25 : -10);
      if (a.ripeness === "overripe") { recommendation = "best_pick"; reasoning = "Soft, sugary flesh is perfect for sauces, stews, and roasting."; }
      else if (a.ripeness === "ripe") { recommendation = "best_pick"; reasoning = "Excellent flavor concentration for cooking applications."; }
      else if (a.ripeness === "spoiled") { recommendation = "avoid"; reasoning = "Not safe even for cooked dishes."; }
      else { recommendation = "store_later"; reasoning = "Develops more flavor as it ripens — wait a couple days."; }
      break;
    case "smoothie":
      score = 60 + (a.ripeness === "ripe" || a.ripeness === "overripe" ? 35 : -15);
      if (a.ripeness === "overripe") { recommendation = "best_pick"; reasoning = "Maximum natural sweetness — blends beautifully into smoothies."; }
      else if (a.ripeness === "ripe") { recommendation = "best_pick"; reasoning = "Sweet, soft, and smoothie-ready."; }
      else if (a.ripeness === "spoiled") { recommendation = "avoid"; reasoning = "Spoilage risk too high for consumption."; }
      else { recommendation = "store_later"; reasoning = "Lacks the sweetness a great smoothie needs — let it ripen."; }
      break;
  }
  return { recommendation, reasoning, score: Math.max(0, Math.min(100, Math.round(score))) };
}

export const RECOMMENDATION_TONE: Record<Recommendation, string> = {
  best_pick: "success",
  use_soon: "warning",
  store_later: "primary",
  avoid: "destructive",
};
