import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
const supabase = supabaseTyped as any;
import hero from "@/assets/hero-aluminium.jpg";
import fenetre from "@/assets/fenetre.jpg";
import porte from "@/assets/porte.jpg";
import veranda from "@/assets/veranda.jpg";
import atelier from "@/assets/atelier.jpg";

export const Route = createFileRoute("/realisations")({
  component: RealisationsPage,
  head: () => ({
    meta: [
      { title: "Nos réalisations aluminium — ALU MED AMINE" },
      { name: "description", content: "Galerie de nos installations aluminium : fenêtres, portes, vérandas réalisées en Tunisie." },
      { property: "og:title", content: "Réalisations aluminium — ALU MED AMINE" },
      { property: "og:description", content: "Découvrez nos projets : fenêtres, portes, vérandas et murs rideaux en aluminium." },
      { property: "og:url", content: "https://alumedamine.vercel.app/realisations" },
    ],
    links: [{ rel: "canonical", href: "https://alumedamine.vercel.app/realisations" }],
  }),
});

const fallback = [
  { id: "f1", titre: "Fenêtre aluminium", image_url: fenetre, categorie: "Fenêtre", description: "" },
  { id: "f2", titre: "Porte aluminium", image_url: porte, categorie: "Porte", description: "" },
  { id: "f3", titre: "Véranda aluminium", image_url: veranda, categorie: "Véranda", description: "" },
  { id: "f4", titre: "Atelier aluminium", image_url: atelier, categorie: "Atelier", description: "" },
  { id: "f5", titre: "Projet aluminium", image_url: hero, categorie: "", description: "" },
];

function RealisationsPage() {
  const [items, setItems] = useState<any[] | null>(null);
  useEffect(() => {
    supabase.from("realisations").select("*").eq("visible", true).order("position").order("created_at", { ascending: false })
      .then(({ data }: any) => setItems(data || []));
  }, []);

  const list = items && items.length > 0 ? items : items === null ? [] : fallback;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container mx-auto px-4 py-16">
        <div className="text-xs uppercase tracking-widest text-primary">Réalisations</div>
        <h1 className="mt-2 font-display text-5xl font-bold tracking-tight">Nos derniers projets</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">Un aperçu de notre savoir-faire en menuiserie aluminium.</p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map((it, i) => (
            <Card key={it.id ?? i} className="group overflow-hidden border-border/60 p-0 shadow-card transition-all hover:shadow-elegant">
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={it.image_url}
                  alt={`${it.titre || "Réalisation"} aluminium — ALU MED AMINE`}
                  loading="lazy"
                  width={1024}
                  height={768}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                {it.categorie && (
                  <span className="text-xs uppercase tracking-wider text-accent font-semibold block mb-1">
                    {it.categorie}
                  </span>
                )}
                <h2 className="font-display text-lg font-semibold">{it.titre}</h2>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {it.description || "Menuiserie aluminium sur mesure conçue et posée avec précision et élégance."}
                </p>
              </div>
            </Card>
          ))}
        </div>
        {items !== null && items.length === 0 && (
          <p className="mt-8 text-sm text-muted-foreground">Galerie en cours de mise à jour.</p>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
