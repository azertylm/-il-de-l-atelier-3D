import React, { useState, useEffect } from "react";
import { 
  Users, Utensils, CheckCircle2, Clock, XCircle, 
  Plus, Search, Download, Printer, Phone, Mail, 
  MapPin, DollarSign, Calendar, Sparkles, Filter, 
  Trash2, Edit, Check, AlertCircle, X, GlassWater,
  ChefHat, Coffee, Store, ShieldCheck, ChevronDown, ChevronUp
} from "lucide-react";

export interface GuestItem {
  id: string;
  name: string;
  category: "VIP" | "Presse" | "Collectionneur" | "Galeriste" | "Partenaire" | "Invité";
  rsvpStatus: "confirmed" | "pending" | "declined" | "attended";
  plusOnes: number;
  dietary?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface LocalPartner {
  id: string;
  name: string;
  category: "traiteur" | "boulangerie" | "caviste" | "snack" | "patisserie" | "fromagerie";
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  menuItems: string;
  budgetEstimated: number;
  orderStatus: "devis_en_cours" | "valide_acompte" | "livraison_confirmee" | "regle";
  deliveryTime?: string;
  notes?: string;
}

export interface EventRsvpPartnersModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: "dark-gold" | "light";
  expoTitle?: string;
  expoDate?: string;
  expoVenue?: string;
  artistName?: string;
  artworksCount?: number;
}

const INITIAL_GUESTS: GuestItem[] = [
  {
    id: "g1",
    name: "Baron & Baronne de Montmirail",
    category: "Collectionneur",
    rsvpStatus: "confirmed",
    plusOnes: 1,
    dietary: "Champagne brut uniquement",
    email: "montmirail.art@collection.fr",
    phone: "+33 6 12 34 56 78",
    notes: "Intéressés par la grande toile centrale en light-painting."
  },
  {
    id: "g2",
    name: "Éléonore Faure",
    category: "Presse",
    rsvpStatus: "confirmed",
    plusOnes: 0,
    dietary: "Végétarien",
    email: "efaure@art-tribune.fr",
    notes: "Rédactrice en chef Art Magazine. Interview prévue à 19h15."
  },
  {
    id: "g3",
    name: "Alexandre Mercier",
    category: "Galeriste",
    rsvpStatus: "confirmed",
    plusOnes: 1,
    email: "a.mercier@galerie-vanguard.com",
    notes: "Directeur de galerie contemporaine Marais."
  },
  {
    id: "g4",
    name: "Céline B.",
    category: "Collectionneur",
    rsvpStatus: "pending",
    plusOnes: 0,
    email: "celine.b@artlovers.net",
    notes: "Relance effectuée hier par WhatsApp."
  },
  {
    id: "g5",
    name: "Julien & Sarah Laurent",
    category: "Partenaire",
    rsvpStatus: "confirmed",
    plusOnes: 0,
    dietary: "Sans gluten",
    phone: "+33 6 98 76 54 32",
    notes: "Propriétaires du Domaine Viticole partenaire du buffet."
  },
  {
    id: "g6",
    name: "Dr. Henri Veyrat",
    category: "Invité",
    rsvpStatus: "declined",
    plusOnes: 0,
    notes: "En déplacement à Bruxelles le soir du vernissage."
  }
];

