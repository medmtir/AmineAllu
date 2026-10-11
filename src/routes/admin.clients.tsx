import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDT } from "@/lib/format";

export const Route = createFileRoute("/admin/clients")({
  component: ClientsPage,
  head: () => ({ meta: [
    { title: "Clients — Admin ALU MED AMINE" },
    { name: "description", content: "Gestion des clients : contacts, code TVA, historique." },
    { name: "robots", content: "noindex" },
  ]}),
});

interface Client { id: string; nom: string; telephone: string | null; email: string | null; adresse: string | null; notes: string | null; code_tva: string | null; }

function ClientsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [q, setQ] = useState("");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Client[];
    },
  });

  const { data: stats = {} } = useQuery({
    queryKey: ["clients-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("factures").select("client_id, total_ttc, montant_paye");
      const map: Record<string, { total: number; paye: number }> = {};
      (data || []).forEach((f: any) => {
        if (!f.client_id) return;
        if (!map[f.client_id]) map[f.client_id] = { total: 0, paye: 0 };
        map[f.client_id].total += Number(f.total_ttc || 0);
        map[f.client_id].paye += Number(f.montant_paye || 0);
      });
      return map;
    },
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      nom: String(fd.get("nom") || "").trim(),
      telephone: String(fd.get("telephone") || "").trim() || null,
      email: String(fd.get("email") || "").trim() || null,
      adresse: String(fd.get("adresse") || "").trim() || null,
      code_tva: String(fd.get("code_tva") || "").trim() || null,
      notes: String(fd.get("notes") || "").trim() || null,
    };
    if (!payload.nom) { toast.error("Nom requis"); return; }
    const res = editing
      ? await supabase.from("clients").update(payload).eq("id", editing.id)
      : await supabase.from("clients").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(editing ? "Client modifié" : "Client ajouté");
    setOpen(false); setEditing(null);
    qc.invalidateQueries({ queryKey: ["clients"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce client ?")) return;
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Supprimé");
    qc.invalidateQueries({ queryKey: ["clients"] });
  };

  const filtered = clients.filter((c) =>
    !q || c.nom.toLowerCase().includes(q.toLowerCase()) || c.telephone?.includes(q) || c.email?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">{clients.length} client(s) au total</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" />Nouveau client</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Modifier" : "Nouveau"} client</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-2"><Label>Nom *</Label><Input name="nom" defaultValue={editing?.nom} required /></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2"><Label>Téléphone</Label><Input name="telephone" defaultValue={editing?.telephone ?? ""} /></div>
                <div className="grid gap-2"><Label>Email</Label><Input name="email" type="email" defaultValue={editing?.email ?? ""} /></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2"><Label>Adresse</Label><Input name="adresse" defaultValue={editing?.adresse ?? ""} /></div>
                <div className="grid gap-2"><Label>Code TVA / Matricule fiscal</Label><Input name="code_tva" defaultValue={editing?.code_tva ?? ""} placeholder="ex: 1234567/A/B/000" /></div>
              </div>
              <div className="grid gap-2"><Label>Notes</Label><Textarea name="notes" defaultValue={editing?.notes ?? ""} /></div>
              <Button type="submit">{editing ? "Enregistrer" : "Ajouter"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6">
        <Input placeholder="Rechercher par nom, téléphone, email…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />
      </div>

      <Card className="mt-4 p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Nom</TableHead><TableHead>Téléphone</TableHead><TableHead>Email</TableHead><TableHead>Code TVA</TableHead>
            <TableHead className="text-right">Facturé</TableHead><TableHead className="text-right">Payé</TableHead>
            <TableHead className="text-right">Reste</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">Aucun client</TableCell></TableRow>}
            {filtered.map((c) => {
              const s = (stats as any)[c.id] || { total: 0, paye: 0 };
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nom}</TableCell>
                  <TableCell>{c.telephone}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell className="font-mono text-xs">{c.code_tva}</TableCell>
                  <TableCell className="text-right">{formatDT(s.total)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatDT(s.paye)}</TableCell>
                  <TableCell className="text-right text-destructive">{formatDT(s.total - s.paye)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
