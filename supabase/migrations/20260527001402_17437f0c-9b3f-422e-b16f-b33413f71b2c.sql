
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Trigger: create profile + promote first user to admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INT;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all clients" ON public.clients FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Devis
CREATE TABLE public.devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  date_devis DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'brouillon',
  total_ht NUMERIC(12,3) NOT NULL DEFAULT 0,
  tva_pct NUMERIC(5,2) NOT NULL DEFAULT 19,
  total_ttc NUMERIC(12,3) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.devis TO authenticated;
GRANT ALL ON public.devis TO service_role;
ALTER TABLE public.devis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all devis" ON public.devis FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.devis_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id UUID NOT NULL REFERENCES public.devis(id) ON DELETE CASCADE,
  designation TEXT NOT NULL,
  quantite NUMERIC(12,3) NOT NULL DEFAULT 1,
  prix_unitaire NUMERIC(12,3) NOT NULL DEFAULT 0,
  total NUMERIC(12,3) NOT NULL DEFAULT 0,
  position INT NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.devis_items TO authenticated;
GRANT ALL ON public.devis_items TO service_role;
ALTER TABLE public.devis_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all devis_items" ON public.devis_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Factures
CREATE TABLE public.factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  devis_id UUID REFERENCES public.devis(id) ON DELETE SET NULL,
  date_facture DATE NOT NULL DEFAULT CURRENT_DATE,
  date_echeance DATE,
  status TEXT NOT NULL DEFAULT 'impayee',
  total_ht NUMERIC(12,3) NOT NULL DEFAULT 0,
  tva_pct NUMERIC(5,2) NOT NULL DEFAULT 19,
  total_ttc NUMERIC(12,3) NOT NULL DEFAULT 0,
  montant_paye NUMERIC(12,3) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.factures TO authenticated;
GRANT ALL ON public.factures TO service_role;
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all factures" ON public.factures FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.facture_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID NOT NULL REFERENCES public.factures(id) ON DELETE CASCADE,
  designation TEXT NOT NULL,
  quantite NUMERIC(12,3) NOT NULL DEFAULT 1,
  prix_unitaire NUMERIC(12,3) NOT NULL DEFAULT 0,
  total NUMERIC(12,3) NOT NULL DEFAULT 0,
  position INT NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.facture_items TO authenticated;
GRANT ALL ON public.facture_items TO service_role;
ALTER TABLE public.facture_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all facture_items" ON public.facture_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Paiements
CREATE TABLE public.paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID NOT NULL REFERENCES public.factures(id) ON DELETE CASCADE,
  montant NUMERIC(12,3) NOT NULL,
  date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,
  methode TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paiements TO authenticated;
GRANT ALL ON public.paiements TO service_role;
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all paiements" ON public.paiements FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Trigger: update facture montant_paye + status when paiement changes
CREATE OR REPLACE FUNCTION public.refresh_facture_paiement()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  fid UUID;
  total_p NUMERIC(12,3);
  ttc NUMERIC(12,3);
BEGIN
  fid := COALESCE(NEW.facture_id, OLD.facture_id);
  SELECT COALESCE(SUM(montant),0) INTO total_p FROM public.paiements WHERE facture_id = fid;
  SELECT total_ttc INTO ttc FROM public.factures WHERE id = fid;
  UPDATE public.factures
    SET montant_paye = total_p,
        status = CASE
          WHEN total_p <= 0 THEN 'impayee'
          WHEN total_p >= ttc THEN 'payee'
          ELSE 'partiellement_payee'
        END
    WHERE id = fid;
  RETURN COALESCE(NEW, OLD);
END;
$$;
CREATE TRIGGER paiements_refresh AFTER INSERT OR UPDATE OR DELETE ON public.paiements
  FOR EACH ROW EXECUTE FUNCTION public.refresh_facture_paiement();

-- Demandes de devis (public)
CREATE TABLE public.demandes_devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  email TEXT,
  telephone TEXT NOT NULL,
  sujet TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'nouvelle',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.demandes_devis TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.demandes_devis TO authenticated;
GRANT ALL ON public.demandes_devis TO service_role;
ALTER TABLE public.demandes_devis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can submit" ON public.demandes_devis FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admin read" ON public.demandes_devis FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin update" ON public.demandes_devis FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "admin delete" ON public.demandes_devis FOR DELETE TO authenticated USING (public.is_admin());
