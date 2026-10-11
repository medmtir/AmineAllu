import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Facebook, Mail } from "lucide-react";
import { COMPANY } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact & devis gratuit — ALU MED AMINE" },
      { name: "description", content: "Demandez votre devis aluminium gratuit. Téléphone, adresse et formulaire de contact à Monastir." },
      { property: "og:title", content: "Contact — ALU MED AMINE" },
      { property: "og:description", content: "Devis aluminium gratuit sous 24h. Contactez ALU MED AMINE à Ouerdanine, Monastir." },
      { property: "og:url", content: "https://alumedamine.vercel.app/contact" },
    ],
    links: [{ rel: "canonical", href: "https://alumedamine.vercel.app/contact" }],
  }),
});

const schema = z.object({
  nom: z.string().trim().min(2, "Nom trop court").max(100),
  telephone: z.string().trim().min(6, "Numéro invalide").max(30),
  email: z.string().trim().email("Email invalide").max(255).optional().or(z.literal("")),
  sujet: z.string().trim().max(150).optional().or(z.literal("")),
  message: z.string().trim().min(5, "Décrivez votre besoin").max(2000),
});

function ContactPage() {
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      nom: String(fd.get("nom") || ""),
      telephone: String(fd.get("telephone") || ""),
      email: String(fd.get("email") || ""),
      sujet: String(fd.get("sujet") || ""),
      message: String(fd.get("message") || ""),
    };
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("demandes_devis").insert({
      nom: parsed.data.nom,
      telephone: parsed.data.telephone,
      email: parsed.data.email || null,
      sujet: parsed.data.sujet || null,
      message: parsed.data.message,
    });
    setLoading(false);
    if (error) { toast.error("Erreur lors de l'envoi. Réessayez."); return; }
    toast.success("Demande envoyée ! Nous vous recontactons sous 24h.");
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container mx-auto grid gap-10 px-4 py-16 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="text-xs uppercase tracking-widest text-accent">Contact</div>
          <h1 className="mt-2 font-display text-5xl font-bold tracking-tight">Demandez votre devis</h1>
          <p className="mt-4 text-muted-foreground">Décrivez votre projet, nous revenons vers vous rapidement.</p>

          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-muted"><MapPin className="h-5 w-5 text-accent" /></div>
              <div><div className="font-medium">Adresse</div><div className="text-sm text-muted-foreground">{COMPANY.address}</div></div>
            </div>
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-muted"><Phone className="h-5 w-5 text-accent" /></div>
              <div><div className="font-medium">Téléphone</div><a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="text-sm text-muted-foreground hover:text-foreground">{COMPANY.phone}</a></div>
            </div>
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-muted"><Facebook className="h-5 w-5 text-accent" /></div>
              <div><div className="font-medium">Facebook</div><div className="text-sm text-muted-foreground">{COMPANY.facebook}</div></div>
            </div>
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-muted"><Mail className="h-5 w-5 text-accent" /></div>
              <div><div className="font-medium">Email</div><div className="text-sm text-muted-foreground">{COMPANY.email}</div></div>
            </div>
          </div>
        </div>

        <Card className="p-6 shadow-elegant md:p-8">
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="nom">Nom complet *</Label>
                <Input id="nom" name="nom" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telephone">Téléphone *</Label>
                <Input id="telephone" name="telephone" type="tel" required />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sujet">Sujet</Label>
                <Input id="sujet" name="sujet" placeholder="Fenêtres, véranda…" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Décrivez votre projet *</Label>
              <Textarea id="message" name="message" rows={6} required placeholder="Dimensions, type d'ouverture, finition souhaitée…" />
            </div>
            <Button type="submit" size="lg" disabled={loading}>{loading ? "Envoi…" : "Envoyer ma demande"}</Button>
          </form>
        </Card>
      </section>
      <SiteFooter />
    </div>
  );
}
