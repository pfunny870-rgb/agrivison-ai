
CREATE TABLE public.scan_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scan_id UUID REFERENCES public.scans(id) ON DELETE CASCADE,
  produce_name TEXT NOT NULL,
  intent TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating IN (-1, 1)),
  was_correct BOOLEAN,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scan_feedback TO authenticated;
GRANT ALL ON public.scan_feedback TO service_role;
ALTER TABLE public.scan_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own feedback" ON public.scan_feedback FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own scan pdfs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'scan-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users upload own scan pdfs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'scan-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own scan pdfs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'scan-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);
