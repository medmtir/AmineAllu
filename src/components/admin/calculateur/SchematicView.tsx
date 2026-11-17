import { useState, useRef } from "react";
import { OuvrageCategory } from "@/lib/alucalc/types";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Download, Eye, EyeOff } from "lucide-react";

interface SchematicViewProps {
  category: OuvrageCategory;
  subType: string;
  largeurMm: number;
  hauteurMm: number;
  profondeurMm?: number;
  couleurAlu: string;
  vitrageType: string;
  titre: string;
}

export function SchematicView({
  category,
  subType,
  largeurMm,
  hauteurMm,
  profondeurMm = 600,
  couleurAlu,
  vitrageType,
  titre,
}: SchematicViewProps) {
  const [zoom, setZoom] = useState(1);
  const [showCotations, setShowCotations] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);

  const L = Math.max(200, largeurMm || 1000);
  const H = Math.max(200, hauteurMm || 1000);

  // SVG viewBox margins for dimension lines
  const padL = showCotations ? 140 : 40;
  const padT = showCotations ? 100 : 40;
  const padR = 40;
  const padB = showCotations ? 100 : 40;

  const vbX = -padL;
  const vbY = -padT;
  const vbW = L + padL + padR;
  const vbH = H + padT + padB;

  // Frame colors
  const getColorStyles = (color: string) => {
    const c = color.toLowerCase();
    if (c.includes("noir")) {
      return { fill: "#1e293b", stroke: "#0f172a", sashFill: "#334155" };
    }
    if (c.includes("anthracite") || c.includes("7016")) {
      return { fill: "#334155", stroke: "#1e293b", sashFill: "#475569" };
    }
    if (c.includes("bois") || c.includes("chêne")) {
      return { fill: "#78350f", stroke: "#451a03", sashFill: "#92400e" };
    }
    if (c.includes("bronze") || c.includes("champagne")) {
      return { fill: "#78716c", stroke: "#44403c", sashFill: "#a8a29e" };
    }
    if (c.includes("argent") || c.includes("9006")) {
      return { fill: "#94a3b8", stroke: "#64748b", sashFill: "#cbd5e1" };
    }
    // Default Blanc 9010
    return { fill: "#f1f5f9", stroke: "#94a3b8", sashFill: "#e2e8f0" };
  };

  const frameColors = getColorStyles(couleurAlu);

  // Glass styles
  const isStopSol = vitrageType.toLowerCase().includes("stop-sol");
  const isSable = vitrageType.toLowerCase().includes("sablé");
  const isDouble = vitrageType.toLowerCase().includes("double");
  const isAluco = vitrageType.toLowerCase().includes("alucobond");

  const downloadSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `schema-${category}-${(L / 10).toFixed(0)}x${(H / 10).toFixed(0)}cm.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Standard frame profiles thickness in mm
  const frameThick = 45;
  const sashThick = 52;

  const formatCm = (mm: number) => {
    const cm = mm / 10;
    return Number.isInteger(cm) ? `${cm}` : cm.toFixed(1);
  };

  return (
    <div className="relative flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      {/* Top Toolbar */}
      <div className="mb-3 flex w-full flex-wrap items-center justify-between gap-2 border-b pb-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
          <span>{titre}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-bold text-foreground">
            {formatCm(L)} × {formatCm(H)} cm
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setShowCotations(!showCotations)}
            title="Afficher/Masquer cotations"
          >
            {showCotations ? <Eye className="mr-1 h-3.5 w-3.5" /> : <EyeOff className="mr-1 h-3.5 w-3.5" />}
            Cotations
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
            title="Zoom avant"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
            title="Zoom arrière"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setZoom(1)}
            title="Réinitialiser zoom"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={downloadSvg}
            title="Télécharger dessin SVG"
          >
            <Download className="mr-1 h-3.5 w-3.5" />
            SVG
          </Button>
        </div>
      </div>

      {/* SVG Canvas Container with interactive zoom */}
      <div className="flex max-h-[560px] w-full items-center justify-center overflow-auto rounded-lg bg-slate-50/50 p-2 dark:bg-slate-900/30">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
            transition: "transform 0.15s ease-out",
          }}
          className="flex items-center justify-center"
        >
          <svg
            ref={svgRef}
            viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
            className="max-h-[500px] w-auto drop-shadow-sm select-none"
            style={{ width: `${Math.min(700, Math.max(300, (L / Math.max(L, H)) * 600))}px` }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Arrow markers for cotations */}
              <marker
                id="arrow-end"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284c7" />
              </marker>
              <marker
                id="arrow-start"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 8 1.5 L 0 5 L 8 8.5 z" fill="#0284c7" />
              </marker>

              {/* Glass Reflection Gradient */}
              <linearGradient id="glassReflect" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop
                  offset="0%"
                  stopColor={isStopSol ? "#78350f" : isSable ? "#f1f5f9" : isAluco ? "#94a3b8" : "#e0f2fe"}
                  stopOpacity={isAluco ? "1" : isSable ? "0.9" : isStopSol ? "0.6" : "0.55"}
                />
                <stop
                  offset="45%"
                  stopColor={isStopSol ? "#b45309" : isSable ? "#ffffff" : isAluco ? "#cbd5e1" : "#bae6fd"}
                  stopOpacity={isAluco ? "1" : isSable ? "0.95" : isStopSol ? "0.5" : "0.4"}
                />
                <stop
                  offset="70%"
                  stopColor={isStopSol ? "#92400e" : isSable ? "#f8fafc" : isAluco ? "#64748b" : "#7dd3fc"}
                  stopOpacity={isAluco ? "1" : isSable ? "0.9" : isStopSol ? "0.6" : "0.5"}
                />
              </linearGradient>

              {/* Mesh pattern for Moustiquaire */}
              <pattern id="meshPattern" width="6" height="6" patternUnits="userSpaceOnUse">
                <path d="M 0 3 L 6 3 M 3 0 L 3 6" stroke="#475569" strokeWidth="0.5" opacity="0.6" />
              </pattern>

              {/* Aluminium slat pattern for Volet */}
              <pattern id="slatPattern" width="100" height="45" patternUnits="userSpaceOnUse">
                <rect width="100" height="43" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" />
                <line x1="0" y1="21" x2="100" y2="21" stroke="#e2e8f0" strokeWidth="0.5" />
              </pattern>
            </defs>

            {/* ============================================================== */}
            {/* 1. COTATIONS (DIMENSION LINES)                                 */}
            {/* ============================================================== */}
            {showCotations && (
              <g className="cotations text-slate-700 font-sans">
                {/* Horizontal Top Width Cotation */}
                <line x1="0" y1="-45" x2={L} y2="-45" stroke="#0284c7" strokeWidth="2.5" markerEnd="url(#arrow-end)" markerStart="url(#arrow-start)" />
                <line x1="0" y1="-10" x2="0" y2="-65" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />
                <line x1={L} y1="-10" x2={L} y2="-65" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />
                <rect x={L / 2 - 60} y="-65" width="120" height="26" fill="#ffffff" rx="4" stroke="#0284c7" strokeWidth="1" />
                <text x={L / 2} y="-47" textAnchor="middle" fill="#0284c7" fontSize="16" fontWeight="bold">
                  L = {formatCm(L)} cm
                </text>

                {/* Vertical Left Height Cotation */}
                <line x1="-55" y1="0" x2="-55" y2={H} stroke="#0284c7" strokeWidth="2.5" markerEnd="url(#arrow-end)" markerStart="url(#arrow-start)" />
                <line x1="-10" y1="0" x2="-75" y2="0" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="-10" y1={H} x2="-75" y2={H} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />
                <g transform={`rotate(-90, -55, ${H / 2})`}>
                  <rect x={-55 - 60} y={H / 2 - 13} width="120" height="26" fill="#ffffff" rx="4" stroke="#0284c7" strokeWidth="1" />
                  <text x={-55} y={H / 2 + 5} textAnchor="middle" fill="#0284c7" fontSize="16" fontWeight="bold">
                    H = {formatCm(H)} cm
                  </text>
                </g>
              </g>
            )}

            {/* ============================================================== */}
            {/* 2. CATEGORY SPECIFIC SCHEMATICS                                */}
            {/* ============================================================== */}

            {/* A. COULISSANT (2V, 3V, 4V) */}
            {category === "coulissant" && (
              <g className="coulissant-schema">
                {/* Dormant Frame (Outer) */}
                <rect
                  x="0"
                  y="0"
                  width={L}
                  height={H}
                  fill={frameColors.fill}
                  stroke={frameColors.stroke}
                  strokeWidth="3"
                  rx="3"
                />
                {/* Inner track bed */}
                <rect
                  x={frameThick}
                  y={frameThick}
                  width={L - 2 * frameThick}
                  height={H - 2 * frameThick}
                  fill="#f1f5f9"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />

                {/* Draw Vantaux */}
                {(() => {
                  const numVantaux = subType === "coulissant_4v" ? 4 : subType === "coulissant_3v" ? 3 : 2;
                  const innerW = L - 2 * frameThick;
                  const innerH = H - 2 * frameThick;

                  // Overlap chicanes
                  const overlap = 32;
                  const vWidth = Math.round((innerW + (numVantaux - 1) * overlap) / numVantaux);

                  return Array.from({ length: numVantaux }).map((_, idx) => {
                    const vx = frameThick + idx * (vWidth - overlap);
                    const vy = frameThick;
                    const vh = innerH;
                    const isEven = idx % 2 === 0;

                    return (
                      <g key={idx} className={`vantail-${idx + 1}`}>
                        {/* Sash Frame */}
                        <rect
                          x={vx}
                          y={vy}
                          width={vWidth}
                          height={vh}
                          fill={isEven ? frameColors.sashFill : frameColors.fill}
                          stroke={frameColors.stroke}
                          strokeWidth="2"
                          rx="2"
                        />
                        {/* Glass Area */}
                        <rect
                          x={vx + sashThick}
                          y={vy + sashThick}
                          width={vWidth - 2 * sashThick}
                          height={vh - 2 * sashThick}
                          fill="url(#glassReflect)"
                          stroke="#94a3b8"
                          strokeWidth="1"
                        />
                        {/* Glass Reflection Streak */}
                        <line
                          x1={vx + sashThick + 20}
                          y1={vy + sashThick + 20}
                          x2={vx + vWidth - sashThick - 30}
                          y2={vy + (vh - 2 * sashThick) * 0.6}
                          stroke="#ffffff"
                          strokeWidth="3"
                          opacity="0.45"
                          strokeLinecap="round"
                        />

                        {/* Sliding Arrow Direction */}
                        <g transform={`translate(${vx + vWidth / 2}, ${vy + vh - 25})`}>
                          <circle r="14" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" />
                          <text
                            x="0"
                            y="5"
                            textAnchor="middle"
                            fill="#0284c7"
                            fontSize="16"
                            fontWeight="bold"
                          >
                            {numVantaux === 4
                              ? idx < 2
                                ? "◀"
                                : "▶"
                              : idx % 2 === 0
                              ? "▶"
                              : "◀"}
                          </text>
                        </g>

                        {/* Sash width indicator inside */}
                        {showCotations && (
                          <text
                            x={vx + vWidth / 2}
                            y={vy + 35}
                            textAnchor="middle"
                            fill="#475569"
                            fontSize="12"
                            fontWeight="600"
                          >
                            V{idx + 1}: {formatCm(vWidth)} cm
                          </text>
                        )}
                      </g>
                    );
                  });
                })()}
              </g>
            )}

            {/* B. BATTANT (1V, 2V, Soufflet, Porte d'entrée) */}
            {category === "battant" && (
              <g className="battant-schema">
                {/* Dormant Frame */}
                <rect
                  x="0"
                  y="0"
                  width={L}
                  height={H}
                  fill={frameColors.fill}
                  stroke={frameColors.stroke}
                  strokeWidth="3.5"
                  rx="2"
                />

                {subType === "battant_2v" ? (
                  // 2 Vantaux
                  (() => {
                    const vW = (L - 2 * frameThick) / 2;
                    const vH = H - 2 * frameThick;
                    return (
                      <>
                        {/* Left Sash */}
                        <g>
                          <rect
                            x={frameThick}
                            y={frameThick}
                            width={vW}
                            height={vH}
                            fill={frameColors.sashFill}
                            stroke={frameColors.stroke}
                            strokeWidth="2.5"
                          />
                          <rect
                            x={frameThick + sashThick}
                            y={frameThick + sashThick}
                            width={vW - 2 * sashThick}
                            height={vH - 2 * sashThick}
                            fill="url(#glassReflect)"
                            stroke="#94a3b8"
                            strokeWidth="1"
                          />
                          {/* Opening dashed triangle (Hinges left, apex right center) */}
                          <polyline
                            points={`${frameThick},${frameThick} ${frameThick + vW},${frameThick + vH / 2} ${frameThick},${frameThick + vH}`}
                            fill="none"
                            stroke="#0284c7"
                            strokeWidth="2"
                            strokeDasharray="6 6"
                          />
                          {/* Left sash handle */}
                          <rect
                            x={frameThick + vW - 16}
                            y={frameThick + vH / 2 - 20}
                            width="6"
                            height="40"
                            fill="#1e293b"
                            rx="2"
                          />
                        </g>

                        {/* Right Sash */}
                        <g>
                          <rect
                            x={frameThick + vW}
                            y={frameThick}
                            width={vW}
                            height={vH}
                            fill={frameColors.sashFill}
                            stroke={frameColors.stroke}
                            strokeWidth="2.5"
                          />
                          <rect
                            x={frameThick + vW + sashThick}
                            y={frameThick + sashThick}
                            width={vW - 2 * sashThick}
                            height={vH - 2 * sashThick}
                            fill="url(#glassReflect)"
                            stroke="#94a3b8"
                            strokeWidth="1"
                          />
                          {/* Opening dashed triangle (Hinges right, apex left center) */}
                          <polyline
                            points={`${frameThick + 2 * vW},${frameThick} ${frameThick + vW},${frameThick + vH / 2} ${frameThick + 2 * vW},${frameThick + vH}`}
                            fill="none"
                            stroke="#0284c7"
                            strokeWidth="2"
                            strokeDasharray="6 6"
                          />
                          {/* Main Cremone Handle */}
                          <rect
                            x={frameThick + vW + 8}
                            y={frameThick + vH / 2 - 25}
                            width="8"
                            height="50"
                            fill="#0f172a"
                            rx="2"
                          />
                        </g>
                      </>
                    );
                  })()
                ) : subType === "soufflet" ? (
                  // Soufflet (Top/Bottom Hopper)
                  (() => {
                    const vW = L - 2 * frameThick;
                    const vH = H - 2 * frameThick;
                    return (
                      <g>
                        <rect
                          x={frameThick}
                          y={frameThick}
                          width={vW}
                          height={vH}
                          fill={frameColors.sashFill}
                          stroke={frameColors.stroke}
                          strokeWidth="2.5"
                        />
                        <rect
                          x={frameThick + sashThick}
                          y={frameThick + sashThick}
                          width={vW - 2 * sashThick}
                          height={vH - 2 * sashThick}
                          fill="url(#glassReflect)"
                          stroke="#94a3b8"
                          strokeWidth="1"
                        />
                        {/* Hopper dashed triangle (apex bottom center, bases top corners) */}
                        <polyline
                          points={`${frameThick},${frameThick} ${frameThick + vW / 2},${frameThick + vH} ${frameThick + vW},${frameThick}`}
                          fill="none"
                          stroke="#0284c7"
                          strokeWidth="2.5"
                          strokeDasharray="6 6"
                        />
                        {/* Top catch lock handle */}
                        <rect
                          x={frameThick + vW / 2 - 18}
                          y={frameThick + 12}
                          width="36"
                          height="12"
                          fill="#1e293b"
                          rx="3"
                        />
                      </g>
                    );
                  })()
                ) : subType === "porte_entree" ? (
                  // Porte d'entrée
                  (() => {
                    const vW = L - 2 * frameThick;
                    const vH = H - 2 * frameThick;
                    const soubassementH = Math.min(850, vH * 0.4);
                    const glassH = vH - soubassementH - 70;

                    return (
                      <g>
                        {/* Door Sash */}
                        <rect
                          x={frameThick}
                          y={frameThick}
                          width={vW}
                          height={vH}
                          fill={frameColors.sashFill}
                          stroke={frameColors.stroke}
                          strokeWidth="3"
                        />

                        {/* Upper Glazed Part */}
                        <rect
                          x={frameThick + sashThick}
                          y={frameThick + sashThick}
                          width={vW - 2 * sashThick}
                          height={glassH}
                          fill="url(#glassReflect)"
                          stroke="#94a3b8"
                          strokeWidth="1.5"
                        />

                        {/* Intermediate Crossrail (Traverse intermédiaire) */}
                        <rect
                          x={frameThick}
                          y={frameThick + sashThick + glassH}
                          width={vW}
                          height="70"
                          fill={frameColors.fill}
                          stroke={frameColors.stroke}
                          strokeWidth="2"
                        />

                        {/* Lower Solid Panel (Alucobond or Woodgrain) */}
                        <rect
                          x={frameThick + sashThick}
                          y={frameThick + sashThick + glassH + 70}
                          width={vW - 2 * sashThick}
                          height={soubassementH - sashThick}
                          fill={frameColors.fill}
                          stroke="#64748b"
                          strokeWidth="1.5"
                        />
                        {/* Kickplate grooves */}
                        <line
                          x1={frameThick + sashThick + 20}
                          y1={frameThick + vH - 60}
                          x2={frameThick + vW - sashThick - 20}
                          y2={frameThick + vH - 60}
                          stroke="#94a3b8"
                          strokeWidth="2"
                        />

                        {/* Door Lock & Handle */}
                        <g transform={`translate(${frameThick + vW - 35}, ${frameThick + vH * 0.52})`}>
                          <rect x="0" y="0" width="16" height="90" rx="4" fill="#0f172a" />
                          <circle cx="8" cy="22" r="6" fill="#cbd5e1" />
                          <rect x="5" y="55" width="6" height="12" rx="2" fill="#cbd5e1" />
                          {/* Handle lever */}
                          <rect x="-30" y="16" width="35" height="10" rx="3" fill="#334155" />
                        </g>

                        {/* Heavy-duty hinges on left */}
                        <rect x={frameThick - 6} y={frameThick + 60} width="8" height="40" rx="2" fill="#0f172a" />
                        <rect x={frameThick - 6} y={frameThick + vH / 2 - 20} width="8" height="40" rx="2" fill="#0f172a" />
                        <rect x={frameThick - 6} y={frameThick + vH - 100} width="8" height="40" rx="2" fill="#0f172a" />
                      </g>
                    );
                  })()
                ) : (
                  // Battant 1 Vantail
                  (() => {
                    const vW = L - 2 * frameThick;
                    const vH = H - 2 * frameThick;
                    return (
                      <g>
                        <rect
                          x={frameThick}
                          y={frameThick}
                          width={vW}
                          height={vH}
                          fill={frameColors.sashFill}
                          stroke={frameColors.stroke}
                          strokeWidth="2.5"
                        />
                        <rect
                          x={frameThick + sashThick}
                          y={frameThick + sashThick}
                          width={vW - 2 * sashThick}
                          height={vH - 2 * sashThick}
                          fill="url(#glassReflect)"
                          stroke="#94a3b8"
                          strokeWidth="1"
                        />
                        {/* Opening dashed triangle (Hinges left, apex right center) */}
                        <polyline
                          points={`${frameThick},${frameThick} ${frameThick + vW},${frameThick + vH / 2} ${frameThick},${frameThick + vH}`}
                          fill="none"
                          stroke="#0284c7"
                          strokeWidth="2.5"
                          strokeDasharray="6 6"
                        />
                        {/* Oscillo-battant secondary top triangle */}
                        <polyline
                          points={`${frameThick},${frameThick + vH} ${frameThick + vW / 2},${frameThick} ${frameThick + vW},${frameThick + vH}`}
                          fill="none"
                          stroke="#0284c7"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          opacity="0.6"
                        />
                        {/* Handle */}
                        <rect
                          x={frameThick + vW - 18}
                          y={frameThick + vH / 2 - 25}
                          width="8"
                          height="50"
                          fill="#0f172a"
                          rx="2"
                        />
                      </g>
                    );
                  })()
                )}
              </g>
            )}

            {/* C. VOLET ROULANT (RIDEAU ALU) */}
            {category === "volet_roulant" && (
              <g className="volet-schema">
                {(() => {
                  const coffreH = Math.min(240, Math.max(160, Math.round(H * 0.18)));
                  const coulisseW = 35;
                  const tablierH = H - coffreH;
                  const slatHeight = 45;
                  const numSlats = Math.floor(tablierH / slatHeight);

                  return (
                    <>
                      {/* Top Box (Coffre en aluminium 45°) */}
                      <path
                        d={`M 0,0 L ${L},0 L ${L},${coffreH - 25} L ${L - 25},${coffreH} L 0,${coffreH} Z`}
                        fill={frameColors.fill}
                        stroke={frameColors.stroke}
                        strokeWidth="3"
                      />
                      {/* Box Front Inspection Plate groove */}
                      <line
                        x1="10"
                        y1={coffreH - 25}
                        x2={L - 10}
                        y2={coffreH - 25}
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                        strokeDasharray="8 4"
                      />
                      {/* Box Brand / Badge */}
                      <rect
                        x={L / 2 - 40}
                        y="15"
                        width="80"
                        height="24"
                        rx="4"
                        fill="#0284c7"
                        opacity="0.9"
                      />
                      <text
                        x={L / 2}
                        y="31"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="bold"
                      >
                        {subType.includes("moteur") ? "⚡ MOTEUR" : "⚙ MANUEL"}
                      </text>

                      {/* Side Guide Channels (Coulisses) */}
                      <rect
                        x="0"
                        y={coffreH}
                        width={coulisseW}
                        height={tablierH}
                        fill={frameColors.sashFill}
                        stroke={frameColors.stroke}
                        strokeWidth="2"
                      />
                      <rect
                        x={L - coulisseW}
                        y={coffreH}
                        width={coulisseW}
                        height={tablierH}
                        fill={frameColors.sashFill}
                        stroke={frameColors.stroke}
                        strokeWidth="2"
                      />

                      {/* Slats Curtain (Tablier de lames 45mm) */}
                      <g className="slats">
                        {Array.from({ length: numSlats }).map((_, i) => {
                          const sy = coffreH + i * slatHeight;
                          const isEven = i % 2 === 0;
                          return (
                            <g key={i}>
                              <rect
                                x={coulisseW}
                                y={sy}
                                width={L - 2 * coulisseW}
                                height={slatHeight - 2}
                                fill={isEven ? "#ffffff" : "#f1f5f9"}
                                stroke="#cbd5e1"
                                strokeWidth="1"
                              />
                              {/* Slat contour & micro-perforation line */}
                              <line
                                x1={coulisseW + 15}
                                y1={sy + slatHeight / 2}
                                x2={L - coulisseW - 15}
                                y2={sy + slatHeight / 2}
                                stroke="#94a3b8"
                                strokeWidth="0.8"
                                strokeDasharray="3 3"
                                opacity="0.6"
                              />
                            </g>
                          );
                        })}

                        {/* Final Slat (Lame finale renforcée avec joint caoutchouc) */}
                        <rect
                          x={coulisseW}
                          y={coffreH + numSlats * slatHeight}
                          width={L - 2 * coulisseW}
                          height={Math.max(35, tablierH - numSlats * slatHeight)}
                          fill={frameColors.fill}
                          stroke={frameColors.stroke}
                          strokeWidth="2"
                        />
                        {/* Bottom neoprene seal */}
                        <rect
                          x={coulisseW}
                          y={H - 8}
                          width={L - 2 * coulisseW}
                          height="8"
                          fill="#0f172a"
                        />
                        {/* Stop stoppers */}
                        <circle cx={coulisseW + 40} cy={H - 22} r="5" fill="#0f172a" />
                        <circle cx={L - coulisseW - 40} cy={H - 22} r="5" fill="#0f172a" />
                      </g>
                    </>
                  );
                })()}
              </g>
            )}

            {/* D. CUISINE ALUMINIUM */}
            {category === "cuisine" && (
              <g className="cuisine-schema">
                {(() => {
                  const isHaut = subType === "meuble_haut";
                  const isTiroir = subType === "tiroirs";
                  const isColonne = subType === "armoire_colonne";

                  const plintheH = isHaut ? 0 : 80;
                  const planH = isHaut ? 0 : 35;
                  const bodyH = H - plintheH - planH;
                  const bodyY = planH;

                  return (
                    <>
                      {/* Countertop (Plan de travail) if base cabinet */}
                      {!isHaut && (
                        <g>
                          <rect
                            x="-10"
                            y="0"
                            width={L + 20}
                            height={planH}
                            fill="#334155"
                            stroke="#0f172a"
                            strokeWidth="2"
                            rx="3"
                          />
                          <text
                            x={L / 2}
                            y="22"
                            textAnchor="middle"
                            fill="#f8fafc"
                            fontSize="11"
                            fontWeight="bold"
                          >
                            Plan de Travail (P = {formatCm(profondeurMm)} cm)
                          </text>
                        </g>
                      )}

                      {/* Main Aluminium Caisson Frame */}
                      <rect
                        x="0"
                        y={bodyY}
                        width={L}
                        height={bodyH}
                        fill={frameColors.fill}
                        stroke={frameColors.stroke}
                        strokeWidth="3"
                        rx="2"
                      />

                      {/* Drawer Unit (3 tiroirs) or Door Units */}
                      {isTiroir ? (
                        (() => {
                          const t1H = Math.round(bodyH * 0.22); // Cutlery
                          const t2H = Math.round((bodyH - t1H) / 2);
                          const t3H = bodyH - t1H - t2H;
                          const drawers = [
                            { y: bodyY + 6, h: t1H - 10, label: "Tiroir Couverts" },
                            { y: bodyY + t1H + 4, h: t2H - 10, label: "Tiroir Rangement" },
                            { y: bodyY + t1H + t2H + 4, h: t3H - 12, label: "Casserolier Profond" },
                          ];

                          return drawers.map((d, i) => (
                            <g key={i}>
                              <rect
                                x="8"
                                y={d.y}
                                width={L - 16}
                                height={d.h}
                                fill={frameColors.sashFill}
                                stroke={frameColors.stroke}
                                strokeWidth="2"
                                rx="3"
                              />
                              {/* Modern integrated Gola profile handle */}
                              <rect
                                x="25"
                                y={d.y + 10}
                                width={L - 50}
                                height="8"
                                fill="#0f172a"
                                rx="2"
                              />
                              <text
                                x={L / 2}
                                y={d.y + d.h / 2 + 5}
                                textAnchor="middle"
                                fill="#475569"
                                fontSize="12"
                                fontWeight="600"
                              >
                                {d.label}
                              </text>
                            </g>
                          ));
                        })()
                      ) : (
                        // Doors
                        (() => {
                          const numDoors = L > 750 ? 2 : 1;
                          const dW = (L - 12) / numDoors;

                          return Array.from({ length: numDoors }).map((_, i) => {
                            const dx = 6 + i * dW;
                            return (
                              <g key={i}>
                                <rect
                                  x={dx + 2}
                                  y={bodyY + 6}
                                  width={dW - 4}
                                  height={bodyH - 12}
                                  fill={frameColors.sashFill}
                                  stroke={frameColors.stroke}
                                  strokeWidth="2"
                                  rx="3"
                                />
                                {/* Door inner decorative panel (Alucobond / Verre) */}
                                <rect
                                  x={dx + 22}
                                  y={bodyY + 24}
                                  width={dW - 44}
                                  height={bodyH - 48}
                                  fill="url(#glassReflect)"
                                  stroke="#94a3b8"
                                  strokeWidth="1"
                                />
                                {/* Vertical integrated edge handle */}
                                <rect
                                  x={i === 0 ? dx + dW - 20 : dx + 8}
                                  y={bodyY + bodyH / 2 - 50}
                                  width="8"
                                  height="100"
                                  fill="#0f172a"
                                  rx="3"
                                />
                                {/* Opening direction arc */}
                                <path
                                  d={`M ${i === 0 ? dx + 24 : dx + dW - 24},${bodyY + 30} Q ${dx + dW / 2},${bodyY + bodyH / 2} ${i === 0 ? dx + dW - 20 : dx + 20},${bodyY + bodyH / 2}`}
                                  fill="none"
                                  stroke="#0284c7"
                                  strokeWidth="1.5"
                                  strokeDasharray="4 4"
                                />
                              </g>
                            );
                          });
                        })()
                      )}

                      {/* Plinthe aluminium & adjustable feet */}
                      {!isHaut && (
                        <g>
                          <rect
                            x="15"
                            y={H - plintheH}
                            width={L - 30}
                            height={plintheH - 6}
                            fill="#475569"
                            stroke="#1e293b"
                            strokeWidth="1.5"
                          />
                          <text
                            x={L / 2}
                            y={H - plintheH / 2}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="bold"
                          >
                            Plinthe Alu Clipsable (100mm)
                          </text>
                        </g>
                      )}
                    </>
                  );
                })()}
              </g>
            )}

            {/* E. MOUSTIQUAIRE */}
            {category === "moustiquaire" && (
              <g className="moustiquaire-schema">
                {(() => {
                  const boxH = 45;
                  const trackW = 28;

                  return (
                    <>
                      {/* Top cassette for enroulable */}
                      {subType !== "coulissante_cadre" ? (
                        <rect
                          x="0"
                          y="0"
                          width={L}
                          height={boxH}
                          fill={frameColors.fill}
                          stroke={frameColors.stroke}
                          strokeWidth="2.5"
                          rx="4"
                        />
                      ) : (
                        <rect
                          x="0"
                          y="0"
                          width={L}
                          height={frameThick}
                          fill={frameColors.fill}
                          stroke={frameColors.stroke}
                          strokeWidth="2.5"
                        />
                      )}

                      {/* Side channels */}
                      <rect
                        x="0"
                        y={boxH}
                        width={trackW}
                        height={H - boxH}
                        fill={frameColors.sashFill}
                        stroke={frameColors.stroke}
                        strokeWidth="2"
                      />
                      <rect
                        x={L - trackW}
                        y={boxH}
                        width={trackW}
                        height={H - boxH}
                        fill={frameColors.sashFill}
                        stroke={frameColors.stroke}
                        strokeWidth="2"
                      />

                      {/* Mesh Area with pattern */}
                      <rect
                        x={trackW}
                        y={boxH}
                        width={L - 2 * trackW}
                        height={H - boxH - 35}
                        fill="url(#meshPattern)"
                        stroke="#94a3b8"
                        strokeWidth="1"
                      />

                      {/* Pull handle bottom bar */}
                      <rect
                        x={trackW}
                        y={H - 35}
                        width={L - 2 * trackW}
                        height="32"
                        fill={frameColors.fill}
                        stroke={frameColors.stroke}
                        strokeWidth="2"
                        rx="2"
                      />
                      {/* Center pull cord handle */}
                      <circle cx={L / 2} cy={H - 18} r="6" fill="#0284c7" />
                      <line x1={L / 2} y1={H - 12} x2={L / 2} y2={H + 15} stroke="#0284c7" strokeWidth="2" />
                    </>
                  );
                })()}
              </g>
            )}

            {/* F. CHÂSSIS FIXE */}
            {category === "fixe" && (
              <g className="fixe-schema">
                {/* Dormant Frame */}
                <rect
                  x="0"
                  y="0"
                  width={L}
                  height={H}
                  fill={frameColors.fill}
                  stroke={frameColors.stroke}
                  strokeWidth="3.5"
                  rx="2"
                />
                {/* Parcloses (Glazing beads with 45° mitre cuts) */}
                <rect
                  x={frameThick}
                  y={frameThick}
                  width={L - 2 * frameThick}
                  height={H - 2 * frameThick}
                  fill="url(#glassReflect)"
                  stroke="#94a3b8"
                  strokeWidth="2"
                />
                {/* Parclose mitre corner marks */}
                <line x1="0" y1="0" x2={frameThick} y2={frameThick} stroke={frameColors.stroke} strokeWidth="1.5" />
                <line x1={L} y1="0" x2={L - frameThick} y2={frameThick} stroke={frameColors.stroke} strokeWidth="1.5" />
                <line x1="0" y1={H} x2={frameThick} y2={H - frameThick} stroke={frameColors.stroke} strokeWidth="1.5" />
                <line x1={L} y1={H} x2={L - frameThick} y2={H - frameThick} stroke={frameColors.stroke} strokeWidth="1.5" />

                {/* Glass Light Reflection */}
                <line
                  x1={frameThick + 40}
                  y1={frameThick + 40}
                  x2={L - frameThick - 60}
                  y2={H * 0.65}
                  stroke="#ffffff"
                  strokeWidth="4"
                  opacity="0.5"
                  strokeLinecap="round"
                />
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="mt-3 flex w-full flex-wrap items-center justify-between gap-2 border-t pt-2 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>
            Finition: <strong className="text-foreground">{couleurAlu}</strong>
          </span>
          <span>•</span>
          <span>
            Vitrage: <strong className="text-foreground">{vitrageType}</strong>
          </span>
        </div>
        <div className="text-right italic">Dessin architectural côté à l'échelle (en cm)</div>
      </div>
    </div>
  );
}
