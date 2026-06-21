import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  imageA: z.string().min(32),
  imageB: z.string().min(32),
  produceHint: z.string().optional(),
  intent: z.string().optional(),
});

const RegionSchema = z.object({
  label: z.string(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0).max(1),
  h: z.number().min(0).max(1),
  severity: z.enum(["positive", "negative", "neutral"]).default("neutral"),
});
export type TwinRegion = z.infer<typeof RegionSchema>;

const TwinSchema = z.object({
  produceName: z.string(),
  winnerIndex: z.number().int().min(0).max(1),
  winnerLabel: z.string(),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  items: z
    .array(
      z.object({
        label: z.string(),
        ripenessScore: z.number().min(0).max(100),
        ripeness: z.string(),
        strengths: z.array(z.string()),
        weaknesses: z.array(z.string()),
        regions: z.array(RegionSchema).default([]),
      }),
    )
    .length(2),
  differences: z.array(
    z.object({
      aspect: z.string(),
      a: z.string(),
      b: z.string(),
      betterIndex: z.number().int().min(0).max(1),
      weight: z.number().min(0).max(1),
    }),
  ),
});

export type TwinAnalysis = z.infer<typeof TwinSchema>;

const SYSTEM = `You are AgriVision AI's twin produce comparison vision model. Given two images of visually similar produce items (e.g., two bananas, two banana bunches), perform a careful side-by-side differential analysis. Identify subtle differences in ripeness, color, surface defects, bruising, stem condition, and freshness. Pick a winner with clear reasoning. For each image, also return normalized bounding-box "regions" pointing to the SPECIFIC visual evidence (brown spot, bruise, uniform-color zone, dark stem, etc.) that drove your conclusion. Respond ONLY with strict JSON. No markdown, no prose.`;

const PROMPT = (hint?: string, intent?: string) => `Compare these two ${hint || "produce"} images (image A first, image B second).${intent ? ` User intent: ${intent}.` : ""}

Return JSON in this exact shape:
{
  "produceName": string,
  "winnerIndex": 0 or 1,
  "winnerLabel": "Image A" | "Image B",
  "confidence": 0-1,
  "summary": one-paragraph plain-language explanation of why the winner wins,
  "items": [
    {
      "label": "Image A",
      "ripenessScore": 0-100,
      "ripeness": "unripe|near_ripe|ripe|overripe|spoiled",
      "strengths": [2-3 short bullets],
      "weaknesses": [1-3 short bullets],
      "regions": [
        { "label": short tag (e.g. "Brown spot", "Bruise", "Even color"), "x": 0-1, "y": 0-1, "w": 0-1, "h": 0-1, "severity": "positive"|"negative"|"neutral" }
      ]
    },
    { "label": "Image B", ...same shape... }
  ],
  "differences": [
    { "aspect": short label, "a": observation for A, "b": observation for B, "betterIndex": 0 or 1, "weight": 0-1 }
  ]
}

Region coordinates are NORMALIZED to the image (0,0 = top-left, 1,1 = bottom-right). x,y is the top-left of the box; w,h is its size. Return 2-4 regions per image pointing to the most decision-relevant evidence (e.g. exact bruise location, uniform yellow band, dark stem). Use "negative" for defects/spoilage, "positive" for desirable traits, "neutral" otherwise. Focus on 4-6 most decision-relevant differences.`;

export const analyzeTwinCompare = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<TwinAnalysis & { source: "ai" | "fallback"; error?: string }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { ...fallback(), source: "fallback", error: "Missing AI key" };
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM },
            {
              role: "user",
              content: [
                { type: "text", text: PROMPT(data.produceHint, data.intent) },
                { type: "image_url", image_url: { url: data.imageA } },
                { type: "image_url", image_url: { url: data.imageB } },
              ],
            },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty AI response");
      const parsed = TwinSchema.parse(typeof content === "string" ? JSON.parse(content) : content);
      return { ...parsed, source: "ai" };
    } catch (e) {
      return { ...fallback(), source: "fallback", error: e instanceof Error ? e.message : String(e) };
    }
  });

function fallback(): TwinAnalysis {
  return {
    produceName: "Banana",
    winnerIndex: 0,
    winnerLabel: "Image A",
    confidence: 0.6,
    summary:
      "Heuristic fallback: AI vision unavailable. Image A is tentatively chosen — re-run when AI is online for a real differential analysis.",
    items: [
      {
        label: "Image A",
        ripenessScore: 65,
        ripeness: "ripe",
        strengths: ["Even color coverage", "Few visible spots"],
        weaknesses: ["Minor stem darkening"],
        regions: [
          { label: "Even color", x: 0.2, y: 0.3, w: 0.5, h: 0.4, severity: "positive" },
          { label: "Stem", x: 0.4, y: 0.05, w: 0.15, h: 0.12, severity: "neutral" },
        ],
      },
      {
        label: "Image B",
        ripenessScore: 78,
        ripeness: "ripe",
        strengths: ["Slightly more sweetness expected"],
        weaknesses: ["More surface speckles", "Softer-looking skin"],
        regions: [
          { label: "Brown spot", x: 0.35, y: 0.45, w: 0.18, h: 0.18, severity: "negative" },
          { label: "Speckling", x: 0.6, y: 0.55, w: 0.2, h: 0.15, severity: "negative" },
        ],
      },
    ],
    differences: [
      { aspect: "Surface bruising", a: "Minimal", b: "Some speckling", betterIndex: 0, weight: 0.7 },
      { aspect: "Color uniformity", a: "Even yellow", b: "Patchy yellow-brown", betterIndex: 0, weight: 0.6 },
      { aspect: "Estimated firmness", a: "Firmer", b: "Softer", betterIndex: 0, weight: 0.5 },
    ],
  };
}
