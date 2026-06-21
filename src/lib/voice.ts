// Client-side voice helper. Streams MP3 audio from /api/tts and plays it.
// Designed for "smart wearable" auto-announce after a scan.

let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;

export function stopVoice() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
}

export async function speak(text: string, voice = "alloy"): Promise<void> {
  stopVoice();
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentAudio = audio;
  currentUrl = url;
  await audio.play().catch(() => {
    /* autoplay blocked — silent */
  });
}

// Build a short, "important-only" announcement string from an analysis + recommendation.
export function buildAnnouncement(params: {
  produceName: string;
  recommendationLabel: string;
  ripenessLabel: string;
  matchScore: number;
  shelfLifeDays?: number;
  topNote?: string;
}): string {
  const { produceName, recommendationLabel, ripenessLabel, matchScore, shelfLifeDays, topNote } = params;
  const parts = [
    `${produceName}: ${recommendationLabel}.`,
    `Ripeness: ${ripenessLabel.replace(/_/g, " ")}.`,
    `${matchScore} percent match.`,
  ];
  if (typeof shelfLifeDays === "number") parts.push(`About ${shelfLifeDays} days shelf life.`);
  if (topNote) parts.push(topNote);
  return parts.join(" ");
}
