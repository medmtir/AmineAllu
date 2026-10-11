import { Link } from "@tanstack/react-router";
import { COMPANY } from "@/lib/format";
import { MapPin, Phone, Facebook } from "lucide-react";
import { Logo } from "@/components/Logo";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t bg-muted/30">
      <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <Logo size={56} />
          <div className="mt-3 font-display text-lg font-bold">{COMPANY.name}</div>
          <p className="mt-2 text-sm text-muted-foreground">{COMPANY.tagline} — Fabrication & pose de menuiseries en aluminium sur mesure.</p>
        </div>
        <div>
          <div className="font-display text-sm font-semibold uppercase tracking-wider">Navigation</div>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Accueil</Link></li>
            <li><Link to="/services" className="hover:text-foreground">Services</Link></li>
            <li><Link to="/realisations" className="hover:text-foreground">Réalisations</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
            <li><Link to="/login" className="hover:text-foreground">Espace admin</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-display text-sm font-semibold uppercase tracking-wider">Contact</div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{COMPANY.address}</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" />{COMPANY.phone}</li>
            <li className="flex items-center gap-2"><Facebook className="h-4 w-4" />{COMPANY.facebook}</li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {COMPANY.name}. Tous droits réservés.
      </div>
    </footer>
  );
}
