import { useRef } from "react";
import { OuvrageCalculationResult } from "@/lib/alucalc/types";
import { Button } from "@/components/ui/button";
import { Printer, Download, ArrowLeft } from "lucide-react";
import { COMPANY } from "@/lib/format";
import { SchematicView } from "./SchematicView";

interface WorkshopPrintSheetProps {
  result: OuvrageCalculationResult;
  clientNom?: string;
  projetTitre?: string;
  onBack?: () => void;
}

export function WorkshopPrintSheet({
  result,
  clientNom = "Client Particulier",
  projetTitre = "Chantier Résidentiel",
  onBack,
}: WorkshopPrintSheetProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top action bar (hidden on print) */}
      <div className="no-print flex items-center justify-between rounded-lg border bg-white p-3 shadow-xs dark:bg-slate-900">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Retour au Calculateur
            </Button>
          )}
          <span className="font-semibold text-sm">Fiche de Débitage & Fabrication Atelier</span>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} className="bg-primary text-white hover:bg-primary/90">
            <Printer className="mr-1.5 h-4 w-4" /> Imprimer Fiche d'Atelier (A4)
          </Button>
        </div>
      </div>

      {/* Printable Document Container */}
      <div
        ref={printRef}
        id="workshop-printable-doc"
        className="mx-auto w-full max-w-[850px] bg-white p-8 text-slate-900 shadow-md print:m-0 print:w-full print:max-w-none print:p-4 print:shadow-none"
        style={{
          fontFamily: "Arial, Helvetica, sans-serif",
          color: "#0f172a",
        }}
      >
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: "#0284c7" }}>
                {COMPANY.name}
              </h1>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Menuiserie Aluminium & Volets Roulants
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Route El Borjin, Ouerdanine, Monastir • Tél : 24 587 206
              </p>
            </div>

            <div className="text-right">
              <div className="inline-block rounded border-2 border-slate-900 px-3 py-1 text-sm font-black uppercase">
                Fiche d'Atelier #FAB-{new Date().getFullYear()}-{String(Math.floor(Math.random() * 900) + 100)}
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Date : {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Project & Client Card */}
          <div className="mt-4 grid grid-cols-2 gap-3 rounded border border-slate-300 bg-slate-50 p-3 text-xs">
            <div>
              <span className="font-bold text-slate-700">Client :</span>{" "}
              <strong className="text-sm font-bold text-slate-900">{clientNom}</strong>
              <br />
              <span className="font-bold text-slate-700">Projet / Chantier :</span>{" "}
              <span className="font-semibold text-slate-900">{projetTitre}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Ouvrage :</span>{" "}
              <strong className="text-sm font-bold text-slate-900">{result.titre}</strong>
              <br />
              <span className="font-bold text-slate-700">Dimensions :</span>{" "}
              <span className="font-bold text-blue-700">
                L: {(result.largeurMm / 10).toFixed(1)} cm × H: {(result.hauteurMm / 10).toFixed(1)} cm
              </span>{" "}
              (Quantité : <strong>{result.quantiteOuvrage}</strong>)
              <br />
              <span className="font-bold text-slate-700">Série & Teinte :</span>{" "}
              <span className="font-medium text-slate-800">
                {result.serie} • {result.couleurAlu}
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Architectural Drawing */}
        <div className="mt-4 border-b pb-4">
          <h2 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <span>1. Schéma Technique Côté (Vue Extérieure)</span>
          </h2>
          <div className="flex justify-center p-2 bg-slate-50 border border-slate-200 rounded">
            <SchematicView
              category={result.category}
              subType={result.subType}
              largeurMm={result.largeurMm}
              hauteurMm={result.hauteurMm}
              profondeurMm={result.profondeurMm}
              couleurAlu={result.couleurAlu}
              vitrageType={result.vitrageType}
              titre={result.titre}
            />
          </div>
        </div>

        {/* Section 2: Tableau de Débitage des Profilés */}
        <div className="mt-5">
          <h2 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-900 flex items-center justify-between">
            <span>2. Fiche de Débitage Profilés Aluminium (Coupes en cm)</span>
            <span className="text-[11px] font-normal text-slate-600">
              {result.pieces.length} repères de coupe
            </span>
          </h2>

          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-200 text-[11px] font-bold text-slate-900">
                <th className="py-1.5 px-2">Rep.</th>
                <th className="py-1.5 px-2">Désignation</th>
                <th className="py-1.5 px-2">Réf. Profil</th>
                <th className="py-1.5 px-2 text-right">Longueur (cm)</th>
                <th className="py-1.5 px-2 text-center">Qté</th>
                <th className="py-1.5 px-2 text-center">Coupe G</th>
                <th className="py-1.5 px-2 text-center">Coupe D</th>
                <th className="py-1.5 px-2">Usinage & Notes</th>
              </tr>
            </thead>
            <tbody>
              {result.pieces.map((p, idx) => (
                <tr
                  key={p.id}
                  className={`border-b border-slate-200 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                >
                  <td className="py-1.5 px-2 font-mono font-bold text-slate-700">P{idx + 1}</td>
                  <td className="py-1.5 px-2 font-semibold text-slate-900">{p.designation}</td>
                  <td className="py-1.5 px-2 font-mono text-[11px] text-slate-700">{p.profilRef}</td>
                  <td className="py-1.5 px-2 text-right">
                    <span className="font-mono font-black text-sm text-blue-700">
                      {(p.longueurMm / 10).toFixed(1)} cm
                    </span>
                    <span className="text-[10px] text-slate-500 block font-normal leading-none">
                      ({p.longueurMm} mm)
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-center font-bold text-slate-900">{p.quantite}</td>
                  <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-800">
                    <span className="rounded bg-slate-200 px-1.5 py-0.5">{p.angleGauche}</span>
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-800">
                    <span className="rounded bg-slate-200 px-1.5 py-0.5">{p.angleDroit}</span>
                  </td>
                  <td className="py-1.5 px-2 text-[11px] text-slate-600">{p.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3: Vitrages / Panneaux & Accessoires */}
        <div className="mt-5 grid grid-cols-2 gap-4">
          {/* Vitrages / Panneaux */}
          <div>
            <h2 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-900">
              3. Vitrages & Remplissages
            </h2>
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-200 text-[11px] font-bold text-slate-900">
                  <th className="py-1 px-2">Type</th>
                  <th className="py-1 px-2 text-right">L × H (cm)</th>
                  <th className="py-1 px-2 text-center">Qté</th>
                  <th className="py-1 px-2 text-right">Surface</th>
                </tr>
              </thead>
              <tbody>
                {result.vitrages.map((v, i) => (
                  <tr key={i} className="border-b border-slate-200">
                    <td className="py-1.5 px-2 font-semibold text-slate-900">{v.type}</td>
                    <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-800">
                      {(v.largeurMm / 10).toFixed(1)} × {(v.hauteurMm / 10).toFixed(1)} cm
                    </td>
                    <td className="py-1.5 px-2 text-center font-bold text-slate-900">{v.quantite}</td>
                    <td className="py-1.5 px-2 text-right font-mono text-slate-700">{v.surfaceM2} m²</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Accessoires & Quincaillerie */}
          <div>
            <h2 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-900">
              4. Quincaillerie & Accessoires
            </h2>
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-200 text-[11px] font-bold text-slate-900">
                  <th className="py-1 px-2">Article</th>
                  <th className="py-1 px-2 text-center">Quantité</th>
                  <th className="py-1 px-2 text-center">Unité</th>
                </tr>
              </thead>
              <tbody>
                {result.accessoires.map((a, i) => (
                  <tr key={i} className="border-b border-slate-200">
                    <td className="py-1.5 px-2 font-medium text-slate-900">{a.nom}</td>
                    <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-800">{a.quantite}</td>
                    <td className="py-1.5 px-2 text-center text-slate-600">{a.unite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Récapitulatif Barres 6m à sortir du stock */}
        <div className="mt-5 rounded border border-slate-300 bg-slate-50 p-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
            5. Récapitulatif des Barres de 6,00 m (600 cm) à Sortir du Stock
          </h2>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            {result.optimisationBarres.map((g) => (
              <div key={g.profilName} className="rounded border bg-white p-2">
                <div className="font-bold text-slate-900">{g.profilName}</div>
                <div className="mt-1 font-mono text-sm font-black text-blue-700">
                  {g.totalBarres6m} barre(s) de 600 cm
                </div>
                <div className="text-[10px] text-slate-500">
                  Perte / Chute : {g.chuteMoyennePct}% ({(g.totalChuteMm / 10).toFixed(1)} cm)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Signatures & Quality Control */}
        <div className="mt-8 border-t-2 border-slate-900 pt-4">
          <div className="grid grid-cols-2 gap-8 text-center text-xs">
            <div className="h-24 rounded border border-dashed border-slate-400 p-2">
              <span className="font-bold text-slate-700">Visa Responsable Débitage</span>
              <p className="mt-1 text-[10px] text-slate-500">Vérification des longueurs et angles</p>
            </div>
            <div className="h-24 rounded border border-dashed border-slate-400 p-2">
              <span className="font-bold text-slate-700">Contrôle Qualité Assemblage</span>
              <p className="mt-1 text-[10px] text-slate-500">Équerrage, étanchéité & quincaillerie</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
