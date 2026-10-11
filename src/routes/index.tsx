import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
const supabase = supabaseTyped as any;
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Hammer, Ruler, ShieldCheck, Sparkles } from "lucide-react";
import hero from "@/assets/hero-aluminium.jpg";
import atelier from "@/assets/atelier.jpg";
import veranda from "@/assets/veranda.jpg";
import porte from "@/assets/porte.jpg";
import fenetre from "@/assets/fenetre.jpg";
import { COMPANY } from "@/lib/format";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "ALU MED AMINE — Menuiserie aluminium à Monastir" },
      { name: "description", content: "Fabrication et pose de fenêtres, portes, vérandas et murs rideaux en aluminium sur mesure à Monastir. Devis gratuit sous 24h." },
      { property: "og:title", content: "ALU MED AMINE — Menuiserie aluminium à Monastir" },
      { property: "og:description", content: "Fabrication et pose de menuiseries aluminium sur mesure : fenêtres, portes, vérandas, murs rideaux." },
      { property: "og:url", content: "https://alumedamine.vercel.app/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://alumedamine.vercel.app/" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "ALU MED AMINE",
        description: "Spécialiste aluminium : fenêtres, portes, vérandas, murs rideaux sur mesure.",
        address: { "@type": "PostalAddress", streetAddress: "Route El Borjin", addressLocality: "Ouerdanine", addressRegion: "Monastir", addressCountry: "TN" },
        telephone: "+216 24 587 206",
        areaServed: "Monastir, Tunisie",
        url: "https://alumedamine.vercel.app/",
      }),
    }],
  }),
});

function Index() {
  const defaultServices = [
    { id: "s1", image_url: porte, title: "Portes-fenêtres", description: "Portes-fenêtres aluminium sur mesure, lumineuses et isolantes." },
    { id: "s2", image_url: fenetre, title: "Fenêtres coulissantes", description: "Coulissantes en aluminium, gain de place et fluidité." },
    { id: "s3", image_url: veranda, title: "Murs-rideaux & Façades", description: "Façades vitrées pour bâtiments résidentiels et locaux commerciaux." },
  ];

  const [services, setServices] = useState<any[]>(defaultServices);
  const [about, setAbout] = useState({
    about_title: "Un savoir-faire au service de votre habitat",
    about_text:
      "Basés à Ouerdanine (Monastir), nous accompagnons particuliers et professionnels dans tous leurs projets de menuiserie aluminium : du simple remplacement d'une fenêtre à la conception complète d'une véranda ou d'une façade vitrée.",
    about_image_url: "",
    about_points: [
      "Profilés haut de gamme",
      "Découpe et assemblage en atelier",
      "Pose & finitions soignées",
      "SAV réactif & garantie",
    ],
  });

  useEffect(() => {
    supabase
      .from("site_services")
      .select("*")
      .eq("visible", true)
      .order("position", { ascending: true })
      .then(({ data }: any) => {
        if (data && data.length > 0) {
          setServices(data.slice(0, 6));
        }
      });

    supabase
      .from("site_settings")
      .select("*")
      .then(({ data }: any) => {
        if (data && data.length > 0) {
          const map: any = {};
          data.forEach((r: any) => {
            map[r.key] = r.value;
          });
          setAbout((prev) => ({
            ...prev,
            about_title: map.about_title || prev.about_title,
            about_text: map.about_text || prev.about_text,
            about_image_url: map.about_image_url || prev.about_image_url,
            about_points: map.about_points
              ? map.about_points.split("\n").filter(Boolean)
              : prev.about_points,
          }));
        }
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={hero} alt="Menuiserie aluminium" className="h-full w-full object-cover" width={1600} height={1100} />
          <div className="absolute inset-0 bg-gradient-hero opacity-85" />
        </div>
        <div className="container relative mx-auto grid min-h-[80vh] items-center px-4 py-24 text-primary-foreground">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3 w-3" /> Spécialiste aluminium à Monastir
            </div>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              L'aluminium sur mesure,<br />avec précision et élégance.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/80">
              {COMPANY.name} conçoit, fabrique et installe vos menuiseries en aluminium :
              fenêtres, portes, vérandas, façades. Devis gratuit sous 24h.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link to="/contact">Demander un devis <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
                <Link to="/realisations">Voir nos réalisations</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { icon: Ruler, title: "Sur mesure", text: "Chaque pièce est fabriquée selon vos dimensions et vos finitions." },
            { icon: Hammer, title: "Pose pro", text: "Installation soignée par notre équipe expérimentée." },
            { icon: ShieldCheck, title: "Garantie", text: "Profilés certifiés et garantie sur la pose." },
            { icon: CheckCircle2, title: "Devis 24h", text: "Réponse rapide et tarifs transparents." },
          ].map((f) => (
            <Card key={f.title} className="border-border/60 p-6 shadow-card">
              <f.icon className="h-7 w-7 text-accent" />
              <h2 className="mt-4 font-display text-lg font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* SERVICES: CE QUE NOUS FABRIQUONS */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-accent font-semibold">Nos services</div>
            <h2 className="mt-2 font-display text-4xl font-bold tracking-tight">Ce que nous fabriquons</h2>
          </div>
          <Button asChild variant="ghost"><Link to="/services">Tout voir <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {services.map((s) => (
            <Card key={s.id || s.title} className="group overflow-hidden border-border/60 p-0 shadow-card transition-all hover:shadow-elegant">
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={s.image_url || s.img}
                  alt={`${s.title} aluminium sur mesure`}
                  loading="lazy"
                  width={1024}
                  height={768}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h2 className="font-display text-lg font-semibold">{s.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-3">{s.description || s.text}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ABOUT / À PROPOS */}
      <section className="container mx-auto grid items-center gap-10 px-4 py-20 md:grid-cols-2">
        <div className="overflow-hidden rounded-xl shadow-elegant aspect-[4/3] bg-muted">
          <img
            src={about.about_image_url || atelier}
            alt="Notre atelier menuiserie aluminium"
            loading="lazy"
            width={1200}
            height={800}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-accent font-semibold">À propos</div>
          <h2 className="mt-2 font-display text-4xl font-bold tracking-tight">{about.about_title}</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed whitespace-pre-line">
            {about.about_text}
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            {about.about_points.map((x, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                <span>{x}</span>
              </li>
            ))}
          </ul>
          <Button asChild className="mt-8"><Link to="/contact">Parlons de votre projet</Link></Button>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-20">
        <div className="overflow-hidden rounded-2xl bg-gradient-steel p-10 text-center text-steel-foreground shadow-elegant md:p-16">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Prêt à transformer votre intérieur ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">Recevez un devis détaillé et gratuit sous 24h.</p>
          <Button asChild size="lg" className="mt-6 bg-white text-primary hover:bg-white/90">
            <Link to="/contact">Demander mon devis</Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
