import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDT, formatDate } from "@/lib/format";

const statusColor: Record<string, string> = {
  brouillon: "bg-muted text-muted-foreground",
  envoye: "bg-blue-100 text-blue-700",
  accepte: "bg-green-100 text-green-700",
  refuse: "bg-red-100 text-red-700",
  impayee: "bg-red-100 text-red-700",
  partiellement_payee: "bg-amber-100 text-amber-700",
  payee: "bg-green-100 text-green-700",
};
const statusLabel: Record<string, string> = {
  brouillon: "Brouillon", envoye: "Envoyé", accepte: "Accepté", refuse: "Refusé",
  impayee: "Impayée", partiellement_payee: "Partielle", payee: "Payée",
};

export function DocumentList({ kind }: { kind: "devis" | "factures" }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const dateField = kind === "devis" ? "date_devis" : "date_facture";
  const editPath = kind === "devis" ? "/admin/devis/$id" : "/admin/factures/$id";

  const { data: rows = [] } = useQuery({
    queryKey: [kind],
    queryFn: async () => {
      const { data, error } = await supabase.from(kind).select(`*, clients(nom)`).order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const remove = async (id: string) => {
    if (!confirm("Supprimer définitivement ?")) return;
    const { error } = await supabase.from(kind).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Supprimé");
    qc.invalidateQueries({ queryKey: [kind] });
  };

  const filtered = rows.filter((r) => !q || r.numero.toLowerCase().includes(q.toLowerCase()) || r.clients?.nom?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight capitalize">{kind === "devis" ? "Devis" : "Factures"}</h1>
          <p className="text-sm text-muted-foreground">{rows.length} document(s)</p>
        </div>
        <Button asChild><Link to={editPath} params={{ id: "new" }}><Plus className="mr-1 h-4 w-4" />Nouveau</Link></Button>
      </div>

      <div className="mt-6">
        <Input placeholder="Rechercher par numéro ou client…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />
      </div>

      <Card className="mt-4 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader><TableRow>
            <TableHead>Numéro</TableHead><TableHead>Date</TableHead><TableHead>Client</TableHead>
            <TableHead>Statut</TableHead><TableHead className="text-right">Total TTC</TableHead>
            {kind === "factures" && <TableHead className="text-right">Restant</TableHead>}
            <TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 && <TableRow><TableCell colSpan={kind === "factures" ? 7 : 6} className="py-8 text-center text-sm text-muted-foreground">Aucun document</TableCell></TableRow>}
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.numero}</TableCell>
                <TableCell>{formatDate(r[dateField])}</TableCell>
                <TableCell>{r.clients?.nom || "—"}</TableCell>
                <TableCell><Badge className={statusColor[r.status] || ""} variant="secondary">{statusLabel[r.status] || r.status}</Badge></TableCell>
                <TableCell className="text-right font-medium">{formatDT(r.total_ttc)}</TableCell>
                {kind === "factures" && <TableCell className="text-right text-destructive">{formatDT(Number(r.total_ttc) - Number(r.montant_paye))}</TableCell>}
                <TableCell className="text-right">
                  <Button asChild size="icon" variant="ghost"><Link to={editPath} params={{ id: r.id }}><Pencil className="h-4 w-4" /></Link></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </Card>
    </div>
  );
}
