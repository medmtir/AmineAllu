export type OuvrageCategory =
  | "coulissant"
  | "battant"
  | "volet_roulant"
  | "cuisine"
  | "moustiquaire"
  | "fixe";

export type CoulissantType = "coulissant_2v" | "coulissant_3v" | "coulissant_4v";
export type BattantType = "battant_1v" | "battant_2v" | "soufflet" | "porte_entree";
export type VoletType = "monobloc_manuel" | "monobloc_moteur" | "tunnel_moteur";
export type CuisineType = "meuble_bas" | "meuble_haut" | "armoire_colonne" | "tiroirs";
export type MoustiquaireType = "enroulable_verticale" | "plissee_laterale" | "coulissante_cadre";

export interface ProfileCutPiece {
  id: string;
  designation: string; // ex: "Dormant Haut", "Ouvrant Montant"
  profilRef: string; // ex: "TPR-6701", "TPR-4502"
  longueurMm: number;
  quantite: number;
  angleGauche: "45°" | "90°";
  angleDroit: "45°" | "90°";
  couleur?: string;
  notes?: string;
}

export interface VitragePiece {
  id: string;
  type: string; // "Simple 6mm", "Double 4/12/4", "Alucobond 4mm", etc.
  largeurMm: number;
  hauteurMm: number;
  quantite: number;
  surfaceM2: number;
  notes?: string;
}

export interface AccessoireItem {
  id: string;
  nom: string;
  reference?: string;
  quantite: number;
  unite: "pcs" | "m" | "paire" | "kit";
  prixEstime?: number;
}

export interface BarCutOptimization {
  barIndex: number;
  barLengthMm: number; // usually 6000 mm
  pieces: Array<{
    pieceId: string;
    label: string;
    lengthMm: number;
    color: string;
  }>;
  usedMm: number;
  chuteMm: number;
  tauxChutePct: number;
}

export interface OptimizedProfileGroup {
  profilName: string;
  totalBarres6m: number;
  totalLongueurUtiliseeMm: number;
  totalChuteMm: number;
  chuteMoyennePct: number;
  barres: BarCutOptimization[];
}

export interface WorkshopCostRates {
  prixKgAluminium: number; // Prix d'achat du kg d'aluminium TPR (ex: 22.0 DT)
  prixM2VitrageSimple: number; // Prix m² verre simple 6mm (ex: 42.0 DT)
  prixM2VitrageDouble: number; // Prix m² double vitrage 4/12/4 (ex: 85.0 DT)
  prixM2VitrageStopSol: number; // Prix m² verre stop-sol (ex: 65.0 DT)
  prixM2Alucobond: number; // Prix m² Alucobond 4mm (ex: 55.0 DT)
  prixM2ToileMoustiquaire: number; // Prix m² toile moustiquaire (ex: 28.0 DT)
  mainDoeuvreM2: number; // Façonnage et main d'œuvre atelier par m² (ex: 35.0 DT)
  margeBeneficiairePct: number; // Marge commerciale en % (ex: 35%)
}

export const DEFAULT_WORKSHOP_RATES: WorkshopCostRates = {
  prixKgAluminium: 22.0,
  prixM2VitrageSimple: 42.0,
  prixM2VitrageDouble: 85.0,
  prixM2VitrageStopSol: 65.0,
  prixM2Alucobond: 55.0,
  prixM2ToileMoustiquaire: 28.0,
  mainDoeuvreM2: 35.0,
  margeBeneficiairePct: 35.0,
};

export interface OuvrageCalculationResult {
  category: OuvrageCategory;
  subType: string;
  titre: string;
  largeurMm: number;
  hauteurMm: number;
  profondeurMm?: number;
  quantiteOuvrage: number;
  serie: string;
  couleurAlu: string;
  vitrageType: string;

  // Detailed cutting list
  pieces: ProfileCutPiece[];

  // Glazing or Panels list
  vitrages: VitragePiece[];

  // Hardware / Accessories list
  accessoires: AccessoireItem[];

  // 1D Bar cutting optimization
  optimisationBarres: OptimizedProfileGroup[];

  // Financial & material estimations
  poidsEstimeKg: number;
  surfaceTotaleM2: number;
  coutAluDt: number;
  coutVitrageDt: number;
  coutAccessoiresDt: number;
  coutMainDoeuvreDt: number;
  prixRevientEstimeDt: number;
  tauxMargePct: number;
  prixVenteSuggereDt: number;
  beneficeEstimeDt: number;
}

export interface AtelierProjetItem {
  id: string;
  titre: string;
  emplacement?: string; // ex: "Salon", "Chambre parents"
  params: {
    category: OuvrageCategory;
    subType: string;
    largeurMm: number;
    hauteurMm: number;
    profondeurMm?: number;
    quantite: number;
    serie: string;
    couleurAlu: string;
    vitrageType: string;
    options?: Record<string, any>;
  };
  result: OuvrageCalculationResult;
}

export interface AtelierProjet {
  id: string;
  titreProjet: string; // ex: "Chantier Villa Sousse"
  clientId?: string;
  clientNom?: string;
  dateCreation: string;
  dateMiseAJour: string;
  articles: AtelierProjetItem[];
  notes?: string;
}
