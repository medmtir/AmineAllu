import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
const supabase = supabaseTyped as any;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Trash2, Upload, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/realisations")({
  component: RealisationsAdmin,
  head: () => ({ meta: [
    { title: "Réalisations — Admin ALU MED AMINE" },
    { name: "description", content: "Gestion de la galerie des réalisations aluminium." },
    { name: "robots", content: "noindex" },
  ]}),
});

function RealisationsAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ titre: "", description: "", categorie: "", image_url: "" });

  const load = async () => {
    const { data } = await supabase.from("realisations").select("*").order("position").order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const uploadImage = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("realisations").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("realisations").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: data.publicUrl }));
    setUploading(false);
    toast.success("Image téléversée");
  };

  const add = async () => {
    if (!form.titre || !form.image_url) return toast.error("Titre et image requis");
    const { error } = await supabase.from("realisations").insert({ ...form, position: items.length });
    if (error) return toast.error(error.message);
    setForm({ titre: "", description: "", categorie: "", image_url: "" });
    if (fileRef.current) fileRef.current.value = "";
    load();
    toast.success("Réalisation ajoutée");
  };

  const toggleVisible = async (id: string, visible: boolean) => {
    await supabase.from("realisations").update({ visible }).eq("id", id);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Supprimer cette réalisation ?")) return;
    await supabase.from("realisations").delete().eq("id", id);
    load();
  };

  return (
    <div className="p-6 md:p-10">
      <h1 className="font-display text-3xl font-bold">Réalisations</h1>
      <p className="mt-1 text-sm text-muted-foreground">Gère la galerie des projets affichée sur le site public.</p>

      <Card className="mt-6 p-6">
        <h2 className="font-display text-lg font-semibold">Ajouter une réalisation</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="grid gap-2"><Label>Titre *</Label><Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} /></div>
          <div className="grid gap-2"><Label>Catégorie</Label><Input value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} placeholder="Fenêtre, porte, véranda…" /></div>
          <div className="md:col-span-2 grid gap-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="md:col-span-2 grid gap-2">
            <Label>Image *</Label>
            <div className="flex items-center gap-3">
              <Input ref={fileRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
              {uploading && <span className="text-xs text-muted-foreground">Téléversement…</span>}
            </div>
            {form.image_url && <img src={form.image_url} alt="Aperçu" className="mt-2 h-32 w-auto rounded border object-cover" />}
          </div>
        </div>
        <Button className="mt-4" onClick={add} disabled={uploading}><Plus className="mr-1 h-4 w-4" />Ajouter</Button>
      </Card>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {!loading && items.length === 0 && <p className="text-sm text-muted-foreground">Aucune réalisation pour le moment.</p>}
        {items.map((it) => (
          <Card key={it.id} className="overflow-hidden">
            <img src={it.image_url} alt={it.titre} className="aspect-[4/3] w-full object-cover" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{it.titre}</div>
                  {it.categorie && <div className="text-xs text-muted-foreground">{it.categorie}</div>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
              {it.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{it.description}</p>}
              <div className="mt-3 flex items-center gap-2 text-sm">
                <Switch checked={it.visible} onCheckedChange={(v) => toggleVisible(it.id, v)} />
                <span className="text-muted-foreground">{it.visible ? "Visible" : "Masquée"}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
