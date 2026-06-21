import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ProduceAnalysis, Ripeness } from "./ai-analysis";

const InputSchema = z.object({
  imageDataUrl: z.string().min(32),
  hintName: z.string().optional(),
  dietaryPreferences: z.array(z.string()).optional(),
});

const RipenessEnum = z.enum(["unripe", "near_ripe", "ripe", "overripe", "spoiled"]);

const AnalysisSchema = z.object({
  produceName: z.string(),
  ripeness: RipenessEnum,
  ripenessScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  colorProfile: z.object({
    hue: z.string(),
    vibrancy: z.number().min(0).max(100),
    uniformity: z.number().min(0).max(100),
  }),
  texture: z.object({
    firmness: z.number().min(0).max(100),
    smoothness: z.number().min(0).max(100),
  }),
  spots: z.number().min(0),
  spoilageRisk: z.number().min(0).max(1),
  shelfLifeDays: z.number().min(0).max(30),
  notes: z.array(z.string()),
});

const SYSTEM = `You are AgriVision AI's produce inspection vision model. Given a single image of a fruit or vegetable, you return a strict JSON analysis evaluating freshness, ripeness, surface defects, and spoilage indicators. Be honest and conservative — flag spoilage when present. Respond ONLY with valid JSON matching the requested schema, no prose, no markdown.`;

const PROMPT = (hint?: string, prefs?: string[]) => `Analyze this produce image. ${hint ? `User suggests it is: ${hint}.` : ""} ${prefs?.length ? `User dietary preferences: ${prefs.join(", ")}.` : ""}

Return JSON with this exact shape:
{
  "produceName": string (e.g. "Banana", "Apple", "Mango"),
  "ripeness": "unripe" | "near_ripe" | "ripe" | "overripe" | "spoiled",
  "ripenessScore": number 0-100 (0=very unripe, 100=fully spoiled),
  "confidence": number 0-1,
  "colorProfile": { "hue": string, "vibrancy": 0-100, "uniformity": 0-100 },
  "texture": { "firmness": 0-100, "smoothness": 0-100 },
  "spots": integer count of visible blemishes/spots,
  "spoilageRisk": 0-1,
  "shelfLifeDays": integer estimate of remaining shelf life,
  "notes": array of 2-4 short observation strings about what you see (color, spots, texture, sheen, bruising)
}`;

export const analyzeProduceAI = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<ProduceAnalysis & { source: "ai" | "fallback"; error?: string }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return { ...fallback(data.imageDataUrl, data.hintName), source: "fallback", error: "Missing AI key" };
    }
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": key,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM },
            {
              role: "user",
              content: [
                { type: "text", text: PROMPT(data.hintName, data.dietaryPreferences) },
                { type: "image_url", image_url: { url: data.imageDataUrl } },
              ],
            },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`AI gateway ${res.status}: ${txt.slice(0, 200)}`);
      }
      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty AI response");
      const parsed = AnalysisSchema.parse(typeof content === "string" ? JSON.parse(content) : content);
      return { ...parsed, source: "ai" };
    } catch (e) {
      return {
        ...fallback(data.imageDataUrl, data.hintName),
        source: "fallback",
        error: e instanceof Error ? e.message : String(e),
      };
    }
  });

function fallback(seed: string, hint?: string): ProduceAnalysis {
  // Tiny deterministic fallback (same shape as mock engine).
  let h = 2166136261;
  for (let i = 0; i < Math.min(seed.length, 512); i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = Math.abs(h) || 1;
  const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const pool = ["Banana", "Apple", "Mango", "Avocado", "Tomato", "Bell Pepper"];
  const ripenessScore = Math.round(20 + rnd() * 75);
  let ripeness: Ripeness =
    ripenessScore < 30 ? "unripe" :
    ripenessScore < 55 ? "near_ripe" :
    ripenessScore < 80 ? "ripe" :
    ripenessScore < 92 ? "overripe" : "spoiled";
  return {
    produceName: hint || pool[Math.floor(rnd() * pool.length)],
    ripeness,
    ripenessScore,
    confidence: 0.7,
    colorProfile: { hue: "natural", vibrancy: 60, uniformity: 70 },
    texture: { firmness: 100 - ripenessScore, smoothness: 70 },
    spots: Math.floor(rnd() * 4),
    spoilageRisk: Math.max(0, (ripenessScore - 70) / 30),
    shelfLifeDays: Math.max(0, 8 - Math.floor(ripenessScore / 12)),
    notes: ["Fallback heuristic analysis (AI unavailable)."],
  };
}
