import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { calculateOuvrage } from "@/lib/alucalc/engine";
import {
  OuvrageCategory,
  OuvrageCalculationResult,
  AtelierProjet,
  AtelierProjetItem,
} from "@/lib/alucalc/types";
import { SchematicView } from "@/components/admin/calculateur/SchematicView";
import { CuttingOptimizerView } from "@/components/admin/calculateur/CuttingOptimizerView";
import { WorkshopPrintSheet } from "@/components/admin/calculateur/WorkshopPrintSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calculator,
  Save,
  FilePlus,
  Printer,
  FileText,
  Trash2,
  Plus,
  Scissors,
  Layers,
  Sparkles,
  Sliders,
  DollarSign,
  Package,
  Check,
  FolderOpen,
  Columns2,
  DoorOpen,
  Blinds,
  ChefHat,
  ShieldCheck,
  Maximize2,
  Ruler,
  BarChart3,
  PackageCheck,
  FolderKanban,
} from "lucide-react";
import { toast } from "sonner";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
const supabase = supabaseTyped as any;

export const Route = createFileRoute("/admin/calculateur")({
  component: CalculateurPage,
  head: () => ({
    meta: [
      { title: "Calculateur & Atelier Aluminium — ALU MED AMINE" },
      { name: "description", content: "Calculateur de débitage, optimisation des barres 6m et devis atelier." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const CATEGORIES: Array<{
  id: OuvrageCategory;
  name: string;
  icon: any;
  desc: string;
  defaultSub: string;
}> = [
  { id: "coulissant", name: "Coulissant", icon: Columns2, desc: "Série 67 / 40 (2V, 3V, 4V)", defaultSub: "coulissant_2v" },
  { id: "battant", name: "Battant", icon: DoorOpen, desc: "Série 45 / 52 (1V, 2V, Porte)", defaultSub: "battant_1v" },
  { id: "volet_roulant", name: "Volet Roulant", icon: Blinds, desc: "Monobloc & Tunnel (Moteur/Manuel)", defaultSub: "monobloc_moteur" },
  { id: "cuisine", name: "Cuisine Alu", icon: ChefHat, desc: "Caissons, Tiroirs, Profils Gola", defaultSub: "meuble_bas" },
  { id: "moustiquaire", name: "Moustiquaire", icon: ShieldCheck, desc: "Enroulable, Plissée, Coulissante", defaultSub: "enroulable_verticale" },
  { id: "fixe", name: "Châssis Fixe", icon: Maximize2, desc: "Fixe vitré avec parcloses 45°", defaultSub: "chassis_fixe" },
];

const SUBTYPES_BY_CAT: Record<OuvrageCategory, Array<{ id: string; label: string }>> = {
  coulissant: [
    { id: "coulissant_2v", label: "Coulissant 2 Vantaux (2 Rails)" },
    { id: "coulissant_3v", label: "Coulissant 3 Vantaux (3 Rails)" },
    { id: "coulissant_4v", label: "Coulissant 4 Vantaux (2 Rails)" },
  ],
  battant: [
    { id: "battant_1v", label: "Fenêtre 1 Vantail (Oscillo-battant)" },
    { id: "battant_2v", label: "Fenêtre 2 Vantaux" },
    { id: "soufflet", label: "Soufflet (Vasistas / Abattant)" },
    { id: "porte_entree", label: "Porte d'entrée lourde avec soubassement" },
  ],
  volet_roulant: [
    { id: "monobloc_moteur", label: "Volet Monobloc Moteur (Radio / Filaire)" },
    { id: "monobloc_manuel", label: "Volet Monobloc Manuel (Sangle / Treuil)" },
    { id: "tunnel_moteur", label: "Volet Tunnel Linteau Moteur" },
  ],
  cuisine: [
    { id: "meuble_bas", label: "Meuble Bas avec Portes (L: 800-1200mm)" },
    { id: "meuble_haut", label: "Meuble Haut Suspendu (H: 720mm)" },
    { id: "tiroirs", label: "Bloc 3 Tiroirs / Casseroliers" },
    { id: "armoire_colonne", label: "Armoire Colonne (H: 2100mm)" },
  ],
  moustiquaire: [
    { id: "enroulable_verticale", label: "Moustiquaire Enroulable Verticale" },
    { id: "plissee_laterale", label: "Moustiquaire Plissée Latérale (PMR)" },
    { id: "coulissante_cadre", label: "Moustiquaire Coulissante sur Cadre" },
  ],
  fixe: [
    { id: "chassis_fixe", label: "Châssis Fixe Vitré Simple" },
  ],
};

const COULEURS = [
  "Blanc 9010",
  "Gris Anthracite 7016",
  "Noir Sablé 9005",
  "Faux Bois Chêne Doré",
  "Champagne / Bronze",
  "Gris Argent 9006",
];

const VITRAGES_BY_CAT: Record<OuvrageCategory, string[]> = {
  coulissant: ["Simple Clair 6mm", "Stop-Sol Bronze 6mm", "Double 4/12/4", "Verre Sablé 6mm"],
  battant: ["Double 4/12/4", "Simple Clair 6mm", "Stop-Sol Bronze 6mm", "Verre Sablé 6mm"],
  volet_roulant: ["Lames Alu 45mm Mousse PU", "Lames Alu 55mm Mousse PU", "Lames Extrudées Sécurité"],
  cuisine: ["Panneau Alucobond 4mm", "Verre Laqué 4mm", "Verre Dépoli 4mm"],
  moustiquaire: ["Toile Fibre de Verre Grise", "Toile Anti-pollen Noire", "Toile Plissée Zig-Zag"],
  fixe: ["Double 4/12/4", "Simple Clair 6mm", "Stop-Sol Bronze 6mm", "Feuilleté Sécurit 44.2"],
};

export function CalculateurPage() {
  const navigate = useNavigate();

  // Active calculation configuration (in Centimètres cm)
  const [category, setCategory] = useState<OuvrageCategory>("coulissant");
  const [subType, setSubType] = useState<string>("coulissant_2v");
  const [largeurCm, setLargeurCm] = useState<number>(120);
  const [hauteurCm, setHauteurCm] = useState<number>(140);
  const [profondeurCm, setProfondeurCm] = useState<number>(60);
  const [quantite, setQuantite] = useState<number>(1);
  const [serie, setSerie] = useState<string>("Série 67 TPR");
  const [couleurAlu, setCouleurAlu] = useState<string>("Blanc 9010");
  const [vitrageType, setVitrageType] = useState<string>("Simple Clair 6mm");
  const [emplacement, setEmplacement] = useState<string>("F1 - Salon");

  // Project state
  const [projetTitre, setProjetTitre] = useState<string>("Chantier Villa");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clientNom, setClientNom] = useState<string>("");
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [projectItems, setProjectItems] = useState<AtelierProjetItem[]>([]);
  const [savedProjects, setSavedProjects] = useState<AtelierProjet[]>([]);
  const [openLoadDialog, setOpenLoadDialog] = useState<boolean>(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<string>("schema");
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState<boolean>(false);

  // Load clients & saved projects on mount
  useEffect(() => {
    supabase
      .from("clients")
      .select("id, nom, telephone, adresse")
      .order("nom")
      .then(({ data }: any) => {
        if (data) setClientsList(data);
      })
      .catch(() => {});

    // Load saved projects from localStorage
    try {
      const stored = localStorage.getItem("alu_projets_sauvegardes");
      if (stored) {
        setSavedProjects(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Update default subType and vitrage when category changes
  const handleCategoryChange = (cat: OuvrageCategory) => {
    setCategory(cat);
    const catConfig = CATEGORIES.find((c) => c.id === cat);
    if (catConfig) {
      setSubType(catConfig.defaultSub);
    }
    const defaultVitrages = VITRAGES_BY_CAT[cat];
    if (defaultVitrages && defaultVitrages[0]) {
      setVitrageType(defaultVitrages[0]);
    }
    // Adjust default dimensions by category (in cm)
    if (cat === "coulissant") {
      setLargeurCm(140);
      setHauteurCm(120);
      setSerie("Série 67 TPR");
    } else if (cat === "battant") {
      setLargeurCm(100);
      setHauteurCm(120);
      setSerie("Série 45 TPR");
    } else if (cat === "volet_roulant") {
      setLargeurCm(120);
      setHauteurCm(140);
      setSerie("Monobloc Coffre 180");
    } else if (cat === "cuisine") {
      setLargeurCm(80);
      setHauteurCm(85);
      setProfondeurCm(60);
      setSerie("Profils Cuisine & Gola");
    } else if (cat === "moustiquaire") {
      setLargeurCm(120);
      setHauteurCm(120);
      setSerie("Enroulable Alu 42mm");
    } else if (cat === "fixe") {
      setLargeurCm(160);
      setHauteurCm(100);
      setSerie("Série 45 Fixe");
    }
  };

  // Live calculation result (converts cm to mm for exact fabrication engine)
  const currentResult: OuvrageCalculationResult = useMemo(() => {
    return calculateOuvrage({
      category,
      subType,
      largeurMm: Math.round(largeurCm * 10),
      hauteurMm: Math.round(hauteurCm * 10),
      profondeurMm: Math.round(profondeurCm * 10),
      quantite,
      serie,
      couleurAlu,
      vitrageType,
    });
  }, [category, subType, largeurCm, hauteurCm, profondeurCm, quantite, serie, couleurAlu, vitrageType]);

  // Add current calculation as an item in the project
  const handleAddToProject = () => {
    const newItem: AtelierProjetItem = {
      id: `item-${Date.now()}`,
      titre: currentResult.titre,
      emplacement: emplacement || `Ouvrage #${projectItems.length + 1}`,
      params: {
        category,
        subType,
        largeurMm: Math.round(largeurCm * 10),
        hauteurMm: Math.round(hauteurCm * 10),
        profondeurMm: Math.round(profondeurCm * 10),
        quantite,
        serie,
        couleurAlu,
        vitrageType,
      },
      result: currentResult,
    };

    setProjectItems((prev) => [...prev, newItem]);
    toast.success(`"${currentResult.titre}" ajouté au projet !`);
    setActiveTab("project_items");
  };

  // Remove item from project
  const handleRemoveProjectItem = (id: string) => {
    setProjectItems((prev) => prev.filter((it) => it.id !== id));
    toast.info("Article retiré du projet");
  };

  // Save current project to localStorage
  const handleSaveProject = () => {
    const project: AtelierProjet = {
      id: `proj-${Date.now()}`,
      titreProjet,
      clientId: selectedClientId || undefined,
      clientNom: clientNom || "Client Non Spécifié",
      dateCreation: new Date().toISOString(),
      dateMiseAJour: new Date().toISOString(),
      articles: projectItems.length > 0 ? projectItems : [
        {
          id: `item-${Date.now()}`,
          titre: currentResult.titre,
          emplacement,
          params: {
            category,
            subType,
            largeurMm: Math.round(largeurCm * 10),
            hauteurMm: Math.round(hauteurCm * 10),
            profondeurMm: Math.round(profondeurCm * 10),
            quantite,
            serie,
            couleurAlu,
            vitrageType,
          },
          result: currentResult,
        },
      ],
    };

    const updated = [project, ...savedProjects.filter((p) => p.id !== project.id)];
    setSavedProjects(updated);
    try {
      localStorage.setItem("alu_projets_sauvegardes", JSON.stringify(updated));
      toast.success(`Projet "${titreProjet}" sauvegardé avec succès !`);
    } catch (e) {
      toast.error("Erreur lors de la sauvegarde locale.");
    }
  };

  // Load an existing saved project
  const handleLoadProject = (proj: AtelierProjet) => {
    setProjetTitre(proj.titreProjet);
    if (proj.clientId) setSelectedClientId(proj.clientId);
    if (proj.clientNom) setClientNom(proj.clientNom);
    setProjectItems(proj.articles || []);
    if (proj.articles && proj.articles.length > 0) {
      const first = proj.articles[0];
      setCategory(first.params.category);
      setSubType(first.params.subType);
      setLargeurCm(first.params.largeurMm / 10);
      setHauteurCm(first.params.hauteurMm / 10);
      if (first.params.profondeurMm) setProfondeurCm(first.params.profondeurMm / 10);
      setQuantite(first.params.quantite);
      setSerie(first.params.serie);
      setCouleurAlu(first.params.couleurAlu);
      setVitrageType(first.params.vitrageType);
      setEmplacement(first.emplacement || "");
    }
    setOpenLoadDialog(false);
    toast.success(`Projet "${proj.titreProjet}" chargé avec ${proj.articles.length} article(s) !`);
  };

  // 1-Click Export to Devis
  const handleExportToDevis = () => {
    // If project has items, export all; else export current calculation
    const itemsToExport = projectItems.length > 0 ? projectItems : [
      {
        id: "single",
        titre: currentResult.titre,
        emplacement,
        params: {
          category,
          subType,
          largeurMm: Math.round(largeurCm * 10),
          hauteurMm: Math.round(hauteurCm * 10),
          quantite,
          serie,
          couleurAlu,
          vitrageType,
        },
        result: currentResult,
      },
    ];

    const devisItems = itemsToExport.map((item, idx) => {
      const r = item.result;
      const desc = `${item.emplacement ? `[${item.emplacement}] ` : ""}${r.titre} (L: ${(r.largeurMm / 10).toFixed(1)} cm × H: ${(r.hauteurMm / 10).toFixed(1)} cm) — ${r.serie}, Teinte: ${r.couleurAlu}, Vitrage: ${r.vitrageType}`;
      return {
        designation: desc,
        quantite: r.quantiteOuvrage,
        prix_unitaire: r.prixVenteSuggereDt,
        total: r.prixVenteSuggereDt * r.quantiteOuvrage,
        position: idx + 1,
      };
    });

    const pendingPayload = {
      client_id: selectedClientId || null,
      notes: `Devis généré depuis le Calculateur Atelier Aluminium.\nChantier: ${projetTitre}\nNombre d'éléments: ${itemsToExport.length}`,
      items: devisItems,
    };

    sessionStorage.setItem("pending_devis_from_calc", JSON.stringify(pendingPayload));
    toast.success("Conversion en Devis prête ! Redirection vers l'éditeur de Devis...");
    navigate({ to: "/admin/devis/$id", params: { id: "new" } });
  };

  // If workshop printable sheet is open
  if (isPrintSheetOpen) {
    return (
      <div className="p-4">
        <WorkshopPrintSheet
          result={currentResult}
          clientNom={clientNom || "Client Particulier"}
          projetTitre={projetTitre}
          onBack={() => setIsPrintSheetOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Banner / Project Controls */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calculator className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">
                Calculateur & Atelier Aluminium
              </h1>
              <p className="text-xs text-muted-foreground">
                Débitage millimétrique, optimisation barres 6m & génération de devis (Normes TPR Tunisie)
              </p>
            </div>
          </div>
        </div>

        {/* Project Meta Inputs & Quick Actions */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {/* Project Title Input */}
          <div className="w-full sm:w-52">
            <Input
              value={projetTitre}
              onChange={(e) => setProjetTitre(e.target.value)}
              placeholder="Nom du Chantier / Projet"
              className="h-9 text-xs font-semibold"
            />
          </div>

          {/* Client Selector */}
          <div className="w-full sm:w-48">
            <Select
              value={selectedClientId}
              onValueChange={(val) => {
                setSelectedClientId(val);
                const found = clientsList.find((c) => c.id === val);
                if (found) setClientNom(found.nom);
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Sélectionner Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Client non répertorié</SelectItem>
                {clientsList.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom} {c.telephone ? `(${c.telephone})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Actions Grid on Mobile */}
          <div className="grid grid-cols-3 sm:flex items-center gap-1.5 w-full sm:w-auto">
            {/* Load Project Dialog */}
            <Dialog open={openLoadDialog} onOpenChange={setOpenLoadDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-xs px-2 truncate">
                  <FolderOpen className="mr-1 h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Projets ({savedProjects.length})</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold">Projets Sauvegardés</DialogTitle>
                </DialogHeader>
                <div className="max-h-72 space-y-2 overflow-y-auto py-2">
                  {savedProjects.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Aucun projet sauvegardé pour le moment.
                    </p>
                  ) : (
                    savedProjects.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleLoadProject(p)}
                        className="cursor-pointer rounded-lg border p-3 text-xs transition-colors hover:bg-muted/50"
                      >
                        <div className="font-bold text-foreground">{p.titreProjet}</div>
                        <div className="text-muted-foreground">
                          Client : {p.clientNom || "Non spécifié"} • {p.articles?.length || 0} article(s)
                        </div>
                        <div className="mt-1 text-[10px] text-muted-foreground/80">
                          {new Date(p.dateCreation).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Save Project Button */}
            <Button variant="outline" size="sm" onClick={handleSaveProject} className="h-9 text-xs px-2">
              <Save className="mr-1 h-3.5 w-3.5 shrink-0" /> Sauvegarder
            </Button>

            {/* 1-Click Convert to Devis */}
            <Button
              size="sm"
              onClick={handleExportToDevis}
              className="h-9 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold px-2 btn-3d"
            >
              <FilePlus className="mr-1 h-3.5 w-3.5 shrink-0" /> Devis
            </Button>
          </div>
        </div>
      </div>

      {/* Category Selection Cards (No Emojis - Sleek Lucide Icons & 3D feel) */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {CATEGORIES.map((cat) => {
          const isSelected = category === cat.id;
          const CatIcon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`card-3d flex flex-col items-start rounded-xl border p-2.5 sm:p-3 text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/30"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg transition-colors ${
                  isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                }`}>
                  <CatIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                {isSelected && (
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <div className="mt-2 font-display text-xs sm:text-sm font-bold text-foreground">
                {cat.name}
              </div>
              <div className="mt-0.5 line-clamp-1 text-[10px] sm:text-[11px] text-muted-foreground">
                {cat.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Left Configurator / Right Live Visualizer */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* ================================================================ */}
        {/* LEFT COLUMN: Inputs & Configuration (5 cols)                    */}
        {/* ================================================================ */}
        <div className="space-y-4 lg:col-span-5">
          <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" /> Configuration de l'Ouvrage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {/* Sub-Type Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Modèle & Type d'Ouverture</Label>
                <Select value={subType} onValueChange={setSubType}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(SUBTYPES_BY_CAT[category] || []).map((st) => (
                      <SelectItem key={st.id} value={st.id}>
                        {st.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dimensions: Largeur & Hauteur en cm */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Largeur (L en cm)</Label>
                  <Input
                    type="number"
                    min="20"
                    max="600"
                    step="0.5"
                    value={largeurCm}
                    onChange={(e) => setLargeurCm(Math.max(10, Number(e.target.value) || 0))}
                    className="font-mono text-sm font-bold"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Ex: 120 cm ({(largeurCm * 10).toFixed(0)} mm)
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Hauteur (H en cm)</Label>
                  <Input
                    type="number"
                    min="20"
                    max="400"
                    step="0.5"
                    value={hauteurCm}
                    onChange={(e) => setHauteurCm(Math.max(10, Number(e.target.value) || 0))}
                    className="font-mono text-sm font-bold"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Ex: 140 cm ({(hauteurCm * 10).toFixed(0)} mm)
                  </span>
                </div>
              </div>

              {/* Profondeur (if cuisine) */}
              {category === "cuisine" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Profondeur Caisson (P en cm)</Label>
                  <Input
                    type="number"
                    min="20"
                    max="100"
                    step="1"
                    value={profondeurCm}
                    onChange={(e) => setProfondeurCm(Number(e.target.value) || 60)}
                    className="font-mono text-sm font-bold"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Standard : 60 cm ({(profondeurCm * 10).toFixed(0)} mm)
                  </span>
                </div>
              )}

              {/* Quantité & Emplacement */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Quantité</Label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={quantite}
                    onChange={(e) => setQuantite(Math.max(1, Number(e.target.value) || 1))}
                    className="font-mono text-sm font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Repère / Emplacement</Label>
                  <Input
                    value={emplacement}
                    onChange={(e) => setEmplacement(e.target.value)}
                    placeholder="Ex: F1 - Salon"
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Séries & Teinte */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Série Profilé</Label>
                  <Input
                    value={serie}
                    onChange={(e) => setSerie(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Couleur / Finition</Label>
                  <Select value={couleurAlu} onValueChange={setCouleurAlu}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COULEURS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Vitrage / Remplissage */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Vitrage ou Remplissage</Label>
                <Select value={vitrageType} onValueChange={setVitrageType}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(VITRAGES_BY_CAT[category] || ["Simple 6mm"]).map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Estimation financière */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Poids Aluminium Estimé :</span>
                  <span className="font-mono font-bold text-foreground">
                    {currentResult.poidsEstimeKg} kg
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Surface Totale :</span>
                  <span className="font-mono font-bold text-foreground">
                    {currentResult.surfaceTotaleM2} m²
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Coût Revient Estimé :</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    ~{currentResult.prixRevientEstimeDt} DT
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm">
                  <span className="font-bold text-foreground">Prix de Vente Conseillé :</span>
                  <span className="font-mono text-base font-black text-emerald-600">
                    {currentResult.prixVenteSuggereDt} DT
                  </span>
                </div>
              </div>

              {/* Buttons: Add to project & Print */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                <Button
                  onClick={handleAddToProject}
                  className="flex-1 bg-primary text-white hover:bg-primary/90 text-xs font-semibold h-9 sm:h-10 btn-3d"
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Ajouter au Projet
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsPrintSheetOpen(true)}
                  className="text-xs h-9 sm:h-10"
                >
                  <Printer className="mr-1.5 h-4 w-4" /> Fiche Atelier
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================================================================ */}
        {/* RIGHT COLUMN: Interactive Visualizer & Tabs (7 cols)            */}
        {/* ================================================================ */}
        <div className="space-y-4 lg:col-span-7">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex w-full overflow-x-auto no-scrollbar gap-1 p-1 bg-muted/60 justify-start sm:grid sm:grid-cols-5 rounded-lg border">
              <TabsTrigger value="schema" className="shrink-0 whitespace-nowrap px-3 py-1.5 text-xs flex items-center gap-1.5 font-medium">
                <Ruler className="h-3.5 w-3.5" />
                <span>Schéma</span>
              </TabsTrigger>
              <TabsTrigger value="debitage" className="shrink-0 whitespace-nowrap px-3 py-1.5 text-xs flex items-center gap-1.5 font-medium">
                <Scissors className="h-3.5 w-3.5" />
                <span>Débitage ({currentResult.pieces.length})</span>
              </TabsTrigger>
              <TabsTrigger value="optimisation" className="shrink-0 whitespace-nowrap px-3 py-1.5 text-xs flex items-center gap-1.5 font-medium">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Barres 6m</span>
              </TabsTrigger>
              <TabsTrigger value="vitrages" className="shrink-0 whitespace-nowrap px-3 py-1.5 text-xs flex items-center gap-1.5 font-medium">
                <PackageCheck className="h-3.5 w-3.5" />
                <span>Accessoires</span>
              </TabsTrigger>
              <TabsTrigger value="project_items" className="shrink-0 whitespace-nowrap px-3 py-1.5 text-xs flex items-center gap-1.5 font-medium">
                <FolderKanban className="h-3.5 w-3.5" />
                <span>Projet ({projectItems.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: ARCHITECTURAL SCHEMATIC DRAWING */}
            <TabsContent value="schema" className="mt-3">
              <SchematicView
                category={currentResult.category}
                subType={currentResult.subType}
                largeurMm={currentResult.largeurMm}
                hauteurMm={currentResult.hauteurMm}
                profondeurMm={currentResult.profondeurMm}
                couleurAlu={currentResult.couleurAlu}
                vitrageType={currentResult.vitrageType}
                titre={currentResult.titre}
              />
            </TabsContent>

            {/* TAB 2: MILLIMETRIC CUTTING LIST */}
            <TabsContent value="debitage" className="mt-3">
              <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-primary" /> Fiche de Débitage Profilés Aluminium
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Coupes exactes avec angles 45° et 90° pour la machine à tronçonner
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {currentResult.pieces.length} pièces
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b bg-muted/40 font-semibold text-muted-foreground">
                        <tr>
                          <th className="py-2 px-3">Désignation</th>
                          <th className="py-2 px-3">Réf. Profil</th>
                          <th className="py-2 px-3 text-right">Longueur (cm)</th>
                          <th className="py-2 px-3 text-center">Qté</th>
                          <th className="py-2 px-3 text-center">Coupe G</th>
                          <th className="py-2 px-3 text-center">Coupe D</th>
                          <th className="py-2 px-3">Usinage / Rôle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {currentResult.pieces.map((p, idx) => (
                          <tr key={p.id} className="hover:bg-muted/30">
                            <td className="py-2.5 px-3 font-semibold text-foreground">
                              {p.designation}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                              {p.profilRef}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="font-mono font-bold text-primary text-sm">
                                {(p.longueurMm / 10).toFixed(1)} cm
                              </span>
                              <span className="text-[10px] text-muted-foreground block leading-none">
                                ({p.longueurMm} mm)
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-foreground">
                              {p.quantite}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                                {p.angleGauche}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                                {p.angleDroit}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-muted-foreground">
                              {p.notes || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: 1D BAR CUTTING OPTIMIZER */}
            <TabsContent value="optimisation" className="mt-3">
              <CuttingOptimizerView groups={currentResult.optimisationBarres} />
            </TabsContent>

            {/* TAB 4: GLAZING & HARDWARE */}
            <TabsContent value="vitrages" className="mt-3 space-y-4">
              {/* Vitrages Table */}
              <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" /> Vitrages & Panneaux
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b bg-muted/40 font-semibold text-muted-foreground">
                      <tr>
                        <th className="py-2 px-3">Type Vitrage / Panneau</th>
                        <th className="py-2 px-3 text-right">L × H (cm)</th>
                        <th className="py-2 px-3 text-center">Qté</th>
                        <th className="py-2 px-3 text-right">Surface (m²)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {currentResult.vitrages.map((v, i) => (
                        <tr key={i} className="hover:bg-muted/30">
                          <td className="py-2 px-3 font-semibold text-foreground">{v.type}</td>
                          <td className="py-2 px-3 text-right">
                            <span className="font-mono font-bold text-foreground">
                              {(v.largeurMm / 10).toFixed(1)} × {(v.hauteurMm / 10).toFixed(1)} cm
                            </span>
                            <span className="text-[10px] text-muted-foreground block leading-none">
                              ({v.largeurMm} × {v.hauteurMm} mm)
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-foreground">
                            {v.quantite}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-primary font-medium">
                            {v.surfaceM2} m²
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Accessoires Table */}
              <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" /> Accessoires & Quincaillerie
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b bg-muted/40 font-semibold text-muted-foreground">
                      <tr>
                        <th className="py-2 px-3">Article</th>
                        <th className="py-2 px-3 text-center">Quantité</th>
                        <th className="py-2 px-3 text-center">Unité</th>
                        <th className="py-2 px-3 text-right">Prix Est.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {currentResult.accessoires.map((a, i) => (
                        <tr key={i} className="hover:bg-muted/30">
                          <td className="py-2 px-3 font-medium text-foreground">{a.nom}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-foreground">
                            {a.quantite}
                          </td>
                          <td className="py-2 px-3 text-center text-muted-foreground">{a.unite}</td>
                          <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                            {a.prixEstime ? `${(a.prixEstime * a.quantite).toFixed(1)} DT` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 5: MULTI-ITEM PROJECT SUMMARY */}
            <TabsContent value="project_items" className="mt-3">
              <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> Articles du Chantier : {projetTitre}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Client : {clientNom || "Non spécifié"} • {projectItems.length} élément(s) ajouté(s)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleExportToDevis}
                      disabled={projectItems.length === 0}
                      className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                    >
                      <FilePlus className="mr-1.5 h-3.5 w-3.5" /> Créer Devis Complet ({projectItems.length})
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {projectItems.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      Aucun article dans ce projet pour l'instant. Configurez votre ouvrage et cliquez sur
                      <strong className="text-foreground"> « Ajouter au Projet »</strong>.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {projectItems.map((item, idx) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg border p-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">
                                #{idx + 1}
                              </Badge>
                              <span className="font-bold text-foreground">{item.titre}</span>
                              {item.emplacement && (
                                <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-muted-foreground">
                                  {item.emplacement}
                                </span>
                              )}
                            </div>
                            <div className="text-muted-foreground">
                              Dimensions : {(item.result.largeurMm / 10).toFixed(1)} × {(item.result.hauteurMm / 10).toFixed(1)} cm (Qté : {item.result.quantiteOuvrage}) • {item.result.serie} • {item.result.couleurAlu}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-mono text-sm font-bold text-foreground">
                                {item.result.prixVenteSuggereDt * item.result.quantiteOuvrage} DT
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {item.result.prixVenteSuggereDt} DT / unité
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleRemoveProjectItem(item.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* Project Totals Card */}
                      <div className="mt-4 rounded-lg bg-muted/40 p-3 text-xs">
                        <div className="flex items-center justify-between font-bold text-foreground">
                          <span>Total Estimé Chantier :</span>
                          <span className="font-mono text-base font-black text-emerald-600">
                            {projectItems.reduce(
                              (sum, it) => sum + it.result.prixVenteSuggereDt * it.result.quantiteOuvrage,
                              0
                            )}{" "}
                            DT
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-muted-foreground text-[11px]">
                          <span>Poids Total Aluminium :</span>
                          <span className="font-mono">
                            {projectItems.reduce((s, it) => s + it.result.poidsEstimeKg, 0).toFixed(1)} kg
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between text-muted-foreground text-[11px]">
                          <span>Surface Totale Vitrée :</span>
                          <span className="font-mono">
                            {projectItems.reduce((s, it) => s + it.result.surfaceTotaleM2, 0).toFixed(2)} m²
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
