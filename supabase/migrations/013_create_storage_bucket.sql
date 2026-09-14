-- ============================================================
-- Migration 013: Create storage bucket for foot images
-- ============================================================

-- Create the foot-images storage bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('foot-images', 'foot-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to foot images
CREATE POLICY "foot_images_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'foot-images');

-- Allow authenticated insert/update for foot images
CREATE POLICY "foot_images_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'foot-images');

CREATE POLICY "foot_images_update" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'foot-images');
