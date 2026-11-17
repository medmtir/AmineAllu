import { useState } from "react";
import { OptimizedProfileGroup } from "@/lib/alucalc/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scissors, Layers, CheckCircle2, AlertTriangle, Printer, Sparkles } from "lucide-react";

interface CuttingOptimizerViewProps {
  groups: OptimizedProfileGroup[];
}

export function CuttingOptimizerView({ groups }: CuttingOptimizerViewProps) {
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number>(0);

  if (!groups || groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <Scissors className="mb-2 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm">Aucun profil à optimiser pour cette configuration.</p>
      </div>
    );
  }

  // Aggregate totals
  const totalBarsAll = groups.reduce((acc, g) => acc + g.totalBarres6m, 0);
  const totalLengthMm = groups.reduce((acc, g) => acc + g.totalLongueurUtiliseeMm, 0);
  const totalChuteMm = groups.reduce((acc, g) => acc + g.totalChuteMm, 0);
  const avgChutePct =
    totalLengthMm + totalChuteMm > 0
      ? Number(((totalChuteMm / (totalLengthMm + totalChuteMm)) * 100).toFixed(1))
      : 0;

  const currentGroup = groups[selectedGroupIndex] || groups[0];

  const getEfficiencyBadge = (pct: number) => {
    if (pct < 8) {
      return (
        <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
          <CheckCircle2 className="mr-1 h-3 w-3" /> Chute minimale ({pct}%)
        </Badge>
      );
    }
    if (pct <= 15) {
      return (
        <Badge className="bg-sky-600 text-white hover:bg-sky-700">
          <Sparkles className="mr-1 h-3 w-3" /> Bon rendement ({pct}%)
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-amber-500 text-amber-600">
        <AlertTriangle className="mr-1 h-3 w-3" /> Chute {pct}% (Possibilité de réutiliser)
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-slate-200 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="p-3">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Barres 6.00m Totales
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-foreground">
              {totalBarsAll} <span className="text-xs font-normal text-muted-foreground">barres</span>
            </div>
            <div className="text-[10px] text-muted-foreground">Profilés standard TPR</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="p-3">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Longueur Utilisée
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-primary">
              {(totalLengthMm / 1000).toFixed(1)} <span className="text-xs font-normal text-muted-foreground">m</span>
            </div>
            <div className="text-[10px] text-muted-foreground">{totalLengthMm.toLocaleString()} mm débités</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="p-3">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Chutes Totales
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-amber-600">
              {(totalChuteMm / 1000).toFixed(1)} <span className="text-xs font-normal text-muted-foreground">m</span>
            </div>
            <div className="text-[10px] text-muted-foreground">{totalChuteMm.toLocaleString()} mm restant</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="p-3">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Taux Moyen de Chute
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-foreground">
              {avgChutePct}%
            </div>
            <div className="mt-1">{getEfficiencyBadge(avgChutePct)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Selector Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 border-b pb-2">
        <span className="mr-2 text-xs font-semibold text-muted-foreground flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" /> Profilés :
        </span>
        {groups.map((g, idx) => (
          <Button
            key={g.profilName}
            variant={selectedGroupIndex === idx ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs font-medium"
            onClick={() => setSelectedGroupIndex(idx)}
          >
            {g.profilName}
            <span className="ml-1.5 rounded-full bg-black/10 px-1.5 py-0.2 text-[10px] dark:bg-white/20">
              {g.totalBarres6m}b
            </span>
          </Button>
        ))}
      </div>

      {/* Selected Profile Optimization Detail */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <div>
            <h4 className="font-display text-base font-bold text-foreground">
              Plan de Débitage : {currentGroup.profilName}
            </h4>
            <p className="text-xs text-muted-foreground">
              {currentGroup.totalBarres6m} barre(s) de 6 000 mm • Trait de scie : 4 mm • Taux de perte : {currentGroup.chuteMoyennePct}%
            </p>
          </div>
          <div>{getEfficiencyBadge(currentGroup.chuteMoyennePct)}</div>
        </div>

        {/* List of 6.00m bars */}
        <div className="space-y-4">
          {currentGroup.barres.map((bar) => {
            const usefulPct = ((bar.usedMm / bar.barLengthMm) * 100).toFixed(1);
            return (
              <div
                key={bar.barIndex}
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/40"
              >
                {/* Bar Details Header */}
                <div className="mb-2 flex flex-wrap items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-primary/10 px-2 py-0.5 font-mono font-bold text-primary">
                      Barre #{bar.barIndex} / {currentGroup.totalBarres6m}
                    </span>
                    <span className="font-medium text-foreground">
                      Longueur : 6 000 mm
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>
                      Débité : <strong className="font-mono text-foreground">{bar.usedMm} mm</strong> ({usefulPct}%)
                    </span>
                    <span>•</span>
                    <span>
                      Chute : <strong className="font-mono text-amber-600">{bar.chuteMm} mm</strong> ({bar.tauxChutePct}%)
                    </span>
                  </div>
                </div>

                {/* Visual Bar Graphical Strip */}
                <div className="relative flex h-11 w-full overflow-hidden rounded-md border border-slate-300 bg-slate-200 shadow-inner dark:border-slate-700 dark:bg-slate-800">
                  {bar.pieces.map((p, pIdx) => {
                    const widthPct = (p.lengthMm / bar.barLengthMm) * 100;
                    return (
                      <div
                        key={p.pieceId || pIdx}
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: p.color,
                        }}
                        className="group relative flex h-full items-center justify-center border-r-2 border-white/80 px-1 text-white shadow-sm transition-transform hover:z-10 hover:brightness-110 dark:border-slate-900"
                        title={`${p.label} - ${p.lengthMm} mm`}
                      >
                        <div className="truncate text-center font-mono text-[11px] font-bold leading-tight drop-shadow-sm">
                          {p.lengthMm}
                          <span className="hidden sm:inline font-sans font-normal text-[9px] opacity-90 block">
                            {p.label.split("(")[0]}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Leftover Scrap / Chute */}
                  {bar.chuteMm > 0 && (
                    <div
                      style={{
                        width: `${(bar.chuteMm / bar.barLengthMm) * 100}%`,
                        backgroundImage: `repeating-linear-gradient(45deg, #cbd5e1, #cbd5e1 8px, #e2e8f0 8px, #e2e8f0 16px)`,
                      }}
                      className="flex h-full items-center justify-center border-l border-slate-300 px-1 text-slate-700 font-mono text-[10px] font-bold dark:border-slate-600 dark:text-slate-800"
                      title={`Chute non utilisée: ${bar.chuteMm} mm`}
                    >
                      <span className="truncate bg-white/80 px-1 rounded shadow-xs">
                        Chute {bar.chuteMm}mm
                      </span>
                    </div>
                  )}
                </div>

                {/* Pieces breakdown list under bar */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-muted-foreground font-medium">Découpes :</span>
                  {bar.pieces.map((p, i) => (
                    <div
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded border bg-white px-2 py-0.5 text-[11px] shadow-xs dark:bg-slate-900"
                    >
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="font-medium text-foreground">{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
