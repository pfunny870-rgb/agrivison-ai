import { useEffect, useState } from "react";
import { Volume2, VolumeX, Play, Check, Settings2 } from "lucide-react";
import {
  DEFAULT_VOICE_PREFS,
  PART_LABELS,
  VOICE_PROFILES,
  loadVoicePrefs,
  saveVoicePrefs,
  type AnnouncePart,
  type VoicePrefs,
  type VoiceProfile,
} from "@/lib/voice-prefs";
import { speak } from "@/lib/voice";
import { toast } from "sonner";

interface Props {
  /** When true renders a compact (collapsed-by-default) card; full view otherwise. */
  compact?: boolean;
  /** Notify parent of pref changes (e.g. so the scan page replays with new voice). */
  onChange?: (prefs: VoicePrefs) => void;
}

const PARTS: AnnouncePart[] = ["produce", "recommendation", "ripeness", "shelfLife", "match"];

export function VoicePrefsPanel({ compact = false, onChange }: Props) {
  const [prefs, setPrefs] = useState<VoicePrefs>(DEFAULT_VOICE_PREFS);
  const [open, setOpen] = useState(!compact);

  useEffect(() => {
    setPrefs(loadVoicePrefs());
  }, []);

  function update(patch: Partial<VoicePrefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    saveVoicePrefs(next);
    onChange?.(next);
  }

  function togglePart(p: AnnouncePart) {
    const has = prefs.parts.includes(p);
    const parts = has ? prefs.parts.filter((x) => x !== p) : [...prefs.parts, p];
    if (parts.length === 0) {
      toast.error("Pick at least one thing to announce");
      return;
    }
    update({ parts });
  }

  function preview() {
    const sample =
      "Banana. Best pick. Ripeness: ripe. About 3 days shelf life. 94 percent match.";
    speak(sample, { voice: prefs.voice, speed: prefs.speed }).catch(() =>
      toast.error("Voice preview unavailable"),
    );
  }

  return (
    <div className="glass-strong rounded-3xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
            {prefs.enabled ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Voice agent</div>
            <div className="font-semibold">In-ear announcement settings</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => update({ enabled: !prefs.enabled })}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium border transition ${
              prefs.enabled
                ? "bg-accent/15 text-accent border-accent/40"
                : "bg-card border-border text-muted-foreground"
            }`}
          >
            {prefs.enabled ? "On" : "Off"}
          </button>
          {compact && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              title="Voice settings"
            >
              <Settings2 className="h-3.5 w-3.5" /> {open ? "Hide" : "Tune"}
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-6 space-y-6">
          {/* What to announce */}
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              What to announce in my ear
            </div>
            <div className="flex flex-wrap gap-2">
              {PARTS.map((p) => {
                const on = prefs.parts.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => togglePart(p)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition inline-flex items-center gap-1.5 ${
                      on
                        ? "gradient-primary text-primary-foreground border-transparent shadow-glass"
                        : "bg-card border-border hover:bg-muted"
                    }`}
                  >
                    {on && <Check className="h-3 w-3" />}
                    {PART_LABELS[p]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice profile */}
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Voice profile
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VOICE_PROFILES.map((v) => {
                const on = prefs.voice === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => update({ voice: v.id as VoiceProfile })}
                    className={`text-left rounded-xl border px-3 py-2 transition ${
                      on
                        ? "bg-primary text-primary-foreground border-transparent shadow-glass"
                        : "bg-card border-border hover:bg-muted"
                    }`}
                  >
                    <div className="text-sm font-semibold">{v.label}</div>
                    <div className={`text-[10px] ${on ? "opacity-80" : "text-muted-foreground"}`}>{v.vibe}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Speech rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Speech rate</div>
              <div className="text-xs font-semibold tabular-nums">{prefs.speed.toFixed(2)}×</div>
            </div>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={prefs.speed}
              onChange={(e) => update({ speed: Number(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Slow</span>
              <span>Normal</span>
              <span>Fast</span>
            </div>
          </div>

          {/* Auto-replay */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <div className="text-sm font-semibold">Auto-replay</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Repeat the announcement until you stop or scan a new item.
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.autoReplay}
                onChange={(e) => update({ autoReplay: e.target.checked })}
                className="h-5 w-9 accent-primary"
              />
            </label>
            {prefs.autoReplay && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Replay every</div>
                  <div className="text-xs font-semibold tabular-nums">{prefs.autoReplayDelaySec}s</div>
                </div>
                <input
                  type="range"
                  min={3}
                  max={30}
                  step={1}
                  value={prefs.autoReplayDelaySec}
                  onChange={(e) => update({ autoReplayDelaySec: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>
            )}
          </div>

          <button
            onClick={preview}
            className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <Play className="h-4 w-4" /> Preview voice
          </button>
        </div>
      )}
    </div>
  );
}
