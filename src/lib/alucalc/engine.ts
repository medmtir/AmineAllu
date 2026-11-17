import {
  OuvrageCategory,
  OuvrageCalculationResult,
  ProfileCutPiece,
  VitragePiece,
  AccessoireItem,
  OptimizedProfileGroup,
  BarCutOptimization,
} from "./types";

// Standard aluminium bar length in Tunisia (TPR): 6000 mm
export const STANDARD_BAR_LENGTH = 6000;
// Saw blade cutting kerf width (perte de trait de scie) in mm
export const SAW_KERF_MM = 4;

const PALETTE = [
  "#0284c7", // sky-600
  "#16a34a", // green-600
  "#d97706", // amber-600
  "#9333ea", // purple-600
  "#dc2626", // red-600
  "#0891b2", // cyan-600
  "#4f46e5", // indigo-600
  "#e11d48", // rose-600
];

/**
 * 1D Cutting Stock Optimizer (Best-Fit Decreasing)
 * Takes a list of cuts of the same profile and packs them into 6.00m bars
 */
export function optimizeBarsForProfile(
  profilName: string,
  pieces: Array<{ id: string; label: string; lengthMm: number; count: number }>,
  barLength = STANDARD_BAR_LENGTH,
  kerf = SAW_KERF_MM
): OptimizedProfileGroup {
  // Expand count into individual items
  const allItems: Array<{ id: string; label: string; lengthMm: number; color: string }> = [];
  pieces.forEach((p, idx) => {
    const color = PALETTE[idx % PALETTE.length];
    for (let c = 0; c < p.count; c++) {
      allItems.push({
        id: `${p.id}-${c + 1}`,
        label: p.label,
        lengthMm: p.lengthMm,
        color,
      });
    }
  });

  // Sort descending by length
  allItems.sort((a, b) => b.lengthMm - a.lengthMm);

  const bars: BarCutOptimization[] = [];

  for (const item of allItems) {
    if (item.lengthMm > barLength) {
      // Piece longer than a standard bar
      bars.push({
        barIndex: bars.length + 1,
        barLengthMm: barLength,
        pieces: [item],
        usedMm: item.lengthMm,
        chuteMm: 0,
        tauxChutePct: 0,
      });
      continue;
    }

    // Try to find the best existing bar that can fit this piece (least remaining space)
    let bestBarIdx = -1;
    let minLeftover = Infinity;

    for (let b = 0; b < bars.length; b++) {
      const currentBar = bars[b];
      const spaceNeeded = currentBar.pieces.length > 0 ? item.lengthMm + kerf : item.lengthMm;
      const leftover = barLength - (currentBar.usedMm + spaceNeeded);

      if (leftover >= 0 && leftover < minLeftover) {
        bestBarIdx = b;
        minLeftover = leftover;
      }
    }

    if (bestBarIdx !== -1) {
      // Fit into existing bar
      const bar = bars[bestBarIdx];
      const spaceNeeded = bar.pieces.length > 0 ? item.lengthMm + kerf : item.lengthMm;
      bar.pieces.push(item);
      bar.usedMm += spaceNeeded;
      bar.chuteMm = Math.max(0, barLength - bar.usedMm);
      bar.tauxChutePct = Number(((bar.chuteMm / barLength) * 100).toFixed(1));
    } else {
      // Open a new bar
      const newBar: BarCutOptimization = {
        barIndex: bars.length + 1,
        barLengthMm: barLength,
        pieces: [item],
        usedMm: item.lengthMm,
        chuteMm: barLength - item.lengthMm,
        tauxChutePct: Number((((barLength - item.lengthMm) / barLength) * 100).toFixed(1)),
      };
      bars.push(newBar);
    }
  }

  const totalLongueurUtilisee = bars.reduce((s, b) => s + b.usedMm, 0);
  const totalChute = bars.reduce((s, b) => s + b.chuteMm, 0);
  const totalBarCapacity = bars.length * barLength;
  const chuteMoyenne = totalBarCapacity > 0 ? (totalChute / totalBarCapacity) * 100 : 0;

  return {
    profilName,
    totalBarres6m: bars.length,
    totalLongueurUtiliseeMm: totalLongueurUtilisee,
    totalChuteMm: totalChute,
    chuteMoyennePct: Number(chuteMoyenne.toFixed(1)),
    barres: bars,
  };
}

/**
 * Main Calculator for all 5 Aluminium categories
 */
