import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import fenetre from "@/assets/fenetre.jpg";
import porte from "@/assets/porte.jpg";
import veranda from "@/assets/veranda.jpg";

export const Route = createFileRoute("/services")({
  component: ServicesPage,
  head: () => ({
    meta: [
      { title: "Nos services aluminium — ALU MED AMINE" },
      { name: "description", content: "Fenêtres, portes, vérandas, façades vitrées, garde-corps : découvrez tous nos services en aluminium sur mesure." },
      { property: "og:title", content: "Services aluminium sur mesure — ALU MED AMINE" },
      { property: "og:description", content: "Fenêtres, portes-fenêtres, coulissantes, murs rideaux, moustiquaires : fabrication et pose à Monastir." },
      { property: "og:url", content: "https://alumedamine.vercel.app/services" },
    ],
    links: [{ rel: "canonical", href: "https://alumedamine.vercel.app/services" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Service",
        serviceType: "Menuiserie aluminium sur mesure",
        provider: { "@type": "LocalBusiness", name: "ALU MED AMINE" },
        areaServed: "Monastir, Tunisie",
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Services aluminium",
          itemListElement: [
            "Porte-fenêtre", "Fenêtre coulissante", "Fenêtre", "Mur rideaux", "Moustiquaire",
          ].map((n) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: n } })),
        },
      }),
    }],
  }),
});

const services = [
  { img: porte, alt: "Porte-fenêtre aluminium sur mesure", title: "Porte-fenêtre", text: "Portes-fenêtres aluminium sur mesure, lumineuses et isolantes." },
  { img: fenetre, alt: "Fenêtre coulissante aluminium", title: "Fenêtre coulissante", text: "Fenêtres coulissantes aluminium, gain de place et grande luminosité." },
  { img: fenetre, alt: "Fenêtre aluminium double vitrage", title: "Fenêtre", text: "Fenêtres aluminium à frappe ou oscillo-battantes, double vitrage." },
  { img: veranda, alt: "Mur rideaux aluminium pour façade", title: "Mur rideaux", text: "Façades vitrées et murs-rideaux pour bâtiments et commerces." },
  { img: fenetre, alt: "Moustiquaire aluminium sur mesure", title: "Moustiquaire", text: "Moustiquaires aluminium enroulables ou plissées, sur mesure." },
];

function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container mx-auto px-4 py-16">
        <div className="text-xs uppercase tracking-widest text-accent">Services</div>
        <h1 className="mt-2 max-w-3xl font-display text-5xl font-bold tracking-tight">Nos services en aluminium</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">De la conception à la pose, nous gérons l'intégralité de votre projet.</p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Card key={i} className="overflow-hidden p-0 shadow-card">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={s.img} alt={s.alt} loading="lazy" width={1024} height={768} className="h-full w-full object-cover" />
              </div>
              <div className="p-6">
                <h2 className="font-display text-lg font-semibold">{s.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-16 rounded-xl bg-muted p-10 text-center">
          <h2 className="font-display text-2xl font-bold">Un projet en tête ?</h2>
          <p className="mt-2 text-muted-foreground">Contactez-nous pour un devis personnalisé et gratuit.</p>
          <Button asChild className="mt-6"><Link to="/contact">Demander un devis</Link></Button>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