const INITIAL_PARTNERS: LocalPartner[] = [
  {
    id: "p1",
    name: "L'Atelier Traiteur des Saveurs",
    category: "traiteur",
    contactPerson: "Chef Matthieu Girard",
    phone: "+33 1 42 78 90 12",
    email: "contact@ateliertraiteur-paris.fr",
    address: "18 rue des Francs-Bourgeois, 75003 Paris",
    menuItems: "400 pièces cocktail raffinées : navettes saumon fumé & aneth, canapés foie gras & figue, mini-tacos guacamole & crevettes, brochettes tomates séchées & mozzarella di bufala.",
    budgetEstimated: 1250,
    orderStatus: "valide_acompte",
    deliveryTime: "17h45 (45 min avant ouverture)",
    notes: "Prêt de verrerie prestige et plateaux ardoise inclus."
  },
  {
    id: "p2",
    name: "Maison Vignes & Terroirs (Caviste Indépendant)",
    category: "caviste",
    contactPerson: "Antoine (Sommelier)",
    phone: "+33 1 43 25 67 89",
    email: "vins@vignes-terroirs.fr",
    address: "42 rue de Turenne, 75003 Paris",
    menuItems: "18 bouteilles Champagne Brut Réserve, 12 bouteilles Bourgogne Blanc Aligoté bio, 12 bouteilles Saint-Émilion Grand Cru, 24 bouteilles jus de pomme artisanal & eaux pétillantes.",
    budgetEstimated: 680,
    orderStatus: "livraison_confirmee",
    deliveryTime: "16h30 le jour J (avec bacs à glaçons)",
    notes: "Reprise des bouteilles non débouchées garantie."
  },
  {
    id: "p3",
    name: "Boulangerie Artisanale du Quartier",
    category: "boulangerie",
    contactPerson: "Lucie & Thomas",
    phone: "+33 1 48 04 33 21",
    address: "7 rue Vieille-du-Temple, 75004 Paris",
    menuItems: "Pains spéciaux au levain naturel (pain aux noix, pain noir au charbon végétal assorti aux photos light painting), 60 gougères tièdes au comté affiné.",
    budgetEstimated: 180,
    orderStatus: "valide_acompte",
    deliveryTime: "18h00 le jour J",
    notes: "Commande personnalisée avec pain au charbon très esthétique."
  },
  {
    id: "p4",
    name: "Snack Urbain & Tapas Bio « Le Refuge »",
    category: "snack",
    contactPerson: "Karim",
    phone: "+33 6 45 12 78 90",
    email: "hello@lerefuge-paris.com",
    address: "12 rue Pavée, 75004 Paris",
    menuItems: "Planches de finger-food chaudes et froides : beignets de courgettes à la menthe, falafels croustillants maison, houmous à la betterave pourpre.",
    budgetEstimated: 320,
    orderStatus: "devis_en_cours",
    deliveryTime: "18h15",
    notes: "Option végane et sans gluten pour les convives exigeants."
  }
];

