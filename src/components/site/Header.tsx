import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { COMPANY } from "@/lib/format";
import { Logo } from "@/components/Logo";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const links = [
    { to: "/", label: "Accueil" },
    { to: "/services", label: "Services" },
    { to: "/realisations", label: "Réalisations" },
    { to: "/contact", label: "Contact" },
  ];
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3">
          <Logo size={44} />
          <div className="leading-tight hidden sm:block">
            <div className="font-display text-sm font-bold tracking-tight">{COMPANY.name}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{COMPANY.tagline}</div>
          </div>
        </Link>
        <nav className="hidden gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "text-foreground bg-muted" }} activeOptions={{ exact: l.to === "/" }}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:block">
          <Button asChild><Link to="/contact">Demander un devis</Link></Button>
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t bg-background md:hidden">
          <div className="container mx-auto flex flex-col gap-1 px-4 py-3">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                {l.label}
              </Link>
            ))}
            <Button asChild className="mt-2"><Link to="/contact" onClick={() => setOpen(false)}>Demander un devis</Link></Button>
          </div>
        </div>
      )}
    </header>
  );
}
