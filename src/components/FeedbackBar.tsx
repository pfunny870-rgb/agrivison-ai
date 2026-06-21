import { useState } from "react";
import { ThumbsUp, ThumbsDown, Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  produceName: string;
  intent: string;
  recommendation: string;
  scanId?: string | null;
}

export function FeedbackBar({ produceName, intent, recommendation, scanId }: Props) {
  const [rating, setRating] = useState<1 | -1 | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function send(nextRating: 1 | -1 | null, nextCorrect: boolean | null) {
    if (nextRating === null && nextCorrect === null) return;
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Sign in to submit feedback");
      const payload: any = {
        user_id: u.user.id,
        scan_id: scanId ?? null,
        produce_name: produceName,
        intent,
        recommendation,
        rating: nextRating ?? rating ?? 1,
        was_correct: nextCorrect,
      };
      const { error } = await (supabase.from("scan_feedback" as any) as any).insert(payload);
      if (error) throw error;
      setDone(true);
      toast.success("Thanks — we'll tune future picks for you");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save feedback");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="glass rounded-2xl p-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Check className="h-4 w-4 text-accent" /> Feedback recorded — future recommendations will adapt.
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
        Help us improve · Was this Best Pick right for you?
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => { setRating(1); send(1, correct); }}
          disabled={saving}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition ${
            rating === 1 ? "bg-accent/15 text-accent border-accent/40" : "bg-card border-border hover:bg-muted"
          }`}
        >
          <ThumbsUp className="h-3.5 w-3.5" /> Helpful
        </button>
        <button
          onClick={() => { setRating(-1); send(-1, correct); }}
          disabled={saving}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition ${
            rating === -1 ? "bg-destructive/15 text-destructive border-destructive/40" : "bg-card border-border hover:bg-muted"
          }`}
        >
          <ThumbsDown className="h-3.5 w-3.5" /> Not quite
        </button>

        <div className="mx-2 h-5 w-px bg-border" />

        <span className="text-xs text-muted-foreground">Was it correct?</span>
        <button
          onClick={() => { setCorrect(true); send(rating, true); }}
          disabled={saving}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition ${
            correct === true ? "bg-accent/15 text-accent border-accent/40" : "bg-card border-border hover:bg-muted"
          }`}
        >
          <Check className="h-3 w-3" /> Yes
        </button>
        <button
          onClick={() => { setCorrect(false); send(rating, false); }}
          disabled={saving}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition ${
            correct === false ? "bg-destructive/15 text-destructive border-destructive/40" : "bg-card border-border hover:bg-muted"
          }`}
        >
          <X className="h-3 w-3" /> No
        </button>
        {saving && <Loader2 className="h-4 w-4 animate-spin text-accent ml-2" />}
      </div>
    </div>
  );
}
