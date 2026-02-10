
-- Tighten storage policies: only allow uploads to own company folder
DROP POLICY "Admins can upload company assets" ON storage.objects;
DROP POLICY "Admins can update company assets" ON storage.objects;
DROP POLICY "Admins can delete company assets" ON storage.objects;

CREATE POLICY "Admins can upload to their company folder" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company-assets' AND
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.company_id = (storage.foldername(name))[1]::uuid
      AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins can update their company assets" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'company-assets' AND
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.company_id = (storage.foldername(name))[1]::uuid
      AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins can delete their company assets" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'company-assets' AND
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.company_id = (storage.foldername(name))[1]::uuid
      AND ur.role = 'admin'
  )
);
