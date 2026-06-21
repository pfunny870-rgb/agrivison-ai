import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// No login required: if the visitor has no session, we sign them in
// anonymously so RLS-backed features (scans, history, feedback) still work
// without a sign-up wall. The /auth page is still available for users who
// want to upgrade to a real account from Settings later.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    let user = data.user;
    if (!user) {
      const { data: anon, error } = await supabase.auth.signInAnonymously();
      if (error || !anon.user) {
        // Fall back to landing if anonymous sign-in is not available.
        throw redirect({ to: "/" });
      }
      user = anon.user;
    }
    return { user };
  },
  component: () => <Outlet />,
});
