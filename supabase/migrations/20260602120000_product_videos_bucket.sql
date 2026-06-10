-- Create public bucket for product videos (workshop trick videos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-videos', 'product-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read videos (public product page)
CREATE POLICY IF NOT EXISTS "public read product-videos"
  ON storage.objects AS PERMISSIVE
  FOR SELECT TO anon
  USING (bucket_id = 'product-videos');