export function calculateOuvrage(params: {
  category: OuvrageCategory;
  subType: string;
  largeurMm: number;
  hauteurMm: number;
  profondeurMm?: number;
  quantite: number;
  serie?: string;
  couleurAlu?: string;
  vitrageType?: string;
  options?: Record<string, any>;
}): OuvrageCalculationResult {
  const L = Math.max(100, Math.round(params.largeurMm));
  const H = Math.max(100, Math.round(params.hauteurMm));
  const P = Math.max(50, Math.round(params.profondeurMm || 600));
  const Qty = Math.max(1, Math.round(params.quantite || 1));
  const serie = params.serie || "Série 67 TPR";
  const couleurAlu = params.couleurAlu || "Gris Anthracite (7016)";
  const vitrageType = params.vitrageType || "Double 4/12/4 Clair";

  let titre = "Ouvrage aluminium";
  const pieces: ProfileCutPiece[] = [];
  const vitrages: VitragePiece[] = [];
  const accessoires: AccessoireItem[] = [];

  // =========================================================================
  // 1. COULISSANT (Série 67 / 40 - 2V, 3V, 4V)
  // =========================================================================
  if (params.category === "coulissant") {
    const is3V = params.subType === "coulissant_3v";
    const is4V = params.subType === "coulissant_4v";
    const nbVantaux = is4V ? 4 : is3V ? 3 : 2;

    titre = `Fenêtre / Baie Coulissante ${nbVantaux} vantaux (${serie})`;

    // Dormant 2 rails
    pieces.push({
      id: "dormant-h",
      designation: "Dormant Haut (Rail supérieur)",
      profilRef: "Dormant 2 Rails",
      longueurMm: L,
      quantite: 1 * Qty,
      angleGauche: "45°",
      angleDroit: "45°",
    });
    pieces.push({
      id: "dormant-b",
      designation: "Dormant Bas (Rail inférieur avec rejet d'eau)",
      profilRef: "Dormant 2 Rails",
      longueurMm: L,
      quantite: 1 * Qty,
      angleGauche: "45°",
      angleDroit: "45°",
    });
    pieces.push({
      id: "dormant-lat",
      designation: "Dormant Latéral (Gauche & Droit)",
      profilRef: "Dormant 2 Rails",
      longueurMm: H,
      quantite: 2 * Qty,
      angleGauche: "45°",
      angleDroit: "45°",
    });

    // Ouvrant Montants (2 par vantail)
    // Hauteur Ouvrant = H - 48 mm
    const hOuvrant = Math.max(50, H - 48);
    pieces.push({
      id: "ouvrant-montant",
      designation: `Montant d'ouvrant (${nbVantaux} vantaux)`,
      profilRef: "Montant Ouvrant",
      longueurMm: hOuvrant,
      quantite: nbVantaux * 2 * Qty,
      angleGauche: "45°",
      angleDroit: "45°",
    });

    // Ouvrant Traverses (2 par vantail)
    // Pour 2V: L_ouvrant = (L + 6) / 2
    // Pour 3V: L_ouvrant = (L + 12) / 3
    // Pour 4V: L_ouvrant = (L + 16) / 4
    const lOuvrant = Math.max(
      50,
      Math.round(is4V ? (L + 16) / 4 : is3V ? (L + 12) / 3 : (L + 6) / 2)
    );
    pieces.push({
      id: "ouvrant-traverse",
      designation: `Traverse d'ouvrant Haut/Bas (${nbVantaux} vantaux)`,
      profilRef: "Traverse Ouvrant",
      longueurMm: lOuvrant,
      quantite: nbVantaux * 2 * Qty,
      angleGauche: "45°",
      angleDroit: "45°",
    });

    // Chicanes centrales
    const nbChicanes = is4V ? 3 : is3V ? 2 : 1;
    pieces.push({
      id: "chicane",
      designation: "Chicane centrale / Renfort étanchéité",
      profilRef: "Profil Chicane",
      longueurMm: hOuvrant - 8,
      quantite: nbChicanes * 2 * Qty,
      angleGauche: "90°",
      angleDroit: "90°",
    });

    // Vitrage (1 vitre par vantail)
    const lVitre = Math.max(40, lOuvrant - 108);
    const hVitre = Math.max(40, hOuvrant - 108);
    const surfUnit = (lVitre * hVitre) / 1_000_000;
    vitrages.push({
      id: "vitre-coulissant",
      type: vitrageType,
      largeurMm: lVitre,
      hauteurMm: hVitre,
      quantite: nbVantaux * Qty,
      surfaceM2: Number((surfUnit * nbVantaux * Qty).toFixed(3)),
      notes: `${nbVantaux} vitres découpées pour châssis ${L}x${H} mm`,
    });

    // Accessoires
    accessoires.push({
      id: "roulettes",
      nom: "Roulettes doubles à aiguilles réglables",
      quantite: nbVantaux * 2 * Qty,
      unite: "pcs",
      prixEstime: 14,
    });
    accessoires.push({
      id: "cremone",
      nom: "Fermeture crémone encastrée / Poignée coquille",
      quantite: (nbVantaux > 2 ? 2 : 1) * Qty,
      unite: "pcs",
      prixEstime: 38,
    });
    accessoires.push({
      id: "joint-brosse",
      nom: "Joint brosse d'étanchéité (Fin-Seal)",
      quantite: Math.ceil(((nbVantaux * 4 * hOuvrant + nbVantaux * 4 * lOuvrant) / 1000) * Qty),
      unite: "m",
      prixEstime: 1.5,
    });
    accessoires.push({
      id: "bouchons",
      nom: "Kit bouchons d'étanchéité & guides d'ouvrant",
      quantite: 1 * Qty,
      unite: "kit",
      prixEstime: 22,
    });
  }

  // =========================================================================
  // 2. BATTANT & OSCILLO-BATTANT (Série 45 / 52)
  // =========================================================================
  else if (params.category === "battant") {
    const is2V = params.subType === "battant_2v";
    const isPorte = params.subType === "porte_entree";
    const isSoufflet = params.subType === "soufflet";

    titre = isPorte
      ? `Porte d'entrée battante alu (${serie})`
      : isSoufflet
      ? `Châssis à soufflet / Abattant (${serie})`
      : `Fenêtre battante ${is2V ? "2 vantaux" : "1 vantail"} (${serie})`;

    // Dormant
    pieces.push({
      id: "dormant-h",
      designation: "Dormant Haut",
      profilRef: "Dormant Battant 45mm",
      longueurMm: L,
      quantite: 1 * Qty,
      angleGauche: "45°",
      angleDroit: "45°",
    });
    if (!isPorte) {
      pieces.push({
        id: "dormant-b",
        designation: "Dormant Bas",
        profilRef: "Dormant Battant 45mm",
        longueurMm: L,
        quantite: 1 * Qty,
        angleGauche: "45°",
        angleDroit: "45°",
      });
    } else {
      pieces.push({
        id: "seuil-porte",
        designation: "Seuil plat aluminium anodisé (PMR)",
        profilRef: "Seuil Porte 15mm",
        longueurMm: L - 60,
        quantite: 1 * Qty,
        angleGauche: "90°",
        angleDroit: "90°",
      });
    }
    pieces.push({
      id: "dormant-lat",
      designation: "Dormant Latéral (Gauche & Droit)",
      profilRef: "Dormant Battant 45mm",
      longueurMm: H,
      quantite: 2 * Qty,
      angleGauche: "45°",
      angleDroit: "45°",
    });

    // Ouvrant(s)
    const nbOuvrants = is2V ? 2 : 1;
    const hOuvrant = Math.max(50, H - (isPorte ? 35 : 52));
    const lOuvrant = Math.max(
      50,
      is2V ? Math.round((L - 58) / 2) : L - 52
    );

    pieces.push({
      id: "ouvrant-lat",
      designation: `Montants d'ouvrant (${nbOuvrants}V)`,
      profilRef: isPorte ? "Profilé Porte Lourd" : "Ouvrant Battant",
      longueurMm: hOuvrant,
      quantite: nbOuvrants * 2 * Qty,
      angleGauche: "45°",
      angleDroit: "45°",
    });
    pieces.push({
      id: "ouvrant-horiz",
      designation: `Traverses d'ouvrant (${nbOuvrants}V)`,
      profilRef: isPorte ? "Profilé Porte Lourd" : "Ouvrant Battant",
      longueurMm: lOuvrant,
      quantite: nbOuvrants * 2 * Qty,
      angleGauche: "45°",
      angleDroit: "45°",
    });

    if (is2V) {
      pieces.push({
        id: "battement-central",
        designation: "Profilé Battement central rapporté",
        profilRef: "Battement Central",
        longueurMm: hOuvrant - 50,
        quantite: 1 * Qty,
        angleGauche: "90°",
        angleDroit: "90",
      });
    }

    // Parcloses
    const lParclose = Math.max(30, lOuvrant - 94);
    const hParclose = Math.max(30, hOuvrant - 94);
    pieces.push({
      id: "parclose-h",
      designation: "Parcloses horizontales",
      profilRef: "Parclose arrondie",
      longueurMm: lParclose,
      quantite: nbOuvrants * 2 * Qty,
      angleGauche: "45°",
      angleDroit: "45°",
    });
    pieces.push({
      id: "parclose-v",
      designation: "Parcloses verticales",
      profilRef: "Parclose arrondie",
      longueurMm: hParclose,
      quantite: nbOuvrants * 2 * Qty,
      angleGauche: "45°",
      angleDroit: "45°",
    });

    // Vitrage / Panneau
    const lVitre = Math.max(30, lOuvrant - 106);
    const hVitre = Math.max(30, hOuvrant - 106);
    vitrages.push({
      id: "vitre-battant",
      type: isPorte ? "Panneau Alucobond sandwich + Vitrage" : vitrageType,
      largeurMm: lVitre,
      hauteurMm: hVitre,
      quantite: nbOuvrants * Qty,
      surfaceM2: Number((((lVitre * hVitre) / 1_000_000) * nbOuvrants * Qty).toFixed(3)),
    });

    // Accessoires
    accessoires.push({
      id: "paumelles",
      nom: isPorte ? "Paumelles renforcées 3 lames pour porte" : "Paumelles aluminium battant",
      quantite: (isPorte ? 3 : 2) * nbOuvrants * Qty,
      unite: "pcs",
      prixEstime: isPorte ? 28 : 12,
    });
    accessoires.push({
      id: "serrure",
      nom: isPorte ? "Serrure multipoints 3 pênes + Cylindre sécurité" : "Poignée crémone oscillo-battante",
      quantite: 1 * Qty,
      unite: "pcs",
      prixEstime: isPorte ? 85 : 35,
    });
    accessoires.push({
      id: "equerres",
      nom: "Équerres d'assemblage à sertir / visser (Dormant + Ouvrant)",
      quantite: (8 + nbOuvrants * 8) * Qty,
      unite: "pcs",
      prixEstime: 2.2,
    });
    accessoires.push({
      id: "joint-epdm",
      nom: "Joint central & joint de frappe EPDM",
      quantite: Math.ceil(((2 * L + 2 * H + nbOuvrants * (2 * lOuvrant + 2 * hOuvrant)) / 1000) * Qty),
      unite: "m",
      prixEstime: 2.0,
    });
  }

  // =========================================================================
  // 3. VOLET ROULANT / RIDEAU ALU (Manuel ou Motorisé)
  // =========================================================================
  else if (params.category === "volet_roulant") {
    const isMoteur = params.subType.includes("moteur");
    const hauteurCoffre = H > 2200 ? 205 : H > 1600 ? 180 : 165;
    const hauteurCoulisse = Math.max(100, H - hauteurCoffre);
    const lamePas = 45; // lame alu 45mm avec mousse
    const nbLames = Math.ceil((hauteurCoulisse + 150) / lamePas);
    const longLame = Math.max(50, L - 52); // jeu de 26mm dans chaque coulisse
    const longTube = Math.max(50, L - 65);

    titre = `Volet Roulant / Rideau Alu ${isMoteur ? "Motorisé" : "Manuel"} (Coffre ${hauteurCoffre}mm)`;

    // Coffre / Caisson (Face avant, sous-face, face arrière)
    pieces.push({
      id: "coffre-face",
      designation: `Coffre caisson alu profilé (${hauteurCoffre} mm)`,
      profilRef: "Caisson Alu",
      longueurMm: L,
      quantite: 1 * Qty,
      angleGauche: "90°",
      angleDroit: "90°",
    });
    pieces.push({
      id: "coffre-sous-face",
      designation: "Sous-face démontable caisson alu",
      profilRef: "Sous-face Caisson",
      longueurMm: L,
      quantite: 1 * Qty,
      angleGauche: "90°",
      angleDroit: "90°",
    });

    // Tube d'enroulement (Axe octogonal)
    pieces.push({
      id: "axe-tube",
      designation: "Axe d'enroulement Tube octogonal acier galva Ø60",
      profilRef: "Tube Octogonal 60mm",
      longueurMm: longTube,
      quantite: 1 * Qty,
      angleGauche: "90°",
      angleDroit: "90°",
    });

    // Coulisses latérales avec joint brosse
    pieces.push({
      id: "coulisses",
      designation: "Coulisses latérales de guidage (Gauche & Droit)",
      profilRef: "Coulisse Alu 53x22",
      longueurMm: hauteurCoulisse,
      quantite: 2 * Qty,
      angleGauche: "90°",
      angleDroit: "90°",
    });

    // Lames aluminium isolées
    pieces.push({
      id: "lames-alu",
      designation: `Lames aluminium thermo-phoniques 45mm (${nbLames} lames)`,
      profilRef: "Lame Alu 45mm Mousse",
      longueurMm: longLame,
      quantite: nbLames * Qty,
      angleGauche: "90°",
      angleDroit: "90°",
    });

    // Lame finale d'arrêt
    pieces.push({
      id: "lame-finale",
      designation: "Lame finale renforcée avec joint caoutchouc",
      profilRef: "Lame Finale Alu",
      longueurMm: longLame,
      quantite: 1 * Qty,
      angleGauche: "90°",
      angleDroit: "90°",
    });

    // Vitrage / Tablier surface
    vitrages.push({
      id: "tablier-surface",
      type: "Tablier aluminium isolé 45mm",
      largeurMm: longLame,
      hauteurMm: hauteurCoulisse,
      quantite: 1 * Qty,
      surfaceM2: Number((((longLame * hauteurCoulisse) / 1_000_000) * Qty).toFixed(3)),
      notes: "Surface du tablier de rideau alu",
    });

    // Accessoires
    if (isMoteur) {
      accessoires.push({
        id: "moteur",
        nom: "Moteur tubulaire électrique (20Nm/30Nm) avec support & adaptateur",
        quantite: 1 * Qty,
        unite: "pcs",
        prixEstime: 135,
      });
      accessoires.push({
        id: "interrupteur",
        nom: "Inverseur mural montée/descente ou récepteur radio",
        quantite: 1 * Qty,
        unite: "pcs",
        prixEstime: 25,
      });
    } else {
      accessoires.push({
        id: "treuil",
        nom: "Treuil à couple réducteur + Manivelle articulée alu",
        quantite: 1 * Qty,
        unite: "kit",
        prixEstime: 45,
      });
    }

    accessoires.push({
      id: "joues",
      nom: `Paire de flasques / Joues latérales caisson ${hauteurCoffre}mm`,
      quantite: 1 * Qty,
      unite: "paire",
      prixEstime: 22,
    });
    accessoires.push({
      id: "attaches",
      nom: "Attaches tablier rigides anti-soulèvement (Sécurité)",
      quantite: Math.max(2, Math.ceil(L / 600)) * Qty,
      unite: "pcs",
      prixEstime: 6,
    });
    accessoires.push({
      id: "embouts",
      nom: "Embouts de guidage latéraux de lames (Kit)",
      quantite: Math.ceil(nbLames * 2) * Qty,
      unite: "pcs",
      prixEstime: 0.5,
    });
  }

  // =========================================================================
  // 4. CUISINE ALUMINIUM (Meubles bas, hauts, façades Alucobond)
  // =========================================================================
  else if (params.category === "cuisine") {
    const isHaut = params.subType === "meuble_haut";
    const hMeuble = isHaut ? Math.min(H, 800) : H;
    const pMeuble = isHaut ? Math.min(P, 400) : P;
    const nbPortes = L > 900 ? 3 : L > 450 ? 2 : 1;
    const lPorte = Math.round((L - 10 - (nbPortes - 1) * 3) / nbPortes);
    const hPorte = isHaut ? hMeuble - 10 : hMeuble - 120; // espace pieds et plan

    titre = isHaut
      ? `Meuble Haut Cuisine Alu (${nbPortes} Portes)`
      : `Élément Bas Cuisine Alu (${nbPortes} Portes)`;

    // Profilés structure caisson
    pieces.push({
      id: "montants-caisson",
      designation: "Montants verticaux cadre caisson (Angles)",
      profilRef: "Tube Rectangulaire Cuisine 40x20",
      longueurMm: hMeuble - 20,
      quantite: 4 * Qty,
      angleGauche: "90°",
      angleDroit: "90°",
    });
    pieces.push({
      id: "traverses-larg",
      designation: "Traverses horizontales façade & fond",
      profilRef: "Tube Rectangulaire Cuisine 40x20",
      longueurMm: L - 40,
      quantite: 4 * Qty,
      angleGauche: "90°",
      angleDroit: "90°",
    });
    pieces.push({
      id: "traverses-prof",
      designation: "Traverses de profondeur (Côtés)",
      profilRef: "Tube Rectangulaire Cuisine 40x20",
      longueurMm: pMeuble - 40,
      quantite: 4 * Qty,
      angleGauche: "90°",
      angleDroit: "90°",
    });

    // Profilés Cadres de portes alu (Profil poignée intégrée)
    pieces.push({
      id: "porte-montant-poignee",
      designation: "Montant de porte avec profil poignée intégrée",
      profilRef: "Profil Poignée Porte Cuisine",
      longueurMm: hPorte,
      quantite: nbPortes * Qty,
      angleGauche: "45°",
      angleDroit: "45°",
    });
    pieces.push({
      id: "porte-montant-charniere",
      designation: "Montant de porte côté charnière",
      profilRef: "Profil Cadre Porte Cuisine",
      longueurMm: hPorte,
      quantite: nbPortes * Qty,
      angleGauche: "45°",
      angleDroit: "45°",
    });
    pieces.push({
      id: "porte-traverses",
      designation: "Traverses Haut/Bas cadre de porte",
      profilRef: "Profil Cadre Porte Cuisine",
      longueurMm: lPorte,
      quantite: nbPortes * 2 * Qty,
      angleGauche: "45°",
      angleDroit: "45°",
    });

    // Remplissage des façades (Alucobond / Verre laqué)
    const lPanneau = lPorte - 38;
    const hPanneau = hPorte - 38;
    vitrages.push({
      id: "panneau-porte",
      type: "Panneau Alucobond 4mm / Verre laqué",
      largeurMm: lPanneau,
      hauteurMm: hPanneau,
      quantite: nbPortes * Qty,
      surfaceM2: Number((((lPanneau * hPanneau) / 1_000_000) * nbPortes * Qty).toFixed(3)),
      notes: `Remplissage pour ${nbPortes} portes de cuisine`,
    });

    // Panneaux côtés & fond de caisson
    vitrages.push({
      id: "panneaux-caisson",
      type: "Alucobond 3mm fond et côtés",
      largeurMm: pMeuble - 45,
      hauteurMm: hMeuble - 45,
      quantite: 2 * Qty,
      surfaceM2: Number(((((pMeuble - 45) * (hMeuble - 45)) / 1_000_000) * 2 * Qty).toFixed(3)),
      notes: "Côtés gauche et droit caisson alu",
    });

    // Accessoires
    accessoires.push({
      id: "charnieres",
      nom: "Charnières invisibles alu avec amortisseur (Soft Close)",
      quantite: nbPortes * 2 * Qty,
      unite: "pcs",
      prixEstime: 8.5,
    });
    if (!isHaut) {
      accessoires.push({
        id: "pieds",
        nom: "Pieds réglables aluminium 10cm avec clips plinthe",
        quantite: 4 * Qty,
        unite: "pcs",
        prixEstime: 5.0,
      });
    } else {
      accessoires.push({
        id: "attaches-meuble",
        nom: "Attaches murales réglables invisibles pour meuble haut",
        quantite: 2 * Qty,
        unite: "paire",
        prixEstime: 15,
      });
    }
    accessoires.push({
      id: "equerres-cuisine",
      nom: "Équerres de liaison caisson aluminium renforcées",
      quantite: 16 * Qty,
      unite: "pcs",
      prixEstime: 1.5,
    });
  }

  // =========================================================================
  // 5. MOUSTIQUAIRE (Enroulable, Plissée, Coulissante)
  // =========================================================================
  else if (params.category === "moustiquaire") {
    const isPlissee = params.subType === "plissee_laterale";
    const isCoulissante = params.subType === "coulissante_cadre";

    titre = isPlissee
      ? "Moustiquaire Plissée latérale"
      : isCoulissante
      ? "Moustiquaire Coulissante sur cadre"
      : "Moustiquaire Enroulable verticale";

    if (isPlissee) {
      pieces.push({
        id: "rail-haut-bas",
        designation: "Rail guide aluminium Haut & Bas",
        profilRef: "Guide Plissé Extra-plat",
        longueurMm: L,
        quantite: 2 * Qty,
        angleGauche: "90°",
        angleDroit: "90°",
      });
      pieces.push({
        id: "profil-lat",
        designation: "Profil latéral coffre & fermeture aimantée",
        profilRef: "Profil Plissé Latéral",
        longueurMm: H,
        quantite: 2 * Qty,
        angleGauche: "90°",
        angleDroit: "90°",
      });

      vitrages.push({
        id: "toile-plissee",
        type: "Toile plissée polyester noire haute résistance",
        largeurMm: L,
        hauteurMm: H,
        quantite: 1 * Qty,
        surfaceM2: Number((((L * H) / 1_000_000) * Qty).toFixed(3)),
      });

      accessoires.push({
        id: "kit-fils",
        nom: "Kit fils de guidage kevlar & chaînette de roulement",
        quantite: 1 * Qty,
        unite: "kit",
        prixEstime: 48,
      });
    } else if (isCoulissante) {
      pieces.push({
        id: "cadre-moust-h",
        designation: "Cadre moustiquaire coulissante Haut/Bas",
        profilRef: "Profil Cadre Moustiquaire",
        longueurMm: Math.round(L / 2) + 10,
        quantite: 2 * Qty,
        angleGauche: "45°",
        angleDroit: "45°",
      });
      pieces.push({
        id: "cadre-moust-v",
        designation: "Cadre moustiquaire coulissante Montants",
        profilRef: "Profil Cadre Moustiquaire",
        longueurMm: H - 25,
        quantite: 2 * Qty,
        angleGauche: "45°",
        angleDroit: "45°",
      });

      vitrages.push({
        id: "toile-fibre",
        type: "Toile moustiquaire fibre de verre grise",
        largeurMm: Math.round(L / 2) + 20,
        hauteurMm: H - 15,
        quantite: 1 * Qty,
        surfaceM2: Number(((((Math.round(L / 2) + 20) * (H - 15)) / 1_000_000) * Qty).toFixed(3)),
      });

      accessoires.push({
        id: "roulettes-moust",
        nom: "Roulettes spécifiques moustiquaire coulissante",
        quantite: 2 * Qty,
        unite: "pcs",
        prixEstime: 8,
      });
      accessoires.push({
        id: "joint-brosse-moust",
        nom: "Brosse d'étanchéité anti-insectes",
        quantite: Math.ceil(((2 * H + L) / 1000) * Qty),
        unite: "m",
        prixEstime: 1.2,
      });
    } else {
      // Enroulable standard
      pieces.push({
        id: "coffre-enrouleur",
        designation: "Coffre enrouleur aluminium avec ressort",
        profilRef: "Coffre Moustiquaire 42mm",
        longueurMm: L,
        quantite: 1 * Qty,
        angleGauche: "90°",
        angleDroit: "90°",
      });
      pieces.push({
        id: "glissieres",
        designation: "Glissières latérales avec brosse coupe-vent",
        profilRef: "Glissière Moustiquaire 32x22",
        longueurMm: H - 45,
        quantite: 2 * Qty,
        angleGauche: "90°",
        angleDroit: "90°",
      });
      pieces.push({
        id: "barre-tirage",
        designation: "Barre de tirage / Lame finale avec joint",
        profilRef: "Barre de tirage",
        longueurMm: L - 25,
        quantite: 1 * Qty,
        angleGauche: "90°",
        angleDroit: "90°",
      });

      vitrages.push({
        id: "toile-enroulable",
        type: "Toile fibre de verre enduite PVC grise",
        largeurMm: L - 20,
        hauteurMm: H + 100,
        quantite: 1 * Qty,
        surfaceM2: Number(((((L - 20) * (H + 100)) / 1_000_000) * Qty).toFixed(3)),
      });

      accessoires.push({
        id: "ressort",
        nom: "Kit mécanisme à ressort & frein de remontée lente",
        quantite: 1 * Qty,
        unite: "kit",
        prixEstime: 32,
      });
      accessoires.push({
        id: "bloqueurs",
        nom: "Poignées de tirage & crochets de verrouillage bas",
        quantite: 1 * Qty,
        unite: "paire",
        prixEstime: 12,
      });
    }
  }

  // =========================================================================
  // 6. CHÂSSIS FIXE / SÉPARATION VITRÉE
  // =========================================================================
  else {
    titre = `Châssis Fixe vitré aluminium (${serie})`;

    pieces.push({
      id: "dormant-fixe-h",
      designation: "Dormant Haut/Bas Châssis Fixe",
      profilRef: "Dormant Fixe 45mm",
      longueurMm: L,
      quantite: 2 * Qty,
      angleGauche: "45°",
      angleDroit: "45°",
    });
    pieces.push({
      id: "dormant-fixe-v",
      designation: "Dormant Latéral Châssis Fixe",
      profilRef: "Dormant Fixe 45mm",
      longueurMm: H,
      quantite: 2 * Qty,
      angleGauche: "45°",
      angleDroit: "45°",
    });

    const lParclose = Math.max(30, L - 90);
    const hParclose = Math.max(30, H - 90);
    pieces.push({
      id: "parclose-h",
      designation: "Parcloses horizontales",
      profilRef: "Parclose Fixe",
      longueurMm: lParclose,
      quantite: 2 * Qty,
      angleGauche: "45°",
      angleDroit: "45°",
    });
    pieces.push({
      id: "parclose-v",
      designation: "Parcloses verticales",
      profilRef: "Parclose Fixe",
      longueurMm: hParclose,
      quantite: 2 * Qty,
      angleGauche: "45°",
      angleDroit: "45°",
    });

    const lVitre = Math.max(30, L - 100);
    const hVitre = Math.max(30, H - 100);
    vitrages.push({
      id: "vitre-fixe",
      type: vitrageType,
      largeurMm: lVitre,
      hauteurMm: hVitre,
      quantite: 1 * Qty,
      surfaceM2: Number((((lVitre * hVitre) / 1_000_000) * Qty).toFixed(3)),
    });

    accessoires.push({
      id: "cales-vitrage",
      nom: "Cales de vitrage & équerres à pion",
      quantite: 8 * Qty,
      unite: "pcs",
      prixEstime: 1.5,
    });
    accessoires.push({
      id: "joint-parclose",
      nom: "Joint EPDM à lèvre pour vitrage",
      quantite: Math.ceil(((2 * L + 2 * H) / 1000) * Qty),
      unite: "m",
      prixEstime: 2.0,
    });
  }

  // =========================================================================
  // 1D BAR CUTTING OPTIMIZATION (Group pieces by profilRef)
  // =========================================================================
  const groupsByRef: Record<string, Array<{ id: string; label: string; lengthMm: number; count: number }>> = {};

  pieces.forEach((p) => {
    if (!groupsByRef[p.profilRef]) {
      groupsByRef[p.profilRef] = [];
    }
    groupsByRef[p.profilRef].push({
      id: p.id,
      label: `${p.designation} (${p.longueurMm}mm ${p.angleGauche})`,
      lengthMm: p.longueurMm,
      count: p.quantite,
    });
  });

  const optimisationBarres: OptimizedProfileGroup[] = Object.entries(groupsByRef).map(
    ([profilRef, items]) => optimizeBarsForProfile(profilRef, items)
  );

  // Estimates
  const totalMeters = pieces.reduce((s, p) => s + (p.longueurMm * p.quantite) / 1000, 0);
  const totalVitrageM2 = vitrages.reduce((s, v) => s + v.surfaceM2, 0);
  const totalAccCost = accessoires.reduce((s, a) => s + (a.prixEstime || 0) * a.quantite, 0);

  // Approximate weight: 1.2 kg per meter of alu profile
  const poidsEstimeKg = Number((totalMeters * 1.25).toFixed(1));
  const surfaceTotaleM2 = Number(((L * H) / 1_000_000).toFixed(2)) * Qty;

  // Approximate prices (Tunisian market average):
  // Aluminium: ~22 DT / kg finished profile
  // Vitrage simple/double: ~45 - 85 DT / m²
  const aluCost = poidsEstimeKg * 22;
  const glassCost = totalVitrageM2 * (vitrageType.includes("Double") ? 85 : 45);
  const mainDoeuvre = surfaceTotaleM2 * 45; // ~45 DT / m² fabrication + pose
  const prixRevientEstimeDt = Math.round(aluCost + glassCost + totalAccCost + mainDoeuvre);
  const prixVenteSuggereDt = Math.round(prixRevientEstimeDt * 1.35); // 35% margin

  return {
    category: params.category,
    subType: params.subType,
    titre,
    largeurMm: L,
    hauteurMm: H,
    profondeurMm: P,
    quantiteOuvrage: Qty,
    serie,
    couleurAlu,
    vitrageType,
    pieces,
    vitrages,
    accessoires,
    optimisationBarres,
    poidsEstimeKg,
    surfaceTotaleM2,
    prixRevientEstimeDt,
    prixVenteSuggereDt,
  };
}
