import React, { useState } from "react";
import { Tool } from "../types.js";
import { TOOLS, CATEGORIES } from "../data.js";
import {
  Search,
  Palette,
  Layers,
  Feather,
  Compass,
  DollarSign,
  Award,
  Home,
  Type,
  Library,
  FileText,
  Wine,
  Share2,
  Scroll,
  Zap,
  PenTool,
  Sparkles,
  Lock,
  RefreshCw,
  Loader2,
  Check
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.js";

interface ToolsBarProps {
  activeToolId: string;
  onSelectTool: (id: string) => void;
  cache: Record<string, any>;
  theme?: "dark-gold" | "light";
  isSubscribed?: boolean;
  onRunAllAnalyses?: () => void;
  onOpenSubscriptionModal?: () => void;
  onOpenGalleryBridge?: () => void;
  onOpenVernissageModal?: () => void;
  onOpenCollectorSales?: () => void;
  onOpenPressSocial?: () => void;
  onOpenGlobalReport?: () => void;
  onOpenQrSalesModal?: () => void;
  batchProgress?: { current: number; total: number; currentToolName: string } | null;
  onRerunTool?: (id: string) => void;
}

// Map tool IDs to Lucide components
const iconMap: Record<string, React.ComponentType<any>> = {
  style: Search,
  palette: Palette,
  technique: Layers,
  critique: Feather,
  conseils: Compass,
  prix: DollarSign,
  certificat: Award,
  decor: Home,
  titres: Type,
  artistes: Library,
  expo: FileText,
  vernissage: Wine,
  reseaux: Share2,
  statement: Scroll,
  inspiration: Zap,
  poesie: PenTool
};

// Short labels for clean UI display
const labelMap: Record<string, string> = {
  style: "STYLE",
  palette: "PALETTE",
  technique: "TECHNIQUE",
  critique: "CRITIQUE",
  conseils: "CONSEILS",
  prix: "ESTIMATION",
  certificat: "CERTIFICAT",
  decor: "SITUATION",
  titres: "TITRES",
  artistes: "ARTISTES",
  expo: "TEXTE EXPO",
  vernissage: "VERNISSAGE",
  reseaux: "RÉSEAUX",
  statement: "DÉMARCHE",
  inspiration: "PISTES",
  poesie: "POÉSIE"
};

const phaseTitles = [
  "Style & Technique",
  "Vernissage & Scénographie",
  "Marché & Vente",
  "Communication & Médias"
];

export default function ToolsBar({ 
  activeToolId, 
  onSelectTool, 
  cache, 
  theme = "dark-gold",
  isSubscribed = false,
  onRunAllAnalyses,
  onOpenSubscriptionModal,
  onOpenGlobalReport,
  batchProgress,
  onRerunTool
}: ToolsBarProps) {
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const isDark = theme === "dark-gold";
  const { t } = useLanguage();

  const completedCount = TOOLS.filter(t => !!cache[t.id]).length;

  // Filter tools according to selected phase
  const displayedTools = selectedPhase === "all" 
    ? TOOLS 
    : TOOLS.filter(t => t.cat === selectedPhase);

  return (
    <div className="space-y-4">
      
      {/* 1-Click All Analyses (Diagnostic Intégral 16/16) */}
      <div className={`p-3 sm:p-4 border transition-all duration-300 relative ${
        isDark 
          ? isSubscribed ? "bg-gradient-to-r from-black via-[#16140e] to-black border-[#c9a84c]/50" : "bg-[#141414] border-white/10"
          : isSubscribed ? "bg-gradient-to-r from-[#faf6eb] via-white to-[#faf6eb] border-[#c9a84c]" : "bg-stone-50 border-stone-200"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border ${
                isSubscribed 
                  ? "bg-[#c9a84c] text-black border-[#c9a84c] font-black" 
                  : "bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/30"
              }`}>
                {isSubscribed ? "PRO ACTIVÉ" : "PRO"}
              </span>
              <span className={`text-xs font-serif font-bold ${isDark ? "text-white" : "text-stone-900"}`}>
                Diagnostic Intégral de l'Œuvre (16/16)
              </span>
            </div>
            
            <p className={`text-[11px] font-sans ${isDark ? "text-neutral-400" : "text-stone-600"}`}>
              {isSubscribed 
                ? `${completedCount}/16 analyses effectuées pour cette œuvre.`
                : "Lancez les 16 analyses simultanément en 1 clic."
              }
            </p>
          </div>

          <div>
            {!isSubscribed ? (
              <button
                type="button"
                onClick={onOpenSubscriptionModal}
                className={`w-full sm:w-auto px-3.5 py-2 text-xs font-sans font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 border shadow-sm ${
                  isDark
                    ? "bg-black/60 hover:bg-[#c9a84c] text-neutral-300 hover:text-black border-[#c9a84c]/40"
                    : "bg-white hover:bg-[#c9a84c] text-stone-800 hover:text-black border-stone-300"
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-[#c9a84c]" />
                <span>Tout Lancer (1 Clic)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onRunAllAnalyses}
                disabled={!!batchProgress}
                className={`w-full sm:w-auto px-4 py-2 text-xs font-sans font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 border-none shadow-md ${
                  batchProgress
                    ? "bg-neutral-800 text-neutral-400 cursor-not-allowed"
                    : isDark
                      ? "bg-[#c9a84c] hover:bg-white text-black"
                      : "bg-stone-900 hover:bg-[#c9a84c] text-white hover:text-black"
                }`}
              >
                {batchProgress ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c9a84c]" />
                    <span>{batchProgress.current}/{batchProgress.total} en cours…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-black" />
                    <span>Lancer les 16 Analyses</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar during Batch Analysis */}
        {batchProgress && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5 animate-fadeIn">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-[#c9a84c] font-bold truncate">
                {batchProgress.currentToolName}
              </span>
              <span className="text-neutral-400">
                {Math.round((batchProgress.current / batchProgress.total) * 100)}% ({batchProgress.current}/{batchProgress.total})
              </span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#9c7d2b] to-[#c9a84c] transition-all duration-300"
                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Global Report Bar */}
        {completedCount > 0 && onOpenGlobalReport && !batchProgress && (
          <div className="mt-3 pt-2.5 border-t border-[#c9a84c]/20 flex items-center justify-between gap-2 animate-fadeIn flex-wrap">
            <span className="text-xs text-[#c9a84c] font-mono font-bold uppercase tracking-wider">
              📜 Dossier Complet Disponible ({completedCount}/16)
            </span>
            <button
              type="button"
              onClick={onOpenGlobalReport}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-[#b8973e] via-[#c9a84c] to-[#e4cb78] text-black font-mono font-bold text-[10px] uppercase tracking-wider hover:brightness-110 shadow-sm cursor-pointer"
            >
              <FileText className="w-3 h-3" />
              <span>Exporter Dossier HTML</span>
            </button>
          </div>
        )}
      </div>

      {/* Clean Category Selector (No nested tabs) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedPhase("all")}
          className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider font-bold transition-all shrink-0 cursor-pointer ${
            selectedPhase === "all"
              ? isDark ? "bg-[#c9a84c] text-black" : "bg-stone-900 text-white"
              : isDark ? "bg-white/5 text-neutral-400 hover:text-white" : "bg-stone-100 text-stone-600 hover:text-stone-900"
          }`}
        >
          Tous ({completedCount}/16)
        </button>

        {CATEGORIES.map((cat, idx) => {
          const isActive = selectedPhase === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedPhase(cat)}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? isDark ? "bg-[#c9a84c] text-black" : "bg-[#c9a84c] text-black"
                  : isDark ? "bg-white/5 text-neutral-400 hover:text-white" : "bg-stone-100 text-stone-600 hover:text-stone-900"
              }`}
            >
              {idx + 1}. {phaseTitles[idx] || cat}
            </button>
          );
        })}
      </div>

      {/* Clean 4-Column Tool Grid (Easy to scan and read) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {displayedTools.map((tool) => {
          const isActive = activeToolId === tool.id;
          const isCached = !!cache[tool.id];
          const IconComponent = iconMap[tool.id] || Search;
          const displayLabel = t(`tool_${tool.id}`, labelMap[tool.id] || tool.label.toUpperCase());

          return (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              title={tool.description}
              className={`p-2.5 sm:p-3 border text-center transition-all duration-200 relative flex flex-col items-center justify-center min-h-[76px] cursor-pointer group select-none ${
                isActive
                  ? isDark
                    ? "bg-[#181610] border-[#c9a84c] text-[#c9a84c] shadow-[0_0_12px_rgba(201,168,76,0.2)]"
                    : "bg-amber-50 border-[#c9a84c] text-[#9c7d2b] shadow-sm font-bold"
                  : isDark
                    ? "bg-black/60 border-white/10 text-neutral-400 hover:border-white/30 hover:text-neutral-200"
                    : "bg-white border-stone-200 text-stone-600 hover:border-[#c9a84c]/50 hover:text-stone-900"
              }`}
            >
              {/* Gold Top Indicator if active */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#c9a84c]" />
              )}

              <IconComponent 
                className={`w-4 h-4 mb-1.5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive
                    ? isDark ? "text-[#c9a84c]" : "text-[#9c7d2b]"
                    : isDark ? "text-neutral-500 group-hover:text-[#c9a84c]" : "text-stone-400 group-hover:text-stone-700"
                }`}
              />

              <span className={`text-[10px] font-sans font-bold tracking-wider block leading-tight ${
                isActive
                  ? isDark ? "text-[#c9a84c]" : "text-[#9c7d2b]"
                  : isDark ? "text-neutral-300" : "text-stone-800"
              }`}>
                {displayLabel}
              </span>

              {/* Status indicator */}
              <div className="flex items-center gap-1 mt-1">
                {isCached ? (
                  <span className="text-[8px] font-mono text-emerald-400 font-bold flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" /> Fait
                  </span>
                ) : (
                  <span className="text-[8px] font-mono text-neutral-500">
                    À faire
                  </span>
                )}

                {onRerunTool && isCached && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRerunTool(tool.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-[#c9a84c] p-0.5 transition-opacity"
                    title="Relancer"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
