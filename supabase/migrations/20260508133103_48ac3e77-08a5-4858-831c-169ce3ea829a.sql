
-- Generic attachments table linking files to any entity
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  project_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  content_type TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attachments_entity ON public.attachments(entity_type, entity_id);
CREATE INDEX idx_attachments_project ON public.attachments(project_id);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attachments_select"
  ON public.attachments FOR SELECT TO authenticated
  USING (public.user_can_access_project(auth.uid(), project_id));

CREATE POLICY "attachments_insert"
  ON public.attachments FOR INSERT TO authenticated
  WITH CHECK (
    public.current_role_is('consultant'::app_role)
    AND public.user_can_access_project(auth.uid(), project_id)
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "attachments_delete"
  ON public.attachments FOR DELETE TO authenticated
  USING (
    public.current_role_is('consultant'::app_role)
    AND public.user_can_access_project(auth.uid(), project_id)
  );

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: path layout = {project_id}/{entity_type}/{entity_id}/{filename}
CREATE POLICY "attachments_storage_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'attachments'
    AND public.user_can_access_project(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "attachments_storage_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'attachments'
    AND public.current_role_is('consultant'::app_role)
    AND public.user_can_access_project(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "attachments_storage_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'attachments'
    AND public.current_role_is('consultant'::app_role)
    AND public.user_can_access_project(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
