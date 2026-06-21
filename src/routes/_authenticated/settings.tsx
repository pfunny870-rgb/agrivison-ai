import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings · AgriVision AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setEmail(u.user.email ?? "");
      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      setName(p?.display_name ?? "");
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("profiles").update({ display_name: name, updated_at: new Date().toISOString() }).eq("id", u.user.id);
      if (error) throw error;
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  }

  return (
    <AppShell>
      <div className="space-y-7 max-w-2xl">
        <div>
          <div className="text-sm text-accent font-medium uppercase tracking-widest">Settings</div>
          <h1 className="text-3xl md:text-4xl font-semibold mt-1">Your account</h1>
        </div>

        <div className="glass-strong rounded-3xl p-8 space-y-5">
          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Email</label>
            <input value={email} disabled className="mt-1 w-full rounded-xl border border-input bg-muted px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Display name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} disabled={loading} className="mt-1 w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button onClick={save} disabled={saving || loading} className="inline-flex items-center justify-center gap-2 rounded-xl gradient-primary text-primary-foreground px-6 py-2.5 font-medium shadow-glass disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
          </button>
        </div>

        <div className="glass rounded-3xl p-8">
          <h2 className="font-semibold">Preferences</h2>
          <p className="text-sm text-muted-foreground mt-1">Default intent and notification controls coming soon.</p>
        </div>
      </div>
    </AppShell>
  );
}
