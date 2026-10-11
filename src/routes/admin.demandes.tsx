import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { Mail, Phone, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/demandes")({
  component: DemandesPage,
  head: () => ({ meta: [
    { title: "Demandes de devis — Admin ALU MED AMINE" },
    { name: "description", content: "Suivi des demandes de devis reçues depuis le site." },
    { name: "robots", content: "noindex" },
  ]}),
});

function DemandesPage() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["demandes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("demandes_devis").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const setStatus = async (id: string, status: string) => {
    await supabase.from("demandes_devis").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["demandes"] });
  };
  const remove = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from("demandes_devis").delete().eq("id", id);
    toast.success("Supprimée");
    qc.invalidateQueries({ queryKey: ["demandes"] });
  };

  return (
    <div className="p-6 md:p-10">
      <h1 className="font-display text-3xl font-bold tracking-tight">Demandes de devis</h1>
      <p className="text-sm text-muted-foreground">Messages reçus depuis le site web</p>

      <div className="mt-6 grid gap-4">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">Aucune demande pour le moment.</p>}
        {rows.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-semibold">{r.nom}</h3>
                  <Badge variant={r.status === "nouvelle" ? "default" : "secondary"}>{r.status}</Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{formatDate(r.created_at)}</div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  <a href={`tel:${r.telephone}`} className="flex items-center gap-1 hover:text-foreground"><Phone className="h-3 w-3" />{r.telephone}</a>
                  {r.email && <a href={`mailto:${r.email}`} className="flex items-center gap-1 hover:text-foreground"><Mail className="h-3 w-3" />{r.email}</a>}
                </div>
                {r.sujet && <div className="mt-2 text-sm font-medium">{r.sujet}</div>}
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{r.message}</p>
              </div>
              <div className="flex gap-1">
                {r.status === "nouvelle" && (
                  <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "traitee")}>
                    <Check className="mr-1 h-4 w-4" />Marquer traitée
                  </Button>
                )}
                <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
