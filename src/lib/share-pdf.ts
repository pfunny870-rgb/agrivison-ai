import { supabase } from "@/integrations/supabase/client";

// Uploads a PDF Blob to the user's private folder in the scan-pdfs bucket
// and returns a signed URL valid for 30 days that anyone with the link can open.
export async function uploadAndShareScanPdf(blob: Blob, filename: string): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const safe = filename.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(0, 80);
  const path = `${u.user.id}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage
    .from("scan-pdfs")
    .upload(path, blob, { contentType: "application/pdf", upsert: false });
  if (error) throw error;
  const { data, error: sErr } = await supabase.storage
    .from("scan-pdfs")
    .createSignedUrl(path, 60 * 60 * 24 * 30);
  if (sErr || !data?.signedUrl) throw sErr ?? new Error("Could not create link");
  return data.signedUrl;
}

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
