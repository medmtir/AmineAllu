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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Upload, Plus, Save, Wrench, Info, CheckCircle2 } from "lucide-react";
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

  // Form for adding/editing service
  const [newService, setNewService] = useState({
    title: "",
    description: "",
    image_url: "",
  });

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
        // Table might not be created yet, fallback gracefully
        setServices(defaultServices.map((s, idx) => ({ ...s, id: `def-${idx}` })));
      } else if (data && data.length > 0) {
        setServices(data);
      } else {
        setServices(defaultServices.map((s, idx) => ({ ...s, id: `def-${idx}` })));
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

  const uploadImage = async (file: File, type: "service" | "about") => {
    const isService = type === "service";
    if (isService) setUploadingService(true);
    else setUploadingAbout(true);

    try {
      const ext = file.name.split(".").pop();
      const path = `uploads/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("realisations").upload(path, file, { upsert: false });

      if (error) throw error;

      const { data } = supabase.storage.from("realisations").getPublicUrl(path);
      if (isService) {
        setNewService((prev) => ({ ...prev, image_url: data.publicUrl }));
      } else {
        setAboutData((prev) => ({ ...prev, about_image_url: data.publicUrl }));
      }
      toast.success("Image téléversée avec succès");
    } catch (err: any) {
      toast.error(err.message || "Erreur de téléversement");
    } finally {
      if (isService) setUploadingService(false);
      else setUploadingAbout(false);
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

  const toggleServiceVisible = async (id: string, visible: boolean) => {
    try {
      await supabase.from("site_services").update({ visible }).eq("id", id);
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, visible } : s)));
      toast.success("Statut mis à jour");
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm("Supprimer ce service ?")) return;
    try {
      await supabase.from("site_services").delete().eq("id", id);
      toast.success("Service supprimé");
      loadServices();
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
          Modifiez ici les services affichés ("Ce que nous fabriquons") ainsi que le texte et l'image de la section "À propos".
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
                  placeholder="Ex: Portes-fenêtres aluminium sur mesure"
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold">Services actuels ({services.length})</h2>
              <span className="text-xs text-muted-foreground">Même style d'affichage avec image et texte sous l'image</span>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Chargement des services…</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((s, idx) => (
                  <Card key={s.id || idx} className="overflow-hidden border group shadow-xs">
                    <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                      <img src={s.image_url} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display font-semibold text-base">{s.title}</h3>
                        {s.id && !s.id.startsWith("def-") && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteService(s.id)}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{s.description}</p>
                      {s.id && !s.id.startsWith("def-") && (
                        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                          <span>Visible sur le site</span>
                          <Switch
                            checked={s.visible !== false}
                            onCheckedChange={(checked) => toggleServiceVisible(s.id, checked)}
                          />
                        </div>
                      )}
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
              <p className="text-xs text-muted-foreground">Personnalisez la présentation de votre atelier affichée sur la page d'accueil.</p>
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
                <span className="text-[11px] text-muted-foreground">Chaque saut de ligne sera affiché avec une coche verte.</span>
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
    </div>
  );
}
