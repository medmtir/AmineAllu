import { Link, useNavigate, Outlet, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, Users, FileText, Receipt, Inbox, LogOut, Home, Image, Menu } from "lucide-react";
import { COMPANY } from "@/lib/format";
import { Logo } from "@/components/Logo";

export function AdminShell() {
  const { session, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!session || !isAdmin)) navigate({ to: "/login" });
  }, [loading, session, isAdmin, navigate]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (loading || !session || !isAdmin) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Chargement…</div>;
  }

  const nav = [
    { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
    { to: "/admin/clients", label: "Clients", icon: Users },
    { to: "/admin/devis", label: "Devis", icon: FileText },
    { to: "/admin/factures", label: "Factures", icon: Receipt },
    { to: "/admin/realisations", label: "Réalisations", icon: Image },
    { to: "/admin/demandes", label: "Demandes", icon: Inbox },
  ];

  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      {/* Mobile Top Navbar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-card px-4 no-print md:hidden">
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <div className="leading-tight">
            <div className="font-display text-sm font-bold">{COMPANY.name}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Admin</div>
          </div>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Menu navigation">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col p-4">
            <SheetHeader className="text-left">
              <SheetTitle className="flex items-center gap-2 font-display text-base">
                <Logo size={28} />
                <span>{COMPANY.name}</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  activeProps={{ className: "bg-primary text-primary-foreground font-semibold" }}
                  activeOptions={{ exact: !!n.exact }}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto space-y-2 border-t pt-4">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Home className="h-4 w-4" />
                Voir le site
              </Link>
              <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive" onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden border-r bg-card no-print md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <Logo size={36} />
          <div className="leading-tight">
            <div className="font-display text-sm font-bold">{COMPANY.name}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Admin</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeProps={{ className: "bg-muted text-foreground font-semibold" }}
              activeOptions={{ exact: !!n.exact }}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-1 p-3 border-t">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            Voir le site
          </Link>
          <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      <main className="bg-background min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
