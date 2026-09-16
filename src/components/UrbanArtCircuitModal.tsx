import React, { useState } from "react";
import { 
  MapPin, Compass, Navigation, Camera, Building, 
  Clock, Footprints, ExternalLink, Printer, Sparkles, 
  X, Check, ChevronRight, Share2, Info
} from "lucide-react";

export interface CircuitWaypoint {
  id: string;
  order: number;
  title: string;
  category: "galerie" | "architecture" | "lightpainting" | "partenaire" | "belvedere";
  address: string;
  walkingTime: string;
  distance: string;
  description: string;
  artisticNote: string;
  coords: { x: number; y: number }; // Relative percentage coordinates for the vector canvas
  mapsQuery: string;
}

export interface UrbanArtCircuitModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: "dark-gold" | "light";
  venueName?: string;
  venueAddress?: string;
  artistName?: string;
  onOpenGallery3D?: () => void;
}

const DEFAULT_WAYPOINTS: CircuitWaypoint[] = [
  {
    id: "wp_1",
    order: 1,
    title: "Galerie de l'Atelier · Point de Départ",
    category: "galerie",
    address: "24 rue de Turenne, Paris 3e",
    walkingTime: "Départ",
    distance: "0 m",
    description: "Lieu de l'exposition principale et du vernissage. Présentation des toiles et des tirages photographiques light painting sous éclairage de galerie.",
    artisticNote: "Point de ralliement et accueil des visiteurs. Récupération des carnets de parcours et cartels.",
    coords: { x: 42, y: 52 },
    mapsQuery: "24+rue+de+Turenne+Paris"
  },
  {
    id: "wp_2",
    order: 2,
    title: "Hôtel Particulier & Portail Baroque",
    category: "architecture",
    address: "12 rue Pavée, Paris 4e",
    walkingTime: "3 min",
    distance: "240 m",
    description: "Façade monumentale du XVIIe siècle aux proportions classiques. Les encadrements en pierre de taille ont inspiré les lignes géométriques des toiles de la série.",
    artisticNote: "Observez le jeu d'ombres portées des mascarons baroques sous l'éclairage public nocturne.",
    coords: { x: 62, y: 35 },
    mapsQuery: "12+rue+Pavee+Paris"
  },
  {
    id: "wp_3",
    order: 3,
    title: "Passage Voûté & Spot de Light Painting Nocturne",
    category: "lightpainting",
    address: "Passage des Singes, Paris 4e",
    walkingTime: "4 min",
    distance: "320 m",
    description: "Arcade historique étroite à la réverbération acoustique et lumineuse unique. C'est ici qu'a été réalisée la prise de vue de l'œuvre centrale 'Trajectoires en Obscurité'.",
    artisticNote: "Spot idéal pour les visiteurs souhaitant tester des photographies en pose longue avec leur smartphone.",
    coords: { x: 74, y: 64 },
    mapsQuery: "Passage+des+Singes+Paris"
  },
  {
    id: "wp_4",
    order: 4,
    title: "Cave & Dégustation Partenaire 'Vignes & Terroirs'",
    category: "partenaire",
    address: "42 rue de Turenne, Paris 3e",
    walkingTime: "2 min",
    distance: "180 m",
    description: "Caviste indépendant partenaire du vernissage. Présentation d'une sélection de cépages d'auteur et d'une mini-toile exposée en vitrine.",
    artisticNote: "Dégustation d'un verre offert sur présentation du carton d'invitation du vernissage.",
    coords: { x: 32, y: 32 },
    mapsQuery: "42+rue+de+Turenne+Paris"
  },
  {
    id: "wp_5",
    order: 5,
    title: "Belvédère & Perspective Haussmannienne",
    category: "belvedere",
    address: "Place des Vosges & Arcades",
    walkingTime: "5 min",
    distance: "400 m",
    description: "Symétrie parfaite de brique rouge et de calcaire blond. Clôture contemplative du parcours urbain sous les arcades illuminées.",
    artisticNote: "Contemplez la perspective centrale où le ciel nocturne rencontre les silhouettes des toits parisiens.",
    coords: { x: 22, y: 72 },
    mapsQuery: "Place+des+Vosges+Paris"
  }
];

