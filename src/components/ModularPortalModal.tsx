import React, { useState } from "react";
import { 
  Layers, Code, Copy, Check, Globe, Laptop, 
  Smartphone, Monitor, Sparkles, ExternalLink, 
  ShieldCheck, Sliders, X, Terminal, Cpu
} from "lucide-react";

export interface ModularPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: "dark-gold" | "light";
  currentAppMode?: "curator" | "visitor";
  currentMode?: "curator" | "visitor";
  onSwitchMode: (mode: "curator" | "visitor") => void;
}

export default function ModularPortalModal({
  isOpen,
  onClose,
  theme = "dark-gold",
  currentAppMode = "curator",
  currentMode,
  onSwitchMode
}: ModularPortalModalProps) {
  const effectiveMode = currentMode || currentAppMode;
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [embedMode, setEmbedMode] = useState<"kiosk" | "curator" | "circuit">("kiosk");
  const [showQrNotice, setShowQrNotice] = useState<boolean>(true);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "https://mon-atelier-art.web.app";
  const embedUrl = `${currentOrigin}?mode=${embedMode}&theme=dark`;

  const iframeSnippet = `<iframe 
  src="${embedUrl}" 
  width="100%" 
  height="750px" 
  frameborder="0" 
  allow="fullscreen" 
  style="border: 1px solid rgba(201,168,76,0.3); background: #050505; border-radius: 4px;"
  title="L'Œil de l'Atelier - Curation & Vernissage">
</iframe>`;

  const postMessageSnippet = `// Piloter l'exposition depuis votre site parent via postMessage :
const iframe = document.querySelector('iframe');

// Naviguer vers l'œuvre suivante
iframe.contentWindow.postMessage({ type: 'OEIL_ATELIER_NAVIGATE', direction: 'next' }, '*');

// Écouter les interactions du visiteur
window.addEventListener('message', (event) => {
  if (event.data.type === 'ARTWORK_CHANGED') {
    console.log('Œuvre affichée :', event.data.artworkTitle);
  }
});`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0c0c0e] border border-[#c9a84c]/60 shadow-2xl text-[#E0E0E0] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-start justify-between gap-4 bg-gradient-to-r from-black via-neutral-950 to-[#14120a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-[#c9a84c]/20 border border-[#c9a84c] flex items-center justify-center text-[#c9a84c] shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#c9a84c] block">
                Architecture Modulaire & Intégration Portail
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-light text-white tracking-wide">
                Centralisation & Intégration Web (Iframe & API)
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          
          {/* Strategic Decision: Dual Mode Toggle */}
          <div className="p-4 bg-neutral-950 border border-[#c9a84c]/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a84c] block">
                  Rôle Actif de l'Application
                </span>
                <h4 className="font-serif text-base sm:text-lg font-medium text-white">
                  Choisissez la Configuration selon le Contexte
                </h4>
              </div>
              <span className={`px-2.5 py-1 text-xs font-mono font-bold uppercase border ${
                currentAppMode === "visitor" ? "bg-emerald-950/40 text-emerald-400 border-emerald-600" : "bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c]"
              }`}>
                {currentAppMode === "visitor" ? "Mode Visiteur Actif" : "Mode Atelier Curation"}
              </span>
            </div>

            <p className="text-xs text-neutral-300 font-sans leading-relaxed">
              Pour répondre à votre question stratégique (outil d'administration en coulisses vs interface interactive pour les visiteurs), <strong>l'application intègre les deux vocations en synergie totale</strong> :
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              {/* Option A: Mode Visiteur */}
              <div 
                onClick={() => onSwitchMode("visitor")}
                className={`p-4 border transition-all cursor-pointer ${
                  currentAppMode === "visitor"
                    ? "bg-[#141208] border-[#c9a84c] shadow-lg shadow-[#c9a84c]/10"
                    : "bg-black/40 border-white/10 hover:border-white/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-[#c9a84c]" />
                    <strong className="text-sm font-serif text-white">Mode 1 · Kiosque Vernissage</strong>
                  </div>
                  {currentAppMode === "visitor" && <Check className="w-4 h-4 text-[#c9a84c]" />}
                </div>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                  Destiné à être projeté sur grand écran ou borne tactile lors du vernissage. Affiche l'<strong>exposition numérique</strong>, les cartels artistiques interactifs et le parcours urbain géolocalisé. Tout le panneau de gestion est masqué.
                </p>
              </div>

              {/* Option B: Mode Atelier */}
              <div 
                onClick={() => onSwitchMode("curator")}
                className={`p-4 border transition-all cursor-pointer ${
                  currentAppMode === "curator"
                    ? "bg-[#141208] border-[#c9a84c] shadow-lg shadow-[#c9a84c]/10"
                    : "bg-black/40 border-white/10 hover:border-white/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#c9a84c]" />
                    <strong className="text-sm font-serif text-white">Mode 2 · Curation & Coulisses</strong>
                  </div>
                  {currentAppMode === "curator" && <Check className="w-4 h-4 text-[#c9a84c]" />}
                </div>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                  L'espace de travail complet pour l'artiste et le galeriste : les <strong>36 outils d'expertise d'art</strong>, la gestion des <strong>invités RSVP & traiteurs locaux</strong>, l'export des certificats COA et des dossiers de presse.
                </p>
              </div>

            </div>
          </div>

          {/* Embed Generator */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a84c] block">
                  Encapsulation Iframe
                </span>
                <h4 className="font-serif text-base text-white">
                  Intégrez l'Application dans votre Site Web ou Portail
                </h4>
              </div>

              {/* URL Mode Switcher */}
              <div className="flex items-center gap-1.5 p-1 bg-black border border-white/10 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setEmbedMode("kiosk")}
                  className={`px-2.5 py-1 transition-all cursor-pointer ${
                    embedMode === "kiosk" ? "bg-[#c9a84c] text-black font-bold" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Kiosque Exposition
                </button>
                <button
                  type="button"
                  onClick={() => setEmbedMode("curator")}
                  className={`px-2.5 py-1 transition-all cursor-pointer ${
                    embedMode === "curator" ? "bg-[#c9a84c] text-black font-bold" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Atelier Complet
                </button>
              </div>
            </div>

            {/* Code Block for Iframe */}
            <div className="relative bg-black border border-white/15 p-3.5 font-mono text-xs text-emerald-400">
              <button
                type="button"
                onClick={() => handleCopy(iframeSnippet, "iframe")}
                className="absolute top-3 right-3 px-2.5 py-1 bg-neutral-900 border border-white/20 text-neutral-300 hover:text-white hover:border-[#c9a84c] flex items-center gap-1 text-[11px] font-mono cursor-pointer transition-colors"
              >
                {copiedKey === "iframe" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === "iframe" ? "Copié !" : "Copier le code"}</span>
              </button>
              <pre className="overflow-x-auto whitespace-pre-wrap pr-24 text-[11px] leading-relaxed text-neutral-300">
                {iframeSnippet}
              </pre>
            </div>
          </div>

          {/* JavaScript postMessage API */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a84c]">
                API JavaScript postMessage (Communication Bidirectionnelle)
              </span>
              <button
                type="button"
                onClick={() => handleCopy(postMessageSnippet, "api")}
                className="px-2.5 py-1 bg-neutral-900 border border-white/20 text-neutral-300 hover:text-white hover:border-[#c9a84c] flex items-center gap-1 text-[11px] font-mono cursor-pointer transition-colors"
              >
                {copiedKey === "api" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === "api" ? "Copié !" : "Copier le snippet JS"}</span>
              </button>
            </div>

            <div className="bg-black border border-white/15 p-3.5 font-mono text-[11px] text-amber-200/90 overflow-x-auto">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {postMessageSnippet}
              </pre>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black flex items-center justify-between text-xs font-mono">
          <span className="text-neutral-400">
            Compatible WordPress, Squarespace, Wix, Webflow et React
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 text-white hover:bg-[#c9a84c] hover:text-black transition-colors font-bold uppercase cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
