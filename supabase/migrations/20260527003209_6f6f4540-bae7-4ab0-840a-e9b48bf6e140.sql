
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.realisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  categorie TEXT,
  position INT NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.realisations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.realisations TO authenticated;
GRANT ALL ON public.realisations TO service_role;

ALTER TABLE public.realisations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view visible realisations"
ON public.realisations FOR SELECT
USING (visible = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert realisations"
ON public.realisations FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update realisations"
ON public.realisations FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete realisations"
ON public.realisations FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_realisations_updated
BEFORE UPDATE ON public.realisations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO storage.buckets (id, name, public) VALUES ('realisations', 'realisations', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read realisations images"
ON storage.objects FOR SELECT USING (bucket_id = 'realisations');

CREATE POLICY "Admins upload realisations images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'realisations' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update realisations images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'realisations' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete realisations images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'realisations' AND public.has_role(auth.uid(), 'admin'));
