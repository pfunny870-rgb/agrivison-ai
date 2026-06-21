// User-tunable voice preferences. Stored client-side (localStorage) so they
// follow the device without any backend round-trip.

export type AnnouncePart = "produce" | "recommendation" | "ripeness" | "shelfLife" | "match";
export type VoiceProfile =
  | "alloy"
  | "ash"
  | "ballad"
  | "coral"
  | "echo"
  | "sage"
  | "shimmer"
  | "verse"
  | "marin"
  | "cedar";

export interface VoicePrefs {
  enabled: boolean;
  parts: AnnouncePart[];
  voice: VoiceProfile;
  speed: number; // 0.5 - 2.0
  autoReplay: boolean;
  autoReplayDelaySec: number;
}

export const DEFAULT_VOICE_PREFS: VoicePrefs = {
  enabled: true,
  parts: ["produce", "recommendation", "ripeness", "shelfLife", "match"],
  voice: "alloy",
  speed: 1.0,
  autoReplay: false,
  autoReplayDelaySec: 6,
};

export const VOICE_PROFILES: { id: VoiceProfile; label: string; vibe: string }[] = [
  { id: "alloy", label: "Alloy", vibe: "Balanced, neutral" },
  { id: "ash", label: "Ash", vibe: "Calm, low" },
  { id: "ballad", label: "Ballad", vibe: "Warm, expressive" },
  { id: "coral", label: "Coral", vibe: "Bright, friendly" },
  { id: "echo", label: "Echo", vibe: "Crisp, narrator" },
  { id: "sage", label: "Sage", vibe: "Wise, mellow" },
  { id: "shimmer", label: "Shimmer", vibe: "Soft, light" },
  { id: "verse", label: "Verse", vibe: "Energetic" },
  { id: "marin", label: "Marin", vibe: "Smooth, modern" },
  { id: "cedar", label: "Cedar", vibe: "Grounded, deep" },
];

export const PART_LABELS: Record<AnnouncePart, string> = {
  produce: "Produce name",
  recommendation: "Recommendation",
  ripeness: "Ripeness",
  shelfLife: "Shelf life",
  match: "Match %",
};

const KEY = "agrivision_voice_prefs_v1";

export function loadVoicePrefs(): VoicePrefs {
  if (typeof window === "undefined") return DEFAULT_VOICE_PREFS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_VOICE_PREFS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_VOICE_PREFS,
      ...parsed,
      parts: Array.isArray(parsed?.parts) && parsed.parts.length > 0 ? parsed.parts : DEFAULT_VOICE_PREFS.parts,
    };
  } catch {
    return DEFAULT_VOICE_PREFS;
  }
}

export function saveVoicePrefs(p: VoicePrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(p));
}