export default function UrbanArtCircuitModal({
  isOpen,
  onClose,
  theme = "dark-gold",
  venueName = "Galerie de l'Atelier",
  venueAddress = "24 rue de Turenne, Paris 3e",
  artistName,
  onOpenGallery3D
}: UrbanArtCircuitModalProps) {
  const [waypoints, setWaypoints] = useState<CircuitWaypoint[]>(DEFAULT_WAYPOINTS);
  const [selectedWaypointId, setSelectedWaypointId] = useState<string>("wp_1");
  const [cityName, setCityName] = useState<string>("Paris · Quartier Historique & Marais");

  if (!isOpen) return null;

  const selectedWaypoint = waypoints.find(w => w.id === selectedWaypointId) || waypoints[0];

  // Printable guide generator
  const handlePrintCircuit = () => {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Parcours Nocturne & Circuit Architectural · ${venueName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 22px; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 1px; }
    .header-info { color: #666; font-size: 13px; margin-bottom: 25px; border-bottom: 2px solid #c9a84c; padding-bottom: 10px; }
    .step-card { border: 1px solid #ddd; padding: 16px; margin-bottom: 16px; page-break-inside: avoid; }
    .step-num { display: inline-block; background: #c9a84c; color: #000; font-weight: bold; width: 24px; height: 24px; text-align: center; line-height: 24px; margin-right: 8px; font-size: 12px; }
    .step-title { font-size: 16px; font-weight: bold; }
    .step-meta { font-size: 12px; color: #777; margin: 6px 0; }
    .step-desc { font-size: 13px; line-height: 1.5; color: #333; }
    .step-art { font-size: 12px; font-style: italic; color: #9c7d2b; margin-top: 6px; }
    .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #888; }
  </style>
</head>
<body>
  <h1>CARNET DE PARCOURS URBAIN & ARTISTIQUE</h1>
  <div class="header-info">Exposition & Vernissage · ${venueName} (${cityName})</div>
  <p style="font-size: 13px; line-height: 1.6; margin-bottom: 20px;">
    Ce circuit immersif a été conçu pour lier les œuvres contemporaines et les photographies en light painting à l'architecture remarquable environnante. Durée estimée de la boucle piétonne : 30 à 45 minutes.
  </p>
  <div>
    ${waypoints.map(wp => `
      <div class="step-card">
        <div>
          <span class="step-num">${wp.order}</span>
          <span class="step-title">${wp.title}</span>
        </div>
        <div class="step-meta">📍 ${wp.address} · 🚶 ${wp.walkingTime} (${wp.distance})</div>
        <div class="step-desc">${wp.description}</div>
        <div class="step-art">💡 <strong>Regard Curation :</strong> ${wp.artisticNote}</div>
      </div>
    `).join("")}
  </div>
  <div class="footer">L'Œil de l'Atelier · Plateforme de Curation, Vernissages & Valorisation d'Œuvres</div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      setTimeout(() => win.print(), 350);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0c0c0e] border border-[#c9a84c]/60 shadow-2xl text-[#E0E0E0] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-start justify-between gap-4 bg-gradient-to-r from-black via-neutral-950 to-[#14120a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-[#c9a84c]/20 border border-[#c9a84c] flex items-center justify-center text-[#c9a84c] shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#c9a84c] block">
                Immersion & Scénographie Hors-les-Murs
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-light text-white tracking-wide">
                Carte Interactive & Parcours Urbain Nocturne
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

        {/* City / Context Selector Banner */}
        <div className="px-5 py-2.5 bg-neutral-950 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Territoire d'Exposition :</span>
            <span className="text-[#c9a84c] font-bold">{cityName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintCircuit}
              className="px-3 py-1 bg-neutral-900 border border-white/20 text-white hover:bg-white hover:text-black font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer text-[11px]"
            >
              <Printer className="w-3.5 h-3.5 text-[#c9a84c]" />
              <span>Imprimer le Carnet Visiteur</span>
            </button>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedWaypoint.mapsQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-[#c9a84c] text-black font-bold uppercase hover:bg-white transition-all flex items-center gap-1.5 text-[11px]"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </a>
          </div>
        </div>

        {/* Main Grid: Interactive Map (Left/Top) + Steps Directory (Right/Bottom) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 custom-scrollbar">
          
          {/* Left Column: Interactive Vector Dark Map (7 cols) */}
          <div className="lg:col-span-7 p-4 sm:p-6 flex flex-col justify-between bg-black/60 border-b lg:border-b-0 lg:border-r border-white/10">
            
            <div className="relative w-full aspect-[4/3] bg-[#070709] border border-white/15 overflow-hidden shadow-inner group">
              
              {/* Stylized Dark Architectural Map Grid Lines */}
              <svg className="w-full h-full absolute inset-0 pointer-events-none opacity-40">
                <defs>
                  <pattern id="urbanGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#222" strokeWidth="0.8" />
                  </pattern>
                  <linearGradient id="routeGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#e5c878" stopOpacity="0.9" />
                  </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#urbanGrid)" />
                
                {/* Stylized Architectural Street Outlines */}
                <path d="M 10 90 Q 200 120 400 80 T 800 110" fill="none" stroke="#1c1c20" strokeWidth="24" />
                <path d="M 150 10 L 220 500" fill="none" stroke="#1c1c20" strokeWidth="18" />
                <path d="M 50 350 L 750 320" fill="none" stroke="#1c1c20" strokeWidth="20" />
                
                {/* Circuit Route Connecting the Waypoints */}
                <path
                  d="M 42% 52% L 62% 35% L 74% 64% L 32% 32% L 22% 72% Z"
                  fill="none"
                  stroke="url(#routeGold)"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
              </svg>

              {/* Waypoint Markers */}
              {waypoints.map((wp) => {
                const isSelected = wp.id === selectedWaypointId;
                return (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => setSelectedWaypointId(wp.id)}
                    style={{ left: `${wp.coords.x}%`, top: `${wp.coords.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 p-1.5 transition-all duration-300 z-10 cursor-pointer group/pin ${
                      isSelected ? "scale-125 z-20" : "hover:scale-110"
                    }`}
                  >
                    <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border shadow-xl transition-all ${
                      isSelected
                        ? "bg-[#c9a84c] text-black border-white shadow-[0_0_15px_rgba(201,168,76,0.8)]"
                        : "bg-black/90 text-[#c9a84c] border-[#c9a84c]/60 hover:bg-[#c9a84c] hover:text-black"
                    }`}>
                      <span className="font-mono text-xs font-black">{wp.order}</span>
                    </div>

                    {/* Floating mini-label on hover or selected */}
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 whitespace-nowrap text-[9px] font-mono uppercase tracking-wider bg-black/90 border border-white/20 text-white pointer-events-none shadow-md transition-opacity ${
                      isSelected ? "opacity-100 border-[#c9a84c] text-[#c9a84c]" : "opacity-0 group-hover/pin:opacity-100"
                    }`}>
                      {wp.title.split("·")[0]}
                    </div>
                  </button>
                );
              })}

              {/* Map Legend Overlay in Bottom Corner */}
              <div className="absolute bottom-2 left-2 p-2 bg-black/85 border border-white/10 text-[9px] font-mono text-neutral-400 space-y-1 pointer-events-none backdrop-blur-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#c9a84c] inline-block" />
                  <span>Points du Parcours Artistique</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-[2px] bg-[#c9a84c] inline-block" />
                  <span>Itinéraire piéton conseillé (35 min)</span>
                </div>
              </div>
            </div>

            {/* Selected Waypoint Detail Card */}
            <div className="mt-4 p-4 bg-neutral-950 border border-[#c9a84c]/50 animate-fadeIn">
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#c9a84c] text-black font-mono font-bold text-xs flex items-center justify-center">
                      {selectedWaypoint.order}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a84c]">
                      {selectedWaypoint.category.toUpperCase()} · 🚶 {selectedWaypoint.walkingTime}
                    </span>
                  </div>
                  <h4 className="font-serif text-lg font-medium text-white tracking-wide mt-1">
                    {selectedWaypoint.title}
                  </h4>
                  <span className="text-xs text-neutral-400 font-mono mt-0.5 block">
                    📍 {selectedWaypoint.address} ({selectedWaypoint.distance})
                  </span>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedWaypoint.mapsQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-neutral-900 border border-white/20 text-[#c9a84c] hover:bg-[#c9a84c] hover:text-black transition-colors"
                  title="Ouvrir dans Google Maps"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <p className="text-xs text-neutral-300 font-sans leading-relaxed mb-3">
                {selectedWaypoint.description}
              </p>

              <div className="p-3 bg-[#c9a84c]/10 border border-[#c9a84c]/30 text-xs font-sans text-[#c9a84c]">
                💡 <strong>Regard Curation & Photo :</strong> {selectedWaypoint.artisticNote}
              </div>
            </div>
          </div>

          {/* Right Column: Step-by-Step Waypoint List (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-6 space-y-3 bg-neutral-950">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#c9a84c] block mb-2">
              Étapes du Circuit Piéton ({waypoints.length} Points Clés)
            </span>

            <div className="space-y-2.5">
              {waypoints.map((wp) => {
                const isSelected = wp.id === selectedWaypointId;
                return (
                  <div
                    key={wp.id}
                    onClick={() => setSelectedWaypointId(wp.id)}
                    className={`p-3.5 border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#121008] border-[#c9a84c] shadow-lg shadow-[#c9a84c]/10"
                        : "bg-black/40 border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-6 h-6 rounded-none font-mono font-bold text-xs flex items-center justify-center border ${
                          isSelected ? "bg-[#c9a84c] text-black border-[#c9a84c]" : "bg-neutral-900 text-neutral-400 border-white/10"
                        }`}>
                          {wp.order}
                        </span>
                        <div>
                          <h5 className={`font-serif text-sm font-medium tracking-wide ${
                            isSelected ? "text-[#c9a84c]" : "text-white"
                          }`}>
                            {wp.title}
                          </h5>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {wp.address} · {wp.walkingTime}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? "text-[#c9a84c] translate-x-1" : "text-neutral-600"}`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Artistic Context Box */}
            <div className="p-4 border border-white/10 bg-neutral-900/60 mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-[#c9a84c]">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-bold uppercase">Pourquoi un Parcours Urbain ?</span>
              </div>
              <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                Le light painting et la peinture contemporaine tirent leur essence de la ville, de son obscurité et de sa géométrie architecturale. Inviter vos collectionneurs à marcher quelques minutes dans le quartier avant ou après le cocktail ancre l'œuvre dans la réalité vivante du lieu.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-black flex items-center justify-between text-xs font-mono">
          <span className="text-neutral-400">
            {waypoints.length} étapes · Boucle pédestre totale : ~1.2 km
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 text-white hover:bg-[#c9a84c] hover:text-black transition-colors font-bold uppercase cursor-pointer"
          >
            Fermer la carte
          </button>
        </div>
      </div>
    </div>
  );
}