export default function EventRsvpPartnersModal({
  isOpen,
  onClose,
  theme = "dark-gold",
  expoTitle = "ÉCHOS DE LUMIÈRE & MATIÈRE",
  expoDate = "Jeudi 15 Octobre 2026 · 18h30",
  expoVenue = "Galerie de l'Atelier, Paris 3e",
  artistName,
  artworksCount
}: EventRsvpPartnersModalProps) {
  const [activeTab, setActiveTab] = useState<"rsvp" | "partners" | "calculator">("rsvp");
  
  // Guests state
  const [guests, setGuests] = useState<GuestItem[]>(INITIAL_GUESTS);
  const [guestSearch, setGuestSearch] = useState<string>("");
  const [guestFilter, setGuestFilter] = useState<string>("all");
  const [isAddGuestOpen, setIsAddGuestOpen] = useState<boolean>(false);
  const [newGuestName, setNewGuestName] = useState<string>("");
  const [newGuestCategory, setNewGuestCategory] = useState<GuestItem["category"]>("VIP");
  const [newGuestStatus, setNewGuestStatus] = useState<GuestItem["rsvpStatus"]>("confirmed");
  const [newGuestPlusOnes, setNewGuestPlusOnes] = useState<number>(0);
  const [newGuestDietary, setNewGuestDietary] = useState<string>("");
  const [newGuestEmail, setNewGuestEmail] = useState<string>("");

  // Partners state
  const [partners, setPartners] = useState<LocalPartner[]>(INITIAL_PARTNERS);
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState<boolean>(false);
  const [newPartnerName, setNewPartnerName] = useState<string>("");
  const [newPartnerCategory, setNewPartnerCategory] = useState<LocalPartner["category"]>("traiteur");
  const [newPartnerContact, setNewPartnerContact] = useState<string>("");
  const [newPartnerPhone, setNewPartnerPhone] = useState<string>("");
  const [newPartnerMenu, setNewPartnerMenu] = useState<string>("");
  const [newPartnerBudget, setNewPartnerBudget] = useState<number>(250);
  const [newPartnerStatus, setNewPartnerStatus] = useState<LocalPartner["orderStatus"]>("valide_acompte");

  // Load persistence
  useEffect(() => {
    const savedGuests = localStorage.getItem("oeilAtelier_event_guests");
    if (savedGuests) {
      try {
        setGuests(JSON.parse(savedGuests));
      } catch (e) {
        console.error("Error loading guests:", e);
      }
    }

    const savedPartners = localStorage.getItem("oeilAtelier_event_partners");
    if (savedPartners) {
      try {
        setPartners(JSON.parse(savedPartners));
      } catch (e) {
        console.error("Error loading partners:", e);
      }
    }
  }, []);

  const saveGuestsToStorage = (updated: GuestItem[]) => {
    setGuests(updated);
    localStorage.setItem("oeilAtelier_event_guests", JSON.stringify(updated));
  };

  const savePartnersToStorage = (updated: LocalPartner[]) => {
    setPartners(updated);
    localStorage.setItem("oeilAtelier_event_partners", JSON.stringify(updated));
  };

  // Calculations
  const confirmedCount = guests
    .filter(g => g.rsvpStatus === "confirmed" || g.rsvpStatus === "attended")
    .reduce((acc, g) => acc + 1 + g.plusOnes, 0);
  
  const pendingCount = guests
    .filter(g => g.rsvpStatus === "pending")
    .reduce((acc, g) => acc + 1 + g.plusOnes, 0);

  const totalPartnersBudget = partners.reduce((acc, p) => acc + p.budgetEstimated, 0);
  const costPerGuest = confirmedCount > 0 ? (totalPartnersBudget / confirmedCount).toFixed(1) : "0";
  const [isMetricsExpanded, setIsMetricsExpanded] = useState<boolean>(false);

  // Filtered Guests
  const filteredGuests = guests.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(guestSearch.toLowerCase()) || 
                          (g.email && g.email.toLowerCase().includes(guestSearch.toLowerCase())) ||
                          (g.notes && g.notes.toLowerCase().includes(guestSearch.toLowerCase()));
    if (!matchesSearch) return false;
    if (guestFilter === "all") return true;
    return g.rsvpStatus === guestFilter || g.category === guestFilter;
  });

  // Add guest handler
  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim()) return;

    const newGuest: GuestItem = {
      id: `guest_${Date.now()}`,
      name: newGuestName.trim(),
      category: newGuestCategory,
      rsvpStatus: newGuestStatus,
      plusOnes: newGuestPlusOnes,
      dietary: newGuestDietary.trim() || undefined,
      email: newGuestEmail.trim() || undefined
    };

    const updated = [newGuest, ...guests];
    saveGuestsToStorage(updated);
    setNewGuestName("");
    setNewGuestDietary("");
    setNewGuestEmail("");
    setNewGuestPlusOnes(0);
    setIsAddGuestOpen(false);
  };

  // Add partner handler
  const handleAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim()) return;

    const newPartner: LocalPartner = {
      id: `partner_${Date.now()}`,
      name: newPartnerName.trim(),
      category: newPartnerCategory,
      contactPerson: newPartnerContact.trim() || undefined,
      phone: newPartnerPhone.trim() || undefined,
      menuItems: newPartnerMenu.trim() || "Prestation sur-mesure",
      budgetEstimated: Number(newPartnerBudget) || 0,
      orderStatus: newPartnerStatus
    };

    const updated = [...partners, newPartner];
    savePartnersToStorage(updated);
    setNewPartnerName("");
    setNewPartnerContact("");
    setNewPartnerPhone("");
    setNewPartnerMenu("");
    setNewPartnerBudget(200);
    setIsAddPartnerOpen(false);
  };

  // Export Emargement HTML
  const handleExportEmargement = () => {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Feuille d'Émargement · ${expoTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; color: #111; }
    h1 { font-size: 20px; text-transform: uppercase; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 13px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; background: #f0f0f0; padding: 8px; border: 1px solid #ccc; font-weight: bold; }
    td { padding: 8px; border: 1px solid #ccc; }
    .check-box { width: 18px; height: 18px; border: 1.5px solid #333; display: inline-block; }
  </style>
</head>
<body>
  <h1>FEUILLE D'ÉMARGEMENT ACCUEIL VERNISSAGE</h1>
  <div class="subtitle">${expoTitle} · ${expoDate} · Lieu : ${expoVenue}</div>
  <table>
    <thead>
      <tr>
        <th style="width: 35px;">Présent</th>
        <th>Nom de l'Invité</th>
        <th>Catégorie</th>
        <th>Statut RSVP</th>
        <th>+1</th>
        <th>Régime / Particularités</th>
        <th>Signature / Émargement</th>
      </tr>
    </thead>
    <tbody>
      ${guests.map(g => `
        <tr>
          <td style="text-align: center;"><span class="check-box"></span></td>
          <td><strong>${g.name}</strong></td>
          <td>${g.category}</td>
          <td>${g.rsvpStatus === "confirmed" ? "Confirmé" : g.rsvpStatus === "pending" ? "En attente" : g.rsvpStatus}</td>
          <td>${g.plusOnes > 0 ? `+${g.plusOnes}` : "Seul"}</td>
          <td>${g.dietary || "—"}</td>
          <td style="width: 150px;"></td>
        </tr>
      `).join("")}
    </tbody>
  </table>
  <p style="margin-top: 25px; font-size: 11px; color: #777;">Généré par L'Œil de l'Atelier · Plateforme de Curation & Vernissage Artistique</p>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      setTimeout(() => win.print(), 350);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-5xl h-[95vh] sm:h-auto sm:max-h-[92vh] flex flex-col bg-[#0d0d0f] border border-[#c9a84c]/60 shadow-2xl text-[#E0E0E0] overflow-hidden">
        
        {/* Header */}
        <div className="p-3 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-gradient-to-r from-black via-neutral-950 to-[#12100a] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-none bg-[#c9a84c]/20 border border-[#c9a84c] flex items-center justify-center text-[#c9a84c] shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-[#c9a84c] block truncate">
                Gestion des Événements & Logistique de Vernissage
              </span>
              <h3 className="font-serif text-sm sm:text-xl md:text-2xl font-light text-white tracking-wide truncate">
                Invités, RSVP & Partenaires Locaux du Buffet
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Mobile Compact KPI Strip (< sm) */}
        <div className="sm:hidden flex items-center justify-between px-3 py-2 bg-black/70 border-b border-white/10 text-[11px] font-mono shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-[11px] py-0.5">
            <span className="text-emerald-400 font-bold whitespace-nowrap">
              ✓ {confirmedCount} conf.
            </span>
            <span className="text-neutral-600">•</span>
            <span className="text-amber-400 whitespace-nowrap">
              ⏳ {pendingCount} rsvp
            </span>
            <span className="text-neutral-600">•</span>
            <span className="text-[#c9a84c] whitespace-nowrap">
              🍽️ {partners.length} part.
            </span>
            <span className="text-neutral-600">•</span>
            <span className="text-white font-bold whitespace-nowrap">
              {totalPartnersBudget} €
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsMetricsExpanded(!isMetricsExpanded)}
            className="ml-2 px-2 py-1 bg-neutral-800/80 hover:bg-neutral-700 text-[10px] text-[#c9a84c] uppercase font-bold shrink-0 flex items-center gap-1 border border-white/15 cursor-pointer"
          >
            {isMetricsExpanded ? (
              <>Moins <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>Détails <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        </div>

        {/* Top Metric Cards (Hidden on mobile when collapsed, 4 columns on sm+) */}
        <div className={`${isMetricsExpanded ? "grid" : "hidden sm:grid"} grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 p-2.5 sm:p-4 bg-black/50 border-b border-white/10 text-xs font-mono shrink-0`}>
          <div className="p-2.5 sm:p-3 bg-neutral-900/80 border border-white/10">
            <span className="text-neutral-400 block text-[9px] sm:text-[10px] uppercase tracking-wider">Convives Confirmés :</span>
            <span className="text-base sm:text-xl font-bold text-emerald-400 mt-0.5 block">
              {confirmedCount} <span className="text-xs text-neutral-400 font-normal">personnes</span>
            </span>
          </div>

          <div className="p-2.5 sm:p-3 bg-neutral-900/80 border border-white/10">
            <span className="text-neutral-400 block text-[9px] sm:text-[10px] uppercase tracking-wider">En Attente RSVP :</span>
            <span className="text-base sm:text-xl font-bold text-amber-400 mt-0.5 block">
              {pendingCount} <span className="text-xs text-neutral-400 font-normal">invitations</span>
            </span>
          </div>

          <div className="p-2.5 sm:p-3 bg-neutral-900/80 border border-white/10">
            <span className="text-neutral-400 block text-[9px] sm:text-[10px] uppercase tracking-wider">Partenaires Buffet :</span>
            <span className="text-base sm:text-xl font-bold text-[#c9a84c] mt-0.5 block">
              {partners.length} <span className="text-xs text-neutral-400 font-normal">commerces</span>
            </span>
          </div>

          <div className="p-2.5 sm:p-3 bg-neutral-900/80 border border-white/10">
            <span className="text-neutral-400 block text-[9px] sm:text-[10px] uppercase tracking-wider">Budget Traiteur :</span>
            <span className="text-base sm:text-xl font-bold text-white mt-0.5 block">
              {totalPartnersBudget} € <span className="text-[10px] text-neutral-400 font-normal">({costPerGuest} € / tête)</span>
            </span>
          </div>
        </div>

        {/* Navigation Tabs (Single line with horizontal scrolling on mobile) */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-white/10 bg-neutral-950 px-2 sm:px-4 shrink-0 whitespace-nowrap">
          <button
            type="button"
            onClick={() => setActiveTab("rsvp")}
            className={`px-3 py-2.5 sm:px-4 sm:py-3 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "rsvp"
                ? "border-[#c9a84c] text-[#c9a84c] bg-white/5"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Invités & RSVP ({guests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("partners")}
            className={`px-3 py-2.5 sm:px-4 sm:py-3 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "partners"
                ? "border-[#c9a84c] text-[#c9a84c] bg-white/5"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <Utensils className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Partenaires Locaux & Buffet ({partners.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("calculator")}
            className={`px-3 py-2.5 sm:px-4 sm:py-3 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "calculator"
                ? "border-[#c9a84c] text-[#c9a84c] bg-white/5"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <GlassWater className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Calculateur Boissons & Pièces</span>
          </button>
        </div>

        {/* Tab Content (min-h-0 allows flex child to shrink and scroll properly) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 custom-scrollbar">
          
          {/* TAB 1: RSVP & GUESTS LIST */}
          {activeTab === "rsvp" && (
            <div className="space-y-4">
              
              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={guestSearch}
                      onChange={(e) => setGuestSearch(e.target.value)}
                      placeholder="Rechercher un invité, email, note..."
                      className="w-full bg-neutral-900 border border-white/15 pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#c9a84c]"
                    />
                  </div>
                  <select
                    value={guestFilter}
                    onChange={(e) => setGuestFilter(e.target.value)}
                    className="bg-neutral-900 border border-white/15 px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-[#c9a84c] cursor-pointer"
                  >
                    <option value="all">Tous les invités</option>
                    <option value="confirmed">Confirmés</option>
                    <option value="pending">En attente</option>
                    <option value="declined">Déclinés</option>
                    <option value="VIP">VIP</option>
                    <option value="Collectionneur">Collectionneurs</option>
                    <option value="Presse">Presse & Médias</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportEmargement}
                    className="px-3 py-1.5 bg-neutral-900 border border-white/20 text-xs font-mono font-bold uppercase hover:bg-white hover:text-black transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Imprimer ou exporter la feuille d'émargement pour l'accueil"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Feuille d'Émargement</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddGuestOpen(!isAddGuestOpen)}
                    className="px-3.5 py-1.5 bg-[#c9a84c] text-black text-xs font-mono font-bold uppercase hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nouvel Invité</span>
                  </button>
                </div>
              </div>

              {/* Add Guest Inline Form */}
              {isAddGuestOpen && (
                <form onSubmit={handleAddGuest} className="bg-neutral-950 border border-[#c9a84c]/50 p-4 animate-fadeIn space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-mono font-bold text-[#c9a84c] uppercase">
                      Ajouter une Invitation Vernissage
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddGuestOpen(false)}
                      className="text-neutral-400 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-mono text-neutral-400 block mb-1">Nom & Titre :</label>
                      <input
                        type="text"
                        required
                        value={newGuestName}
                        onChange={(e) => setNewGuestName(e.target.value)}
                        placeholder="Ex: Sophie & Laurent Bertin"
                        className="w-full bg-neutral-900 border border-white/20 p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-neutral-400 block mb-1">Catégorie :</label>
                      <select
                        value={newGuestCategory}
                        onChange={(e) => setNewGuestCategory(e.target.value as any)}
                        className="w-full bg-neutral-900 border border-white/20 p-2 text-white"
                      >
                        <option value="VIP">VIP</option>
                        <option value="Collectionneur">Collectionneur</option>
                        <option value="Presse">Presse & Médias</option>
                        <option value="Galeriste">Galeriste & Curateur</option>
                        <option value="Partenaire">Partenaire Local</option>
                        <option value="Invité">Invité Standard</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-neutral-400 block mb-1">Statut RSVP :</label>
                      <select
                        value={newGuestStatus}
                        onChange={(e) => setNewGuestStatus(e.target.value as any)}
                        className="w-full bg-neutral-900 border border-white/20 p-2 text-white"
                      >
                        <option value="confirmed">Confirmé</option>
                        <option value="pending">En attente de réponse</option>
                        <option value="declined">Décliné</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-neutral-400 block mb-1">Accompagnant (+N) :</label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        value={newGuestPlusOnes}
                        onChange={(e) => setNewGuestPlusOnes(parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-neutral-900 border border-white/20 p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-neutral-400 block mb-1">Régime / Allergies :</label>
                      <input
                        type="text"
                        value={newGuestDietary}
                        onChange={(e) => setNewGuestDietary(e.target.value)}
                        placeholder="Ex: Végétarien, sans alcool..."
                        className="w-full bg-neutral-900 border border-white/20 p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-neutral-400 block mb-1">Email / Contact :</label>
                      <input
                        type="text"
                        value={newGuestEmail}
                        onChange={(e) => setNewGuestEmail(e.target.value)}
                        placeholder="contact@domaine.fr"
                        className="w-full bg-neutral-900 border border-white/20 p-2 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#c9a84c] text-black font-mono font-bold text-xs uppercase hover:bg-white cursor-pointer"
                    >
                      Enregistrer l'invité
                    </button>
                  </div>
                </form>
              )}

              {/* Guests Table */}
              <div className="border border-white/10 overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-neutral-950 font-mono text-[10px] uppercase tracking-wider text-neutral-400 border-b border-white/10">
                    <tr>
                      <th className="p-3">Invité & Contact</th>
                      <th className="p-3">Catégorie</th>
                      <th className="p-3">Statut RSVP</th>
                      <th className="p-3">+1</th>
                      <th className="p-3">Régime / Notes</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredGuests.map((guest) => (
                      <tr key={guest.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3">
                          <span className="font-bold text-white block">{guest.name}</span>
                          <span className="text-[11px] text-neutral-400 font-mono">
                            {guest.email || guest.phone || "Non renseigné"}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 text-[10px] font-mono uppercase font-bold border ${
                            guest.category === "VIP"
                              ? "bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c]/50"
                              : guest.category === "Collectionneur"
                              ? "bg-purple-950/40 text-purple-300 border-purple-800"
                              : guest.category === "Presse"
                              ? "bg-blue-950/40 text-blue-300 border-blue-800"
                              : "bg-neutral-800 text-neutral-300 border-neutral-700"
                          }`}>
                            {guest.category}
                          </span>
                        </td>
                        <td className="p-3">
                          <select
                            value={guest.rsvpStatus}
                            onChange={(e) => {
                              const updated = guests.map(g => g.id === guest.id ? { ...g, rsvpStatus: e.target.value as any } : g);
                              saveGuestsToStorage(updated);
                            }}
                            className={`px-2 py-1 text-[11px] font-mono uppercase font-bold border bg-neutral-900 cursor-pointer ${
                              guest.rsvpStatus === "confirmed" || guest.rsvpStatus === "attended"
                                ? "text-emerald-400 border-emerald-500/50"
                                : guest.rsvpStatus === "pending"
                                ? "text-amber-400 border-amber-500/50"
                                : "text-rose-400 border-rose-500/50"
                            }`}
                          >
                            <option value="confirmed">✓ Confirmé</option>
                            <option value="pending">⏳ En attente</option>
                            <option value="declined">✕ Décliné</option>
                            <option value="attended">★ Présent sur place</option>
                          </select>
                        </td>
                        <td className="p-3 font-mono">
                          {guest.plusOnes > 0 ? `+${guest.plusOnes}` : "Seul"}
                        </td>
                        <td className="p-3 text-neutral-300 text-xs">
                          {guest.dietary && (
                            <span className="text-[#c9a84c] text-[11px] block font-mono">
                              🍽️ {guest.dietary}
                            </span>
                          )}
                          {guest.notes && <span className="italic text-neutral-400 text-[11px]">{guest.notes}</span>}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = guests.filter(g => g.id !== guest.id);
                              saveGuestsToStorage(updated);
                            }}
                            className="p-1 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Supprimer l'invité"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PARTENAIRES COMMERCES LOCAUX & BUFFET */}
          {activeTab === "partners" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-neutral-950 p-3 sm:p-4 border border-[#c9a84c]/30">
                <div>
                  <h4 className="text-xs sm:text-sm font-serif font-bold text-white uppercase tracking-wider">
                    Commerces Locaux, Traiteurs & Partenaires Buffet
                  </h4>
                  <p className="text-[11px] sm:text-xs text-neutral-400 font-sans mt-0.5">
                    Centralisez les menus, contacts directs et devis des commerces de votre quartier pour valoriser l'ancrage local de votre vernissage.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddPartnerOpen(!isAddPartnerOpen)}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#c9a84c] text-black font-mono font-bold text-[11px] sm:text-xs uppercase hover:bg-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Ajouter un Partenaire</span>
                </button>
              </div>

              {/* Add Partner Form */}
              {isAddPartnerOpen && (
                <form onSubmit={handleAddPartner} className="bg-neutral-950 border border-[#c9a84c] p-4 animate-fadeIn space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-mono font-bold text-[#c9a84c] uppercase">
                      Nouvelle Fiche Partenaire Local
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddPartnerOpen(false)}
                      className="text-neutral-400 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-mono text-neutral-400 block mb-1">Nom du Commerce / Établissement :</label>
                      <input
                        type="text"
                        required
                        value={newPartnerName}
                        onChange={(e) => setNewPartnerName(e.target.value)}
                        placeholder="Ex: Cave des Beaux-Arts"
                        className="w-full bg-neutral-900 border border-white/20 p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-neutral-400 block mb-1">Catégorie :</label>
                      <select
                        value={newPartnerCategory}
                        onChange={(e) => setNewPartnerCategory(e.target.value as any)}
                        className="w-full bg-neutral-900 border border-white/20 p-2 text-white"
                      >
                        <option value="traiteur">Traiteur & Cocktail</option>
                        <option value="caviste">Caviste & Boissons</option>
                        <option value="boulangerie">Boulangerie Artisanale</option>
                        <option value="snack">Snack & Tapas Bio</option>
                        <option value="patisserie">Pâtisserie & Mignardises</option>
                        <option value="fromagerie">Fromagerie Locale</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-neutral-400 block mb-1">Budget / Devis Convenu (€) :</label>
                      <input
                        type="number"
                        min="0"
                        value={newPartnerBudget}
                        onChange={(e) => setNewPartnerBudget(parseFloat(e.target.value) || 0)}
                        className="w-full bg-neutral-900 border border-white/20 p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-neutral-400 block mb-1">Contact Référent :</label>
                      <input
                        type="text"
                        value={newPartnerContact}
                        onChange={(e) => setNewPartnerContact(e.target.value)}
                        placeholder="Nom du gérant ou chef"
                        className="w-full bg-neutral-900 border border-white/20 p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-neutral-400 block mb-1">Téléphone Direct :</label>
                      <input
                        type="text"
                        value={newPartnerPhone}
                        onChange={(e) => setNewPartnerPhone(e.target.value)}
                        placeholder="+33 1 23 45 67 89"
                        className="w-full bg-neutral-900 border border-white/20 p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-neutral-400 block mb-1">Statut de la commande :</label>
                      <select
                        value={newPartnerStatus}
                        onChange={(e) => setNewPartnerStatus(e.target.value as any)}
                        className="w-full bg-neutral-900 border border-white/20 p-2 text-white"
                      >
                        <option value="devis_en_cours">Devis en cours de négociation</option>
                        <option value="valide_acompte">Validé & Acompte versé</option>
                        <option value="livraison_confirmee">Livraison Jour J confirmée</option>
                        <option value="regle">Facture réglée</option>
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-mono text-neutral-400 block mb-1">Détail du Menu / Prestation fournie :</label>
                      <textarea
                        rows={2}
                        value={newPartnerMenu}
                        onChange={(e) => setNewPartnerMenu(e.target.value)}
                        placeholder="Ex: 200 pièces salées, canapés saumon, brochettes légumes, prêt de 50 flûtes à champagne..."
                        className="w-full bg-neutral-900 border border-white/20 p-2 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#c9a84c] text-black font-mono font-bold text-xs uppercase hover:bg-white cursor-pointer"
                    >
                      Enregistrer le Partenaire
                    </button>
                  </div>
                </form>
              )}

              {/* Partners Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partners.map((partner) => (
                  <div key={partner.id} className="bg-neutral-950 border border-white/10 p-4 hover:border-[#c9a84c]/50 transition-colors space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[9px] font-mono uppercase tracking-widest text-[#c9a84c] bg-[#c9a84c]/15 px-2 py-0.5 border border-[#c9a84c]/30 inline-block mb-1">
                          {partner.category.toUpperCase()}
                        </span>
                        <h4 className="font-serif text-lg font-medium text-white tracking-wide">
                          {partner.name}
                        </h4>
                        {partner.address && (
                          <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-sans mt-0.5">
                            <MapPin className="w-3 h-3 text-[#c9a84c]" />
                            {partner.address}
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-base font-mono font-bold text-[#c9a84c] block">
                          {partner.budgetEstimated} €
                        </span>
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 border inline-block mt-1 ${
                          partner.orderStatus === "livraison_confirmee" || partner.orderStatus === "regle"
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-800"
                            : partner.orderStatus === "valide_acompte"
                            ? "bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c]/40"
                            : "bg-amber-950/40 text-amber-300 border-amber-800"
                        }`}>
                          {partner.orderStatus === "livraison_confirmee" ? "Livraison confirmée" : partner.orderStatus === "valide_acompte" ? "Acompte versé" : "Devis en cours"}
                        </span>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="p-3 bg-neutral-900 border border-white/5 text-xs text-neutral-300 font-sans leading-relaxed">
                      <strong className="text-white font-mono text-[10px] uppercase block mb-1">Au Menu / Prestation :</strong>
                      {partner.menuItems}
                    </div>

                    {/* Delivery & Direct Contacts */}
                    <div className="flex flex-wrap items-center justify-between text-xs font-mono pt-2 border-t border-white/10 gap-2">
                      <div className="flex items-center gap-3 text-neutral-400">
                        {partner.phone && (
                          <a href={`tel:${partner.phone}`} className="hover:text-[#c9a84c] flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{partner.phone}</span>
                          </a>
                        )}
                        {partner.deliveryTime && (
                          <span className="flex items-center gap-1 text-[#c9a84c]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{partner.deliveryTime}</span>
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = partners.filter(p => p.id !== partner.id);
                          savePartnersToStorage(updated);
                        }}
                        className="text-neutral-500 hover:text-rose-400 p-1 cursor-pointer"
                        title="Supprimer ce partenaire"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CALCULATEUR DE BUFFET */}
          {activeTab === "calculator" && (
            <div className="space-y-6">
              <div className="bg-neutral-950 p-5 border border-white/10 max-w-2xl mx-auto space-y-4 text-xs font-sans">
                <div className="border-b border-white/10 pb-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a84c] block">
                    Optimisation Logistique du Vernissage
                  </span>
                  <h4 className="font-serif text-xl font-light text-white mt-1">
                    Calculateur Automatique de Boissons & Cocktails
                  </h4>
                  <p className="text-neutral-400 mt-1">
                    Ajusté automatiquement pour votre jauge actuelle de <strong>{confirmedCount} convives confirmés</strong>.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-neutral-900 border border-white/10">
                    <div>
                      <strong className="text-white text-sm block">Champagne ou Crémant Brut</strong>
                      <span className="text-neutral-400 text-[11px]">Ratio standard de 1 bouteille pour 3 personnes</span>
                    </div>
                    <span className="text-lg font-mono font-bold text-[#c9a84c]">
                      {Math.ceil(confirmedCount / 3)} bouteilles
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 border border-white/10">
                    <div>
                      <strong className="text-white text-sm block">Vins Blancs & Rouges Sélectionnés</strong>
                      <span className="text-neutral-400 text-[11px]">Ratio de 1 bouteille pour 4 personnes</span>
                    </div>
                    <span className="text-lg font-mono font-bold text-[#c9a84c]">
                      {Math.ceil(confirmedCount / 4)} bouteilles
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 border border-white/10">
                    <div>
                      <strong className="text-white text-sm block">Eaux Minérales & Softs Artisanaux</strong>
                      <span className="text-neutral-400 text-[11px]">Indispensable (1 bouteille pour 3 personnes)</span>
                    </div>
                    <span className="text-lg font-mono font-bold text-neutral-300">
                      {Math.ceil(confirmedCount / 3)} bouteilles
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 border border-white/10">
                    <div>
                      <strong className="text-white text-sm block">Pièces Cocktail Salées (Finger Food)</strong>
                      <span className="text-neutral-400 text-[11px]">Recommandation de 6 à 8 pièces par personne</span>
                    </div>
                    <span className="text-lg font-mono font-bold text-emerald-400">
                      {confirmedCount * 7} pièces
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 border border-white/10">
                    <div>
                      <strong className="text-white text-sm block">Mignardises Sucrées & Macarons</strong>
                      <span className="text-neutral-400 text-[11px]">Fin de soirée (3 pièces par personne)</span>
                    </div>
                    <span className="text-lg font-mono font-bold text-amber-300">
                      {confirmedCount * 3} pièces
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#c9a84c]/10 border border-[#c9a84c]/30 text-[11px] text-[#c9a84c] font-sans">
                  💡 <strong>Astuce Curation :</strong> N'hésitez pas à demander à votre boulangerie ou pâtissier partenaire de créer une mignardise rappelant la gamme chromatique de vos toiles (ex: macarons noir charbon ou éclats dorés).
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-2.5 sm:p-4 border-t border-white/10 bg-black flex items-center justify-between text-[10px] sm:text-xs font-mono shrink-0">
          <span className="text-neutral-400 truncate mr-2">
            {confirmedCount} convives · {partners.length} partenaires
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-neutral-800 text-white hover:bg-[#c9a84c] hover:text-black transition-colors font-bold uppercase cursor-pointer text-xs shrink-0"
          >
            Fermer le module
          </button>
        </div>
      </div>
    </div>
  );
}
