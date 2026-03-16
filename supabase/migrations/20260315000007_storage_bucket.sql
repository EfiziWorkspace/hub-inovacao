-- Migration 7: Storage bucket + policies

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-files',
  'ticket-files',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/html', 'image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Usuario autenticado pode fazer upload na propria pasta
CREATE POLICY "storage_upload_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ticket-files'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Usuario pode ler seus proprios arquivos
CREATE POLICY "storage_read_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ticket-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
