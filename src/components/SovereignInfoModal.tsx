/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALPHABETTE SASU - Modal Écosystème, Résilience & Souveraineté Numérique
 * Éditeur : ALPHABETTE SASU (fondé par Valentin RICHAUD à La Grande-Motte)
 * Hébergement : Serveurs souverains OVH (alphabette.fr / alphabette.eu)
 */

import React, { useState, useEffect } from "react";
import { 
  X, ShieldCheck, Cpu, Cloud, RefreshCw, Server, CheckCircle2, 
  AlertTriangle, Lock, Globe, ExternalLink, Zap, ArrowRight, 
  Terminal, Sparkles, HeartHandshake, Layers
} from "lucide-react";
import { 
  fetchAIStatus, 
  AIStatusReport, 
  getPreferredProvider, 
  setPreferredProvider, 
  AIProviderId, 
  getLastTelemetry,
  SovereigntyTelemetry 
} from "../services/aiService";

interface SovereignInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSubscription: () => void;
  theme?: "dark-gold" | "light";
}

export default function SovereignInfoModal({
  isOpen,
  onClose,
  onOpenSubscription,
  theme = "dark-gold"
}: SovereignInfoModalProps) {
  const [statusReport, setStatusReport] = useState<AIStatusReport | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProviderId>("gemini");
  const [pingResult, setPingResult] = useState<{ success: boolean; message: string; timestamp: string } | null>(null);
  const [telemetry, setTelemetry] = useState<SovereigntyTelemetry | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedProvider(getPreferredProvider());
      setTelemetry(getLastTelemetry());
      handleRefreshStatus();
    }
  }, [isOpen]);

  const handleRefreshStatus = async () => {
    setIsLoadingStatus(true);
    setPingResult(null);
    try {
      const data = await fetchAIStatus();
      setStatusReport(data);
      const isReachable = data.providers.local_ollama.reachable;
      setPingResult({
        success: isReachable,
        message: isReachable 
          ? `Serveur local opérationnel sur ${data.providers.local_ollama.url} (Modèle : ${data.providers.local_ollama.model})`
          : `Serveur local non détecté sur ${data.providers.local_ollama.url}. Le mécanisme de bascule automatique vers Mistral Cloud ou Gemini prendra le relais en toute transparence.`,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err: any) {
      console.warn("Could not fetch AI status:", err);
      setPingResult({
        success: false,
        message: "Diagnostic réseau indisponible. Le mode développement standard (Gemini) reste pleinement opérationnel.",
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleSelectProvider = (provider: AIProviderId) => {
    setSelectedProvider(provider);
    setPreferredProvider(provider);
  };

  if (!isOpen) return null;

  const isDark = theme === "dark-gold";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div 
        className={`relative w-full max-w-4xl border shadow-2xl my-6 flex flex-col max-h-[92vh] transition-colors duration-300 ${
          isDark 
            ? "bg-[#0c0c0c] border-[#c9a84c]/50 text-white" 
            : "bg-white border-stone-300 text-stone-900"
        }`}
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-6 border-b flex items-start justify-between gap-4 ${
          isDark ? "bg-[#141414] border-white/10" : "bg-stone-50 border-stone-200"
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-[#c9a84c] text-black font-mono text-[9px] font-black uppercase tracking-widest">
                ÉCOSYSTÈME SOUVERAIN ALPHABETTE SASU
              </span>
              <span className="text-[10px] font-mono text-neutral-400">
                Fondé par Valentin RICHAUD à La Grande-Motte • Serveurs Dédiés OVHcloud France
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#c9a84c]">
              Architecture IA Hybride, Résiliente & Souveraine
            </h2>
            <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
              Souveraineté numérique et respect de la vie privée : absence totale de revente de données personnelles, aucune régie publicitaire tierce, et priorité absolue au traitement local ou souverain.
            </p>
          </div>

          <button
            onClick={onClose}
            className={`p-2 border transition-colors ${
              isDark 
                ? "border-white/10 hover:border-[#c9a84c] text-neutral-400 hover:text-white" 
                : "border-stone-200 hover:border-stone-400 text-stone-600 hover:text-black"
            }`}
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs leading-relaxed">
          
          {/* Section 1: Stratégie en 3 Phases */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-xs uppercase font-bold tracking-wider text-[#c9a84c] flex items-center gap-2">
                <Layers className="w-4 h-4" />
                La Stratégie d'Exécution en 3 Phases
              </h3>
              <span className="text-[10px] font-mono text-neutral-400">
                Transition maîtrisée & haute disponibilité
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Phase 1 */}
              <div className={`p-4 border relative space-y-2 ${
                selectedProvider === "gemini"
                  ? (isDark ? "bg-[#18160e] border-[#c9a84c]" : "bg-amber-50/70 border-[#c9a84c]")
                  : (isDark ? "bg-[#121212] border-white/10 opacity-80" : "bg-stone-50 border-stone-200")
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 bg-neutral-800 text-neutral-300">
                    Phase 1 • Actuelle
                  </span>
                  <span className="text-xs">⚡</span>
                </div>
                <h4 className="font-serif font-bold text-sm text-[#c9a84c]">
                  Prototypage & Conception
                </h4>
                <p className="text-[11px] text-neutral-400">
                  Modèles <strong>Google Gemini API</strong> pour construire, tester et valider l'ensemble des 36 outils d'atelier, la vision par ordinateur et la logique métier.
                </p>
                <div className="pt-2 text-[10px] font-mono text-[#c9a84c]">
                  ● Actif par défaut en développement
                </div>
              </div>

              {/* Phase 2 */}
              <div className={`p-4 border relative space-y-2 ${
                selectedProvider === "local_only" || selectedProvider === "hybrid_mistral"
                  ? (isDark ? "bg-[#0e1713] border-emerald-500" : "bg-emerald-50/70 border-emerald-500")
                  : (isDark ? "bg-[#121212] border-white/10 opacity-80" : "bg-stone-50 border-stone-200")
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    Phase 2 • Production Cible
                  </span>
                  <span className="text-xs">🏠</span>
                </div>
                <h4 className="font-serif font-bold text-sm text-emerald-400">
                  Moteur Local Souverain
                </h4>
                <p className="text-[11px] text-neutral-400">
                  Serveur dédié haute performance chez <strong>ALPHABETTE</strong> (Ollama / vLLM, Mistral NeMo / Small). Coût d'inférence nul, données traitées 100% localement.
                </p>
                <div className="pt-2 text-[10px] font-mono text-emerald-400">
                  ● Appel prioritaire instantané
                </div>
              </div>

              {/* Phase 3 */}
              <div className={`p-4 border relative space-y-2 ${
                selectedProvider === "mistral_cloud" || selectedProvider === "hybrid_mistral"
                  ? (isDark ? "bg-[#15121c] border-indigo-500" : "bg-indigo-50/70 border-indigo-400")
                  : (isDark ? "bg-[#121212] border-white/10 opacity-80" : "bg-stone-50 border-stone-200")
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                    Phase 3 • Secours Résilient
                  </span>
                  <span className="text-xs">🇫🇷</span>
                </div>
                <h4 className="font-serif font-bold text-sm text-indigo-400">
                  Cloud Européen Mistral AI
                </h4>
                <p className="text-[11px] text-neutral-400">
                  En cas de panne locale (coupure électrique, fibre, saturation &gt; 3.5s), <strong>bascule transparente automatique</strong> vers l'API souveraine Mistral AI (Paris, France).
                </p>
                <div className="pt-2 text-[10px] font-mono text-indigo-400">
                  ● Zéro interruption pour l'utilisateur
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Commutateur de Mode & Testeur */}
          <div className={`p-4 sm:p-5 border space-y-4 ${
            isDark ? "bg-[#121212] border-white/10" : "bg-stone-50 border-stone-200"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-mono text-xs uppercase font-bold tracking-wider text-[#c9a84c] flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Sélecteur de Fournisseur Actif (Pattern Strategy)
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Changez instantanément le mode d'inférence utilisé par l'application pour tester la résilience :
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefreshStatus}
                disabled={isLoadingStatus}
                className="self-start sm:self-auto px-3 py-1.5 border border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c] hover:text-black font-mono text-[10px] uppercase font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingStatus ? "animate-spin" : ""}`} />
                <span>Tester la connexion locale</span>
              </button>
            </div>

            {/* Radio / Button Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Option 1: Gemini */}
              <div 
                onClick={() => handleSelectProvider("gemini")}
                className={`p-3 border cursor-pointer transition-all flex items-start gap-3 ${
                  selectedProvider === "gemini"
                    ? isDark ? "bg-[#1a170f] border-[#c9a84c]" : "bg-white border-[#c9a84c] shadow-sm"
                    : isDark ? "bg-black/40 border-white/10 hover:border-white/20" : "bg-white/60 border-stone-200 hover:border-stone-300"
                }`}
              >
                <input 
                  type="radio" 
                  name="provider_choice" 
                  checked={selectedProvider === "gemini"} 
                  onChange={() => handleSelectProvider("gemini")}
                  className="mt-1 accent-[#c9a84c]"
                />
                <div>
                  <div className="font-mono font-bold text-xs flex items-center gap-1.5">
                    <span>⚡ Google Gemini (Phase 1 Prototypage)</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Moteur de conception actif. Idéal pour le développement et la validation sur AI Studio.
                  </p>
                </div>
              </div>

              {/* Option 2: Hybride Mistral */}
              <div 
                onClick={() => handleSelectProvider("hybrid_mistral")}
                className={`p-3 border cursor-pointer transition-all flex items-start gap-3 ${
                  selectedProvider === "hybrid_mistral"
                    ? isDark ? "bg-[#0f1a14] border-emerald-500" : "bg-white border-emerald-500 shadow-sm"
                    : isDark ? "bg-black/40 border-white/10 hover:border-white/20" : "bg-white/60 border-stone-200 hover:border-stone-300"
                }`}
              >
                <input 
                  type="radio" 
                  name="provider_choice" 
                  checked={selectedProvider === "hybrid_mistral"} 
                  onChange={() => handleSelectProvider("hybrid_mistral")}
                  className="mt-1 accent-emerald-500"
                />
                <div>
                  <div className="font-mono font-bold text-xs flex items-center gap-1.5 text-emerald-400">
                    <span>🏠 ➔ 🇫🇷 Hybride Résilient (Cible ALPHABETTE)</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Tente le serveur local (Ollama) ; si indisponible sous 3.5s, bascule sur Mistral Cloud France.
                  </p>
                </div>
              </div>

              {/* Option 3: Local Seul */}
              <div 
                onClick={() => handleSelectProvider("local_only")}
                className={`p-3 border cursor-pointer transition-all flex items-start gap-3 ${
                  selectedProvider === "local_only"
                    ? isDark ? "bg-[#0f171e] border-cyan-500" : "bg-white border-cyan-500 shadow-sm"
                    : isDark ? "bg-black/40 border-white/10 hover:border-white/20" : "bg-white/60 border-stone-200 hover:border-stone-300"
                }`}
              >
                <input 
                  type="radio" 
                  name="provider_choice" 
                  checked={selectedProvider === "local_only"} 
                  onChange={() => handleSelectProvider("local_only")}
                  className="mt-1 accent-cyan-500"
                />
                <div>
                  <div className="font-mono font-bold text-xs flex items-center gap-1.5">
                    <span>🏠 Serveur Local Dédié Seul (Ollama)</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    100% en atelier. Aucune donnée ne quitte le réseau privé. Nécessite Ollama actif sur la machine.
                  </p>
                </div>
              </div>

              {/* Option 4: Mistral Cloud Seul */}
              <div 
                onClick={() => handleSelectProvider("mistral_cloud")}
                className={`p-3 border cursor-pointer transition-all flex items-start gap-3 ${
                  selectedProvider === "mistral_cloud"
                    ? isDark ? "bg-[#181324] border-indigo-400" : "bg-white border-indigo-400 shadow-sm"
                    : isDark ? "bg-black/40 border-white/10 hover:border-white/20" : "bg-white/60 border-stone-200 hover:border-stone-300"
                }`}
              >
                <input 
                  type="radio" 
                  name="provider_choice" 
                  checked={selectedProvider === "mistral_cloud"} 
                  onChange={() => handleSelectProvider("mistral_cloud")}
                  className="mt-1 accent-indigo-400"
                />
                <div>
                  <div className="font-mono font-bold text-xs flex items-center gap-1.5">
                    <span>🇫🇷 Mistral AI Cloud Direct (Souveraineté UE)</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Inférence directe via les serveurs sécurisés de Mistral AI à Paris. Conforme RGPD et UE AI Act.
                  </p>
                </div>
              </div>

            </div>

            {/* Diagnostic Box from Ping */}
            {pingResult && (
              <div className={`p-3 border text-[11px] font-mono flex items-start gap-2.5 transition-all ${
                pingResult.success 
                  ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300" 
                  : "bg-amber-950/40 border-amber-500/50 text-amber-300"
              }`}>
                {pingResult.success ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase tracking-wider">
                      {pingResult.success ? "Diagnostic Réseau : Connecté" : "Diagnostic Réseau : Mode Hybride Actif"}
                    </span>
                    <span className="opacity-60 text-[9px]">[{pingResult.timestamp}]</span>
                  </div>
                  <p className="text-[10px] leading-relaxed opacity-90">
                    {pingResult.message}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Dernière Télémétrie d'Inférence */}
          {telemetry && (
            <div className={`p-4 border space-y-2.5 ${
              isDark ? "bg-[#141414] border-white/10" : "bg-stone-50 border-stone-200"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a84c] font-bold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  Dernière Inférence Traitée
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/30">
                  Latence : {telemetry.latencyMs} ms
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px]">
                <div className="p-2 bg-black/40 border border-white/5">
                  <span className="text-neutral-500 block">Fournisseur</span>
                  <span className="font-bold text-[#c9a84c] capitalize">{telemetry.providerUsed}</span>
                </div>
                <div className="p-2 bg-black/40 border border-white/5">
                  <span className="text-neutral-500 block">Modèle Invoqué</span>
                  <span className="font-bold truncate block">{telemetry.modelUsed}</span>
                </div>
                <div className="p-2 bg-black/40 border border-white/5">
                  <span className="text-neutral-500 block">Souveraineté</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    {telemetry.sovereignty.flag} {telemetry.sovereignty.isEuropean ? "Européen / Local" : "Cloud Global"}
                  </span>
                </div>
                <div className="p-2 bg-black/40 border border-white/5">
                  <span className="text-neutral-500 block">Bascule de Secours</span>
                  <span className={telemetry.isFallback ? "text-amber-400 font-bold" : "text-neutral-300"}>
                    {telemetry.isFallback ? "Oui (Secours actif)" : "Non (Direct)"}
                  </span>
                </div>
              </div>

              {telemetry.fallbackReason && (
                <p className="text-[10px] text-amber-300/90 font-mono bg-amber-950/20 p-2 border border-amber-500/20">
                  ℹ️ {telemetry.fallbackReason}
                </p>
              )}
            </div>
          )}

          {/* Section 4: Charte Éthique & Modèle Économique ALPHABETTE SASU */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Charte Éthique */}
            <div className={`p-4 border space-y-3 ${
              isDark ? "bg-[#121212] border-white/10" : "bg-stone-50 border-stone-200"
            }`}>
              <div className="flex items-center gap-2 text-[#c9a84c]">
                <ShieldCheck className="w-4 h-4" />
                <h4 className="font-mono text-xs uppercase font-bold tracking-wider">
                  Positionnement & Éthique ALPHABETTE
                </h4>
              </div>
              <ul className="space-y-2 text-[11px] text-neutral-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Souveraineté numérique :</strong> absence totale de revente de données personnelles et aucune régie publicitaire tierce.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Traitement optimisé :</strong> priorité au traitement local et respect strict de la confidentialité de vos projets.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Propriété intellectuelle :</strong> vos toiles et textes restent votre propriété exclusive et ne servent jamais à entraîner des modèles tiers.</span>
                </li>
              </ul>
            </div>

            {/* Modèle Économique Transparent */}
            <div className={`p-4 border space-y-3 ${
              isDark ? "bg-[#15140e] border-[#c9a84c]/40" : "bg-amber-50/50 border-[#c9a84c]/40"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#c9a84c]">
                  <HeartHandshake className="w-4 h-4" />
                  <h4 className="font-mono text-xs uppercase font-bold tracking-wider">
                    Règles Tarifaires Strictes
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-[#c9a84c] font-bold">Sans frais cachés</span>
              </div>

              <p className="text-[11px] text-neutral-400">
                Abonnements annuels forfaitaires. Aucun prélèvement mensuel afin d'éviter les frais bancaires intermédiaires :
              </p>

              <div className="space-y-2">
                <div className="p-2.5 bg-black/40 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-white">Application Individuelle</span>
                    <p className="text-[10px] text-neutral-400">L'Œil de l'Atelier (ou IADébat, Infos Perso)</p>
                  </div>
                  <span className="font-serif font-bold text-base text-[#c9a84c]">15 € <span className="text-[10px] font-sans font-normal text-neutral-400">TTC / an</span></span>
                </div>

                <div className="p-2.5 bg-[#c9a84c]/10 border border-[#c9a84c]/40 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-[#c9a84c]">Le « Pass ALPHABETTE »</span>
                    <p className="text-[10px] text-neutral-400">Tout le bouquet applicatif actuel & futures applications</p>
                  </div>
                  <span className="font-serif font-bold text-base text-[#c9a84c]">40 € <span className="text-[10px] font-sans font-normal text-neutral-400">TTC / an</span></span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSubscription();
                }}
                className="w-full py-2 bg-[#c9a84c] hover:bg-white text-black font-sans font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Consulter les formules d'accès (15 € ou 40 € / an)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono ${
          isDark ? "bg-[#111] border-white/10 text-neutral-400" : "bg-stone-50 border-stone-200 text-stone-600"
        }`}>
          <div className="flex items-center gap-2">
            <span>Éditeur : <strong>ALPHABETTE SASU</strong> (Valentin RICHAUD - La Grande-Motte)</span>
            <span>•</span>
            <a 
              href="https://alphabette.fr" 
              target="_blank" 
              rel="noreferrer" 
              className="text-[#c9a84c] hover:underline flex items-center gap-1"
            >
              alphabette.fr <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-sans text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}
