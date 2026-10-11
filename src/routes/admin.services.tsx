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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Trash2,
  Upload,
  Plus,
  Save,
  Wrench,
  Info,
  CheckCircle2,
  Pencil,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import porteImg from "@/assets/porte.jpg";
import fenetreImg from "@/assets/fenetre.jpg";
import verandaImg from "@/assets/veranda.jpg";

export const Route = createFileRoute("/admin/services")({
  component: ServicesAndContentAdmin,
  head: () => ({
    meta: [
      { title: "Services & Contenu — Admin ALU MED AMINE" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const defaultServices = [
  {
    title: "Porte-fenêtre",
    description: "Portes-fenêtres aluminium sur mesure, lumineuses et isolantes avec profilés haute résistance.",
    image_url: porteImg,
    visible: true,
  },
  {
    title: "Fenêtre coulissante",
    description: "Fenêtres coulissantes en aluminium fluide, gain de place et luminosité maximale.",
    image_url: fenetreImg,
    visible: true,
  },
  {
    title: "Fenêtre battante",
    description: "Fenêtres aluminium à frappe ou oscillo-battantes avec double vitrage thermique.",
    image_url: fenetreImg,
    visible: true,
  },
  {
    title: "Mur rideaux",
    description: "Façades vitrées et murs-rideaux pour bâtiments résidentiels et commerces.",
    image_url: verandaImg,
    visible: true,
  },
  {
    title: "Véranda & Pergola",
    description: "Conception et pose de vérandas en aluminium sur mesure et pergolas étanches.",
    image_url: verandaImg,
    visible: true,
  },
  {
    title: "Moustiquaire",
    description: "Moustiquaires aluminium enroulables ou plissées robustes fabriquées sur mesure.",
    image_url: fenetreImg,
    visible: true,
  },
];

function ServicesAndContentAdmin() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingService, setUploadingService] = useState(false);
  const [uploadingAbout, setUploadingAbout] = useState(false);
  const [savingAbout, setSavingAbout] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const aboutFileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  // Form for adding a new service
  const [newService, setNewService] = useState({
    title: "",
    description: "",
    image_url: "",
  });

  // Modal state for editing an existing service
  const [editOpen, setEditOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [uploadingEdit, setUploadingEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Form for About section
  const [aboutData, setAboutData] = useState({
    about_title: "Un savoir-faire au service de votre habitat",
    about_text:
      "Basés à Ouerdanine (Monastir), nous accompagnons particuliers et professionnels dans tous leurs projets de menuiserie aluminium : du simple remplacement d'une fenêtre à la conception complète d'une véranda ou d'une façade vitrée.",
    about_image_url: "",
    about_points:
      "Profilés haut de gamme\nDécoupe et soudure en atelier\nPose & finitions soignées\nSAV réactif & garantie",
  });

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from("site_services")
        .select("*")
        .order("position", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        // Table fallback
        setServices(defaultServices.map((s, idx) => ({ ...s, id: `def-${idx}` })));
      } else if (data && data.length > 0) {
        setServices(data);
      } else {
        // If table is empty, auto-seed default services into database so they become editable immediately
        const toInsert = defaultServices.map((s, idx) => ({
          title: s.title,
          description: s.description,
          image_url: s.image_url,
          position: idx,
          visible: true,
        }));
        const { data: inserted } = await supabase.from("site_services").insert(toInsert).select();
        if (inserted && inserted.length > 0) {
          setServices(inserted);
        } else {
          setServices(defaultServices.map((s, idx) => ({ ...s, id: `def-${idx}` })));
        }
      }
    } catch {
      setServices(defaultServices.map((s, idx) => ({ ...s, id: `def-${idx}` })));
    } finally {
      setLoading(false);
    }
  };

  const loadAboutSettings = async () => {
    try {
      const { data } = await supabase.from("site_settings").select("*");
      if (data && data.length > 0) {
        const mapped: any = { ...aboutData };
        data.forEach((row: any) => {
          if (row.key in mapped) mapped[row.key] = row.value;
        });
        setAboutData(mapped);
      }
    } catch (e) {
      console.warn("Could not load site settings", e);
    }
  };

  useEffect(() => {
    loadServices();
    loadAboutSettings();
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

  const uploadImage = async (file: File, type: "service" | "about" | "edit") => {
    if (type === "service") setUploadingService(true);
    else if (type === "about") setUploadingAbout(true);
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
      if (type === "service") {
        setNewService((prev) => ({ ...prev, image_url: data.publicUrl }));
      } else if (type === "about") {
        setAboutData((prev) => ({ ...prev, about_image_url: data.publicUrl }));
      } else {
        setEditingService((prev: any) => ({ ...prev, image_url: data.publicUrl }));
      }
      toast.success("Image téléversée avec succès");
    } catch (err: any) {
      toast.error(err.message || "Erreur de téléversement");
    } finally {
      if (type === "service") setUploadingService(false);
      else if (type === "about") setUploadingAbout(false);
      else setUploadingEdit(false);
    }
  };

  const addService = async () => {
    if (!newService.title.trim() || !newService.image_url) {
      return toast.error("Le titre et l'image sont obligatoires");
    }

    try {
      const { error } = await supabase.from("site_services").insert({
        title: newService.title.trim(),
        description: newService.description.trim(),
        image_url: newService.image_url,
        position: services.length,
        visible: true,
      });

      if (error) throw error;

      setNewService({ title: "", description: "", image_url: "" });
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Service ajouté avec succès");
      loadServices();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'ajout");
    }
  };

  // Open Edit Modal for a service
  const openEditModal = (service: any) => {
    setEditingService({ ...service });
    setEditOpen(true);
  };

  // Save changes from Edit Modal
  const saveEditService = async () => {
    if (!editingService || !editingService.title?.trim()) {
      return toast.error("Le titre du service est requis");
    }

    setSavingEdit(true);
    try {
      const isDef = String(editingService.id || "").startsWith("def-");

      if (isDef) {
        // If editing a default service, ensure all default services are migrated to DB with the updated one
        const hasOtherDefs = services.some((s) => String(s.id || "").startsWith("def-") && s.id !== editingService.id);
        if (hasOtherDefs) {
          const rowsToInsert = services.map((s, idx) => {
            if (s.id === editingService.id) {
              return {
                title: editingService.title.trim(),
                description: editingService.description || "",
                image_url: editingService.image_url,
                visible: editingService.visible !== false,
                position: idx,
              };
            }
            return {
              title: s.title,
              description: s.description,
              image_url: s.image_url,
              visible: s.visible !== false,
              position: idx,
            };
          });
          const { error } = await supabase.from("site_services").insert(rowsToInsert);
          if (error) {
            // Local fallback if DB insert fails
            setServices((prev) =>
              prev.map((s) => (s.id === editingService.id ? { ...editingService } : s))
            );
          }
        } else {
          const { error } = await supabase.from("site_services").insert({
            title: editingService.title.trim(),
            description: editingService.description || "",
            image_url: editingService.image_url,
            visible: editingService.visible !== false,
            position: services.findIndex((s) => s.id === editingService.id),
          });
          if (error) {
            setServices((prev) =>
              prev.map((s) => (s.id === editingService.id ? { ...editingService } : s))
            );
          }
        }
      } else {
        // Update existing row in Supabase
        const { error } = await supabase
          .from("site_services")
          .update({
            title: editingService.title.trim(),
            description: editingService.description || "",
            image_url: editingService.image_url,
            visible: editingService.visible !== false,
          })
          .eq("id", editingService.id);
        if (error) throw error;
      }

      toast.success("Service modifié avec succès !");
      setEditOpen(false);
      loadServices();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la modification");
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm("Supprimer ce service ?")) return;
    try {
      if (String(id).startsWith("def-")) {
        setServices((prev) => prev.filter((s) => s.id !== id));
      } else {
        await supabase.from("site_services").delete().eq("id", id);
      }
      toast.success("Service supprimé");
      loadServices();
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    }
  };

  const toggleServiceVisible = async (service: any) => {
    const next = !(service.visible !== false);
    try {
      if (String(service.id).startsWith("def-")) {
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, visible: next } : s))
        );
      } else {
        await supabase.from("site_services").update({ visible: next }).eq("id", service.id);
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, visible: next } : s))
        );
      }
      toast.success(next ? "Service activé sur le site" : "Service masqué");
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    }
  };

  const saveAboutSettings = async () => {
    setSavingAbout(true);
    try {
      const entries = Object.entries(aboutData).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("site_settings").upsert(entries, { onConflict: "key" });
      if (error) throw error;

      toast.success("Section À propos enregistrée avec succès");
    } catch (err: any) {
      toast.error(err.message || "Erreur d'enregistrement");
    } finally {
      setSavingAbout(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-6xl">
      <div className="border-b pb-4">
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Services & Contenu du Site</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Modifiez ici les photos, les textes et les détails de chaque service ainsi que la section "À propos".
        </p>
      </div>

      <Tabs defaultValue="services" className="mt-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Nos Services
          </TabsTrigger>
          <TabsTrigger value="about" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Section "À propos"
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SERVICES */}
        <TabsContent value="services" className="mt-6 space-y-6">
          {/* Add New Service Card */}
          <Card className="p-5 sm:p-6 border-l-4 border-l-primary">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Ajouter un nouveau service
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Nom du service / Titre *</Label>
                <Input
                  value={newService.title}
                  onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                  placeholder="Ex: Baie vitrée aluminium sur mesure"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Description / Détails *</Label>
                <Textarea
                  rows={2}
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  placeholder="Ex: Profilés haut de gamme avec rupture de pont thermique et vitrage phonique..."
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Image du service *</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "service")}
                    className="max-w-xs cursor-pointer"
                  />
                  {uploadingService && <span className="text-xs text-primary animate-pulse">Téléversement en cours…</span>}
                </div>
                {newService.image_url && (
                  <div className="mt-3 relative w-36 aspect-[4/3] rounded-lg overflow-hidden border">
                    <img src={newService.image_url} alt="Aperçu" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <Button onClick={addService} disabled={uploadingService} className="mt-5">
              <Plus className="mr-1.5 h-4 w-4" />
              Ajouter ce service
            </Button>
          </Card>

          {/* Existing Services Grid */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
              <h2 className="font-display text-lg font-bold">Services actuels ({services.length})</h2>
              <span className="text-xs text-muted-foreground">
                Cliquez sur « Modifier » pour changer la photo ou le texte
              </span>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Chargement des services…</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((s, idx) => (
                  <Card key={s.id || idx} className="overflow-hidden border group shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                        <img
                          src={s.image_url}
                          alt={s.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge
                            variant={s.visible !== false ? "default" : "secondary"}
                            className="text-[10px] font-semibold"
                          >
                            {s.visible !== false ? "Visible" : "Masqué"}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        <h3 className="font-display font-bold text-base text-foreground">{s.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                          {s.description}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons on card: MODIFIER & SUPPRIMER */}
                    <div className="p-4 pt-0">
                      <div className="pt-3 border-t flex items-center justify-between gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(s)}
                          className="flex-1 h-9 text-xs font-semibold gap-1.5 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Modifier
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteService(s.id)}
                          className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0"
                          title="Supprimer ce service"
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
        </TabsContent>

        {/* TAB 2: ABOUT / À PROPOS */}
        <TabsContent value="about" className="mt-6">
          <Card className="p-5 sm:p-6 space-y-5 border-l-4 border-l-accent">
            <div>
              <h2 className="font-display text-lg font-semibold">Modifier la section "À propos"</h2>
              <p className="text-xs text-muted-foreground">
                Personnalisez la présentation de votre atelier affichée sur la page d'accueil.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Titre principal de la section</Label>
                <Input
                  value={aboutData.about_title}
                  onChange={(e) => setAboutData({ ...aboutData, about_title: e.target.value })}
                  placeholder="Ex: Un savoir-faire au service de votre habitat"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Texte de présentation / Histoire</Label>
                <Textarea
                  rows={4}
                  value={aboutData.about_text}
                  onChange={(e) => setAboutData({ ...aboutData, about_text: e.target.value })}
                  placeholder="Présentez votre atelier, votre expérience et vos engagements qualité..."
                />
              </div>

              <div className="space-y-1.5">
                <Label>Points forts (Un point par ligne)</Label>
                <Textarea
                  rows={4}
                  value={aboutData.about_points}
                  onChange={(e) => setAboutData({ ...aboutData, about_points: e.target.value })}
                  placeholder="Profilés haut de gamme&#10;Découpe et assemblage en atelier&#10;Pose & finitions soignées"
                />
                <span className="text-[11px] text-muted-foreground">
                  Chaque saut de ligne sera affiché avec une coche verte.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label>Photo de l'atelier / Équipe</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    ref={aboutFileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "about")}
                    className="max-w-xs cursor-pointer"
                  />
                  {uploadingAbout && <span className="text-xs text-primary animate-pulse">Téléversement…</span>}
                </div>
                {aboutData.about_image_url && (
                  <div className="mt-3 relative w-48 aspect-[3/2] rounded-lg overflow-hidden border">
                    <img src={aboutData.about_image_url} alt="Atelier" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <Button onClick={saveAboutSettings} disabled={savingAbout} className="h-10 px-5">
              <Save className="mr-1.5 h-4 w-4" />
              {savingAbout ? "Enregistrement…" : "Enregistrer la section À propos"}
            </Button>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL DIALOG POUR MODIFIER UN SERVICE */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              Modifier le service
            </DialogTitle>
          </DialogHeader>

          {editingService && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Titre / Nom du service *</Label>
                <Input
                  value={editingService.title || ""}
                  onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                  placeholder="Ex: Porte-fenêtre aluminium sur mesure"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Description *</Label>
                <Textarea
                  rows={3}
                  value={editingService.description || ""}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  placeholder="Description détaillée du service..."
                />
              </div>

              <div className="space-y-1.5">
                <Label>Changer la photo du service</Label>
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

                {editingService.image_url && (
                  <div className="mt-2 relative w-full aspect-[4/3] rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={editingService.image_url}
                      alt="Aperçu du service"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t text-sm">
                <Label htmlFor="edit-visible" className="cursor-pointer">
                  Visible sur le site
                </Label>
                <Switch
                  id="edit-visible"
                  checked={editingService.visible !== false}
                  onCheckedChange={(checked) =>
                    setEditingService({ ...editingService, visible: checked })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={savingEdit}>
              Annuler
            </Button>
            <Button onClick={saveEditService} disabled={savingEdit || uploadingEdit}>
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
