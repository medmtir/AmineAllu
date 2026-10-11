import { useEffect, useState } from "react";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
const supabase = supabaseTyped as any;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Printer, Save, ArrowLeft, Eye, Edit3, Truck, FileText, CheckCircle2, Download, Loader2 } from "lucide-react";
import { formatDT, formatDate, COMPANY } from "@/lib/format";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Link, useNavigate } from "@tanstack/react-router";

export interface DocItem {
  id?: string;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
  position: number;
}

interface Props {
  kind: "devis" | "facture";
  id: string; // "new" or uuid
}

export function DocumentEditor({ kind, id }: Props) {
  const isNew = id === "new";
  const navigate = useNavigate();
  const table = kind === "devis" ? "devis" : "factures";
  const itemsTable = kind === "devis" ? "devis_items" : "facture_items";
  const dateField = kind === "devis" ? "date_devis" : "date_facture";

  const [clients, setClients] = useState<any[]>([]);
  const [doc, setDoc] = useState<any>({
    numero: "",
    client_id: null,
    [dateField]: new Date().toISOString().slice(0, 10),
    status: kind === "devis" ? "brouillon" : "impayee",
    tva_pct: 19,
    total_ht: 0,
    total_ttc: 0,
    notes: "",
    ...(kind === "facture" ? { date_echeance: "", montant_paye: 0 } : {}),
  });
  const [items, setItems] = useState<DocItem[]>([
    { designation: "", quantite: 1, prix_unitaire: 0, total: 0, position: 0 },
  ]);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  // Mobile / Print controls
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">(isNew ? "edit" : "preview");
  const [docFormat, setDocFormat] = useState<"standard" | "bon_livraison">("standard");
  const [blShowPrices, setBlShowPrices] = useState(false);

  useEffect(() => {
    supabase
      .from("clients")
      .select("id, nom, adresse, telephone, code_tva")
      .order("nom")
      .then(({ data }: any) => setClients(data || []));

    if (isNew) {
      const prefix = kind === "devis" ? "DEV" : "FAC";
      const y = new Date().getFullYear();
      supabase
        .from(table)
        .select("numero")
        .like("numero", `${prefix}-${y}-%`)
        .order("created_at", { ascending: false })
        .limit(1)
        .then(({ data }: any) => {
          const last = data?.[0]?.numero;
          const n = last ? parseInt(last.split("-").pop() || "0") + 1 : 1;
          setDoc((d: any) => ({ ...d, numero: `${prefix}-${y}-${String(n).padStart(4, "0")}` }));
        });
    } else {
      Promise.all([
        supabase.from(table).select("*").eq("id", id).single(),
        supabase.from(itemsTable).select("*").eq(`${kind}_id`, id).order("position"),
        kind === "facture"
          ? supabase.from("paiements").select("*").eq("facture_id", id).order("date_paiement", { ascending: false })
          : Promise.resolve({ data: [] }),
      ]).then(([d, i, p]: any) => {
        if (d.data) setDoc(d.data);
        if (i.data?.length) setItems(i.data as any);
        if (p.data) setPaiements(p.data);
        setLoading(false);
      });
    }
  }, [id, isNew, kind, table, itemsTable]);

  const total_ht = items.reduce((s, it) => s + Number(it.quantite || 0) * Number(it.prix_unitaire || 0), 0);
  const total_ttc = total_ht * (1 + Number(doc.tva_pct || 0) / 100);

  const updateItem = (i: number, patch: Partial<DocItem>) => {
    setItems((arr) =>
      arr.map((it, idx) => {
        if (idx !== i) return it;
        const next = { ...it, ...patch };
        next.total = Number(next.quantite || 0) * Number(next.prix_unitaire || 0);
        return next;
      })
    );
  };

  const addItem = () => {
    setItems((arr) => [
      ...arr,
      { designation: "", quantite: 1, prix_unitaire: 0, total: 0, position: arr.length },
    ]);
  };

  const removeItem = (i: number) => {
    setItems((arr) => (arr.length > 1 ? arr.filter((_, idx) => idx !== i) : arr));
  };

  const save = async () => {
    if (!doc.numero) return toast.error("Numéro requis");
    if (items.some((it) => !it.designation.trim())) {
      return toast.error("Toutes les lignes doivent avoir une désignation");
    }

    setSaving(true);
    try {
      const payload = {
        numero: doc.numero,
        client_id: doc.client_id || null,
        [dateField]: doc[dateField],
        status: doc.status,
        tva_pct: Number(doc.tva_pct || 0),
        total_ht,
        total_ttc,
        notes: doc.notes || null,
        ...(kind === "facture" ? { date_echeance: doc.date_echeance || null, devis_id: doc.devis_id || null } : {}),
      };

      let docId = id;
      if (isNew) {
        const { data, error } = await supabase.from(table).insert(payload).select("id").single();
        if (error) throw error;
        docId = data!.id;
      } else {
        const { error } = await supabase.from(table).update(payload).eq("id", id);
        if (error) throw error;
        await supabase.from(itemsTable).delete().eq(`${kind}_id`, id);
      }

      const itemsPayload = items.map((it, idx) => ({
        [`${kind}_id`]: docId,
        designation: it.designation,
        quantite: Number(it.quantite || 0),
        prix_unitaire: Number(it.prix_unitaire || 0),
        total: Number(it.quantite || 0) * Number(it.prix_unitaire || 0),
        position: idx,
      }));

      if (itemsPayload.length) {
        const { error } = await supabase.from(itemsTable).insert(itemsPayload);
        if (error) throw error;
      }

      toast.success("Document enregistré avec succès");
      if (isNew) {
        navigate({ to: kind === "devis" ? "/admin/devis/$id" : "/admin/factures/$id", params: { id: docId! } });
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const printDocument = (format: "standard" | "bon_livraison") => {
    setDocFormat(format);
    setMobileTab("preview");
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const downloadPdf = async (format: "standard" | "bon_livraison") => {
    setDocFormat(format);
    setMobileTab("preview");
    setDownloadingPdf(true);
    toast.info("Génération du document PDF en cours…");

    try {
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const element = document.getElementById("printable-a4-doc");
      if (!element) throw new Error("Document introuvable");

      const prefix = format === "bon_livraison" ? "Bon_de_Livraison" : kind === "devis" ? "Devis" : "Facture";
      const cleanNum = (doc.numero || "document").replace(/[^a-zA-Z0-9-_]/g, "_");
      const filename = `${prefix}_${cleanNum}.pdf`;

      const opt = {
        margin: [6, 8, 6, 8],
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(opt).from(element).save();
      toast.success("PDF téléchargé avec succès !");
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur lors de la génération du PDF. Utilisez le bouton 'Imprimer'");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const addPaiement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const montant = Number(fd.get("montant"));
    if (!montant || montant <= 0) return toast.error("Montant invalide");
    const { error } = await supabase.from("paiements").insert({
      facture_id: id,
      montant,
      date_paiement: String(fd.get("date_paiement") || new Date().toISOString().slice(0, 10)),
      methode: String(fd.get("methode") || "") || null,
      notes: String(fd.get("notes") || "") || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Paiement ajouté");
    (e.target as HTMLFormElement).reset();
    const [p, d] = await Promise.all([
      supabase.from("paiements").select("*").eq("facture_id", id).order("date_paiement", { ascending: false }),
      supabase.from("factures").select("*").eq("id", id).single(),
    ]);
    setPaiements(p.data || []);
    if (d.data) setDoc(d.data);
  };

  const deletePaiement = async (pid: string) => {
    if (!confirm("Supprimer ce paiement ?")) return;
    await supabase.from("paiements").delete().eq("id", pid);
    const [p, d] = await Promise.all([
      supabase.from("paiements").select("*").eq("facture_id", id).order("date_paiement", { ascending: false }),
      supabase.from("factures").select("*").eq("id", id).single(),
    ]);
    setPaiements(p.data || []);
    if (d.data) setDoc(d.data);
  };

  if (loading) return <div className="p-10 text-sm text-muted-foreground">Chargement…</div>;

  const client = clients.find((c) => c.id === doc.client_id);
  const reste = Number(doc.total_ttc || total_ttc) - Number(doc.montant_paye || 0);

  // Formatted BL Number
  const blNumero = `BL-${doc.numero?.replace(/^(DEV|FAC)-/, "") || doc.numero}`;

  return (
    <div className="p-4 sm:p-6 md:p-10">
      {/* ACTION BAR (Screen only) */}
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to={kind === "devis" ? "/admin/devis" : "/admin/factures"}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Retour
            </Link>
          </Button>
          <span className="text-sm font-semibold text-muted-foreground sm:inline hidden">|</span>
          <span className="font-display font-bold text-lg">
            {isNew ? `Nouveau ${kind === "devis" ? "Devis" : "Facture"}` : doc.numero}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mobile Tab Toggle */}
          <div className="flex rounded-lg border bg-muted p-1 md:hidden">
            <button
              type="button"
              onClick={() => setMobileTab("edit")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                mobileTab === "edit" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              Saisie
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("preview")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                mobileTab === "preview" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Aperçu
            </button>
          </div>

          {/* Action Buttons: Télécharger PDF & Imprimer */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="default"
              size="sm"
              disabled={downloadingPdf}
              onClick={() => downloadPdf(docFormat)}
              title="Télécharger directement le fichier PDF (idéal sur téléphone)"
              className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {downloadingPdf ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-1.5 h-4 w-4" />
              )}
              <span>Télécharger PDF</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => printDocument(docFormat)}
              title="Imprimer le document"
              className="h-9 px-3"
            >
              <Printer className="mr-1.5 h-4 w-4 text-primary" />
              <span>Imprimer</span>
            </Button>
          </div>

          <Button onClick={save} disabled={saving} size="sm" className="h-9 px-4">
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>

      {/* FORMAT SELECTOR & OPTIONS (Screen Only) */}
      <div className="no-print mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card/60 p-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-foreground">Affichage document :</span>
          <div className="inline-flex rounded-md border p-0.5">
            <button
              type="button"
              onClick={() => setDocFormat("standard")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                docFormat === "standard" ? "bg-primary text-primary-foreground" : "hover:text-foreground"
              }`}
            >
              {kind === "devis" ? "Devis" : "Facture"}
            </button>
            <button
              type="button"
              onClick={() => setDocFormat("bon_livraison")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                docFormat === "bon_livraison" ? "bg-amber-600 text-white" : "hover:text-foreground"
              }`}
            >
              Bon de Livraison
            </button>
          </div>
        </div>

        {docFormat === "bon_livraison" && (
          <div className="flex items-center gap-2">
            <Switch id="bl-prices" checked={blShowPrices} onCheckedChange={setBlShowPrices} />
            <Label htmlFor="bl-prices" className="cursor-pointer text-xs">
              Afficher les montants sur le bon de livraison
            </Label>
          </div>
        )}
      </div>

      {/* MOBILE TOUCH-FRIENDLY EDIT FORM (Visible only on mobile when mobileTab === 'edit') */}
      <div className={`no-print mt-4 space-y-4 md:hidden ${mobileTab === "edit" ? "block" : "hidden"}`}>
        {/* Info Card */}
        <Card className="p-4 space-y-3">
          <div className="font-display text-sm font-semibold">Informations du document</div>

          <div className="space-y-1">
            <Label className="text-xs">Client *</Label>
            <Select value={doc.client_id ?? ""} onValueChange={(v) => setDoc({ ...doc, client_id: v })}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Sélectionner un client…" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom} {c.telephone ? `(${c.telephone})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Numéro</Label>
              <Input
                value={doc.numero}
                onChange={(e) => setDoc({ ...doc, numero: e.target.value })}
                className="h-10 font-mono text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={doc[dateField] || ""}
                onChange={(e) => setDoc({ ...doc, [dateField]: e.target.value })}
                className="h-10 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Statut</Label>
              <Select value={doc.status} onValueChange={(v) => setDoc({ ...doc, status: v })}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {kind === "devis" ? (
                    <>
                      <SelectItem value="brouillon">Brouillon</SelectItem>
                      <SelectItem value="envoye">Envoyé</SelectItem>
                      <SelectItem value="accepte">Accepté</SelectItem>
                      <SelectItem value="refuse">Refusé</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="impayee">Impayée</SelectItem>
                      <SelectItem value="partiellement_payee">Partiellement payée</SelectItem>
                      <SelectItem value="payee">Payée</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">TVA (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={doc.tva_pct}
                onChange={(e) => setDoc({ ...doc, tva_pct: e.target.value })}
                className="h-10 text-xs"
              />
            </div>
          </div>

          {kind === "facture" && (
            <div className="space-y-1">
              <Label className="text-xs">Date d'échéance</Label>
              <Input
                type="date"
                value={doc.date_echeance || ""}
                onChange={(e) => setDoc({ ...doc, date_echeance: e.target.value })}
                className="h-10 text-xs"
              />
            </div>
          )}
        </Card>

        {/* Mobile Items List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-display text-sm font-semibold">Articles & Prestations ({items.length})</div>
            <Button size="sm" variant="outline" onClick={addItem} className="h-8 text-xs">
              <Plus className="mr-1 h-3.5 w-3.5" />
              Ajouter
            </Button>
          </div>

          {items.map((it, i) => (
            <Card key={i} className="p-3.5 space-y-3 border-l-4 border-l-primary/60">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-muted-foreground">Ligne #{i + 1}</span>
                {items.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeItem(i)}
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Désignation / Description</Label>
                <Textarea
                  rows={2}
                  value={it.designation}
                  onChange={(e) => updateItem(i, { designation: e.target.value })}
                  placeholder="Ex: Fenêtre coulissante 2 vantaux 120x100 cm..."
                  className="text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Quantité</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={it.quantite}
                    onChange={(e) => updateItem(i, { quantite: Number(e.target.value) })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Prix unitaire (HT)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={it.prix_unitaire}
                    onChange={(e) => updateItem(i, { prix_unitaire: Number(e.target.value) })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center border-t pt-2 text-xs">
                <span className="text-muted-foreground">Total ligne HT :</span>
                <span className="font-bold text-foreground">{formatDT(it.quantite * it.prix_unitaire)}</span>
              </div>
            </Card>
          ))}

          <Button size="sm" variant="outline" onClick={addItem} className="w-full h-10 border-dashed">
            <Plus className="mr-1.5 h-4 w-4" />
            Ajouter une ligne d'article
          </Button>
        </div>

        {/* Mobile Summary Card */}
        <Card className="p-4 space-y-2 bg-card">
          <div className="font-display text-sm font-semibold mb-2">Récapitulatif Financier</div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Total HT</span>
            <span className="font-medium">{formatDT(total_ht)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">TVA ({doc.tva_pct}%)</span>
            <span className="font-medium">{formatDT((total_ht * Number(doc.tva_pct || 0)) / 100)}</span>
          </div>
          <div className="flex justify-between text-base font-bold border-t pt-2">
            <span>Total TTC</span>
            <span className="text-primary">{formatDT(total_ttc)}</span>
          </div>
          {kind === "facture" && (
            <>
              <div className="flex justify-between text-xs pt-1 text-green-600">
                <span>Déjà payé</span>
                <span className="font-medium">{formatDT(doc.montant_paye || 0)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-destructive">
                <span>Reste à payer</span>
                <span>{formatDT(reste)}</span>
              </div>
            </>
          )}

          <div className="pt-2">
            <Label className="text-xs">Notes / Conditions</Label>
            <Textarea
              className="mt-1 text-xs"
              rows={2}
              value={doc.notes || ""}
              onChange={(e) => setDoc({ ...doc, notes: e.target.value })}
              placeholder="Conditions de paiement, délai de livraison, etc."
            />
          </div>
        </Card>

        {/* Big Mobile Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button onClick={save} disabled={saving} className="flex-1 h-11 font-semibold">
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setMobileTab("preview")}
            className="flex-1 h-11 font-semibold"
          >
            <Eye className="mr-1.5 h-4 w-4" />
            Voir l'Aperçu
          </Button>
        </div>
      </div>

      {/* PRINTABLE A4 DOCUMENT (Visible on Desktop, or on Mobile when mobileTab === 'preview', ALWAYS in print) */}
      <div
        id="printable-a4-doc"
        className={`a4-page mt-6 mx-auto rounded-xl border bg-card shadow-card print:border-0 print:shadow-none print:rounded-none print:m-0 print:p-0 ${
          mobileTab === "preview" ? "block" : "hidden md:block"
        }`}
      >
        {/* Document Header */}
        <div className="flex items-start justify-between border-b-2 border-primary/30 pb-4 sm:pb-6 gap-3">
          <div className="flex items-start gap-3 sm:gap-4">
            <Logo size={70} />
            <div>
              <div className="font-display text-xl sm:text-2xl font-bold text-primary">{COMPANY.name}</div>
              <div className="text-xs text-muted-foreground">{COMPANY.tagline}</div>
              <div className="mt-1.5 text-xs text-muted-foreground">{COMPANY.address}</div>
              <div className="text-xs font-semibold text-foreground">Tél : {COMPANY.phone}</div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-primary">
              {docFormat === "bon_livraison" ? "Bon de Livraison" : kind === "devis" ? "Devis" : "Facture"}
            </div>
            <div className="mt-1 text-sm font-bold font-mono">
              N° {docFormat === "bon_livraison" ? blNumero : doc.numero}
            </div>
            <div className="text-xs text-muted-foreground">
              Date : {formatDate(doc[dateField])}
            </div>
            {docFormat === "standard" && kind === "facture" && doc.date_echeance && (
              <div className="text-xs text-muted-foreground">
                Échéance : {formatDate(doc.date_echeance)}
              </div>
            )}
          </div>
        </div>

        {/* Client Box & Desktop Controls */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border sm:border-0 p-3 sm:p-0 bg-muted/20 sm:bg-transparent">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Client</div>
            <div className="mt-1 text-base font-bold text-foreground">{client?.nom || "—"}</div>
            {client?.adresse && <div className="text-xs text-muted-foreground mt-0.5">{client.adresse}</div>}
            {client?.telephone && <div className="text-xs font-medium text-foreground mt-0.5">Tél : {client.telephone}</div>}
            {client?.code_tva && (
              <div className="text-xs text-muted-foreground mt-0.5">
                Code TVA : <span className="font-mono font-medium">{client.code_tva}</span>
              </div>
            )}
          </div>

          <div className="no-print hidden sm:block">
            <Label className="text-xs">Sélectionner client</Label>
            <Select value={doc.client_id ?? ""} onValueChange={(v) => setDoc({ ...doc, client_id: v })}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Choisir un client…" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Desktop inline editable settings */}
        <div className="no-print mt-4 hidden md:grid gap-3 md:grid-cols-4">
          <div className="grid gap-1">
            <Label className="text-xs">Numéro</Label>
            <Input
              value={doc.numero}
              onChange={(e) => setDoc({ ...doc, numero: e.target.value })}
              className="h-8 font-mono text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">Date</Label>
            <Input
              type="date"
              value={doc[dateField] || ""}
              onChange={(e) => setDoc({ ...doc, [dateField]: e.target.value })}
              className="h-8 text-xs"
            />
          </div>
          {kind === "facture" && (
            <div className="grid gap-1">
              <Label className="text-xs">Échéance</Label>
              <Input
                type="date"
                value={doc.date_echeance || ""}
                onChange={(e) => setDoc({ ...doc, date_echeance: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          )}
          <div className="grid gap-1">
            <Label className="text-xs">Statut</Label>
            <Select value={doc.status} onValueChange={(v) => setDoc({ ...doc, status: v })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {kind === "devis" ? (
                  <>
                    <SelectItem value="brouillon">Brouillon</SelectItem>
                    <SelectItem value="envoye">Envoyé</SelectItem>
                    <SelectItem value="accepte">Accepté</SelectItem>
                    <SelectItem value="refuse">Refusé</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="impayee">Impayée</SelectItem>
                    <SelectItem value="partiellement_payee">Partiellement payée</SelectItem>
                    <SelectItem value="payee">Payée</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">TVA %</Label>
            <Input
              type="number"
              step="0.01"
              value={doc.tva_pct}
              onChange={(e) => setDoc({ ...doc, tva_pct: e.target.value })}
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* LINE ITEMS TABLE */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-primary/20 text-left text-xs font-semibold uppercase text-muted-foreground">
                <th className="py-2.5 px-1">Désignation</th>
                <th className="py-2.5 px-2 text-right w-20 sm:w-24">Qté</th>
                {(docFormat !== "bon_livraison" || blShowPrices) && (
                  <>
                    <th className="py-2.5 px-2 text-right w-24 sm:w-28">P.U HT</th>
                    <th className="py-2.5 px-2 text-right w-28 sm:w-32">Total HT</th>
                  </>
                )}
                <th className="no-print w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {items.map((it, i) => (
                <tr key={i} className="align-top">
                  {/* Designation */}
                  <td className="py-2.5 px-1 pr-2">
                    {/* Screen edit: Textarea */}
                    <div className="print:hidden">
                      <Textarea
                        rows={1}
                        value={it.designation}
                        onChange={(e) => updateItem(i, { designation: e.target.value })}
                        placeholder="Description..."
                        className="min-h-8 resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-1 focus-visible:ring-primary text-sm"
                      />
                    </div>
                    {/* Print display: Pure static text (avoids mobile print input bugs) */}
                    <div className="hidden print:block whitespace-pre-wrap font-sans text-sm font-medium py-1">
                      {it.designation}
                    </div>
                  </td>

                  {/* Quantity */}
                  <td className="py-2.5 px-2 text-right">
                    <div className="print:hidden">
                      <Input
                        type="number"
                        step="0.001"
                        value={it.quantite}
                        onChange={(e) => updateItem(i, { quantite: Number(e.target.value) })}
                        className="h-8 border-0 bg-transparent text-right p-1 shadow-none focus-visible:ring-1 text-sm font-medium"
                      />
                    </div>
                    <div className="hidden print:block text-sm font-medium py-1">
                      {it.quantite}
                    </div>
                  </td>

                  {/* Prices (if standard or blShowPrices) */}
                  {(docFormat !== "bon_livraison" || blShowPrices) && (
                    <>
                      <td className="py-2.5 px-2 text-right">
                        <div className="print:hidden">
                          <Input
                            type="number"
                            step="0.001"
                            value={it.prix_unitaire}
                            onChange={(e) => updateItem(i, { prix_unitaire: Number(e.target.value) })}
                            className="h-8 border-0 bg-transparent text-right p-1 shadow-none focus-visible:ring-1 text-sm font-medium"
                          />
                        </div>
                        <div className="hidden print:block text-sm font-medium py-1">
                          {formatDT(it.prix_unitaire)}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-right font-semibold text-foreground py-1">
                        {formatDT(it.quantite * it.prix_unitaire)}
                      </td>
                    </>
                  )}

                  {/* Delete button */}
                  <td className="no-print py-2 text-center">
                    {items.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(i)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add item button on desktop */}
        <div className="no-print mt-3 hidden md:block">
          <Button size="sm" variant="outline" onClick={addItem} className="h-8 text-xs">
            <Plus className="mr-1 h-3.5 w-3.5" />
            Ajouter une ligne
          </Button>
        </div>

        {/* FINANCIAL SUMMARY (Only for Standard or if BL with prices) */}
        {(docFormat !== "bon_livraison" || blShowPrices) && (
          <div className="mt-6 ml-auto w-64 sm:w-72 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total HT</span>
              <span className="font-medium">{formatDT(total_ht)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">TVA {doc.tva_pct}%</span>
              <span className="font-medium">{formatDT((total_ht * Number(doc.tva_pct || 0)) / 100)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-display text-base sm:text-lg font-bold text-foreground">
              <span>Total TTC</span>
              <span className="text-primary">{formatDT(total_ttc)}</span>
            </div>
            {kind === "facture" && (
              <>
                <div className="flex justify-between pt-1.5 text-xs text-green-700">
                  <span>Montant Payé</span>
                  <span className="font-semibold">{formatDT(doc.montant_paye || 0)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-destructive">
                  <span>Reste Dû</span>
                  <span>{formatDT(reste)}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="mt-6 border-t pt-3">
          <Label className="no-print text-xs font-semibold text-muted-foreground">Notes & Conditions</Label>
          <Textarea
            className="no-print mt-1 text-xs"
            rows={2}
            value={doc.notes || ""}
            onChange={(e) => setDoc({ ...doc, notes: e.target.value })}
            placeholder="Notes..."
          />
          {doc.notes && (
            <div className="hidden print:block whitespace-pre-wrap text-xs text-muted-foreground italic">
              <strong className="not-italic text-foreground">Notes : </strong>
              {doc.notes}
            </div>
          )}
        </div>

        {/* SIGNATURES SECTION */}
        {docFormat === "bon_livraison" ? (
          <div className="mt-8 border-t-2 border-dashed border-border pt-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="border rounded-md p-3 h-28 flex flex-col justify-between">
                <span className="font-semibold">Cachet & Signature de l'Entreprise :</span>
                <span className="text-[10px] text-muted-foreground">ALU MED AMINE</span>
              </div>
              <div className="border rounded-md p-3 h-28 flex flex-col justify-between">
                <span className="font-semibold">Bon pour réception (Client) :</span>
                <span className="text-[10px] text-muted-foreground">Nom, Date & Signature</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 border-t pt-4 flex justify-between items-end text-xs">
            <div className="text-[11px] text-muted-foreground">
              {COMPANY.name} — Spécialiste Aluminium sur mesure
            </div>
            <div className="text-right border-t border-muted-foreground/30 pt-1 w-44">
              <span className="font-semibold">Signature & Cachet</span>
            </div>
          </div>
        )}

        {/* Document Footer */}
        <div className="mt-8 border-t pt-3 text-center text-[10px] sm:text-xs text-muted-foreground">
          Merci de votre confiance — {COMPANY.name} — {COMPANY.address} — Tél : {COMPANY.phone}
        </div>
      </div>

      {/* PAIEMENTS SECTION — only for existing invoices */}
      {kind === "facture" && !isNew && (
        <Card className="no-print mx-auto mt-6 max-w-4xl p-4 sm:p-6">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Historique des Paiements
          </h2>

          <form onSubmit={addPaiement} className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            <div className="grid gap-1">
              <Label className="text-xs">Montant (DT) *</Label>
              <Input name="montant" type="number" step="0.001" placeholder="Ex: 500" required className="h-9 text-xs" />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Date</Label>
              <Input
                name="date_paiement"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="h-9 text-xs"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Mode</Label>
              <Input name="methode" placeholder="Espèces, chèque, virement..." className="h-9 text-xs" />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Notes</Label>
              <Input name="notes" placeholder="Réf chèque, etc." className="h-9 text-xs" />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full h-9 text-xs">
                <Plus className="mr-1 h-3.5 w-3.5" />
                Ajouter
              </Button>
            </div>
          </form>

          <div className="mt-4 divide-y">
            {paiements.length === 0 && (
              <p className="py-3 text-sm text-muted-foreground">Aucun paiement enregistré pour le moment.</p>
            )}
            {paiements.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="font-bold text-sm">
                    {formatDT(p.montant)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">— {formatDate(p.date_paiement)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.methode || "Non spécifié"}
                    {p.notes ? ` • ${p.notes}` : ""}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deletePaiement(p.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
