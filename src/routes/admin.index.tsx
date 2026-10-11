import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, Receipt, AlertTriangle, Inbox, Plus } from "lucide-react";
import { formatDT, formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
  head: () => ({ meta: [
    { title: "Tableau de bord — Admin ALU MED AMINE" },
    { name: "description", content: "Vue d'ensemble : chiffre d'affaires, impayés, demandes." },
    { name: "robots", content: "noindex" },
  ]}),
});

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [clients, devis, factures, demandes, impayees] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("devis").select("id", { count: "exact", head: true }),
        supabase.from("factures").select("total_ttc, montant_paye"),
        supabase.from("demandes_devis").select("id", { count: "exact", head: true }).eq("status", "nouvelle"),
        supabase.from("factures").select("id, numero, total_ttc, montant_paye, date_facture, client_id").neq("status", "payee").order("date_facture", { ascending: false }).limit(5),
      ]);
      const totalCA = (factures.data || []).reduce((s, f) => s + Number(f.total_ttc || 0), 0);
      const totalPaye = (factures.data || []).reduce((s, f) => s + Number(f.montant_paye || 0), 0);
      return {
        clients: clients.count || 0,
        devis: devis.count || 0,
        factures: factures.data?.length || 0,
        demandes: demandes.count || 0,
        totalCA, totalPaye, restant: totalCA - totalPaye,
        impayees: impayees.data || [],
      };
    },
  });

  const cards = [
    { label: "Clients", value: stats?.clients ?? "…", icon: Users, to: "/admin/clients" },
    { label: "Devis", value: stats?.devis ?? "…", icon: FileText, to: "/admin/devis" },
    { label: "Factures", value: stats?.factures ?? "…", icon: Receipt, to: "/admin/factures" },
    { label: "Demandes", value: stats?.demandes ?? "…", icon: Inbox, to: "/admin/demandes" },
  ];

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">Vue d'ensemble de votre activité.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/admin/devis"><Plus className="mr-1 h-4 w-4" />Nouveau devis</Link></Button>
          <Button asChild><Link to="/admin/factures"><Plus className="mr-1 h-4 w-4" />Nouvelle facture</Link></Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to}>
            <Card className="p-5 transition-shadow hover:shadow-elegant">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
                <c.icon className="h-4 w-4 text-accent" />
              </div>
              <div className="mt-2 font-display text-3xl font-bold">{c.value}</div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Chiffre d'affaires</div>
          <div className="mt-2 font-display text-2xl font-bold">{formatDT(stats?.totalCA ?? 0)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Encaissé</div>
          <div className="mt-2 font-display text-2xl font-bold text-green-600">{formatDT(stats?.totalPaye ?? 0)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Restant dû</div>
          <div className="mt-2 font-display text-2xl font-bold text-destructive">{formatDT(stats?.restant ?? 0)}</div>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <h2 className="font-display text-lg font-semibold">Factures impayées</h2>
        </div>
        {!stats?.impayees.length ? (
          <p className="text-sm text-muted-foreground">Aucune facture impayée. 🎉</p>
        ) : (
          <div className="divide-y">
            {stats.impayees.map((f: any) => (
              <Link key={f.id} to="/admin/factures/$id" params={{ id: f.id }} className="flex items-center justify-between py-3 hover:bg-muted/50">
                <div>
                  <div className="font-medium">{f.numero}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(f.date_facture)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-destructive">{formatDT(Number(f.total_ttc) - Number(f.montant_paye))} restant</div>
                  <div className="text-xs text-muted-foreground">Total {formatDT(f.total_ttc)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
