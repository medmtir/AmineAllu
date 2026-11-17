import { useRef } from "react";
import { OuvrageCalculationResult } from "@/lib/alucalc/types";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, CheckSquare } from "lucide-react";
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
          <span className="font-semibold text-sm">Fiche de Débitage & Fabrication Atelier (A4)</span>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} className="bg-primary text-white hover:bg-primary/90 btn-3d">
            <Printer className="mr-1.5 h-4 w-4" /> Imprimer la Fiche d'Atelier
          </Button>
        </div>
      </div>

      {/* Printable Document Container */}
      <div
        ref={printRef}
        id="workshop-printable-doc"
        className="mx-auto w-full max-w-[850px] bg-white p-6 text-slate-900 shadow-md print:m-0 print:w-full print:max-w-none print:p-2 print:shadow-none"
        style={{
          fontFamily: "Arial, Helvetica, sans-serif",
          color: "#0f172a",
        }}
      >
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: "#0284c7" }}>
                {COMPANY.name}
              </h1>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Menuiserie Aluminium & Volets Roulants • Spécialiste TPR
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Route El Borjin, Ouerdanine, Monastir • Tél : 24 587 206
              </p>
            </div>

            <div className="text-right">
              <div className="inline-block rounded border-2 border-slate-900 bg-slate-100 px-3 py-1 text-sm font-black uppercase text-slate-900">
                FICHE D'ATELIER #FAB-{new Date().getFullYear()}-{String(Math.floor(Math.random() * 900) + 100)}
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Date : {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Top 2-Column: Specifications + Architectural Drawing */}
        <div className="mt-3 grid grid-cols-12 gap-3 border-b-2 border-slate-900 pb-3">
          {/* Left: Metadata */}
          <div className="col-span-7 space-y-2 text-xs">
            <div className="rounded border border-slate-300 bg-slate-50 p-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-bold text-slate-600 uppercase text-[10px]">Client :</span>
                  <div className="font-black text-sm text-slate-900">{clientNom}</div>
                </div>
                <div>
                  <span className="font-bold text-slate-600 uppercase text-[10px]">Chantier / Projet :</span>
                  <div className="font-bold text-slate-900">{projetTitre}</div>
                </div>
              </div>
            </div>

            <div className="rounded border border-slate-300 p-2.5">
              <div className="font-black text-sm text-slate-900 border-b pb-1 mb-1.5 flex items-center justify-between">
                <span>{result.titre}</span>
                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-900 font-bold">
                  Quantité : {result.quantiteOuvrage}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <div>
                  <span className="font-bold text-slate-600">Dimensions :</span>{" "}
                  <strong className="font-mono text-sm text-blue-800">
                    {(result.largeurMm / 10).toFixed(1)} × {(result.hauteurMm / 10).toFixed(1)} cm
                  </strong>
                  <span className="text-[10px] text-slate-500 block">({result.largeurMm} × {result.hauteurMm} mm)</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600">Gamme :</span>{" "}
                  <span className="font-semibold text-slate-900">{result.serie}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600">Teinte Alu :</span>{" "}
                  <span className="font-semibold text-slate-900">{result.couleurAlu}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600">Vitrage :</span>{" "}
                  <span className="font-semibold text-slate-900">{result.vitrageType}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Clean Drawing without buttons */}
          <div className="col-span-5 flex flex-col items-center justify-center rounded border border-slate-300 bg-slate-50/50 p-1">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Schéma Côté (Vue Extérieure)
            </span>
            <div className="w-full flex items-center justify-center">
              <SchematicView
                category={result.category}
                subType={result.subType}
                largeurMm={result.largeurMm}
                hauteurMm={result.hauteurMm}
                profondeurMm={result.profondeurMm}
                couleurAlu={result.couleurAlu}
                vitrageType={result.vitrageType}
                titre={result.titre}
                printMode={true}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Tableau de Débitage des Profilés */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1">
              <span>Fiche de Débitage des Profilés Aluminium (Coupes Scie)</span>
            </h2>
            <span className="text-[10px] text-slate-600 italic">
              Trait de scie : 4 mm • Profilés TPR 6.00 m • {result.pieces.length} repères
            </span>
          </div>

          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-2 border-slate-900 bg-slate-200 text-[11px] font-bold text-slate-900">
                <th className="py-1 px-1.5 border-r border-slate-400 text-center w-8">Rep.</th>
                <th className="py-1 px-2 border-r border-slate-400">Désignation</th>
                <th className="py-1 px-2 border-r border-slate-400">Réf. Profil</th>
                <th className="py-1 px-2 border-r border-slate-400 text-right">Longueur</th>
                <th className="py-1 px-1 border-r border-slate-400 text-center w-10">Qté</th>
                <th className="py-1 px-1.5 border-r border-slate-400 text-center">Coupe G</th>
                <th className="py-1 px-1.5 border-r border-slate-400 text-center">Coupe D</th>
                <th className="py-1 px-2 border-r border-slate-400">Usinage / Trous / Notes</th>
                <th className="py-1 px-1 text-center w-12">Pointage</th>
              </tr>
            </thead>
            <tbody>
              {result.pieces.map((p, idx) => (
                <tr
                  key={p.id}
                  className={`border-b border-slate-300 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                >
                  <td className="py-1 px-1.5 border-r border-slate-300 font-mono font-bold text-center text-slate-800">
                    P{idx + 1}
                  </td>
                  <td className="py-1 px-2 border-r border-slate-300 font-bold text-slate-900">
                    {p.designation}
                  </td>
                  <td className="py-1 px-2 border-r border-slate-300 font-mono text-[11px] text-slate-700">
                    {p.profilRef}
                  </td>
                  <td className="py-1 px-2 border-r border-slate-300 text-right">
                    <span className="font-mono font-black text-sm text-blue-800">
                      {(p.longueurMm / 10).toFixed(1)} cm
                    </span>
                    <span className="text-[10px] text-slate-500 block leading-none font-normal">
                      ({p.longueurMm} mm)
                    </span>
                  </td>
                  <td className="py-1 px-1 border-r border-slate-300 text-center font-black text-slate-900 text-sm">
                    {p.quantite}
                  </td>
                  <td className="py-1 px-1.5 border-r border-slate-300 text-center font-mono font-bold text-slate-800">
                    <span className="rounded bg-slate-200 px-1 py-0.5 text-[10px]">{p.angleGauche}</span>
                  </td>
                  <td className="py-1 px-1.5 border-r border-slate-300 text-center font-mono font-bold text-slate-800">
                    <span className="rounded bg-slate-200 px-1 py-0.5 text-[10px]">{p.angleDroit}</span>
                  </td>
                  <td className="py-1 px-2 border-r border-slate-300 text-[11px] text-slate-600">
                    {p.notes || "—"}
                  </td>
                  <td className="py-1 px-1 text-center">
                    <div className="mx-auto h-4 w-4 rounded border border-slate-400 bg-white" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3: Vitrages & Accessoires (Side by Side) */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          {/* Vitrages */}
          <div>
            <h2 className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-900">
              Découpe Vitrages & Remplissages
            </h2>
            <table className="w-full border-collapse text-left text-xs border border-slate-300">
              <thead>
                <tr className="border-b border-slate-400 bg-slate-200 text-[10px] font-bold text-slate-900">
                  <th className="py-1 px-1.5">Type</th>
                  <th className="py-1 px-1.5 text-right">L × H (cm)</th>
                  <th className="py-1 px-1 text-center">Qté</th>
                  <th className="py-1 px-1.5 text-right">Surface</th>
                </tr>
              </thead>
              <tbody>
                {result.vitrages.map((v, i) => (
                  <tr key={i} className="border-b border-slate-200">
                    <td className="py-1 px-1.5 font-semibold text-slate-900">{v.type}</td>
                    <td className="py-1 px-1.5 text-right font-mono font-bold text-slate-800">
                      {(v.largeurMm / 10).toFixed(1)} × {(v.hauteurMm / 10).toFixed(1)}
                    </td>
                    <td className="py-1 px-1 text-center font-bold text-slate-900">{v.quantite}</td>
                    <td className="py-1 px-1.5 text-right font-mono text-slate-700">{v.surfaceM2} m²</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Accessoires */}
          <div>
            <h2 className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-900">
              Quincaillerie & Accessoires à Préparer
            </h2>
            <table className="w-full border-collapse text-left text-xs border border-slate-300">
              <thead>
                <tr className="border-b border-slate-400 bg-slate-200 text-[10px] font-bold text-slate-900">
                  <th className="py-1 px-1.5">Article</th>
                  <th className="py-1 px-1 text-center">Qté</th>
                  <th className="py-1 px-1 text-center">Unité</th>
                  <th className="py-1 px-1 text-center">OK</th>
                </tr>
              </thead>
              <tbody>
                {result.accessoires.map((a, i) => (
                  <tr key={i} className="border-b border-slate-200">
                    <td className="py-1 px-1.5 font-medium text-slate-900">{a.nom}</td>
                    <td className="py-1 px-1 text-center font-mono font-bold text-slate-800">{a.quantite}</td>
                    <td className="py-1 px-1 text-center text-[10px] text-slate-600">{a.unite}</td>
                    <td className="py-1 px-1 text-center">
                      <div className="mx-auto h-3.5 w-3.5 rounded border border-slate-400 bg-white" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Barres 6.00 m à sortir du stock */}
        <div className="mt-3 rounded border border-slate-400 bg-slate-50 p-2">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-900 mb-1">
            Sortie des Barres 6.00 m (600 cm) du Stock Atelier
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {result.optimisationBarres.map((g) => (
              <div key={g.profilName} className="rounded border bg-white p-1.5">
                <div className="font-bold text-slate-900 text-[11px]">{g.profilName}</div>
                <div className="font-mono text-xs font-black text-blue-800">
                  {g.totalBarres6m} barre(s) de 600 cm
                </div>
                <div className="text-[10px] text-slate-500">
                  Chute totale : {(g.totalChuteMm / 10).toFixed(1)} cm ({g.chuteMoyennePct}%)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Visas & Contrôle Qualité */}
        <div className="mt-4 border-t-2 border-slate-900 pt-2">
          <div className="grid grid-cols-2 gap-4 text-center text-xs">
            <div className="h-16 rounded border border-dashed border-slate-400 p-1 flex flex-col justify-between">
              <span className="font-bold text-slate-800">Visa & Date Responsable Débitage</span>
              <span className="text-[9px] text-slate-500">Contrôle des longueurs, angles 45°/90° et bavures</span>
            </div>
            <div className="h-16 rounded border border-dashed border-slate-400 p-1 flex flex-col justify-between">
              <span className="font-bold text-slate-800">Visa Contrôle Qualité & Assemblage</span>
              <span className="text-[9px] text-slate-500">Équerrage, étanchéité joints et coulissement/fermeture</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
