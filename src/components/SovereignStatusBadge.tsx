/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALPHABETTE SASU - Indicateur Discret de Souveraineté & Résilience IA
 * Éditeur : ALPHABETTE SASU (fondé par Valentin RICHAUD à La Grande-Motte)
 * Hébergement : Serveurs souverains OVH (alphabette.fr / alphabette.eu)
 */

import React, { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, Cpu, Sparkles } from "lucide-react";
import { 
  subscribeToTelemetry, 
  SovereigntyTelemetry, 
  getPreferredProvider,
  AIProviderId 
} from "../services/aiService";

interface SovereignStatusBadgeProps {
  theme?: "dark-gold" | "light";
  onClick: () => void;
  className?: string;
}

export default function SovereignStatusBadge({
  theme = "dark-gold",
  onClick,
  className = ""
}: SovereignStatusBadgeProps) {
  const [telemetry, setTelemetry] = useState<SovereigntyTelemetry | null>(null);
  const [activePreference, setActivePreference] = useState<AIProviderId>("gemini");

  useEffect(() => {
    setActivePreference(getPreferredProvider());
    const unsubscribe = subscribeToTelemetry((latest) => {
      setTelemetry(latest);
    });
    return unsubscribe;
  }, []);

  const isDark = theme === "dark-gold";

  // Compute display label and icon depending on telemetry or preference
  let badgeLabel = "Traitement Sécurisé & Souverain";
  let hostLabel = "ALPHABETTE SASU • La Grande-Motte";
  let flag = "🛡️";
  let isLocal = false;
  let isFallback = false;

  if (telemetry) {
    flag = telemetry.sovereignty.flag;
    isLocal = telemetry.sovereignty.isLocal;
    isFallback = telemetry.isFallback;
    badgeLabel = telemetry.sovereignty.label;
    hostLabel = telemetry.sovereignty.host;
  } else if (activePreference === "hybrid_mistral") {
    flag = "🇫🇷";
    badgeLabel = "Moteur Hybride Résilient";
    hostLabel = "Local + Secours Mistral France";
  } else if (activePreference === "local_only") {
    flag = "🏠";
    badgeLabel = "Moteur Local Souverain";
    hostLabel = "Ollama Local Alphabette";
    isLocal = true;
  } else if (activePreference === "mistral_cloud") {
    flag = "🇫🇷";
    badgeLabel = "Mistral AI Cloud";
    hostLabel = "Paris, France (Souverain)";
  } else {
    flag = "⚡";
    badgeLabel = "Phase 1 : Conception & Prototypage";
    hostLabel = "Google Gemini Engine";
  }

  return (
    <button
      type="button"
      id="sovereign-status-badge"
      onClick={onClick}
      className={`group relative inline-flex items-center gap-2 px-2.5 py-1 text-[11px] font-sans font-medium transition-all duration-300 border cursor-pointer select-none ${
        isDark 
          ? "bg-black/60 hover:bg-black text-neutral-300 border-white/15 hover:border-[#c9a84c]/60" 
          : "bg-stone-50 hover:bg-white text-stone-700 border-stone-300 hover:border-[#c9a84c]"
      } ${className}`}
      title="Architecture IA Souveraine ALPHABETTE SASU (Valentin RICHAUD - La Grande-Motte) — Cliquez pour afficher les détails et tester le moteur"
    >
      {/* Sovereignty / Status Icon */}
      <span className="relative flex items-center justify-center">
        {isLocal ? (
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
        ) : isFallback ? (
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        ) : (
          <ShieldCheck className="w-3.5 h-3.5 text-[#c9a84c]" />
        )}
        <span 
          className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${
            isLocal 
              ? "bg-emerald-400 animate-ping" 
              : isFallback 
                ? "bg-amber-400" 
                : "bg-[#c9a84c]"
          }`}
        />
      </span>

      {/* Flag / Icon */}
      <span className="text-xs leading-none" aria-hidden="true">
        {flag}
      </span>

      {/* Main Label */}
      <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wide">
        <span className="font-bold text-[#c9a84c] uppercase">
          {badgeLabel}
        </span>
        <span className="opacity-30 hidden sm:inline">•</span>
        <span className="opacity-60 hidden sm:inline truncate max-w-[130px]">
          {hostLabel}
        </span>
      </div>

      {/* Latency indicator if last analysis recorded */}
      {telemetry && (
        <span className="text-[9px] font-mono px-1 py-0.2 bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20 hidden lg:inline">
          {telemetry.latencyMs}ms
        </span>
      )}

      {/* Subtle indicator for ALPHABETTE charter */}
      <span className="text-[9px] font-mono tracking-widest text-neutral-400 uppercase hidden md:inline ml-0.5 border-l border-white/10 pl-1.5">
        ALPHABETTE
      </span>
    </button>
  );
}
