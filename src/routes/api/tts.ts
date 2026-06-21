import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const body = await request.json().catch(() => ({}));
        const text = String(body?.text ?? "").slice(0, 1500);
        const voice = String(body?.voice ?? "alloy");
        const rawSpeed = Number(body?.speed);
        const speed = Number.isFinite(rawSpeed) ? Math.min(2, Math.max(0.5, rawSpeed)) : 1.0;
        if (!text) return new Response("Missing text", { status: 400 });

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: text,
            voice,
            speed,
            response_format: "mp3",
          }),
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          return new Response(t || "TTS failed", { status: res.status });
        }
        return new Response(res.body, {
          headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
