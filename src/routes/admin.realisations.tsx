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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Plus, Pencil, Save, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

import heroImg from "@/assets/hero-aluminium.jpg";
import fenetreImg from "@/assets/fenetre.jpg";
import porteImg from "@/assets/porte.jpg";
import verandaImg from "@/assets/veranda.jpg";
import atelierImg from "@/assets/atelier.jpg";

export const Route = createFileRoute("/admin/realisations")({
  component: RealisationsAdmin,
  head: () => ({
    meta: [
      { title: "Réalisations — Admin ALU MED AMINE" },
      { name: "description", content: "Gestion de la galerie des réalisations aluminium." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const defaultRealisations = [
  {
    titre: "Fenêtre aluminium",
    image_url: fenetreImg,
    categorie: "Fenêtre",
    description: "Fenêtres coulissantes et battantes sur mesure avec double vitrage isolant.",
  },
  {
    titre: "Porte d'entrée aluminium",
    image_url: porteImg,
    categorie: "Porte",
    description: "Portes d'entrée et portes-fenêtres haute sécurité et excellente isolation.",
  },
  {
    titre: "Véranda & Pergola",
    image_url: verandaImg,
    categorie: "Véranda",
    description: "Conception et installation de vérandas étanches et pergolas bioclimatiques.",
  },
  {
    titre: "Atelier de fabrication",
    image_url: atelierImg,
    categorie: "Atelier",
    description: "Découpe de précision et assemblage soigné en atelier à Ouerdanine.",
  },
  {
    titre: "Façade vitrée & Mur-rideau",
    image_url: heroImg,
    categorie: "Façade",
    description: "Grandes baies vitrées et profilés aluminium pour villas et commerces.",
  },
];

function RealisationsAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    titre: "",
    description: "",
    categorie: "",
    image_url: "",
  });

  // Modal edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [uploadingEdit, setUploadingEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("realisations")
        .select("*")
        .order("position", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        setItems(defaultRealisations.map((r, i) => ({ ...r, id: `def-${i}`, visible: true })));
      } else if (data && data.length > 0) {
        setItems(data);
      } else {
        // Auto-seed default projects into database if table is empty
        try {
          const toInsert = defaultRealisations.map((r, i) => ({
            titre: r.titre,
            description: r.description,
            categorie: r.categorie,
            image_url: r.image_url,
            position: i,
            visible: true,
          }));
          const { data: inserted } = await supabase.from("realisations").insert(toInsert).select();
          if (inserted && inserted.length > 0) {
            setItems(inserted);
            return;
          }
        } catch {
          // ignore
        }
        setItems(defaultRealisations.map((r, i) => ({ ...r, id: `def-${i}`, visible: true })));
      }
    } catch {
      setItems(defaultRealisations.map((r, i) => ({ ...r, id: `def-${i}`, visible: true })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const compressImage = async (file: File, maxWidth = 1280, quality = 0.85): Promise<File> => {
    if (!file.type.startsWith("image/") || file.type.includes("svg")) {
      return file;
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(file);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressed);
            },
            "image/jpeg",
            quality
          );
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const uploadImage = async (file: File, target: "new" | "edit") => {
    if (target === "new") setUploading(true);
    else setUploadingEdit(true);

    try {
      const fileToUpload = await compressImage(file);
      const ext = fileToUpload.name.split(".").pop() || "jpg";
      const path = `uploads/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("realisations").upload(path, fileToUpload, {
        contentType: fileToUpload.type || "image/jpeg",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("realisations").getPublicUrl(path);

      if (target === "new") {
        setForm((f) => ({ ...f, image_url: data.publicUrl }));
      } else if (editingItem) {
        setEditingItem((prev: any) => ({ ...prev, image_url: data.publicUrl }));
      }
      toast.success("Image téléversée avec succès");
    } catch (err: any) {
      toast.error(err.message || "Erreur de téléversement");
    } finally {
      if (target === "new") setUploading(false);
      else setUploadingEdit(false);
    }
  };

  const add = async () => {
    if (!form.titre || !form.image_url) {
      return toast.error("Le titre et l'image sont obligatoires");
    }

    try {
      const { error } = await supabase.from("realisations").insert({
        ...form,
        position: items.length,
        visible: true,
      });
      if (error) throw error;

      setForm({ titre: "", description: "", categorie: "", image_url: "" });
      if (fileRef.current) fileRef.current.value = "";
      load();
      toast.success("Réalisation ajoutée avec succès");
    } catch (err: any) {
      toast.error(err.message || "Erreur d'ajout");
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem({ ...item });
    setEditOpen(true);
  };

  const saveEditItem = async () => {
    if (!editingItem || !editingItem.titre?.trim()) {
      return toast.error("Le titre de la réalisation est requis");
    }

    setSavingEdit(true);
    try {
      const isDef = String(editingItem.id || "").startsWith("def-");
      if (isDef) {
        const hasOtherDefs = items.some((it) => String(it.id || "").startsWith("def-") && it.id !== editingItem.id);
        if (hasOtherDefs) {
          const rowsToInsert = items.map((it, idx) => {
            if (it.id === editingItem.id) {
              return {
                titre: editingItem.titre.trim(),
                categorie: editingItem.categorie || "",
                description: editingItem.description || "",
                image_url: editingItem.image_url,
                visible: editingItem.visible !== false,
                position: idx,
              };
            }
            return {
              titre: it.titre,
              categorie: it.categorie || "",
              description: it.description || "",
              image_url: it.image_url,
              visible: it.visible !== false,
              position: idx,
            };
          });
          const { error } = await supabase.from("realisations").insert(rowsToInsert);
          if (error) {
            setItems((prev) =>
              prev.map((it) => (it.id === editingItem.id ? { ...editingItem } : it))
            );
          }
        } else {
          const { error } = await supabase.from("realisations").insert({
            titre: editingItem.titre.trim(),
            categorie: editingItem.categorie || "",
            description: editingItem.description || "",
            image_url: editingItem.image_url,
            visible: editingItem.visible !== false,
            position: items.findIndex((it) => it.id === editingItem.id),
          });
          if (error) {
            setItems((prev) =>
              prev.map((it) => (it.id === editingItem.id ? { ...editingItem } : it))
            );
          }
        }
      } else {
        const { error } = await supabase
          .from("realisations")
          .update({
            titre: editingItem.titre.trim(),
            categorie: editingItem.categorie || "",
            description: editingItem.description || "",
            image_url: editingItem.image_url,
            visible: editingItem.visible !== false,
          })
          .eq("id", editingItem.id);
        if (error) throw error;
      }

      toast.success("Réalisation modifiée avec succès !");
      setEditOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message || "Erreur de modification");
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleVisible = async (item: any) => {
    const next = !(item.visible !== false);
    try {
      if (String(item.id).startsWith("def-")) {
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, visible: next } : it))
        );
      } else {
        await supabase.from("realisations").update({ visible: next }).eq("id", item.id);
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, visible: next } : it))
        );
      }
      toast.success(next ? "Projet visible sur le site" : "Projet masqué");
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette réalisation ?")) return;
    try {
      if (String(id).startsWith("def-")) {
        setItems((prev) => prev.filter((it) => it.id !== id));
      } else {
        await supabase.from("realisations").delete().eq("id", id);
      }
      toast.success("Réalisation supprimée");
      load();
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-6xl">
      <div className="border-b pb-4">
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Réalisations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gère la galerie des projets affichée sur le site public. Cliquez sur « Modifier » pour changer la photo ou les informations.
        </p>
      </div>

      {/* Add realization form */}
      <Card className="mt-6 p-5 sm:p-6 border-l-4 border-l-primary">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Ajouter une réalisation
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Titre du projet *</Label>
            <Input
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
              placeholder="Ex: Baie vitrée coulissante villa Sousse"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Catégorie</Label>
            <Input
              value={form.categorie}
              onChange={(e) => setForm({ ...form, categorie: e.target.value })}
              placeholder="Ex: Fenêtre, Porte, Véranda, Façade…"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Détails du projet (profilés utilisés, vitrage, lieu, finitions)…"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Photo de la réalisation *</Label>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "new")}
                className="max-w-xs cursor-pointer text-xs"
              />
              {uploading && (
                <span className="text-xs text-primary animate-pulse flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Téléversement…
                </span>
              )}
            </div>
            {form.image_url && (
              <div className="mt-3 relative w-36 aspect-[4/3] rounded-lg overflow-hidden border">
                <img src={form.image_url} alt="Aperçu" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
        <Button className="mt-5" onClick={add} disabled={uploading}>
          <Plus className="mr-1.5 h-4 w-4" />
          Ajouter ce projet
        </Button>
      </Card>

      {/* Grid of existing realizations */}
      <div className="mt-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
          <h2 className="font-display text-lg font-bold">Projets actuels ({items.length})</h2>
          <span className="text-xs text-muted-foreground">
            Cliquez sur « Modifier » pour changer la photo ou le texte
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement des réalisations…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune réalisation pour le moment.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it, idx) => (
              <Card
                key={it.id || idx}
                className="overflow-hidden border group shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                    <img
                      src={it.image_url}
                      alt={it.titre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant={it.visible !== false ? "default" : "secondary"}
                        className="text-[10px] font-semibold"
                      >
                        {it.visible !== false ? "Visible" : "Masqué"}
                      </Badge>
                    </div>
                    {it.categorie && (
                      <div className="absolute bottom-2 left-2">
                        <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-medium">
                          {it.categorie}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-1.5">
                    <h3 className="font-display font-bold text-base text-foreground">{it.titre}</h3>
                    {it.description && (
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {it.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-4 pt-0">
                  <div className="pt-3 border-t flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(it)}
                      className="flex-1 h-9 text-xs font-semibold gap-1.5 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Modifier
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(it.id)}
                      className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0"
                      title="Supprimer ce projet"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* DIALOG MODAL: MODIFIER UNE RÉALISATION */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              Modifier la réalisation
            </DialogTitle>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Titre / Nom du projet *</Label>
                <Input
                  value={editingItem.titre || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, titre: e.target.value })}
                  placeholder="Ex: Porte d'entrée aluminium"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Catégorie</Label>
                <Input
                  value={editingItem.categorie || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, categorie: e.target.value })}
                  placeholder="Ex: Fenêtre, Porte, Véranda…"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={editingItem.description || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, description: e.target.value })
                  }
                  placeholder="Détails du projet..."
                />
              </div>

              <div className="space-y-1.5">
                <Label>Changer la photo de la réalisation</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    ref={editFileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "edit")}
                    className="cursor-pointer text-xs"
                  />
                  {uploadingEdit && (
                    <span className="text-xs text-primary animate-pulse flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Téléversement…
                    </span>
                  )}
                </div>

                {editingItem.image_url && (
                  <div className="mt-2 relative w-full aspect-[4/3] rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={editingItem.image_url}
                      alt="Aperçu"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t text-sm">
                <Label htmlFor="edit-real-visible" className="cursor-pointer">
                  Visible sur le site public
                </Label>
                <Switch
                  id="edit-real-visible"
                  checked={editingItem.visible !== false}
                  onCheckedChange={(checked) =>
                    setEditingItem({ ...editingItem, visible: checked })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={savingEdit}>
              Annuler
            </Button>
            <Button onClick={saveEditItem} disabled={savingEdit || uploadingEdit}>
              {savingEdit ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Enregistrement…
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-4 w-4" /> Enregistrer les modifications
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
