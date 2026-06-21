// Client-side voice helper. Streams MP3 audio from /api/tts and plays it.
// Honors user voice preferences (voice profile, speed, parts to announce,
// auto-replay) and exposes a small playback API.

import type { AnnouncePart, VoicePrefs } from "./voice-prefs";
import { DEFAULT_VOICE_PREFS } from "./voice-prefs";

let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
let replayTimer: ReturnType<typeof setTimeout> | null = null;

export function stopVoice() {
  if (replayTimer) {
    clearTimeout(replayTimer);
    replayTimer = null;
  }
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

export interface SpeakOpts {
  voice?: string;
  speed?: number;
  autoReplay?: boolean;
  autoReplayDelaySec?: number;
}

export async function speak(text: string, opts: SpeakOpts = {}): Promise<void> {
  stopVoice();
  if (!text.trim()) return;
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      voice: opts.voice ?? "alloy",
      speed: opts.speed ?? 1.0,
    }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentAudio = audio;
  currentUrl = url;

  if (opts.autoReplay) {
    const delayMs = Math.max(1, opts.autoReplayDelaySec ?? 6) * 1000;
    audio.addEventListener("ended", () => {
      // Only re-trigger if this is still the active audio (user didn't stop).
      if (currentAudio !== audio) return;
      replayTimer = setTimeout(() => {
        if (currentAudio !== audio) return;
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }, delayMs);
    });
  }

  await audio.play().catch(() => {
    /* autoplay blocked — silent */
  });
}

export interface AnnouncementInput {
  produceName: string;
  recommendationLabel: string;
  ripenessLabel: string;
  matchScore: number;
  shelfLifeDays?: number;
}

// Build a short, "important-only" announcement string, honoring which parts
// the user opted into.
export function buildAnnouncement(
  p: AnnouncementInput,
  parts: AnnouncePart[] = DEFAULT_VOICE_PREFS.parts,
): string {
  const out: string[] = [];
  if (parts.includes("produce")) out.push(`${p.produceName}.`);
  if (parts.includes("recommendation")) out.push(`${p.recommendationLabel}.`);
  if (parts.includes("ripeness")) out.push(`Ripeness: ${p.ripenessLabel.replace(/_/g, " ")}.`);
  if (parts.includes("shelfLife") && typeof p.shelfLifeDays === "number") {
    out.push(`About ${p.shelfLifeDays} days shelf life.`);
  }
  if (parts.includes("match")) out.push(`${p.matchScore} percent match.`);
  return out.join(" ");
}

export function speakFromPrefs(
  prefs: VoicePrefs,
  input: AnnouncementInput,
): Promise<void> {
  if (!prefs.enabled) return Promise.resolve();
  const text = buildAnnouncement(input, prefs.parts);
  if (!text) return Promise.resolve();
  return speak(text, {
    voice: prefs.voice,
    speed: prefs.speed,
    autoReplay: prefs.autoReplay,
    autoReplayDelaySec: prefs.autoReplayDelaySec,
  });
}
