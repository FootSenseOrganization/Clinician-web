-- ============================================================================
-- Migration 017: Storage Buckets (Friend's migration — ALREADY APPLIED)
-- footsense-heatmaps bucket for thermal heatmap PNGs
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('footsense-heatmaps', 'footsense-heatmaps', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload thermal heatmaps"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'footsense-heatmaps'
    AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  );

CREATE POLICY "Public & Authenticated read access for thermal heatmaps"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'footsense-heatmaps');

CREATE POLICY "Users can delete their thermal heatmaps"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'footsense-heatmaps'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.role() = 'service_role')
  );
