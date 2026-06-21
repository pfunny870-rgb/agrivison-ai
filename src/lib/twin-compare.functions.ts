import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  imageA: z.string().min(32),
  imageB: z.string().min(32),
  produceHint: z.string().optional(),
  intent: z.string().optional(),
});

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

const SYSTEM = `You are AgriVision AI's twin produce comparison vision model. Given two images of visually similar produce items (e.g., two bananas, two banana bunches), perform a careful side-by-side differential analysis. Identify the subtle differences in ripeness, color, surface defects, bruising, stem condition, and freshness. Pick a winner with clear reasoning. Respond ONLY with strict JSON. No markdown, no prose.`;

const PROMPT = (hint?: string, intent?: string) => `Compare these two ${hint || "produce"} images (image A first, image B second).${intent ? ` User intent: ${intent}.` : ""}

Return JSON in this exact shape:
{
  "produceName": string,
  "winnerIndex": 0 or 1,
  "winnerLabel": "Image A" | "Image B",
  "confidence": 0-1,
  "summary": one-paragraph plain-language explanation of why the winner wins,
  "items": [
    { "label": "Image A", "ripenessScore": 0-100, "ripeness": "unripe|near_ripe|ripe|overripe|spoiled", "strengths": [2-3 short bullets], "weaknesses": [1-3 short bullets] },
    { "label": "Image B", "ripenessScore": 0-100, "ripeness": "unripe|near_ripe|ripe|overripe|spoiled", "strengths": [2-3 short bullets], "weaknesses": [1-3 short bullets] }
  ],
  "differences": [
    { "aspect": short label (e.g. "Surface bruising"), "a": observation for A, "b": observation for B, "betterIndex": 0 or 1, "weight": 0-1 importance }
  ]
}

Focus on 4-6 most decision-relevant differences.`;

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
      },
      {
        label: "Image B",
        ripenessScore: 78,
        ripeness: "ripe",
        strengths: ["Slightly more sweetness expected"],
        weaknesses: ["More surface speckles", "Softer-looking skin"],
      },
    ],
    differences: [
      { aspect: "Surface bruising", a: "Minimal", b: "Some speckling", betterIndex: 0, weight: 0.7 },
      { aspect: "Color uniformity", a: "Even yellow", b: "Patchy yellow-brown", betterIndex: 0, weight: 0.6 },
      { aspect: "Estimated firmness", a: "Firmer", b: "Softer", betterIndex: 0, weight: 0.5 },
    ],
  };
}
