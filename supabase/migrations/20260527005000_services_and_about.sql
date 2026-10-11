-- Tables for customizable Services and About (À Propos) section

CREATE TABLE IF NOT EXISTS public.site_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_services TO anon, authenticated;
GRANT ALL ON public.site_services TO authenticated, service_role;

ALTER TABLE public.site_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view visible services"
ON public.site_services FOR SELECT
USING (visible = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage services"
ON public.site_services FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Table for Site Settings (À Propos, Contact, etc.)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO authenticated, service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site settings"
ON public.site_settings FOR SELECT USING (true);

CREATE POLICY "Admins manage site settings"
ON public.site_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Default initial content
INSERT INTO public.site_settings (key, value) VALUES
('about_title', 'Un savoir-faire au service de votre habitat'),
('about_text', 'Basés à Ouerdanine (Monastir), nous accompagnons particuliers et professionnels dans tous leurs projets de menuiserie aluminium : de la fabrication sur mesure à la pose complète de vos fenêtres, portes, vérandas et façades vitrées.'),
('about_image_url', ''),
('about_points', 'Profilés haut de gamme\nDécoupe et assemblage en atelier\nPose & finitions soignées\nSAV réactif & garantie')
ON CONFLICT (key) DO NOTHING;
