/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Sparkles, BookOpen, Trash2, ArrowLeft, Paintbrush, HelpCircle, 
  AlertTriangle, Plus, FolderPlus, Heart, Check, X, Calendar, Eye, 
  Layers, FileText, RefreshCw, Loader2, Crown, Lock, User, Images,
  QrCode, Tag, Globe, Share2, Cloud, UtensilsCrossed, Compass, Maximize, Monitor, Wine,
  Palette, ChevronLeft, ChevronRight
} from "lucide-react";
import { ArtistProfile, HistoryItem, CustomArtwork, UserAccount, UserRole } from "./types.js";
import { TOOLS } from "./data.js";
import { PRESET_ARTWORKS, getArtworkBase64, PresetArtwork } from "./presets.js";
import { useLanguage } from "./i18n/LanguageContext.js";
import { LanguageSelectorModal } from "./components/LanguageSelectorModal.js";
import ArtistProfileForm from "./components/ArtistProfileForm.js";
import ArtistProfileModal from "./components/ArtistProfileModal.js";
import HubStrategicModal from "./components/HubStrategicModal.js";
import DropZone from "./components/DropZone.js";
import HistoryModal from "./components/HistoryModal.js";
import ResultsPanel from "./components/ResultsPanel.js";
import ToolsBar from "./components/ToolsBar.js";
import DonationModal from "./components/DonationModal.js";
import SubscriptionModal from "./components/SubscriptionModal.js";
import GalleryBridgeModal from "./components/GalleryBridgeModal.js";
import VernissageEventModal from "./components/VernissageEventModal.js";
import CollectorSalesModal from "./components/CollectorSalesModal.js";
import PressSocialBridgeModal from "./components/PressSocialBridgeModal.js";
import ArtworkToolsModal from "./components/ArtworkToolsModal.js";
import AddFromGalleryModal from "./components/AddFromGalleryModal.js";
import GlobalReportExportModal from "./components/GlobalReportExportModal.js";
import QrSalesCartelModal from "./components/QrSalesCartelModal.js";
import ShareModal, { ShareRole } from "./components/ShareModal.js";
import TopExplanationTab from "./components/TopExplanationTab.js";
import ExplanationSection from "./components/ExplanationSection.js";
import UserAccountModal from "./components/UserAccountModal.js";
import EventRsvpPartnersModal from "./components/EventRsvpPartnersModal.js";
import UrbanArtCircuitModal from "./components/UrbanArtCircuitModal.js";
import ModularPortalModal from "./components/ModularPortalModal.js";

export interface ExhibitionArtwork {
  id: string;
  title: string;
  artist?: string;
  medium?: string;
  year?: string;
  imageSrc: string;
  description?: string;
  price?: string;
}
import { onAuthStateChanged } from "firebase/auth";
import { 
  auth, 
  fetchCloudUserProfile, 
  saveCloudUserProfile, 
  fetchCloudArtworks, 
  saveCloudArtwork, 
  deleteCloudArtwork, 
  fetchCloudHistory, 
  saveCloudHistoryItem,
  deleteCloudHistoryItem
} from "./lib/firebase.js";

const DEFAULT_PROFILE: ArtistProfile = {
  name: "",
  instagram: "",
  web: "",
  style: "",
  desc: "",
  bio: "",
  contactEmail: "",
  mediums: "",
  achievements: "",
  philosophy: ""
};

// Helper: Resize and compress image base64 for history to stay safely within localStorage quota
function resizeImageBase64(base64: string, maxWidth: number = 140, maxHeight: number = 140, quality: number = 0.5): Promise<string> {
  return new Promise((resolve) => {
    if (!base64 || typeof base64 !== "string") {
      resolve("");
      return;
    }
    if (base64.startsWith("data:image/svg+xml")) {
      resolve(base64.length < 30000 ? base64 : "");
      return;
    }

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      let resolved = false;

      const finish = (result: string) => {
        if (!resolved) {
          resolved = true;
          resolve(result);
        }
      };

      const timer = setTimeout(() => {
        finish(base64.startsWith("data:") && base64.length < 30000 ? base64 : "");
      }, 1200);

      img.onload = () => {
        clearTimeout(timer);
        try {
          const canvas = document.createElement("canvas");
          let width = img.naturalWidth || img.width || 100;
          let height = img.naturalHeight || img.height || 100;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.max(1, Math.round((height * maxWidth) / width));
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.max(1, Math.round((width * maxHeight) / height));
              height = maxHeight;
            }
          }

          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            finish(canvas.toDataURL("image/jpeg", quality));
          } else {
            finish("");
          }
        } catch (e) {
          console.warn("Canvas resize exception:", e);
          finish(base64.startsWith("data:") && base64.length < 30000 ? base64 : "");
        }
      };

      img.onerror = () => {
        clearTimeout(timer);
        finish("");
      };

      img.src = base64;
    } catch (err) {
      console.warn("resizeImageBase64 error:", err);
      resolve("");
    }
  });
}

// Storage Helper: Safely save history items without throwing QuotaExceededError and never wiping in-memory state
function safeSaveHistoryToLocalStorage(history: HistoryItem[]): void {
  try {
    localStorage.setItem("oeilAtelier_history", JSON.stringify(history));
  } catch (e) {
    console.warn("Storage quota reached for full history. Saving lightweight version...");
    try {
      // Step 1: Strip imageSrc from older items (keep only for 2 newest)
      const lightweight = history.map((item, idx) => ({
        ...item,
        imageSrc: idx < 2 ? (item.imageSrc && item.imageSrc.length < 25000 ? item.imageSrc : "") : ""
      }));
      localStorage.setItem("oeilAtelier_history", JSON.stringify(lightweight));
    } catch (e2) {
      console.warn("Storage quota still tight. Saving text-only history...");
      try {
        // Step 2: Strip all images from history, keep text
        const textOnly = history.slice(0, 30).map((item) => ({ ...item, imageSrc: "" }));
        localStorage.setItem("oeilAtelier_history", JSON.stringify(textOnly));
      } catch (e3) {
        console.error("Could not write history to localStorage:", e3);
      }
    }
  }
}

// Storage Helper: Safely save custom artworks
function safeSaveCustomArtworksToLocalStorage(artworks: CustomArtwork[]): void {
  try {
    localStorage.setItem("oeilAtelier_custom_artworks", JSON.stringify(artworks));
  } catch (e) {
    console.warn("Storage quota reached for artworks. Saving compressed thumbnails...");
    try {
      localStorage.setItem("oeilAtelier_custom_artworks", JSON.stringify(artworks.slice(0, 25)));
    } catch (e2) {
      console.error("Could not write custom artworks to localStorage:", e2);
    }
  }
}

// Helper: Convert File to Base64 Promise
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Format de fichier non pris en charge."));
      }
    };
    reader.onerror = () => reject(reader.error || new Error("Erreur de lecture de fichier."));
    reader.readAsDataURL(file);
  });
}

// Helper to safely parse API responses and handle HTML error pages gracefully
async function parseApiResponse(response: Response, defaultErrMsg = "Erreur lors de la communication avec l'IA.") {
  const rawText = await response.text();
  let data: any = null;
  try {
    data = JSON.parse(rawText);
  } catch (parseError) {
    if (response.status === 413) {
      throw new Error("Le volume d'images transmis est trop volumineux pour le serveur. Veuillez sélectionner moins d'images simultanément.");
    }
    if (response.status === 503 || response.status === 502 || response.status === 504) {
      throw new Error("Les serveurs d'analyse IA sont actuellement très sollicités ou en cours de réinitialisation. Veuillez réessayer dans quelques instants.");
    }
    if (!response.ok) {
      throw new Error(`Service d'analyse momentanément indisponible (Code HTTP ${response.status}). Veuillez réessayer.`);
    }
    throw new Error(defaultErrMsg);
  }

  if (!response.ok) {
    throw new Error(data?.error?.message || defaultErrMsg);
  }

  return data;
}

export default function App() {
  // Session States
  const [file, setFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeSeries, setActiveSeries] = useState<Array<{ id: string; title: string; imageSrc: string; artist?: string; medium?: string; year?: string }>>([]);
  const [activeToolId, setActiveToolId] = useState<string>("style");
  const [cache, setCache] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark-gold" | "light">("dark-gold");
  const { language, setLanguage, t, langMeta, isRTL } = useLanguage();
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState<boolean>(false);

  // Persistence States
  const [profile, setProfile] = useState<ArtistProfile>(DEFAULT_PROFILE);
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [logbookNotification, setLogbookNotification] = useState<{ message: string; visible: boolean } | null>(null);
  const [isDonationOpen, setIsDonationOpen] = useState<boolean>(false);
  
  // Subscription & Pro States (3 € / mois ou 20 € / an)
  const [isSubscriptionActive, setIsSubscriptionActive] = useState<boolean>(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);
  const [isArtworkToolsModalOpen, setIsArtworkToolsModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isHubModalOpen, setIsHubModalOpen] = useState<boolean>(false);
  const [isExamplesOpen, setIsExamplesOpen] = useState<boolean>(false);
  const [isGalleryBridgeOpen, setIsGalleryBridgeOpen] = useState<boolean>(false);
  const [isVernissageModalOpen, setIsVernissageModalOpen] = useState<boolean>(false);
  const [isCollectorSalesOpen, setIsCollectorSalesOpen] = useState<boolean>(false);
  const [isPressSocialOpen, setIsPressSocialOpen] = useState<boolean>(false);
  const [isAddFromGalleryOpen, setIsAddFromGalleryOpen] = useState<boolean>(false);
  const [isGlobalReportModalOpen, setIsGlobalReportModalOpen] = useState<boolean>(false);
  const [isQrSalesModalOpen, setIsQrSalesModalOpen] = useState<boolean>(false);
  const [qrSalesInitialTab, setQrSalesInitialTab] = useState<"generator" | "visitor_preview" | "guestbook" | "fifty_ideas" | "print_cartels" | "contract_coa">("generator");
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareRole, setShareRole] = useState<ShareRole>("all");
  const [isTopExplanationOpen, setIsTopExplanationOpen] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentToolName: string } | null>(null);

  // User Account & Multi-Device Cloud Synchronization (PC, Tablette, Smartphone)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Navigation & Vernissage Innovations
  const [activeMainTab, setActiveMainTab] = useState<"atelier" | "events">("atelier");
  const [appExperienceMode, setAppExperienceMode] = useState<"curator" | "visitor">("curator");
  const [isEventRsvpPartnersOpen, setIsEventRsvpPartnersOpen] = useState<boolean>(false);
  const [isUrbanCircuitOpen, setIsUrbanCircuitOpen] = useState<boolean>(false);
  const [isModularPortalOpen, setIsModularPortalOpen] = useState<boolean>(false);
  const [activeKioskIndex, setActiveKioskIndex] = useState<number>(0);

  // Gallery States
  const [customArtworks, setCustomArtworks] = useState<CustomArtwork[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<CustomArtwork | PresetArtwork | null>(null);
  const [isPresetLoading, setIsPresetLoading] = useState<boolean>(false);
  const [batchLoadingStatus, setBatchLoadingStatus] = useState<string | null>(null);
  const [galleryTab, setGalleryTab] = useState<"presets" | "custom">("presets");
  const [saveFormOpen, setSaveFormOpen] = useState<boolean>(false);
  const [saveTitle, setSaveTitle] = useState<string>("");
  const [saveArtist, setSaveArtist] = useState<string>("");
  const [saveMedium, setSaveMedium] = useState<string>("");
  const [saveYear, setSaveYear] = useState<string>("");

  // Load Persisted Data & Deep Links on Mount
  useEffect(() => {
    const savedProfile = localStorage.getItem("oeilAtelier_profile");
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Error parsing saved profile:", e);
      }
    }

    const savedKey = localStorage.getItem("oeilAtelier_custom_key");
    if (savedKey) {
      setCustomApiKey(savedKey);
    }

    const savedCustomArtworks = localStorage.getItem("oeilAtelier_custom_artworks");
    if (savedCustomArtworks) {
      try {
        setCustomArtworks(JSON.parse(savedCustomArtworks));
      } catch (e) {
        console.error("Error parsing custom artworks:", e);
      }
    }

    const savedHistory = localStorage.getItem("oeilAtelier_history");
    if (savedHistory) {
      try {
        setHistoryList(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Error parsing saved history:", e);
      }
    }

    const savedTheme = localStorage.getItem("oeilAtelier_theme");
    if (savedTheme === "dark-gold" || savedTheme === "light") {
      setTheme(savedTheme);
    }

    const savedSubscription = localStorage.getItem("oeilAtelier_subscriptionActive");
    if (savedSubscription === "true") {
      setIsSubscriptionActive(true);
    }

    // Interception des Deep Links de Partage (?view=...&role=...&mode=...&verify=...)
    try {
      const params = new URLSearchParams(window.location.search);
      const view = params.get("view");
      const roleParam = params.get("role");
      const mode = params.get("mode");
      const verify = params.get("verify");

      if (view === "bridge" || roleParam === "galeriste") {
        setIsGalleryBridgeOpen(true);
      } else if (mode === "kiosk" || mode === "kiosk3d" || view === "kiosk" || mode === "visitor") {
        setAppExperienceMode("visitor");
      } else if (view === "circuit" || view === "map") {
        setIsUrbanCircuitOpen(true);
      } else if (view === "rsvp" || view === "partners") {
        setIsEventRsvpPartnersOpen(true);
      } else if (view === "portal" || view === "embed") {
        setIsModularPortalOpen(true);
      } else if (view === "cartels" || mode === "visitor") {
        if (mode === "visitor") setQrSalesInitialTab("visitor_preview");
        setIsQrSalesModalOpen(true);
      } else if (view === "contract" || verify) {
        setQrSalesInitialTab("contract_coa");
        setIsQrSalesModalOpen(true);
      } else if (view === "sales" || roleParam === "collectionneur") {
        setIsCollectorSalesOpen(true);
      } else if (roleParam) {
        setShareRole(roleParam as ShareRole);
      }
    } catch (e) {
      console.error("Error reading URL parameters:", e);
    }
  }, []);

  // Compute artworks list for the Exhibition Kiosk & Events
  const getExhibitionArtworks = (): ExhibitionArtwork[] => {
    // 1. From activeSeries if populated
    if (activeSeries.length > 0) {
      return activeSeries.map(s => ({
        id: s.id,
        title: s.title,
        artist: s.artist || profile.name || "Artiste",
        medium: s.medium || "Technique Mixte",
        year: s.year || "2026",
        imageSrc: s.imageSrc,
        description: `Œuvre de la série contemporaine ${s.title}, mise en valeur dans l'exposition de l'Atelier.`
      }));
    }

    // 2. From custom artworks if user uploaded pieces
    if (customArtworks.length > 0) {
      return customArtworks.map(ca => ({
        id: ca.id,
        title: ca.title,
        artist: ca.artist || profile.name || "Artiste",
        medium: ca.medium || "Photographie Light Painting / Peinture",
        year: ca.year || "2026",
        imageSrc: ca.imageSrc,
        price: ca.price ? `${ca.price} €` : undefined,
        description: ca.notes || `Création originale mise en valeur sous contraste lumineux.`
      }));
    }

    // 3. From current active image if any
    if (imageBase64 || previewUrl) {
      return [{
        id: "active_current",
        title: selectedArtwork?.title || saveTitle || "Création de l'Atelier",
        artist: profile.name || selectedArtwork?.artist || saveArtist || "L'Artiste",
        medium: selectedArtwork?.medium || saveMedium || profile.style || "Light Painting / Technique Mixte",
        year: selectedArtwork?.year || saveYear || "2026",
        imageSrc: imageBase64 || previewUrl || "",
        description: "Œuvre originale en cours d'analyse et d'exposition."
      }];
    }

    // 4. Default high-craft light-painting & art presets
    return PRESET_ARTWORKS.slice(0, 6).map(p => ({
      id: p.id,
      title: p.title,
      artist: p.artist,
      medium: p.medium,
      year: p.year,
      imageSrc: p.url || "",
      description: `${p.title}. Composition capturant les flux lumineux et l'obscurité contemporaine.`
    }));
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark-gold" ? "light" : "dark-gold";
    setTheme(nextTheme);
    localStorage.setItem("oeilAtelier_theme", nextTheme);
  };

  // Firebase Authentication & Multi-Device Cloud Sync Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // 1. Fetch Cloud Profile
          const cloudData = await fetchCloudUserProfile(firebaseUser.uid);
          if (cloudData) {
            setCurrentUser(cloudData);
            if (cloudData.profile && cloudData.profile.name) {
              setProfile(prev => ({
                ...prev,
                ...cloudData.profile,
              }));
              localStorage.setItem("oeilAtelier_profile", JSON.stringify({
                ...profile,
                ...cloudData.profile
              }));
            }
          } else {
            // Initial cloud registration for first login
            const initialAccount: UserAccount = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "Artiste",
              photoURL: firebaseUser.photoURL || undefined,
              role: "artist",
              profile: {
                ...profile,
                name: profile.name || firebaseUser.displayName || "",
                contactEmail: profile.contactEmail || firebaseUser.email || "",
              },
            };
            setCurrentUser(initialAccount);
            await saveCloudUserProfile(firebaseUser, initialAccount.profile, "artist");
          }

          // 2. Fetch and merge cloud artworks seamlessly
          const cloudArtworks = await fetchCloudArtworks(firebaseUser.uid);
          if (cloudArtworks && cloudArtworks.length > 0) {
            setCustomArtworks(prev => {
              const existingIds = new Set(prev.map(a => a.id));
              const additions = cloudArtworks.filter(a => !existingIds.has(a.id));
              const merged = [...prev, ...additions];
              localStorage.setItem("oeilAtelier_custom_artworks", JSON.stringify(merged));
              return merged;
            });
          }

          // 3. Fetch and merge cloud analysis history seamlessly
          const cloudHistory = await fetchCloudHistory(firebaseUser.uid);
          if (cloudHistory && cloudHistory.length > 0) {
            setHistoryList(prev => {
              const existingIds = new Set(prev.map(h => h.id));
              const additions = cloudHistory.filter(h => !existingIds.has(h.id));
              const merged = [...prev, ...additions];
              safeSaveHistoryToLocalStorage(merged);
              return merged;
            });
          }
        } catch (e) {
          console.error("Firebase sync error on login:", e);
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Update profile locally and to cloud
  const handleUpdateProfile = (newProfile: ArtistProfile) => {
    setProfile(newProfile);
    localStorage.setItem("oeilAtelier_profile", JSON.stringify(newProfile));
    if (currentUser) {
      saveCloudUserProfile(
        { uid: currentUser.uid, email: currentUser.email, displayName: currentUser.displayName } as any,
        newProfile,
        currentUser.role
      ).catch(console.error);
    }
  };

  // Sync everything from local browser to cloud
  const handleSyncAllToCloud = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    try {
      // 1. Profile
      await saveCloudUserProfile(
        { uid: currentUser.uid, email: currentUser.email, displayName: currentUser.displayName } as any,
        profile,
        currentUser.role
      );
      // 2. Custom Artworks
      for (const art of customArtworks) {
        await saveCloudArtwork(currentUser.uid, art);
      }
      // 3. History
      for (const item of historyList) {
        await saveCloudHistoryItem(currentUser.uid, item);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Download everything from cloud to current device
  const handlePullFromCloud = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    try {
      const cloudData = await fetchCloudUserProfile(currentUser.uid);
      if (cloudData && cloudData.profile) {
        setProfile(cloudData.profile);
        localStorage.setItem("oeilAtelier_profile", JSON.stringify(cloudData.profile));
      }

      const cloudArtworks = await fetchCloudArtworks(currentUser.uid);
      if (cloudArtworks) {
        setCustomArtworks(cloudArtworks);
        safeSaveCustomArtworksToLocalStorage(cloudArtworks);
      }

      const cloudHistory = await fetchCloudHistory(currentUser.uid);
      if (cloudHistory) {
        setHistoryList(cloudHistory);
        safeSaveHistoryToLocalStorage(cloudHistory);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper: Convert File to Base64
  const convertFileToBase64 = (selectedFile: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageBase64(reader.result);
      }
    };
    reader.onerror = (err) => {
      console.error("Failed to read file as Base64:", err);
      setError("Impossible de charger le fichier d'image. Réessayez.");
    };
    reader.readAsDataURL(selectedFile);
  };

  // Handler: Artwork Upload Selected
  const handleFileSelected = async (selectedFile: File) => {
    setError(null);
    setFile(selectedFile);
    setCache({}); // Reset cache for the new artwork
    setActiveToolId("style"); // Reset to style tool
    
    try {
      const base64 = await readFileAsBase64(selectedFile);
      setImageBase64(base64);
      setPreviewUrl(base64);
      
      const title = selectedFile.name.split('.')[0] || "Sans titre";
      setActiveSeries([{
        id: `uploaded-${Date.now()}`,
        title,
        imageSrc: base64,
        artist: profile.name || "Artiste",
        medium: profile.style || "Technique Mixte",
        year: new Date().getFullYear().toString()
      }]);
    } catch (err: any) {
      console.error("Failed to read uploaded file:", err);
      setError("Impossible de charger le fichier d'image. Réessayez.");
    }
  };

  // Handler: Multiple Artwork Upload / Batch Import (Up to 50 works total)
  const handleMultipleFilesSelected = async (selectedFiles: File[]) => {
    setError(null);
    if (selectedFiles.length === 0) return;
    
    // Check space left in gallery (max 50 works total)
    const currentCount = customArtworks.length;
    if (currentCount >= 50) {
      setError("Votre galerie virtuelle est pleine (maximum 50 œuvres). Veuillez supprimer des œuvres existantes pour en importer d'autres.");
      return;
    }
    
    // Determine how many we can import
    const spaceLeft = 50 - currentCount;
    const filesToImport = selectedFiles.slice(0, spaceLeft);
    const skippedCount = selectedFiles.length - filesToImport.length;
    
    setBatchLoadingStatus(`Préparation de l'importation de ${filesToImport.length} œuvre(s)...`);
    
    const importedArtworks: CustomArtwork[] = [];
    
    try {
      for (let i = 0; i < filesToImport.length; i++) {
        const file = filesToImport[i];
        setBatchLoadingStatus(`Importation ${i + 1}/${filesToImport.length} : « ${file.name.split('.')[0]} »...`);
        
        // Convert to Base64
        const base64 = await readFileAsBase64(file);
        
        // Compress image to 320x320 specifically for gallery to stay within localStorage quota
        const compressed = await resizeImageBase64(base64, 320, 320);
        
        // Generate metadata
        const title = file.name.split('.')[0] || "Sans titre";
        const artist = profile.name.trim() || "Artiste d'Atelier";
        const medium = profile.style.trim() || "Technique Mixte";
        const year = new Date().getFullYear().toString();
        
        const newArtwork: CustomArtwork = {
          id: `custom-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          title,
          artist,
          medium,
          year,
          imageSrc: compressed
        };
        
        importedArtworks.push(newArtwork);
      }
      
      const updated = [...importedArtworks, ...customArtworks];
      setCustomArtworks(updated);
      localStorage.setItem("oeilAtelier_custom_artworks", JSON.stringify(updated));

      // Synchronize imported artworks to cloud if user is authenticated
      if (currentUser) {
        for (const art of importedArtworks) {
          saveCloudArtwork(currentUser.uid, art).catch(console.error);
        }
      }
      
      setGalleryTab("custom"); // Automatically switch to virtual gallery tab so they see them!
      
      if (skippedCount > 0) {
        setError(`Importation réussie de ${filesToImport.length} œuvre(s) en série. ${skippedCount} œuvre(s) ont été ignorées car la capacité maximale de votre galerie (50 œuvres) is atteinte.`);
      }
      
      // Select the first imported artwork to display in the main workspace and populate activeSeries
      if (importedArtworks.length > 0) {
        const firstArt = importedArtworks[0];
        setActiveSeries(importedArtworks.map(art => ({
          id: art.id,
          title: art.title,
          imageSrc: art.imageSrc,
          artist: art.artist,
          medium: art.medium,
          year: art.year
        })));
        setSelectedArtwork(firstArt);
        setImageBase64(firstArt.imageSrc);
        setPreviewUrl(firstArt.imageSrc);
        setFile(null);
        setActiveToolId("style");
        setCache({});

        // Automatically run initial global analysis for the whole series
        setIsLoading(true);
        try {
          const headers: Record<string, string> = {
            "Content-Type": "application/json"
          };
          if (customApiKey) {
            headers["x-goog-api-key"] = customApiKey;
            headers["x-gemini-api-key"] = customApiKey;
          }
          
          // Limit series sample to first 6 artworks to optimize payload and avoid network timeouts
          const seriesSample = importedArtworks.slice(0, 6).map(art => art.imageSrc);

          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
              images: seriesSample,
              image: firstArt.imageSrc,
              mimeType: "image/jpeg",
              toolId: "style",
              artistProfile: profile
            })
          });

          const data = await parseApiResponse(response, "Erreur lors de l'analyse automatique initiale de la série.");
          setCache({ style: data });
        } catch (autoErr: any) {
          console.warn("Initial series auto-analysis note:", autoErr);
          // Don't fail the whole batch import if the optional auto-analysis encountered a quota/delay
          setError(`Importation réussie de ${importedArtworks.length} œuvre(s) ! Note : ${autoErr.message || "L'analyse automatique initiale n'a pas pu démarrer, vous pouvez cliquer sur « Analyser » ci-dessous."}`);
        }
      }
    } catch (err: any) {
      console.error("Batch import failed:", err);
      setError(`L'importation en série a échoué : ${err.message || err}`);
    } finally {
      setBatchLoadingStatus(null);
      setIsLoading(false);
    }
  };

  // Handler: Reset Current Artwork Selection
  const handleReset = () => {
    setFile(null);
    setImageBase64(null);
    setPreviewUrl(null);
    setActiveSeries([]);
    setCache({});
    setError(null);
    setIsLoading(false);
    setSelectedArtwork(null);
    setSaveFormOpen(false);
  };

  // Handler: Select a Preset or Saved Custom Artwork with auto-analysis
  const handleSelectArtwork = async (artwork: PresetArtwork | CustomArtwork) => {
    setIsPresetLoading(true);
    setError(null);
    setCache({});
    setFile(null);
    setSelectedArtwork(artwork);

    try {
      let base64 = "";
      if ("url" in artwork && !("imageSrc" in artwork)) {
        // It's a PresetArtwork
        base64 = await getArtworkBase64(artwork as PresetArtwork);
      } else {
        // It's a CustomArtwork
        base64 = (artwork as CustomArtwork).imageSrc;
      }

      setImageBase64(base64);
      setPreviewUrl(base64);
      setActiveSeries([{
        id: artwork.id,
        title: artwork.title,
        imageSrc: base64,
        artist: artwork.artist,
        medium: artwork.medium,
        year: artwork.year
      }]);
      setActiveToolId("style");
      
      // Automatically run primary analysis for a stellar instant feedback experience
      setIsLoading(true);
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (customApiKey) {
        headers["x-goog-api-key"] = customApiKey;
        headers["x-gemini-api-key"] = customApiKey;
      }
      
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          image: base64,
          mimeType: "image/jpeg",
          toolId: "style",
          artistProfile: {
            ...profile,
            name: profile.name || artwork.artist,
            style: profile.style || artwork.medium
          }
        })
      });

      const data = await parseApiResponse(response, "Erreur lors de l'analyse automatique initiale.");
      setCache({ style: data });
    } catch (err: any) {
      console.error("Auto analysis failed on select:", err);
      setError(`L'œuvre d'art a été chargée, mais l'analyse initiale a rencontré un problème : ${err.message}`);
    } finally {
      setIsPresetLoading(false);
      setIsLoading(false);
    }
  };

  // Handler: Remove item from active series
  const handleRemoveFromSeries = (itemId: string) => {
    const updated = activeSeries.filter(item => item.id !== itemId);
    setActiveSeries(updated);
    setCache({}); // Reset cache as the collection has changed
    
    if (updated.length > 0) {
      // Focus on the first remaining item
      const nextFocus = updated[0];
      setImageBase64(nextFocus.imageSrc);
      setPreviewUrl(nextFocus.imageSrc);
    } else {
      // Series is empty, reset back to main screen
      handleReset();
    }
  };

  // Handler: Add items directly to active series from file picker
  const handleAddToSeriesFromFiles = async (filesToAdd: File[]) => {
    setError(null);
    if (filesToAdd.length === 0) return;
    
    try {
      const newItems: typeof activeSeries = [];
      for (const file of filesToAdd) {
        if (!file.type.startsWith("image/")) continue;
        const base64 = await readFileAsBase64(file);
        const title = file.name.split('.')[0] || "Œuvre";
        newItems.push({
          id: `uploaded-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title,
          imageSrc: base64,
          artist: profile.name || "Artiste",
          medium: profile.style || "Technique Mixte",
          year: new Date().getFullYear().toString()
        });
      }
      
      const updated = [...activeSeries, ...newItems];
      setActiveSeries(updated);
      setCache({}); // Reset cache
      
      // Auto-focus the last added item
      if (newItems.length > 0) {
        const lastAdded = newItems[newItems.length - 1];
        setImageBase64(lastAdded.imageSrc);
        setPreviewUrl(lastAdded.imageSrc);
      }
    } catch (err: any) {
      console.error("Failed to add files to series:", err);
      setError("Impossible d'ajouter ces images à la série.");
    }
  };

  // Handler: Toggle artwork in active analysis series
  const handleToggleInSeries = async (item: { id: string; title: string; imageSrc: string; artist?: string; medium?: string; year?: string }) => {
    setError(null);
    setCache({}); // Reset cache since the active group of works has changed
    
    // Check if it's a preset URL that we need to convert to base64 for proper offline analysis
    let finalImageSrc = item.imageSrc;
    if (item.imageSrc.startsWith("http") || item.imageSrc.startsWith("/")) {
      try {
        setIsPresetLoading(true);
        // Find if this is a preset and fetch base64
        const matchedPreset = PRESET_ARTWORKS.find(p => p.id === item.id);
        if (matchedPreset) {
          finalImageSrc = await getArtworkBase64(matchedPreset);
        }
      } catch (err) {
        console.error("Failed to load base64 for series preset:", err);
      } finally {
        setIsPresetLoading(false);
      }
    }

    const isInSeries = activeSeries.some(s => s.id === item.id);
    let updatedSeries = [];
    
    if (isInSeries) {
      updatedSeries = activeSeries.filter(s => s.id !== item.id);
    } else {
      updatedSeries = [...activeSeries, { ...item, imageSrc: finalImageSrc }];
    }
    
    setActiveSeries(updatedSeries);
    
    if (updatedSeries.length > 0) {
      // If we don't have a preview yet, or if current previewed item was removed, focus on the first item
      if (!previewUrl || !updatedSeries.some(s => s.imageSrc === imageBase64)) {
        const focusItem = updatedSeries[0];
        setImageBase64(focusItem.imageSrc);
        setPreviewUrl(focusItem.imageSrc);
        setFile(null);
        setActiveToolId("style");
      }
    } else {
      // If the series became empty, clean up the workbench
      handleReset();
    }
  };

  // Handler: Batch add multiple artworks to series
  const handleAddMultipleToSeries = (items: Array<{ id: string; title: string; imageSrc: string; artist?: string; medium?: string; year?: string }>) => {
    setError(null);
    setCache({});
    const existingIds = new Set(activeSeries.map(s => s.id));
    const toAdd = items.filter(item => !existingIds.has(item.id));
    if (toAdd.length > 0) {
      const newSeries = [...activeSeries, ...toAdd];
      setActiveSeries(newSeries);
      if (!previewUrl && newSeries.length > 0) {
        setImageBase64(newSeries[0].imageSrc);
        setPreviewUrl(newSeries[0].imageSrc);
        setFile(null);
        setActiveToolId("style");
      }
    }
  };

  // Handler: Batch remove multiple artworks from series
  const handleRemoveMultipleFromSeries = (ids: string[]) => {
    setError(null);
    setCache({});
    const idsToRemove = new Set(ids);
    const updated = activeSeries.filter(s => !idsToRemove.has(s.id));
    setActiveSeries(updated);
    if (updated.length > 0) {
      if (!updated.some(item => item.imageSrc === imageBase64)) {
        setImageBase64(updated[0].imageSrc);
        setPreviewUrl(updated[0].imageSrc);
      }
    } else {
      handleReset();
    }
  };

  // Handler: Open the custom artwork metadata form
  const handleOpenSaveForm = () => {
    setSaveTitle(file?.name?.split(".")[0] || (selectedArtwork ? selectedArtwork.title : "") || "Œuvre d'Atelier");
    setSaveArtist(profile.name || (selectedArtwork ? selectedArtwork.artist : "") || "Artiste");
    setSaveMedium(profile.style || (selectedArtwork ? selectedArtwork.medium : "") || "Technique Mixte");
    setSaveYear(new Date().getFullYear().toString());
    setSaveFormOpen(true);
  };

  // Handler: Save current active artwork to Ma Galerie Virtuelle
  const handleSaveCustomArtwork = async () => {
    if (!imageBase64) return;
    
    if (customArtworks.length >= 50) {
      setError("Votre galerie virtuelle est pleine (maximum 50 œuvres). Supprimez une œuvre existante pour en ajouter une nouvelle.");
      return;
    }

    try {
      // Compress to 320x320 specifically for the gallery thumbnail to save localStorage space!
      const compressed = await resizeImageBase64(imageBase64, 320, 320);
      
      const newArtwork: CustomArtwork = {
        id: `custom-${Date.now()}`,
        title: saveTitle.trim() || "Œuvre d'Atelier",
        artist: saveArtist.trim() || "Artiste d'Atelier",
        medium: saveMedium.trim() || "Technique Mixte",
        year: saveYear.trim() || new Date().getFullYear().toString(),
        imageSrc: compressed
      };

      const updated = [newArtwork, ...customArtworks];
      setCustomArtworks(updated);
      safeSaveCustomArtworksToLocalStorage(updated);

      // Synchronize to cloud if authenticated
      if (currentUser) {
        saveCloudArtwork(currentUser.uid, newArtwork).catch(console.error);
      }
      
      // Reset form states
      setSaveFormOpen(false);
      setSelectedArtwork(newArtwork);
    } catch (err) {
      console.error("Failed to save custom artwork:", err);
      setError("Impossible d'enregistrer l'œuvre d'art dans votre galerie d'atelier.");
    }
  };

  // Handler: Delete custom artwork
  const handleDeleteCustomArtwork = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customArtworks.filter(art => art.id !== id);
    setCustomArtworks(updated);
    localStorage.setItem("oeilAtelier_custom_artworks", JSON.stringify(updated));
    if (currentUser) {
      deleteCloudArtwork(currentUser.uid, id).catch(console.error);
    }
    if (selectedArtwork && selectedArtwork.id === id) {
      setSelectedArtwork(null);
    }
  };

  // Handler: Execute Gemini Analysis
  const executeAnalysis = async (toolIdToRun: string) => {
    if (!imageBase64 || isLoading) return;
    setIsLoading(true);
    setError(null);

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (customApiKey) {
      headers["x-goog-api-key"] = customApiKey;
      headers["x-gemini-api-key"] = customApiKey;
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          image: imageBase64,
          images: activeSeries.length > 1 ? activeSeries.map(item => item.imageSrc) : undefined,
          mimeType: file ? file.type : "image/jpeg",
          toolId: toolIdToRun,
          artistProfile: profile,
          language: language
        })
      });

      const data = await parseApiResponse(response, "Une erreur s'est produite lors de l'analyse.");

      // 1. Save results to Session Cache
      setCache((prev) => ({ ...prev, [toolIdToRun]: data }));

      // 2. Format a summary sentence from the result
      let summaryText = "";
      if (data.style) {
        summaryText = `Analyse de style: ${data.style}`;
      } else if (data.harmonie) {
        summaryText = `Palette de couleurs: ${data.harmonie}`;
      } else if (data.titre_critique) {
        summaryText = `Critique: ${data.titre_critique}`;
      } else if (data.titre_oeuvre) {
        summaryText = `Certificat pour « ${data.titre_oeuvre} »`;
      } else if (data.titre_expo) {
        summaryText = `Expo: ${data.titre_expo}`;
      } else if (data.titre_event) {
        summaryText = `Vernissage: ${data.titre_event}`;
      } else if (data.titre_poeme) {
        summaryText = `Poème: ${data.titre_poeme}`;
      } else {
        const foundTool = TOOLS.find((t) => t.id === toolIdToRun);
        summaryText = `Génération ${foundTool?.label || "Outil"}`;
      }

      // Append series indicator if applicable
      if (activeSeries.length > 1) {
        summaryText = `[Série de ${activeSeries.length} œuvres] ${summaryText}`;
      }

      // 3. Save to Local History Logs (Carnet de Bord)
      const activeTool = TOOLS.find((t) => t.id === toolIdToRun);
      
      let compressedImage = "";
      if (imageBase64) {
        try {
          compressedImage = await resizeImageBase64(imageBase64, 120, 120, 0.5);
        } catch (resizeErr) {
          console.warn("Failed to compress image for history:", resizeErr);
          compressedImage = "";
        }
      }

      const artworkName = (selectedArtwork && selectedArtwork.title) || (file ? file.name : (activeSeries.length > 0 ? activeSeries[0].title : "Œuvre d'Atelier"));

      const newHistoryItem: HistoryItem = {
        id: Date.now(),
        date: new Date().toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        }),
        filename: activeSeries.length > 1 ? `Série de ${activeSeries.length} œuvres` : artworkName,
        toolId: toolIdToRun,
        toolLabel: activeTool?.label || "Outil",
        summary: summaryText,
        result: data,
        imageSrc: compressedImage
      };

      setHistoryList((prev) => {
        const updatedHistory = [newHistoryItem, ...prev].slice(0, 50);
        safeSaveHistoryToLocalStorage(updatedHistory);
        return updatedHistory;
      });

      // Synchronize to cloud if user is authenticated
      if (currentUser) {
        saveCloudHistoryItem(currentUser.uid, newHistoryItem).catch(console.error);
      }

      setLogbookNotification({
        message: `Analyse « ${activeTool?.label || "Outil"} » enregistrée dans votre Carnet de Bord.`,
        visible: true
      });
      setTimeout(() => {
        setLogbookNotification((prev) => (prev ? { ...prev, visible: false } : null));
      }, 4000);

    } catch (err: any) {
      console.error("Analysis execution error:", err);
      setError(err.message || "Une erreur réseau ou serveur s'est produite lors de l'analyse.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Subscription Activation
  const handleSubscribe = (plan: "monthly" | "yearly" | "gift", codeUsed?: string) => {
    setIsSubscriptionActive(true);
    localStorage.setItem("oeilAtelier_subscriptionActive", "true");
    localStorage.setItem("oeilAtelier_subscriptionPlan", plan);
    if (codeUsed) {
      localStorage.setItem("oeilAtelier_giftCode", codeUsed);
    }
  };

  // Handler: Cancel Subscription (for testing)
  const handleCancelSubscription = () => {
    setIsSubscriptionActive(false);
    localStorage.removeItem("oeilAtelier_subscriptionActive");
    localStorage.removeItem("oeilAtelier_subscriptionPlan");
    localStorage.removeItem("oeilAtelier_giftCode");
  };

  // Handler: Run all 16 analyses in batch (Subscription Pro Feature)
  const handleRunAllAnalyses = async () => {
    if (!isSubscriptionActive) {
      setIsSubscriptionModalOpen(true);
      return;
    }

    if (!imageBase64 || isLoading || batchProgress) return;

    setIsLoading(true);
    setError(null);

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (customApiKey) {
      headers["x-goog-api-key"] = customApiKey;
      headers["x-gemini-api-key"] = customApiKey;
    }

    try {
      const toolsToRun = [...TOOLS];
      for (let i = 0; i < toolsToRun.length; i++) {
        const currentTool = toolsToRun[i];
        setBatchProgress({
          current: i + 1,
          total: toolsToRun.length,
          currentToolName: `Analyse ${i + 1}/16 : « ${currentTool.label} »`
        });

        // If we already have cache for this tool, we still run it or reuse
        try {
          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
              image: imageBase64,
              images: activeSeries.length > 1 ? activeSeries.map(item => item.imageSrc) : undefined,
              mimeType: file ? file.type : "image/jpeg",
              toolId: currentTool.id,
              artistProfile: profile,
              language: language
            })
          });

          const data = await parseApiResponse(response, `Erreur lors de l'analyse ${currentTool.label}`);
          if (data) {
            setCache(prev => ({ ...prev, [currentTool.id]: data }));
          }
        } catch (toolErr) {
          console.warn(`Error analyzing tool ${currentTool.id}:`, toolErr);
        }

        // Brief delay between calls for visual feedback
        await new Promise(r => setTimeout(r, 120));
      }
    } catch (err: any) {
      console.error("Batch all analysis error:", err);
      setError("Une erreur est survenue lors de l'exécution complète du diagnostic.");
    } finally {
      setBatchProgress(null);
      setIsLoading(false);
      // Automatically open the Global Report Modal with all 16 recommendations
      setIsGlobalReportModalOpen(true);
    }
  };

  // Handler: Select a Tool
  const handleSelectTool = async (toolId: string) => {
    setActiveToolId(toolId);
    setError(null);
    // If we don't have results for this tool yet, and an image is loaded, launch the analysis immediately
    if (!cache[toolId] && imageBase64) {
      await executeAnalysis(toolId);
    }
    // Sur écrans mobiles et tablettes, faire défiler automatiquement jusqu'aux résultats
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setTimeout(() => {
        const el = document.getElementById("results-panel-container");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 120);
    }
  };

  // Handler: Select a Tool from Top Hub or Top Navigation
  const handleSelectToolFromTop = async (toolId: string) => {
    setActiveToolId(toolId);
    setError(null);
    if (previewUrl && imageBase64) {
      if (!cache[toolId]) {
        await executeAnalysis(toolId);
      }
      setTimeout(() => {
        const el = document.getElementById("results-panel-container") || document.getElementById("main-workspace-anchor");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 80);
    } else {
      setTimeout(() => {
        const uploadEl = document.getElementById("artwork-selector-section");
        if (uploadEl) {
          uploadEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 80);
    }
  };

  // Handler: Force manual retry / rerun of ANY tool
  const handleRerun = async () => {
    await executeAnalysis(activeToolId);
  };

  // Handler: Rerun a specific tool regardless of active tool
  const handleRerunTool = async (toolId: string) => {
    setActiveToolId(toolId);
    await executeAnalysis(toolId);
  };

  // Handler: Execute one of the 5 Gallery Bridge Tools
  const handleAnalyzeGalleryTool = async (toolId: string) => {
    try {
      let imgToSend = imageBase64;
      if (!imgToSend && PRESET_ARTWORKS.length > 0) {
        try {
          imgToSend = await getArtworkBase64(PRESET_ARTWORKS[0]);
        } catch (e) {
          console.warn("Could not load preset image for gallery tool, sending transparent fallback:", e);
        }
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (customApiKey) {
        headers["x-custom-api-key"] = customApiKey;
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({
          image: imgToSend || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          toolId: toolId,
          artistProfile: profile,
          language: language,
          seriesArtworks: activeSeries.length > 0 ? activeSeries.map(a => ({
            title: a.title,
            artist: a.artist,
            medium: a.medium,
            year: a.year
          })) : undefined
        })
      });

      const data = await parseApiResponse(response, "Erreur lors de l'exécution de l'analyse galerie.");
      return data;
    } catch (err: any) {
      console.error("Gallery tool execution error:", err);
      throw err;
    }
  };

  // Handler: Execute one of the 5 Vernissage & Exhibition Tools
  const handleAnalyzeVernissageTool = async (toolId: string) => {
    try {
      let imgToSend = imageBase64;
      if (!imgToSend && PRESET_ARTWORKS.length > 0) {
        try {
          imgToSend = await getArtworkBase64(PRESET_ARTWORKS[0]);
        } catch (e) {
          console.warn("Could not load preset image for vernissage tool:", e);
        }
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (customApiKey) {
        headers["x-custom-api-key"] = customApiKey;
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({
          image: imgToSend || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          toolId: toolId,
          artistProfile: profile,
          language: language,
          seriesArtworks: activeSeries.length > 0 ? activeSeries.map(a => ({
            title: a.title,
            artist: a.artist,
            medium: a.medium,
            year: a.year
          })) : undefined
        })
      });

      const data = await parseApiResponse(response, "Erreur lors de l'exécution de l'outil vernissage.");
      return data;
    } catch (err: any) {
      console.error("Vernissage tool execution error:", err);
      throw err;
    }
  };

  // Handler: Execute one of the 5 Collector & Sales Tools
  const handleAnalyzeSalesTool = async (toolId: string) => {
    try {
      let imgToSend = imageBase64;
      if (!imgToSend && PRESET_ARTWORKS.length > 0) {
        try {
          imgToSend = await getArtworkBase64(PRESET_ARTWORKS[0]);
        } catch (e) {
          console.warn("Could not load preset image for sales tool:", e);
        }
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (customApiKey) {
        headers["x-custom-api-key"] = customApiKey;
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({
          image: imgToSend || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          toolId: toolId,
          artistProfile: profile,
          language: language,
          seriesArtworks: activeSeries.length > 0 ? activeSeries.map(a => ({
            title: a.title,
            artist: a.artist,
            medium: a.medium,
            year: a.year
          })) : undefined
        })
      });

      const data = await parseApiResponse(response, "Erreur lors de l'exécution de l'outil de vente.");
      return data;
    } catch (err: any) {
      console.error("Sales tool execution error:", err);
      throw err;
    }
  };

  // Handler: Execute one of the 5 Press, Media & Social Tools
  const handleAnalyzePressTool = async (toolId: string) => {
    try {
      let imgToSend = imageBase64;
      if (!imgToSend && PRESET_ARTWORKS.length > 0) {
        try {
          imgToSend = await getArtworkBase64(PRESET_ARTWORKS[0]);
        } catch (e) {
          console.warn("Could not load preset image for press tool:", e);
        }
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (customApiKey) {
        headers["x-custom-api-key"] = customApiKey;
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({
          image: imgToSend || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          toolId: toolId,
          artistProfile: profile,
          language: language,
          seriesArtworks: activeSeries.length > 0 ? activeSeries.map(a => ({
            title: a.title,
            artist: a.artist,
            medium: a.medium,
            year: a.year
          })) : undefined
        })
      });

      const data = await parseApiResponse(response, "Erreur lors de l'exécution de l'outil presse & médias.");
      return data;
    } catch (err: any) {
      console.error("Press tool execution error:", err);
      throw err;
    }
  };

  // Handler: Clear History
  const handleClearHistory = () => {
    setHistoryList([]);
    localStorage.removeItem("oeilAtelier_history");
    if (currentUser) {
      historyList.forEach((item) => {
        deleteCloudHistoryItem(currentUser.uid, item.id).catch(console.error);
      });
    }
  };

  // Handler: Delete single History item
  const handleDeleteHistoryItem = (id: number) => {
    setHistoryList((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      safeSaveHistoryToLocalStorage(updated);
      return updated;
    });
    if (currentUser) {
      deleteCloudHistoryItem(currentUser.uid, id).catch(console.error);
    }
  };

  // Handler: Explicitly save current active analysis directly into Carnet de Bord
  const handleSaveCurrentToLogbook = async () => {
    const currentResult = cache[activeToolId];
    if (!currentResult) {
      setError("Aucune analyse active à enregistrer. Lancez d'abord une analyse sur votre œuvre.");
      return;
    }

    const activeTool = TOOLS.find((t) => t.id === activeToolId);
    let summaryText = "";
    if (currentResult && typeof currentResult === "object") {
      if (currentResult.style) {
        summaryText = typeof currentResult.style === "string" ? `Style: ${currentResult.style.slice(0, 100)}` : "Analyse de style";
      } else if (currentResult.harmonie) {
        summaryText = typeof currentResult.harmonie === "string" ? `Palette: ${currentResult.harmonie.slice(0, 100)}` : "Palette chromatique";
      } else if (currentResult.titre_critique) {
        summaryText = `Critique: ${currentResult.titre_critique}`;
      } else if (currentResult.titre_oeuvre) {
        summaryText = `Certificat pour « ${currentResult.titre_oeuvre} »`;
      } else if (currentResult.titre_expo) {
        summaryText = `Expo: ${currentResult.titre_expo}`;
      } else if (currentResult.titre_event) {
        summaryText = `Vernissage: ${currentResult.titre_event}`;
      } else if (currentResult.titre_poeme) {
        summaryText = `Poème: ${currentResult.titre_poeme}`;
      } else {
        summaryText = `Fiche ${activeTool?.label || "Analyse"}`;
      }
    } else {
      summaryText = `Fiche ${activeTool?.label || "Analyse"}`;
    }

    if (activeSeries.length > 1) {
      summaryText = `[Série de ${activeSeries.length} œuvres] ${summaryText}`;
    }

    const artworkName = (selectedArtwork && selectedArtwork.title) || (file ? file.name : (activeSeries.length > 0 ? activeSeries[0].title : "Œuvre d'Atelier"));

    let compressedImage = "";
    if (imageBase64) {
      try {
        compressedImage = await resizeImageBase64(imageBase64, 120, 120, 0.5);
      } catch (err) {
        compressedImage = "";
      }
    }

    const newHistoryItem: HistoryItem = {
      id: Date.now(),
      date: new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }),
      filename: activeSeries.length > 1 ? `Série de ${activeSeries.length} œuvres` : artworkName,
      toolId: activeToolId,
      toolLabel: activeTool?.label || "Analyse",
      summary: summaryText,
      result: currentResult,
      imageSrc: compressedImage
    };

    setHistoryList((prev) => {
      const filtered = prev.filter(
        (h) => !(h.toolId === activeToolId && h.filename === artworkName && Date.now() - h.id < 45000)
      );
      const updated = [newHistoryItem, ...filtered].slice(0, 50);
      safeSaveHistoryToLocalStorage(updated);
      return updated;
    });

    if (currentUser) {
      saveCloudHistoryItem(currentUser.uid, newHistoryItem).catch(console.error);
    }

    setLogbookNotification({
      message: `« ${activeTool?.label || "Analyse"} » enregistrée avec succès dans votre Carnet de Bord !`,
      visible: true
    });
    setTimeout(() => {
      setLogbookNotification((prev) => (prev ? { ...prev, visible: false } : null));
    }, 4500);
  };

  const isCurrentAnalysisInLogbook = Boolean(
    cache[activeToolId] &&
    historyList.some(
      (h) =>
        h.toolId === activeToolId &&
        ((selectedArtwork && h.filename === selectedArtwork.title) ||
          (file && h.filename === file.name) ||
          (activeSeries.length > 0 && h.filename.includes("Série")))
    )
  );

  // Handler: Load past History item
  const handleLoadHistoryItem = (item: HistoryItem) => {
    if (item.imageSrc) {
      setImageBase64(item.imageSrc);
      setPreviewUrl(item.imageSrc);
      setFile(null); // File handle is lost since we reloaded from base64 string
    }
    setActiveToolId(item.toolId);
    
    // Seed cache with the saved result of this history item
    setCache((prev) => ({
      ...prev,
      [item.toolId]: item.result
    }));
    setError(null);

    setTimeout(() => {
      const el = document.getElementById("results-panel-container");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 150);
  };

  return (
    <div className={`min-h-screen relative overflow-x-hidden flex flex-col justify-between selection:bg-[#c9a84c] selection:text-black transition-colors duration-500 ${
      theme === "dark-gold"
        ? "bg-[#0A0A0A] text-[#E0E0E0]"
        : "bg-[#FAF7F2] text-[#2C2A29]"
    }`}>
      
      {/* Background film-grain noise */}
      <div 
        className="fixed inset-0 opacity-[0.02] pointer-events-none z-0 bg-repeat"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Foreground Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-24 sm:pb-36 flex-1 flex flex-col">
        
        {/* Header */}
        <header className={`mb-6 sm:mb-8 pb-4 sm:pb-6 border-b transition-colors duration-500 space-y-4 ${
          theme === "dark-gold" ? "border-white/10" : "border-stone-200"
        }`}>
          {/* Top Row: Brand & System Utilities */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-center md:text-left flex flex-col">
              <span className={`text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.3em] uppercase mb-1 transition-colors duration-300 ${
                theme === "dark-gold" ? "text-neutral-500" : "text-stone-500"
              }`}>
                {t("bridge_tagline", "LE PONT INTELLIGENT ENTRE ARTISTES, GALERIES & ACHETEURS")}
              </span>
              <h1 className={`font-serif font-light text-3xl sm:text-5xl md:text-6xl tracking-tight leading-none transition-colors duration-300 ${
                theme === "dark-gold" ? "text-white" : "text-stone-950"
              }`}>
                L'Œil de <span className="italic text-[#c9a84c] font-light font-serif">{t("app_title_suffix", "l'Atelier")}</span>
              </h1>
              <p className={`text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-sans mt-2 sm:mt-3.5 transition-colors duration-300 font-bold ${
                theme === "dark-gold" ? "text-[#c9a84c]" : "text-[#9c7d2b]"
              }`}>
                {t("app_subtitle", "36 OUTILS IA POUR CRÉER, VALORISER, EXPOSER & VENDRE VOTRE ART")}
              </p>
            </div>

            {/* Quick System Utilities: Language, Theme & Cloud */}
            <div className="flex items-center justify-center md:justify-end gap-2 shrink-0 flex-wrap">
              {/* Language Selector */}
              <button
                id="language-selector-btn"
                onClick={() => setIsLanguageModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider uppercase font-sans font-bold transition-all duration-300 rounded-none shadow-sm border cursor-pointer ${
                  theme === "dark-gold"
                    ? "bg-black text-[#c9a84c] border-[#c9a84c]/60 hover:bg-[#c9a84c] hover:text-black"
                    : "bg-white text-stone-900 border-stone-300 hover:bg-stone-50"
                }`}
                title="Changer la langue officielle / Change language (14 langues)"
              >
                <span className="text-sm leading-none">{langMeta.flag}</span>
                <span className="font-bold">{langMeta.code.toUpperCase()}</span>
                <Globe className="w-3.5 h-3.5 text-[#c9a84c]" />
              </button>

              {/* Theme Selector Toggle */}
              <button
                onClick={handleToggleTheme}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider uppercase font-sans font-bold transition-all duration-300 rounded-none shadow-sm border cursor-pointer ${
                  theme === "dark-gold"
                    ? "bg-black text-[#c9a84c] border-[#c9a84c]/60 hover:bg-[#c9a84c] hover:text-black"
                    : "bg-white text-stone-900 border-stone-300 hover:bg-stone-50"
                }`}
                title="Basculer entre Mode Clair et Noir & Or"
              >
                <Paintbrush className="w-3.5 h-3.5 text-[#c9a84c]" />
                <span className="hidden sm:inline">{theme === "dark-gold" ? t("theme_light", "Mode Clair") : t("theme_dark", "Noir & Or")}</span>
              </button>

              {/* Compte Cloud Multi-Appareils */}
              <button
                id="cloud-account-header-btn"
                onClick={() => setIsAccountModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider uppercase font-sans font-bold transition-all duration-300 rounded-none shadow-sm border cursor-pointer ${
                  currentUser
                    ? "bg-emerald-950/80 text-emerald-400 border-emerald-500 hover:bg-emerald-900"
                    : (theme === "dark-gold"
                        ? "bg-[#14120a] text-[#c9a84c] border-[#c9a84c]/60 hover:bg-[#c9a84c] hover:text-black"
                        : "bg-amber-50 text-stone-900 border-[#c9a84c] hover:bg-amber-100")
                }`}
                title="Gérer votre compte multi-appareils (PC, tablette, mobile) et synchroniser vos données"
              >
                <Cloud className={`w-3.5 h-3.5 text-[#c9a84c] ${isSyncing ? "animate-spin" : ""}`} />
                <span>{currentUser ? (currentUser.displayName || "Mon Espace") : "Cloud Sync"}</span>
                {currentUser && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
              </button>
            </div>
          </div>

          {/* Lower Row: Studio Action Toolbar */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 border-t border-dashed border-white/5">
            {/* Carnet de Bord (Primary highlight) */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs tracking-wider uppercase font-sans font-black transition-all duration-300 rounded-none shadow-md cursor-pointer ${
                theme === "dark-gold"
                  ? "bg-[#c9a84c] text-black hover:bg-white"
                  : "bg-stone-900 text-white hover:bg-[#c9a84c] hover:text-black"
              }`}
              title="Consulter l'historique et les fiches sauvegardées dans le Carnet de Bord"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t("logbook_btn", "Carnet de Bord")}</span>
              {historyList.length > 0 && (
                <span className={`px-1.5 py-0.2 text-[10px] font-mono font-black ${
                  theme === "dark-gold" ? "bg-black text-[#c9a84c]" : "bg-[#c9a84c] text-black"
                }`}>
                  {historyList.length}
                </span>
              )}
            </button>

            {/* Cartels Muraux & QR Vente */}
            <button
              id="qr-sales-cartel-btn"
              onClick={() => setIsQrSalesModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider uppercase font-sans font-bold transition-all duration-300 rounded-none shadow-sm border bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c] hover:bg-[#c9a84c] hover:text-black cursor-pointer"
              title="Générateur de cartels muraux prêts à imprimer en A4 (5x3 cm et 5x4 cm) avec QR de vente"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{t("cartels_btn", "Cartels & QR Vente")}</span>
            </button>

            {/* Atelier Pro */}
            <button
              id="atelier-pro-top-btn"
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider uppercase font-sans font-bold transition-all duration-300 rounded-none shadow-sm border bg-gradient-to-r from-[#b8973e] via-[#c9a84c] to-[#e4cb78] text-black border-[#c9a84c] hover:brightness-110 cursor-pointer"
              title="Abonnement Atelier Pro"
            >
              <Crown className="w-3.5 h-3.5 text-black" />
              <span>{isSubscriptionActive ? t("pro_active", "Atelier Pro (Actif)") : t("pro_btn", "Atelier Pro")}</span>
            </button>

            {/* Profil Artiste */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider uppercase font-sans font-medium transition-all duration-300 rounded-none border cursor-pointer ${
                profile.name.trim()
                  ? "bg-[#c9a84c]/15 text-[#c9a84c] border-[#c9a84c] hover:bg-[#c9a84c] hover:text-black"
                  : (theme === "dark-gold"
                      ? "bg-black/50 text-neutral-300 border-white/10 hover:border-[#c9a84c]/60 hover:text-white"
                      : "bg-white text-stone-700 border-stone-300 hover:bg-stone-50")
              }`}
              title="Renseigner ou modifier votre profil d'artiste"
            >
              <User className="w-3.5 h-3.5 text-[#c9a84c]" />
              <span>{profile.name.trim() ? profile.name : t("artist_profile", "Profil Artiste")}</span>
            </button>

            {/* 36 Outils IA */}
            <button
              onClick={() => setIsHubModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider uppercase font-sans font-medium transition-all duration-300 rounded-none border cursor-pointer ${
                theme === "dark-gold"
                  ? "bg-black/50 text-neutral-300 border-white/10 hover:border-[#c9a84c] hover:text-[#c9a84c]"
                  : "bg-white text-stone-700 border-stone-300 hover:border-[#c9a84c]"
              }`}
              title="Ouvrir le Hub des 5 Pôles et 36 Outils"
            >
              <Layers className="w-3.5 h-3.5 text-[#c9a84c]" />
              <span>{t("hub_btn", "36 Outils IA")}</span>
            </button>

            {/* Guide & Explications */}
            <button
              id="top-guide-toggle-btn"
              onClick={() => setIsTopExplanationOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider uppercase font-sans font-medium transition-all duration-300 rounded-none border cursor-pointer ${
                isTopExplanationOpen
                  ? "bg-[#c9a84c] text-black border-[#c9a84c]"
                  : (theme === "dark-gold"
                      ? "bg-black/50 text-neutral-400 border-white/10 hover:text-white"
                      : "bg-white text-stone-600 border-stone-300 hover:text-black")
              }`}
              title={isTopExplanationOpen ? "Masquer le guide d'explications" : "Afficher le guide d'explications"}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{t("guide_btn", "Guide")}</span>
              <span className="text-[10px]">{isTopExplanationOpen ? "▲" : "▼"}</span>
            </button>

            {/* Dossier Global (visible when analyses exist) */}
            {Object.keys(cache).length > 0 && (
              <button
                type="button"
                onClick={() => setIsGlobalReportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider uppercase font-sans font-bold transition-all duration-300 rounded-none shadow-sm border bg-[#c9a84c] text-black border-[#c9a84c] hover:bg-white cursor-pointer animate-fadeIn"
                title="Consulter et exporter le dossier complet de l'œuvre"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t("global_report", "Dossier Global")} ({Object.keys(cache).length}/16)</span>
              </button>
            )}

            {/* Partager */}
            <button
              id="share-app-btn"
              onClick={() => {
                setShareRole("all");
                setIsShareModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs tracking-wider uppercase font-sans font-medium transition-all duration-300 rounded-none border border-white/10 text-neutral-400 hover:border-[#c9a84c] hover:text-[#c9a84c] cursor-pointer"
              title="Partager un lien direct vers l'application"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("share_btn", "Partager")}</span>
            </button>

            {/* Soutenir */}
            <button
              id="support-donation-btn"
              onClick={() => setIsDonationOpen(true)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs tracking-wider uppercase font-sans font-medium transition-all duration-300 rounded-none border cursor-pointer ${
                theme === "dark-gold"
                  ? "bg-rose-950/20 text-rose-300 border-rose-900/40 hover:bg-rose-900/40"
                  : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
              }`}
              title="Soutenir l'Atelier"
            >
              <span>{t("support_btn", "Soutenir")}</span>
              <Heart className="w-3 h-3 text-red-500 fill-red-500 shrink-0" />
            </button>
          </div>
        </header>

        {/* ONGLET D'EXPLICATIONS EN HAUT DE PAGE (D'ABORD MASQUÉ PAR DÉFAUT, OUVERT VIA LE BOUTON GUIDE DU HEADER) */}
        <TopExplanationTab
          theme={theme}
          isOpen={isTopExplanationOpen}
          onToggle={() => setIsTopExplanationOpen((prev) => !prev)}
          onClose={() => setIsTopExplanationOpen(false)}
          onOpenArtworkTools={() => setIsArtworkToolsModalOpen(true)}
          onOpenGalleryBridge={() => setIsGalleryBridgeOpen(true)}
          onOpenVernissageModal={() => setIsVernissageModalOpen(true)}
          onOpenCollectorSales={() => setIsCollectorSalesOpen(true)}
          onOpenPressSocial={() => setIsPressSocialOpen(true)}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onOpenAccountModal={() => setIsAccountModalOpen(true)}
          onOpenQrSalesModal={(tab) => {
            if (tab) setQrSalesInitialTab(tab);
            setIsQrSalesModalOpen(true);
          }}
          onOpenGlobalReport={() => setIsGlobalReportModalOpen(true)}
          onOpenShareModal={() => {
            setShareRole("all");
            setIsShareModalOpen(true);
          }}
          onOpenHubModal={() => setIsHubModalOpen(true)}
          onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
        />

        {/* MODE VISITEUR / KIOSQUE D'EXPOSITION NUMÉRIQUE OU MODE CURATION ATELIER */}
        {appExperienceMode === "visitor" ? (
          <div className="flex-1 flex flex-col min-h-[85vh] relative animate-fadeIn">
            {/* Ruban Supérieur Kiosque Minimaliste Vernissage */}
            <div className={`flex flex-wrap items-center justify-between p-3 px-4 border-b ${
              theme === "dark-gold" ? "bg-black/95 border-[#c9a84c]/30 text-white" : "bg-white/95 border-amber-300 text-black"
            }`}>
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#c9a84c]">
                  Kiosque d'Exposition
                </span>
                <span className="text-xs text-neutral-400 hidden sm:inline">• {profile.name || "Galerie de l'Atelier"}</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsUrbanCircuitOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-white/20 text-xs font-mono font-bold text-white hover:bg-white hover:text-black transition-colors cursor-pointer"
                  title="Carte du parcours urbain nocturne"
                >
                  <Compass className="w-3.5 h-3.5 text-[#c9a84c]" />
                  <span className="hidden sm:inline">Parcours Urbain</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsQrSalesModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c9a84c] text-black text-xs font-mono font-bold hover:bg-white transition-colors cursor-pointer"
                  title="Cartels muraux et QR codes d'achat"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cartels & Vente</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAppExperienceMode("curator")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 border border-neutral-600 text-xs font-mono font-bold text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Revenir à l'espace de curation et d'analyse d'atelier"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Mode Atelier</span>
                </button>
              </div>
            </div>

            {/* Visionneuse 2D Kiosque Haute Définition */}
            {(() => {
              const artworks = getExhibitionArtworks();
              const currentIndex = Math.min(activeKioskIndex, Math.max(0, artworks.length - 1));
              const currentArt = artworks[currentIndex] || artworks[0];

              return (
                <div className="flex-1 flex flex-col justify-between bg-black p-4 sm:p-6 select-none min-h-[75vh]">
                  {/* Zone Principale Œuvre */}
                  <div className="relative flex-1 flex items-center justify-center min-h-[48vh] sm:min-h-[58vh]">
                    {currentArt?.imageSrc ? (
                      <div className="relative max-w-full max-h-full flex items-center justify-center">
                        <img
                          src={currentArt.imageSrc}
                          alt={currentArt.title}
                          className="max-h-[55vh] max-w-full object-contain shadow-2xl border border-white/10 rounded-sm"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 text-center text-neutral-500">
                        <Palette className="w-16 h-16 mb-3 opacity-40 text-[#c9a84c]" />
                        <p className="font-mono text-sm">Aucune œuvre dans l'exposition.</p>
                      </div>
                    )}

                    {/* Flèches Précédent / Suivant */}
                    {artworks.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveKioskIndex((currentIndex - 1 + artworks.length) % artworks.length)}
                          className="absolute left-2 sm:left-4 p-3 bg-black/70 hover:bg-[#c9a84c] text-white hover:text-black border border-white/20 transition-all rounded-full cursor-pointer shadow-lg z-10"
                          title="Œuvre précédente"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveKioskIndex((currentIndex + 1) % artworks.length)}
                          className="absolute right-2 sm:right-4 p-3 bg-black/70 hover:bg-[#c9a84c] text-white hover:text-black border border-white/20 transition-all rounded-full cursor-pointer shadow-lg z-10"
                          title="Œuvre suivante"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Cartouche d'Informations Artistiques & Vente */}
                  {currentArt && (
                    <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-5xl mx-auto w-full">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg sm:text-xl font-serif font-bold text-white tracking-wide">
                            {currentArt.title}
                          </h2>
                          <span className="text-xs font-mono text-[#c9a84c] border border-[#c9a84c]/40 px-2 py-0.5">
                            {currentIndex + 1} / {artworks.length}
                          </span>
                        </div>
                        <p className="text-xs font-sans text-neutral-400">
                          <span className="text-white font-medium">{currentArt.artist}</span> • {currentArt.medium} {currentArt.year ? `(${currentArt.year})` : ""}
                        </p>
                        {currentArt.description && (
                          <p className="text-xs text-neutral-300 line-clamp-2 max-w-2xl font-light">
                            {currentArt.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {currentArt.price && (
                          <span className="font-mono text-sm font-bold text-[#c9a84c] px-3 py-1.5 bg-[#c9a84c]/10 border border-[#c9a84c]/30">
                            {currentArt.price}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsQrSalesModalOpen(true)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#c9a84c] text-black text-xs font-mono font-bold uppercase hover:bg-white transition-colors cursor-pointer shadow-md"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>Cartel & Acquérir</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bandeau de Vignettes Défilantes */}
                  {artworks.length > 1 && (
                    <div className="mt-3 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
                      {artworks.map((art, idx) => (
                        <button
                          key={art.id || idx}
                          type="button"
                          onClick={() => setActiveKioskIndex(idx)}
                          className={`h-12 w-16 shrink-0 border-2 overflow-hidden transition-all cursor-pointer ${
                            idx === currentIndex ? "border-[#c9a84c] scale-105" : "border-white/20 opacity-50 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={art.imageSrc}
                            alt={art.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          <>
            {/* Top Main Navigation Mode Bar */}
            <div className={`mb-6 p-2 sm:p-2.5 border flex flex-col sm:flex-row items-center justify-between gap-3 transition-all ${
              theme === "dark-gold" 
                ? "bg-[#111111] border-white/10 shadow-lg" 
                : "bg-white border-[#e8dfd3] shadow-sm"
            }`}>
              {/* Primary Navigation Modes */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveMainTab("atelier")}
                  className={`px-3 sm:px-4 py-2 text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeMainTab === "atelier"
                      ? "bg-[#c9a84c] text-black shadow-md font-black"
                      : (theme === "dark-gold" ? "text-neutral-300 hover:text-white hover:bg-white/5" : "text-stone-700 hover:text-black hover:bg-stone-100")
                  }`}
                >
                  <Paintbrush className="w-3.5 h-3.5" />
                  <span>Atelier & Diagnostic</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMainTab("events")}
                  className={`px-3 sm:px-4 py-2 text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeMainTab === "events"
                      ? "bg-[#c9a84c] text-black shadow-md font-black"
                      : (theme === "dark-gold" ? "text-neutral-300 hover:text-white hover:bg-white/5" : "text-stone-700 hover:text-black hover:bg-stone-100")
                  }`}
                >
                  <Wine className="w-3.5 h-3.5 text-[#c9a84c]" />
                  <span>Scénographie & Événements</span>
                </button>
              </div>

              {/* Secondary Actions */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setAppExperienceMode("visitor")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/40 text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
                  title="Basculer en mode Kiosque Visiteur pour l'exposition"
                >
                  <Maximize className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Mode Kiosque</span>
                </button>
              </div>
            </div>

            {/* Main Interface Workspace */}
            <main id="main-workspace-anchor" className="flex-1 flex flex-col justify-center">
            {activeMainTab === "events" ? (
              <div className="space-y-6 animate-fadeIn py-2 sm:py-4">
                <div className="text-center max-w-2xl mx-auto space-y-1.5">
                  <span className="bg-[#c9a84c] text-black font-mono font-bold text-[10px] sm:text-xs px-3 py-0.5 uppercase tracking-widest inline-block">
                    ÉCOSYSTÈME PROFESSIONNEL & SCÉNOGRAPHIE
                  </span>
                  <h2 className={`text-xl sm:text-2xl font-serif font-bold uppercase tracking-tight ${
                    theme === "dark-gold" ? "text-white" : "text-stone-950"
                  }`}>
                    Scénographie, Événements & Ventes
                  </h2>
                  <p className={`text-xs sm:text-sm font-sans ${
                    theme === "dark-gold" ? "text-neutral-400" : "text-stone-600"
                  }`}>
                    Accédez aux modules professionnels pour vos vernissages, cartels d'exposition, relations galeries et ventes.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Card 1: Cartels & QR */}
                  <div
                    onClick={() => {
                      setQrSalesInitialTab("generator");
                      setIsQrSalesModalOpen(true);
                    }}
                    className={`p-5 border cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between ${
                      theme === "dark-gold"
                        ? "bg-[#111111] border-white/10 hover:border-[#c9a84c]"
                        : "bg-white border-stone-200 hover:border-[#c9a84c]"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-[#c9a84c] text-black font-black flex items-center justify-center text-lg">
                        🏷️
                      </div>
                      <h3 className={`text-base font-serif font-bold ${theme === "dark-gold" ? "text-white" : "text-stone-900"}`}>
                        Cartels Muraux & QR Codes de Vente
                      </h3>
                      <p className={`text-xs leading-relaxed ${theme === "dark-gold" ? "text-neutral-400" : "text-stone-600"}`}>
                        Génération de cartels d'exposition imprimables, audioguide vocal IA pour visiteurs et réservation discrète d'œuvres.
                      </p>
                    </div>
                    <button type="button" className="mt-4 px-3 py-2 bg-[#c9a84c] text-black font-mono font-bold text-xs uppercase tracking-wider text-center">
                      Ouvrir les Cartels →
                    </button>
                  </div>

                  {/* Card 2: Parcours Urbain Géolocalisé */}
                  <div
                    onClick={() => setIsUrbanCircuitOpen(true)}
                    className={`p-5 border cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between ${
                      theme === "dark-gold"
                        ? "bg-[#111111] border-white/10 hover:border-[#c9a84c]"
                        : "bg-white border-stone-200 hover:border-[#c9a84c]"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-[#c9a84c] text-black font-black flex items-center justify-center text-lg">
                        🗺️
                      </div>
                      <h3 className={`text-base font-serif font-bold ${theme === "dark-gold" ? "text-white" : "text-stone-900"}`}>
                        Parcours Urbain & Carte Interactive
                      </h3>
                      <p className={`text-xs leading-relaxed ${theme === "dark-gold" ? "text-neutral-400" : "text-stone-600"}`}>
                        Circuit géolocalisé hors-les-murs, points d'étape artistiques, carnet d'adresses et guidage nocturne.
                      </p>
                    </div>
                    <button type="button" className="mt-4 px-3 py-2 bg-[#c9a84c] text-black font-mono font-bold text-xs uppercase tracking-wider text-center">
                      Lancer le Parcours →
                    </button>
                  </div>

                  {/* Card 3: Vernissages & Réceptions */}
                  <div
                    onClick={() => setIsVernissageModalOpen(true)}
                    className={`p-5 border cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between ${
                      theme === "dark-gold"
                        ? "bg-[#111111] border-white/10 hover:border-[#c9a84c]"
                        : "bg-white border-stone-200 hover:border-[#c9a84c]"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-[#c9a84c] text-black font-black flex items-center justify-center text-lg">
                        🥂
                      </div>
                      <h3 className={`text-base font-serif font-bold ${theme === "dark-gold" ? "text-white" : "text-stone-900"}`}>
                        Soirées de Vernissage & Invitations
                      </h3>
                      <p className={`text-xs leading-relaxed ${theme === "dark-gold" ? "text-neutral-400" : "text-stone-600"}`}>
                        Invitations VIP personnalisées, livre d'or numérique, scénographie 2D et fiches de présentation.
                      </p>
                    </div>
                    <button type="button" className="mt-4 px-3 py-2 bg-[#c9a84c] text-black font-mono font-bold text-xs uppercase tracking-wider text-center">
                      Organiser Vernissage →
                    </button>
                  </div>

                  {/* Card 4: RSVP & Traiteurs Locaux */}
                  <div
                    onClick={() => setIsEventRsvpPartnersOpen(true)}
                    className={`p-5 border cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between ${
                      theme === "dark-gold"
                        ? "bg-[#111111] border-white/10 hover:border-[#c9a84c]"
                        : "bg-white border-stone-200 hover:border-[#c9a84c]"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-[#c9a84c] text-black font-black flex items-center justify-center text-lg">
                        🍽️
                      </div>
                      <h3 className={`text-base font-serif font-bold ${theme === "dark-gold" ? "text-white" : "text-stone-900"}`}>
                        RSVP & Traiteurs Locaux
                      </h3>
                      <p className={`text-xs leading-relaxed ${theme === "dark-gold" ? "text-neutral-400" : "text-stone-600"}`}>
                        Gestion des présences invités, devis cocktails, régimes alimentaires et traiteurs locaux.
                      </p>
                    </div>
                    <button type="button" className="mt-4 px-3 py-2 bg-[#c9a84c] text-black font-mono font-bold text-xs uppercase tracking-wider text-center">
                      Gérer RSVP & Traiteur →
                    </button>
                  </div>

                  {/* Card 5: Passerelle Galeries */}
                  <div
                    onClick={() => setIsGalleryBridgeOpen(true)}
                    className={`p-5 border cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between ${
                      theme === "dark-gold"
                        ? "bg-[#111111] border-white/10 hover:border-[#c9a84c]"
                        : "bg-white border-stone-200 hover:border-[#c9a84c]"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-[#c9a84c] text-black font-black flex items-center justify-center text-lg">
                        🎨
                      </div>
                      <h3 className={`text-base font-serif font-bold ${theme === "dark-gold" ? "text-white" : "text-stone-900"}`}>
                        Passerelle Galeries & Prospection
                      </h3>
                      <p className={`text-xs leading-relaxed ${theme === "dark-gold" ? "text-neutral-400" : "text-stone-600"}`}>
                        Dossier de candidature artistique, contrat de dépôt en galerie, bourse aux murs et salons d'art.
                      </p>
                    </div>
                    <button type="button" className="mt-4 px-3 py-2 bg-[#c9a84c] text-black font-mono font-bold text-xs uppercase tracking-wider text-center">
                      Prospection Galeries →
                    </button>
                  </div>

                  {/* Card 6: Ventes Privées & Défiscalisation */}
                  <div
                    onClick={() => setIsCollectorSalesOpen(true)}
                    className={`p-5 border cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between ${
                      theme === "dark-gold"
                        ? "bg-[#111111] border-white/10 hover:border-[#c9a84c]"
                        : "bg-white border-stone-200 hover:border-[#c9a84c]"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-[#c9a84c] text-black font-black flex items-center justify-center text-lg">
                        💼
                      </div>
                      <h3 className={`text-base font-serif font-bold ${theme === "dark-gold" ? "text-white" : "text-stone-900"}`}>
                        Ventes Privées & Défiscalisation
                      </h3>
                      <p className={`text-xs leading-relaxed ${theme === "dark-gold" ? "text-neutral-400" : "text-stone-600"}`}>
                        Simulateur de défiscalisation d'entreprise (Art. 238 bis AB CGI), factures Marcus et salon VIP.
                      </p>
                    </div>
                    <button type="button" className="mt-4 px-3 py-2 bg-[#c9a84c] text-black font-mono font-bold text-xs uppercase tracking-wider text-center">
                      Ventes & Défiscalisation →
                    </button>
                  </div>

                  {/* Card 7: Presse & Réseaux Sociaux */}
                  <div
                    onClick={() => setIsPressSocialOpen(true)}
                    className={`p-5 border cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between ${
                      theme === "dark-gold"
                        ? "bg-[#111111] border-white/10 hover:border-[#c9a84c]"
                        : "bg-white border-stone-200 hover:border-[#c9a84c]"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-[#c9a84c] text-black font-black flex items-center justify-center text-lg">
                        📣
                      </div>
                      <h3 className={`text-base font-serif font-bold ${theme === "dark-gold" ? "text-white" : "text-stone-900"}`}>
                        Presse, Médias & Bourses DRAC
                      </h3>
                      <p className={`text-xs leading-relaxed ${theme === "dark-gold" ? "text-neutral-400" : "text-stone-600"}`}>
                        Communiqués de presse muséaux, scripts Reels/TikTok d'atelier et dossiers de bourses CNAP/DRAC.
                      </p>
                    </div>
                    <button type="button" className="mt-4 px-3 py-2 bg-[#c9a84c] text-black font-mono font-bold text-xs uppercase tracking-wider text-center">
                      Ouvrir Médias & DRAC →
                    </button>
                  </div>

                  {/* Card 8: Parcours Urbain */}
                  <div
                    onClick={() => setIsUrbanCircuitOpen(true)}
                    className={`p-5 border cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between ${
                      theme === "dark-gold"
                        ? "bg-[#111111] border-white/10 hover:border-[#c9a84c]"
                        : "bg-white border-stone-200 hover:border-[#c9a84c]"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-[#c9a84c] text-black font-black flex items-center justify-center text-lg">
                        🗺️
                      </div>
                      <h3 className={`text-base font-serif font-bold ${theme === "dark-gold" ? "text-white" : "text-stone-900"}`}>
                        Parcours Nocturne Urbain
                      </h3>
                      <p className={`text-xs leading-relaxed ${theme === "dark-gold" ? "text-neutral-400" : "text-stone-600"}`}>
                        Parcours artistique géolocalisé reliant la galerie d'exposition aux architectures de la ville.
                      </p>
                    </div>
                    <button type="button" className="mt-4 px-3 py-2 bg-[#c9a84c] text-black font-mono font-bold text-xs uppercase tracking-wider text-center">
                      Explorer le Parcours →
                    </button>
                  </div>

                  {/* Card 9: Portail & Intégration */}
                  <div
                    onClick={() => setIsModularPortalOpen(true)}
                    className={`p-5 border cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between ${
                      theme === "dark-gold"
                        ? "bg-[#111111] border-white/10 hover:border-[#c9a84c]"
                        : "bg-white border-stone-200 hover:border-[#c9a84c]"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-[#c9a84c] text-black font-black flex items-center justify-center text-lg">
                        💻
                      </div>
                      <h3 className={`text-base font-serif font-bold ${theme === "dark-gold" ? "text-white" : "text-stone-900"}`}>
                        Portail & Intégration Widget
                      </h3>
                      <p className={`text-xs leading-relaxed ${theme === "dark-gold" ? "text-neutral-400" : "text-stone-600"}`}>
                        Intégrez l'application comme un module dans votre propre site web d'artiste ou de galerie.
                      </p>
                    </div>
                    <button type="button" className="mt-4 px-3 py-2 bg-[#c9a84c] text-black font-mono font-bold text-xs uppercase tracking-wider text-center">
                      Configurer l'Embed →
                    </button>
                  </div>
                </div>
              </div>
            ) : !previewUrl ? (
            /* Upload Screen & Departure View - Simple, Épuré et Intuitif */
            <div id="artwork-selector-section" className="animate-fadeIn py-2 sm:py-4 space-y-6 sm:space-y-8">
              
              {/* 1. PREMIER ÉLÉMENT : DÉPÔT IMMÉDIAT DE PHOTOS OU IMAGES */}
              <div className="space-y-4">
                <div className="text-center max-w-2xl mx-auto space-y-1 sm:space-y-2">
                  <span className="bg-[#c9a84c] text-black font-mono font-bold text-[10px] sm:text-xs px-3 py-0.5 uppercase tracking-widest inline-block">
                    {t("start_direct", "DÉMARRAGE DIRECT")}
                  </span>
                  <h2 className={`text-xl sm:text-2xl md:text-3xl font-serif font-bold uppercase tracking-tight ${
                    theme === "dark-gold" ? "text-white" : "text-stone-950"
                  }`}>
                    {t("drop_title", "Déposez Vos Photos ou Fichiers Images")}
                  </h2>
                  <p className={`text-xs sm:text-sm font-sans ${
                    theme === "dark-gold" ? "text-neutral-400" : "text-stone-600"
                  }`}>
                    {t("drop_desc", "Glissez-déposez le visuel d'une création unique ou sélectionnez plusieurs toiles pour lancer les analyses.")}
                  </p>
                </div>

                {/* Zone de Dépôt Principale */}
                <div>
                  <DropZone 
                    onFileSelected={handleFileSelected} 
                    onMultipleFilesSelected={handleMultipleFilesSelected} 
                    theme={theme} 
                  />
                </div>

                {/* Boutons discrets sous la boîte de dépôt pour ceux qui souhaitent tester ou ouvrir leur galerie */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExamplesOpen(!isExamplesOpen || galleryTab !== "presets");
                      setGalleryTab("presets");
                    }}
                    className={`px-3.5 py-1.5 text-xs font-mono font-bold uppercase border transition-all flex items-center gap-1.5 ${
                      isExamplesOpen && galleryTab === "presets"
                        ? "bg-[#c9a84c] text-black border-[#c9a84c]"
                        : (theme === "dark-gold"
                            ? "bg-black/60 text-neutral-300 border-white/10 hover:border-[#c9a84c] hover:text-[#c9a84c]"
                            : "bg-white text-stone-700 border-stone-200 hover:border-[#c9a84c] hover:text-black")
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#c9a84c]" />
                    <span>Explorer des chefs-d'œuvre exemples (15)</span>
                    <span className="text-[10px]">{isExamplesOpen && galleryTab === "presets" ? "▲" : "▼"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsExamplesOpen(!isExamplesOpen || galleryTab !== "custom");
                      setGalleryTab("custom");
                    }}
                    className={`px-3.5 py-1.5 text-xs font-mono font-bold uppercase border transition-all flex items-center gap-1.5 ${
                      isExamplesOpen && galleryTab === "custom"
                        ? "bg-[#c9a84c] text-black border-[#c9a84c]"
                        : (theme === "dark-gold"
                            ? "bg-black/60 text-neutral-300 border-white/10 hover:border-[#c9a84c] hover:text-[#c9a84c]"
                            : "bg-white text-stone-700 border-stone-200 hover:border-[#c9a84c] hover:text-black")
                    }`}
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-[#c9a84c]" />
                    <span>Ma Galerie ({customArtworks.length}/50)</span>
                    <span className="text-[10px]">{isExamplesOpen && galleryTab === "custom" ? "▲" : "▼"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(true)}
                    className={`px-3.5 py-1.5 text-xs font-mono font-bold uppercase border transition-all flex items-center gap-1.5 ${
                      theme === "dark-gold"
                        ? "bg-black/60 text-neutral-400 border-white/10 hover:border-[#c9a84c] hover:text-white"
                        : "bg-white text-stone-600 border-stone-200 hover:border-[#c9a84c] hover:text-black"
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-[#c9a84c]" />
                    <span>Profil Artiste {profile.name.trim() ? `(« ${profile.name} »)` : "(optionnel)"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQrSalesInitialTab("generator");
                      setIsQrSalesModalOpen(true);
                    }}
                    className={`px-3.5 py-1.5 text-xs font-mono font-bold uppercase border transition-all flex items-center gap-1.5 ${
                      theme === "dark-gold"
                        ? "bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c]/50 hover:bg-[#c9a84c] hover:text-black"
                        : "bg-amber-100 text-amber-900 border-amber-300 hover:bg-[#c9a84c] hover:text-black"
                    }`}
                  >
                    <span>{t("cartels_full_btn", "🏷️ Cartels Muraux, QR & Livre d'Or")}</span>
                  </button>
                </div>
              </div>

              {/* SECTION GUIDE & EXPLICATION SUR LA PREMIÈRE PAGE (MASQUÉE PAR DÉFAUT, VALORISÉE AVEC TOUTES LES POSSIBILITÉS) */}
              <ExplanationSection
                theme={theme}
                onOpenArtworkTools={() => setIsArtworkToolsModalOpen(true)}
                onOpenGalleryBridge={() => setIsGalleryBridgeOpen(true)}
                onOpenVernissageModal={() => setIsVernissageModalOpen(true)}
                onOpenCollectorSales={() => setIsCollectorSalesOpen(true)}
                onOpenPressSocial={() => setIsPressSocialOpen(true)}
                onOpenProfileModal={() => setIsProfileModalOpen(true)}
                onOpenAccountModal={() => setIsAccountModalOpen(true)}
                onOpenQrSalesModal={(tab) => {
                  if (tab) setQrSalesInitialTab(tab);
                  setIsQrSalesModalOpen(true);
                }}
                onOpenGlobalReport={() => setIsGlobalReportModalOpen(true)}
                onOpenShareModal={() => {
                  setShareRole("all");
                  setIsShareModalOpen(true);
                }}
                onOpenHubModal={() => setIsHubModalOpen(true)}
                onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                onOpenHistory={() => setIsHistoryOpen(true)}
              />

              {/* Loader indicator for presets or batch imports */}
              {(isPresetLoading || batchLoadingStatus) && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 bg-black/95 transition-opacity duration-300">
                  <div className="text-center space-y-6 max-w-lg">
                    <Loader2 className="w-12 h-12 text-[#c9a84c] animate-spin mx-auto" />
                    <h3 className="text-[#f0e8d8] font-serif font-light text-2xl tracking-wide uppercase">
                      {batchLoadingStatus ? "Vernissage & Transfert de Série..." : "Curation & Préparation Artistique..."}
                    </h3>
                    <p className="text-[#c9a84c] font-sans text-xs tracking-widest uppercase">
                      {batchLoadingStatus ? "Mise en ligne de vos créations d'atelier" : "Génération du chef-d'œuvre virtuel"}
                    </p>
                    <div className="h-[1px] w-24 bg-[#c9a84c]/40 mx-auto" />
                    <p className="text-neutral-400 font-serif italic text-sm leading-relaxed px-4">
                      {batchLoadingStatus ? batchLoadingStatus : (selectedArtwork?.id ? `« ${PRESET_ARTWORKS.find(art => art.id === selectedArtwork.id)?.styleDesc || "Chargement..."} »` : "« L'art ne reproduit pas le visible, il rend visible. » — Paul Klee")}
                    </p>
                  </div>
                </div>
              )}

              {/* Galerie de Chefs-d'œuvre & Œuvres d'Atelier (Dépliée sur demande) */}
              {isExamplesOpen && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b pb-2 border-[#c9a84c]/30">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#c9a84c] text-black font-mono font-bold text-[10px] sm:text-xs px-2 py-0.5 uppercase tracking-wider">
                        GALERIE D'EXEMPLES
                      </span>
                      <span className={`text-xs sm:text-sm font-serif font-bold uppercase tracking-wider ${
                        theme === "dark-gold" ? "text-white" : "text-stone-900"
                      }`}>
                        {galleryTab === "presets" ? "15 Chefs-d'œuvre pour Découvrir l'IA" : `Ma Galerie Virtuelle (${customArtworks.length}/50)`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsExamplesOpen(false)}
                      className="text-xs font-mono text-[#c9a84c] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>✕ Masquer les exemples</span>
                    </button>
                  </div>

                  {/* Gallery section containing at least 15 artworks */}
                  <div className={`border p-6 sm:p-8 rounded-none transition-colors duration-300 ${
                    theme === "dark-gold" ? "bg-[#111111] border-white/10 shadow-2xl" : "bg-white border-[#e8dfd3] shadow-lg"
                  }`}>
                {/* Tabs Selector & Active Series Quick Launch Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 mb-6 gap-3 pb-2">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setGalleryTab("presets")}
                      className={`pb-3 text-xs tracking-widest uppercase font-sans font-bold border-b-2 transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                        galleryTab === "presets"
                          ? "border-[#c9a84c] text-[#c9a84c]"
                          : "border-transparent text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      Chefs-d'œuvre (15)
                    </button>
                    <button
                      onClick={() => setGalleryTab("custom")}
                      className={`pb-3 text-xs tracking-widest uppercase font-sans font-bold border-b-2 transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                        galleryTab === "custom"
                          ? "border-[#c9a84c] text-[#c9a84c]"
                          : "border-transparent text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      <FolderPlus className="w-4 h-4" />
                      Ma Galerie Virtuelle ({customArtworks.length}/50)
                    </button>
                  </div>

                  {activeSeries.length > 0 && (
                    <div className="flex items-center gap-2 animate-fadeIn">
                      <span className="text-[10px] font-mono text-[#c9a84c] font-bold">
                        {activeSeries.length} sélectionnée(s)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const first = activeSeries[0];
                          setImageBase64(first.imageSrc);
                          setPreviewUrl(first.imageSrc);
                          setFile(null);
                          setActiveToolId("style");
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-[#b8973e] via-[#c9a84c] to-[#e4cb78] text-black text-[10px] font-mono font-bold uppercase tracking-wider hover:brightness-110 shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Lancer la Série ({activeSeries.length}) →</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveMultipleFromSeries(activeSeries.map(s => s.id))}
                        className="px-2 py-1.5 text-[9px] font-mono text-neutral-400 hover:text-rose-400 border border-white/10 cursor-pointer"
                        title="Vider la sélection"
                      >
                        Vider
                      </button>
                    </div>
                  )}
                </div>

                {/* Presets Gallery Grid */}
                {galleryTab === "presets" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {PRESET_ARTWORKS.map((artwork) => (
                      <div
                        key={artwork.id}
                        onClick={() => handleSelectArtwork(artwork)}
                        className={`group border cursor-pointer relative overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                          theme === "dark-gold"
                            ? "bg-[#0d0d0d] border-white/10 hover:border-[#c9a84c]/50"
                            : "bg-stone-50 border-stone-200 hover:border-[#c9a84c]/50 hover:bg-stone-100/50"
                        }`}
                      >
                        {/* Artwork Frame Accent */}
                        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-transparent group-hover:bg-[#c9a84c] transition-colors" />
                        
                        <div className="space-y-2">
                          {/* Image Box */}
                          <div className="aspect-[4/3] w-full overflow-hidden relative bg-black flex items-center justify-center">
                            <img
                              src={artwork.url}
                              alt={artwork.title}
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                            />
                            {/* Inner ambient shine */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                            
                            {/* Year badge */}
                            <span className="absolute bottom-1.5 right-1.5 text-[8px] font-mono tracking-widest uppercase bg-black/70 text-[#c9a84c] px-1.5 py-0.5 border border-[#c9a84c]/20">
                              {artwork.year}
                            </span>
                          </div>

                          {/* Meta Details */}
                          <div className="px-3 pb-1">
                            <h4 className={`text-xs font-serif font-bold italic tracking-wide line-clamp-1 group-hover:text-[#c9a84c] transition-colors ${
                              theme === "dark-gold" ? "text-neutral-200" : "text-stone-900"
                            }`}>
                              {artwork.title}
                            </h4>
                            <p className="text-[9px] uppercase tracking-widest text-neutral-400 font-sans truncate">
                              {artwork.artist}
                            </p>
                            <p className="text-[8px] font-sans text-neutral-500 truncate italic mt-0.5">
                              {artwork.medium}
                            </p>
                          </div>
                        </div>

                        {/* Hover Overlay Button Action */}
                        <div className="p-2 border-t border-white/5 bg-black/10 flex gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectArtwork(artwork);
                            }}
                            className={`flex-1 py-1 text-[8px] tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-1.5 font-bold ${
                              theme === "dark-gold"
                                ? "bg-neutral-900 text-[#c9a84c] hover:bg-[#c9a84c] hover:text-black"
                                : "bg-stone-200 text-stone-700 hover:bg-[#c9a84c] hover:text-black"
                            }`}
                          >
                            <Eye className="w-3 h-3" />
                            Analyser
                          </button>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleInSeries({
                                id: artwork.id,
                                title: artwork.title,
                                imageSrc: artwork.url,
                                artist: artwork.artist,
                                medium: artwork.medium,
                                year: artwork.year
                              });
                            }}
                            className={`px-2 py-1 text-[8px] tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-1 font-bold ${
                              activeSeries.some(item => item.id === artwork.id)
                                ? "bg-[#c9a84c] text-black"
                                : (theme === "dark-gold" ? "bg-neutral-900 text-neutral-400 hover:text-[#c9a84c]" : "bg-stone-200 text-stone-500 hover:text-[#c9a84c]")
                            }`}
                            title={activeSeries.some(item => item.id === artwork.id) ? "Retirer de la série de vernissage" : "Ajouter à la série de vernissage"}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Custom Gallery Grid */}
                {galleryTab === "custom" && (
                  <div>
                    {customArtworks.length === 0 ? (
                      <div className="text-center py-12 space-y-4">
                        <div className="w-12 h-12 rounded-none border border-white/10 flex items-center justify-center mx-auto text-neutral-500">
                          <FolderPlus className="w-5 h-5" />
                        </div>
                        <div className="max-w-md mx-auto space-y-1.5">
                          <p className={`font-serif text-base italic ${
                            theme === "dark-gold" ? "text-neutral-300" : "text-stone-700"
                          }`}>
                            Votre galerie d'atelier est vide pour l'instant
                          </p>
                          <p className="text-[10px] font-sans uppercase tracking-widest text-neutral-500 leading-relaxed">
                            Chargez une œuvre d'art via la zone de dépôt ci-dessus, puis utilisez l'option de sauvegarde pour la conserver dans cette galerie virtuelle.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                        {customArtworks.map((artwork) => (
                          <div
                            key={artwork.id}
                            onClick={() => handleSelectArtwork(artwork)}
                            className={`group border cursor-pointer relative overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                              theme === "dark-gold"
                                ? "bg-[#0d0d0d] border-white/10 hover:border-[#c9a84c]/50"
                                : "bg-stone-50 border-stone-200 hover:border-[#c9a84c]/50 hover:bg-stone-100/50"
                            }`}
                          >
                            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-transparent group-hover:bg-[#c9a84c] transition-colors" />

                            <div className="space-y-2">
                              {/* Image Box */}
                              <div className="aspect-[4/3] w-full overflow-hidden relative bg-black flex items-center justify-center">
                                <img
                                  src={artwork.imageSrc}
                                  alt={artwork.title}
                                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                
                                {/* Trash delete button */}
                                <button
                                  onClick={(e) => handleDeleteCustomArtwork(artwork.id, e)}
                                  className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 hover:bg-rose-950 hover:text-rose-400 text-neutral-400 transition-colors border border-white/5"
                                  title="Supprimer de la galerie"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Year badge */}
                                <span className="absolute bottom-1.5 right-1.5 text-[8px] font-mono tracking-widest uppercase bg-black/70 text-[#c9a84c] px-1.5 py-0.5 border border-[#c9a84c]/20">
                                  {artwork.year}
                                </span>
                              </div>

                              {/* Meta Details */}
                              <div className="px-3 pb-1">
                                <h4 className={`text-xs font-serif font-bold italic tracking-wide line-clamp-1 group-hover:text-[#c9a84c] transition-colors ${
                                  theme === "dark-gold" ? "text-neutral-200" : "text-stone-900"
                                }`}>
                                  {artwork.title}
                                </h4>
                                <p className="text-[9px] uppercase tracking-widest text-neutral-400 font-sans truncate">
                                  {artwork.artist}
                                </p>
                                <p className="text-[8px] font-sans text-neutral-500 truncate italic mt-0.5">
                                  {artwork.medium}
                                </p>
                              </div>
                            </div>

                            {/* Hover Overlay Button Action */}
                            <div className="p-2 border-t border-white/5 bg-black/10 flex gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectArtwork(artwork);
                                }}
                                className={`flex-1 py-1 text-[8px] tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-1.5 font-bold ${
                                  theme === "dark-gold"
                                    ? "bg-neutral-900 text-[#c9a84c] hover:bg-[#c9a84c] hover:text-black"
                                    : "bg-stone-200 text-stone-700 hover:bg-[#c9a84c] hover:text-black"
                                }`}
                              >
                                <Eye className="w-3 h-3" />
                                Analyser
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleInSeries({
                                    id: artwork.id,
                                    title: artwork.title,
                                    imageSrc: artwork.imageSrc,
                                    artist: artwork.artist,
                                    medium: artwork.medium,
                                    year: artwork.year
                                  });
                                }}
                                className={`px-2 py-1 text-[8px] tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-1 font-bold ${
                                  activeSeries.some(item => item.id === artwork.id)
                                    ? "bg-[#c9a84c] text-black"
                                    : (theme === "dark-gold" ? "bg-neutral-900 text-neutral-400 hover:text-[#c9a84c]" : "bg-stone-200 text-stone-500 hover:text-[#c9a84c]")
                                }`}
                                title={activeSeries.some(item => item.id === artwork.id) ? "Retirer de la série de vernissage" : "Ajouter à la série de vernissage"}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Active Dashboard */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
              
              {/* Left Column: Visual Artwork & Tools list */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Visual Framing Card */}
                <div className={`border p-4 rounded-none shadow-xl relative overflow-hidden group transition-colors duration-300 ${
                  theme === "dark-gold" ? "bg-[#111111] border-white/10" : "bg-white border-[#e8dfd3]"
                }`}>
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#c9a84c]" />
                  
                  {/* Elegant gold corner accents */}
                  <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[#c9a84c]/40" />
                  <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-[#c9a84c]/40" />
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-[#c9a84c]/40" />
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[#c9a84c]/40" />

                  <div className={`aspect-square flex items-center justify-center overflow-hidden border rounded-none relative transition-colors duration-300 ${
                    theme === "dark-gold" ? "bg-black border-neutral-900" : "bg-stone-50 border-stone-200"
                  }`}>
                    <img
                      src={previewUrl}
                      alt="Aperçu de l'œuvre d'art"
                      className="max-w-full max-h-full object-contain filter brightness-95 group-hover:scale-[1.01] transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  {file && (
                    <p className={`text-[10px] text-center font-mono mt-3 uppercase tracking-wider truncate px-4 ${
                      theme === "dark-gold" ? "text-neutral-500" : "text-stone-500"
                    }`}>
                      {file.name} · {Math.round(file.size / 1024)} ko
                    </p>
                  )}
                </div>

                {/* Active Series Curation Workspace */}
                {activeSeries.length > 0 && (
                  <div className={`border p-4 rounded-none transition-colors duration-300 animate-fadeIn ${
                    theme === "dark-gold" ? "bg-[#111111] border-white/10" : "bg-white border-[#e8dfd3]"
                  }`}>
                    <div className="flex items-center justify-between mb-3 border-b border-[#c9a84c]/20 pb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#c9a84c]" />
                        <h4 className="text-xs font-sans font-bold tracking-widest uppercase text-neutral-300">
                          Série de Vernissage en cours
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddFromGalleryOpen(true)}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold uppercase bg-gradient-to-r from-[#b8973e] via-[#c9a84c] to-[#e4cb78] text-black hover:brightness-110 transition-all shadow-sm cursor-pointer"
                          title="Ajouter d'autres œuvres déjà enregistrées dans votre galerie"
                        >
                          <Images className="w-3.5 h-3.5" />
                          <span>+ Photos déjà importées ({customArtworks.length})</span>
                        </button>
                        <span className="text-[10px] font-mono bg-[#c9a84c]/20 text-[#c9a84c] px-2 py-0.5 font-bold">
                          {activeSeries.length} ŒUVRE{activeSeries.length > 1 ? 'S' : ''}
                        </span>
                      </div>
                    </div>

                    {activeSeries.length === 1 ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#c9a84c]/10 border border-[#c9a84c]/30 p-2.5 mb-3">
                        <p className="text-[11px] text-[#c9a84c] font-sans">
                          💡 <strong>Une seule œuvre sélectionnée :</strong> Vous pouvez facilement rajouter d'autres toiles déjà importées pour activer la comparaison et l'analyse globale de série.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsAddFromGalleryOpen(true)}
                          className="px-2.5 py-1 bg-[#c9a84c] text-black font-mono font-bold text-[10px] uppercase hover:bg-white transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer"
                        >
                          Choisir parmi mes {customArtworks.length} œuvres →
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-neutral-400 italic mb-3 leading-relaxed">
                        Analyse globale activée sur {activeSeries.length} œuvres. L'IA étudie les connexions esthétiques, la palette chromatique commune et la cohérence scénographique.
                      </p>
                    )}

                    {/* Horizontal list of thumbnails */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                      {activeSeries.map((item) => {
                        const isFocused = item.imageSrc === imageBase64;
                        return (
                          <div 
                            key={item.id}
                            onClick={() => {
                              setImageBase64(item.imageSrc);
                              setPreviewUrl(item.imageSrc);
                            }}
                            className={`relative flex-shrink-0 w-16 h-16 border cursor-pointer group transition-all duration-300 ${
                              isFocused 
                                ? "border-[#c9a84c] scale-105 shadow-md shadow-[#c9a84c]/20" 
                                : "border-neutral-800 hover:border-neutral-500"
                            }`}
                            title={`Focus sur : ${item.title}`}
                          >
                            <img 
                              src={item.imageSrc} 
                              alt={item.title} 
                              className="w-full h-full object-cover" 
                            />
                            {/* Overlay focus indicator */}
                            {isFocused && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="text-[9px] font-mono font-bold text-[#c9a84c] bg-black/80 px-1 py-0.5 scale-75 border border-[#c9a84c]/30">FOCUS</span>
                              </div>
                            )}
                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFromSeries(item.id);
                              }}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black/80 border border-white/20 text-neutral-400 hover:text-white hover:bg-rose-950 flex items-center justify-center transition-colors animate-fadeIn"
                              title="Retirer de la série"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        );
                      })}
                      
                      {/* Quick Button: Add from already imported artworks */}
                      <button
                        type="button"
                        onClick={() => setIsAddFromGalleryOpen(true)}
                        className={`w-16 h-16 flex-shrink-0 border flex flex-col items-center justify-center cursor-pointer transition-all ${
                          theme === "dark-gold" 
                            ? "bg-[#c9a84c]/15 border-[#c9a84c]/70 text-[#c9a84c] hover:bg-[#c9a84c] hover:text-black" 
                            : "bg-amber-50 border-[#c9a84c] text-[#9c7d2b] hover:bg-[#c9a84c] hover:text-black"
                        }`}
                        title="Ajouter d'autres œuvres déjà importées"
                      >
                        <Images className="w-5 h-5" />
                        <span className="text-[8px] uppercase tracking-widest mt-1 font-bold">Galerie</span>
                      </button>

                      {/* Upload more directly into series */}
                      <label className={`w-16 h-16 flex-shrink-0 border border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                        theme === "dark-gold" 
                          ? "border-neutral-800 hover:border-[#c9a84c]/30 text-neutral-500 hover:text-[#c9a84c]" 
                          : "border-stone-300 hover:border-[#c9a84c]/30 text-stone-400 hover:text-stone-700"
                      }`}
                      title="Importer un nouveau fichier depuis votre ordinateur">
                        <Plus className="w-5 h-5" />
                        <span className="text-[8px] uppercase tracking-widest mt-1">Fichier</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          onChange={(e) => {
                            if (e.target.files) {
                              handleAddToSeriesFromFiles(Array.from(e.target.files));
                            }
                          }}
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Main Action Bar */}
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className={`flex-1 py-3 border text-xs tracking-widest uppercase transition-all duration-300 rounded-none flex items-center justify-center gap-2 font-bold ${
                      theme === "dark-gold"
                        ? "border-white/10 text-neutral-400 hover:text-white hover:border-[#c9a84c]/40 bg-[#0d0d0d]"
                        : "border-[#e8dfd3] text-stone-600 hover:text-stone-900 hover:border-[#c9a84c]/60 bg-white shadow-sm"
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Changer d'œuvre
                  </button>

                  <button
                    onClick={handleRerun}
                    disabled={isLoading}
                    className={`flex-1 py-3 font-black text-xs tracking-widest uppercase transition-all duration-300 rounded-none flex items-center justify-center gap-2 shadow-lg border-none ${
                      theme === "dark-gold"
                        ? "bg-[#c9a84c] hover:bg-white text-black disabled:opacity-50"
                        : "bg-stone-900 hover:bg-[#c9a84c] hover:text-black text-white disabled:opacity-50"
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    {isLoading ? "Observation…" : "Réanalyser"}
                  </button>
                </div>

                {/* Save to personal gallery section */}
                {previewUrl && (
                  <div className="space-y-3">
                    {/* Check if current artwork is already saved */}
                    {customArtworks.some(art => art.imageSrc === imageBase64) || (selectedArtwork && !("url" in selectedArtwork)) ? (
                      <div className={`p-3 text-center border text-[11px] font-sans tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-300 ${
                        theme === "dark-gold" 
                          ? "bg-neutral-900/40 border-[#c9a84c]/20 text-[#c9a84c]" 
                          : "bg-[#fdfcf7] border-[#c9a84c]/30 text-[#9c7d2b]"
                      }`}>
                        <Check className="w-4 h-4 text-[#c9a84c]" />
                        Œuvre enregistrée dans votre galerie d'atelier
                      </div>
                    ) : (
                      <>
                        {!saveFormOpen ? (
                          <button
                            onClick={handleOpenSaveForm}
                            className={`w-full py-2.5 border text-[11px] tracking-widest uppercase transition-all duration-300 rounded-none flex items-center justify-center gap-2 font-bold ${
                              theme === "dark-gold"
                                ? "border-white/10 text-neutral-300 hover:text-white hover:border-[#c9a84c]/40 bg-black/40"
                                : "border-[#e8dfd3] text-stone-700 hover:text-stone-900 hover:border-[#c9a84c]/50 bg-stone-50"
                            }`}
                          >
                            <FolderPlus className="w-4 h-4 text-[#c9a84c]" />
                            Conserver dans ma galerie (Max 50)
                          </button>
                        ) : (
                          <div className={`border p-4 transition-all duration-300 animate-fadeIn ${
                            theme === "dark-gold" ? "bg-[#141414] border-white/10" : "bg-white border-[#e8dfd3]"
                          }`}>
                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
                              <h4 className="text-xs uppercase tracking-widest font-bold text-[#c9a84c] flex items-center gap-1.5">
                                <FolderPlus className="w-3.5 h-3.5" />
                                Enregistrer l'œuvre d'art
                              </h4>
                              <button 
                                onClick={() => setSaveFormOpen(false)}
                                className="text-neutral-500 hover:text-neutral-200 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="space-y-3 text-left">
                              <div>
                                <label className="block text-[9px] uppercase tracking-widest text-neutral-500 mb-1">Titre de l'œuvre</label>
                                <input
                                  type="text"
                                  value={saveTitle}
                                  onChange={(e) => setSaveTitle(e.target.value)}
                                  placeholder="Entrez le titre..."
                                  className={`w-full px-3 py-1.5 text-xs rounded-none border focus:outline-none transition-colors ${
                                    theme === "dark-gold"
                                      ? "bg-black border-white/10 text-white focus:border-[#c9a84c]"
                                      : "bg-white border-stone-200 text-stone-900 focus:border-[#c9a84c]"
                                  }`}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[9px] uppercase tracking-widest text-neutral-500 mb-1">Artiste</label>
                                  <input
                                    type="text"
                                    value={saveArtist}
                                    onChange={(e) => setSaveArtist(e.target.value)}
                                    placeholder="Nom de l'artiste"
                                    className={`w-full px-3 py-1.5 text-xs rounded-none border focus:outline-none transition-colors ${
                                      theme === "dark-gold"
                                        ? "bg-black border-white/10 text-white focus:border-[#c9a84c]"
                                        : "bg-white border-stone-200 text-stone-900 focus:border-[#c9a84c]"
                                    }`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] uppercase tracking-widest text-neutral-500 mb-1">Année</label>
                                  <input
                                    type="text"
                                    value={saveYear}
                                    onChange={(e) => setSaveYear(e.target.value)}
                                    placeholder="Ex: 2026"
                                    className={`w-full px-3 py-1.5 text-xs rounded-none border focus:outline-none transition-colors ${
                                      theme === "dark-gold"
                                        ? "bg-black border-white/10 text-white focus:border-[#c9a84c]"
                                        : "bg-white border-stone-200 text-stone-900 focus:border-[#c9a84c]"
                                    }`}
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[9px] uppercase tracking-widest text-neutral-500 mb-1">Technique / Médium</label>
                                <input
                                  type="text"
                                  value={saveMedium}
                                  onChange={(e) => setSaveMedium(e.target.value)}
                                  placeholder="Ex: Huile sur toile, Technique Mixte..."
                                  className={`w-full px-3 py-1.5 text-xs rounded-none border focus:outline-none transition-colors ${
                                    theme === "dark-gold"
                                      ? "bg-black border-white/10 text-white focus:border-[#c9a84c]"
                                      : "bg-white border-stone-200 text-stone-900 focus:border-[#c9a84c]"
                                  }`}
                                />
                              </div>

                              <button
                                onClick={handleSaveCustomArtwork}
                                className="w-full py-2 bg-[#c9a84c] hover:bg-white hover:text-black text-black transition-colors font-bold text-[10px] uppercase tracking-widest rounded-none shadow-md mt-2"
                              >
                                Confirmer la Sauvegarde
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                {/* Error Banner */}
                {error && (
                  <div className={`p-4 border-2 rounded-none text-xs flex flex-col sm:flex-row gap-3 items-start justify-between animate-fadeIn ${
                    theme === "dark-gold" 
                      ? "bg-rose-950/30 border-rose-800/80 text-rose-200" 
                      : "bg-rose-50 border-rose-300 text-rose-900"
                  }`}>
                    <div className="flex gap-3 items-start min-w-0">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                      <div className="space-y-1 leading-relaxed">
                        <p className="font-bold tracking-wide uppercase text-[10px] text-rose-400">
                          {error.includes("quota") || error.includes("429") ? "Limite de Requêtes Temporaire (Quota Gratuit)" : "Information d'Analyse"}
                        </p>
                        <p className="font-light text-xs">{error}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto pt-2 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => executeAnalysis(activeToolId)}
                        disabled={isLoading}
                        className="flex-1 sm:flex-none px-3 py-1.5 bg-[#c9a84c] hover:bg-white text-black font-bold uppercase tracking-wider text-[10px] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Réessayer l'analyse
                      </button>
                    </div>
                  </div>
                )}

                {/* Tools Bar selection index - Step 3 Chapter Heading */}
                <div className={`border p-3.5 sm:p-5 rounded-none shadow-md transition-colors duration-300 ${
                  theme === "dark-gold" ? "bg-[#111111] border-white/10" : "bg-white border-[#e8dfd3]"
                }`}>
                  <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-2.5 border-b pb-2 border-[#c9a84c]/30">
                    <span className="bg-[#c9a84c] text-black font-mono font-bold text-[10px] px-2 py-0.5 uppercase tracking-wider flex-shrink-0 whitespace-nowrap">
                      Étape 3 sur 4
                    </span>
                    <div className="min-w-0">
                      <h3 className={`text-xs sm:text-sm font-serif font-bold uppercase tracking-wider ${
                        theme === "dark-gold" ? "text-white" : "text-stone-900"
                      }`}>
                        Choix du Module de Simulation (16 Outils)
                      </h3>
                      <p className={`text-[10px] font-sans ${
                        theme === "dark-gold" ? "text-neutral-400" : "text-stone-600"
                      }`}>
                        Sélectionnez un outil par phase : style, vernissage, marché ou réseaux sociaux.
                      </p>
                    </div>
                  </div>

                  <ToolsBar
                    activeToolId={activeToolId}
                    onSelectTool={handleSelectTool}
                    cache={cache}
                    theme={theme}
                    isSubscribed={isSubscriptionActive}
                    onRunAllAnalyses={handleRunAllAnalyses}
                    onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                    onOpenGalleryBridge={() => setIsGalleryBridgeOpen(true)}
                    onOpenVernissageModal={() => setIsVernissageModalOpen(true)}
                    onOpenCollectorSales={() => setIsCollectorSalesOpen(true)}
                    onOpenPressSocial={() => setIsPressSocialOpen(true)}
                    onOpenQrSalesModal={() => setIsQrSalesModalOpen(true)}
                    batchProgress={batchProgress}
                    onRerunTool={handleRerunTool}
                    onOpenGlobalReport={() => setIsGlobalReportModalOpen(true)}
                  />
                </div>

              </div>

              {/* Right Column: Output Results Panel - Step 4 Chapter Heading */}
              <div id="results-panel-container" className="lg:col-span-7">
                <div className="mb-2.5 sm:mb-3 flex items-center gap-2 sm:gap-2.5 border-b pb-2 border-[#c9a84c]/30">
                  <span className="bg-[#c9a84c] text-black font-mono font-bold text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 uppercase tracking-wider flex-shrink-0 whitespace-nowrap">
                    Étape 4 sur 4
                  </span>
                  <div className="min-w-0">
                    <h3 className={`text-xs sm:text-sm md:text-base font-serif font-bold uppercase tracking-wider ${
                      theme === "dark-gold" ? "text-white" : "text-stone-900"
                    }`}>
                      Résultats de la Simulation & Fiches
                    </h3>
                    <p className={`text-[11px] sm:text-xs font-sans mt-0.5 ${
                      theme === "dark-gold" ? "text-neutral-400" : "text-stone-600"
                    }`}>
                      Consultez la fiche générée, copiez les cartels et sauvegardez dans votre Carnet de Bord.
                    </p>
                  </div>
                </div>

                <ResultsPanel
                  toolId={activeToolId}
                  result={cache[activeToolId]}
                  isLoading={isLoading}
                  artistName={profile.name}
                  theme={theme}
                  previewUrl={previewUrl}
                  onRerunCurrentTool={handleRerun}
                  onOpenGlobalReport={() => setIsGlobalReportModalOpen(true)}
                  onSaveToLogbook={handleSaveCurrentToLogbook}
                  isSavedInLogbook={isCurrentAnalysisInLogbook}
                  onOpenLogbook={() => setIsHistoryOpen(true)}
                  logbookCount={historyList.length}
                />
              </div>

            </div>
          )}
        </main>
        </>
        )}

      </div>

      {/* Footer */}
      <footer className={`relative z-10 py-8 sm:py-10 border-t text-center mt-16 sm:mt-24 text-[10px] uppercase tracking-[0.2em] transition-colors duration-300 ${
        theme === "dark-gold"
          ? "border-white/10 bg-black/50 text-neutral-400"
          : "border-stone-200 bg-[#f7f3ec] text-stone-600"
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serif italic font-light text-sm text-[#c9a84c]">L'Œil de l'Atelier</span>
            <span className="opacity-40">•</span>
            <span>Plateforme d'Expertise Artistique, Scénographie & Vente Directe</span>
          </div>
          <div className="font-mono text-[9px] opacity-70">
            Atelier d'Art & Technologies Visuelles • Paris 2026
          </div>
        </div>
      </footer>

      {/* Floating Carnet de Bord Toast Notification */}
      {logbookNotification && logbookNotification.visible && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[60] max-w-[calc(100vw-2.5rem)] sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={`px-4 py-3 border shadow-2xl flex items-center gap-3 ${
            theme === "dark-gold"
              ? "bg-[#141414] border-[#c9a84c] text-white shadow-black/80"
              : "bg-white border-[#c9a84c] text-stone-900 shadow-amber-900/10"
          }`}>
            <div className="w-8 h-8 bg-[#c9a84c] text-black flex items-center justify-center flex-shrink-0 font-bold text-sm">
              ✓
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-mono font-bold text-[#c9a84c] uppercase tracking-wider">
                Carnet de Bord d'Atelier
              </p>
              <p className="text-xs font-sans mt-0.5 truncate">
                {logbookNotification.message}
              </p>
            </div>
            <button
              onClick={() => {
                setLogbookNotification(null);
                setIsHistoryOpen(true);
              }}
              className="text-[10px] uppercase font-bold tracking-wider underline text-[#c9a84c] hover:opacity-80 px-1 py-0.5 whitespace-nowrap cursor-pointer"
            >
              Consulter
            </button>
            <button
              onClick={() => setLogbookNotification(null)}
              className="text-neutral-400 hover:text-stone-700 text-xs px-1 cursor-pointer"
              title="Fermer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* History modal ("Mon Carnet d'Atelier") */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyList={historyList}
        onLoadHistoryItem={handleLoadHistoryItem}
        onClearHistory={handleClearHistory}
        onDeleteItem={handleDeleteHistoryItem}
        theme={theme}
        artistName={profile.name}
      />

      {/* Donation modal */}
      <DonationModal
        isOpen={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
        theme={theme}
      />

      {/* Subscription Pro Modal (3 € / mois ou 20 € / an) */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        isSubscribed={isSubscriptionActive}
        onSubscribe={handleSubscribe}
        onCancelSubscription={handleCancelSubscription}
        theme={theme}
      />

      {/* Gallery Bridge Modal (5 Nouveaux Outils Galeries & Artistes) */}
      <GalleryBridgeModal
        isOpen={isGalleryBridgeOpen}
        onClose={() => setIsGalleryBridgeOpen(false)}
        theme={theme}
        profile={profile}
        activeArtworkImage={imageBase64}
        activeSeries={activeSeries}
        onAnalyzeGalleryTool={handleAnalyzeGalleryTool}
        onOpenShareModal={() => {
          setShareRole("galeriste");
          setIsShareModalOpen(true);
        }}
      />

      {/* Vernissage & Exhibition Events Modal (5 Outils Soirées & Événements) */}
      <VernissageEventModal
        isOpen={isVernissageModalOpen}
        onClose={() => setIsVernissageModalOpen(false)}
        theme={theme}
        profile={profile}
        activeArtworkImage={imageBase64}
        activeSeries={activeSeries}
        onAnalyzeVernissageTool={handleAnalyzeVernissageTool}
        onOpenRsvpPartners={() => setIsEventRsvpPartnersOpen(true)}
        onOpenUrbanCircuit={() => setIsUrbanCircuitOpen(true)}
      />

      {/* Collector & Sales Modal (5 Outils Ventes Privées & Acheteurs) */}
      <CollectorSalesModal
        isOpen={isCollectorSalesOpen}
        onClose={() => setIsCollectorSalesOpen(false)}
        theme={theme}
        profile={profile}
        activeArtworkImage={imageBase64}
        activeSeries={activeSeries}
        onAnalyzeSalesTool={handleAnalyzeSalesTool}
      />

      {/* Press, Social & Grants Modal (5 Outils Médias & Rayonnement) */}
      <PressSocialBridgeModal
        isOpen={isPressSocialOpen}
        onClose={() => setIsPressSocialOpen(false)}
        theme={theme}
        profile={profile}
        activeArtworkImage={imageBase64}
        activeSeries={activeSeries}
        onAnalyzePressTool={handleAnalyzePressTool}
      />

      {/* 16 Workshop Analysis Tools Modal (Accès Rapide aux 16 Outils Majeurs) */}
      <ArtworkToolsModal
        isOpen={isArtworkToolsModalOpen}
        onClose={() => setIsArtworkToolsModalOpen(false)}
        theme={theme}
        activeToolId={activeToolId}
        cache={cache}
        onSelectTool={handleSelectToolFromTop}
        isSubscribed={isSubscriptionActive}
        onRunAllAnalyses={handleRunAllAnalyses}
        onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
        onOpenGlobalReport={() => setIsGlobalReportModalOpen(true)}
        onOpenQrSalesModal={() => setIsQrSalesModalOpen(true)}
      />

      {/* Artist Profile Modal */}
      <ArtistProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        setProfile={handleUpdateProfile}
        customApiKey={customApiKey}
        setCustomApiKey={setCustomApiKey}
        theme={theme}
      />

      {/* Hub Stratégique - 5 Pôles & 36 Outils */}
      <HubStrategicModal
        isOpen={isHubModalOpen}
        onClose={() => setIsHubModalOpen(false)}
        theme={theme}
        onOpenArtworkTools={() => setIsArtworkToolsModalOpen(true)}
        onOpenGalleryBridge={() => setIsGalleryBridgeOpen(true)}
        onOpenVernissageModal={() => setIsVernissageModalOpen(true)}
        onOpenCollectorSales={() => setIsCollectorSalesOpen(true)}
        onOpenPressSocial={() => setIsPressSocialOpen(true)}
        onOpenQrSalesModal={() => setIsQrSalesModalOpen(true)}
        onSelectTool={handleSelectToolFromTop}
        activeToolId={activeToolId}
        cache={cache}
      />

      {/* Modal Passerelle Artistes • Galeristes • Visiteurs (Cartels Muraux & QR Codes de Vente) */}
      <QrSalesCartelModal
        isOpen={isQrSalesModalOpen}
        onClose={() => setIsQrSalesModalOpen(false)}
        theme={theme}
        profile={profile}
        activeArtworkImage={imageBase64 || previewUrl}
        activeArtworkTitle={selectedArtwork?.title || saveTitle || (activeSeries.length > 0 ? activeSeries[0].title : "Œuvre d'Atelier")}
        activeArtworkMedium={selectedArtwork?.medium || saveMedium || profile.style || "Technique Mixte"}
        activeArtworkYear={selectedArtwork?.year || saveYear || new Date().getFullYear().toString()}
        activeArtworkDimensions={(selectedArtwork && 'dimensions' in selectedArtwork) ? selectedArtwork.dimensions : undefined}
        activeSeries={activeSeries}
        customArtworks={customArtworks}
        presetArtworks={PRESET_ARTWORKS}
        cache={cache}
        onOpenGlobalReport={() => setIsGlobalReportModalOpen(true)}
        onOpenShareModal={() => {
          setShareRole("visiteur");
          setIsShareModalOpen(true);
        }}
        initialTab={qrSalesInitialTab}
      />

      {/* Modal pour ajouter facilement des photos déjà importées à la série */}
      <AddFromGalleryModal
        isOpen={isAddFromGalleryOpen}
        onClose={() => setIsAddFromGalleryOpen(false)}
        customArtworks={customArtworks}
        activeSeries={activeSeries}
        onToggleItem={handleToggleInSeries}
        onAddMultiple={handleAddMultipleToSeries}
        onRemoveMultiple={handleRemoveMultipleFromSeries}
        onUploadNewFiles={handleMultipleFilesSelected}
        theme={theme}
      />

      {/* Modal Dossier Global d'Expertise (Téléchargement HTML, Copier-Coller & Partage) */}
      <GlobalReportExportModal
        isOpen={isGlobalReportModalOpen}
        onClose={() => setIsGlobalReportModalOpen(false)}
        cache={cache}
        artistProfile={{
          name: profile.name,
          style: profile.style,
          bio: profile.bio,
          location: profile.desc,
          website: profile.web
        }}
        artwork={{
          title: selectedArtwork?.title || saveTitle || (activeSeries.length > 0 ? activeSeries[0].title : "Œuvre d'Atelier"),
          artist: profile.name || selectedArtwork?.artist || saveArtist || "Artiste",
          medium: selectedArtwork?.medium || saveMedium || profile.style || "Technique Mixte",
          year: selectedArtwork?.year || saveYear || new Date().getFullYear().toString(),
          dimensions: (selectedArtwork && 'dimensions' in selectedArtwork) ? selectedArtwork.dimensions : undefined,
          imageSrc: imageBase64 || previewUrl || undefined
        }}
        activeSeries={activeSeries}
        theme={theme}
      />

      {/* Modal Partage & Liens Directs (Artistes, Galeristes, Visiteurs, Acheteurs) */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        initialRole={shareRole}
        profile={profile}
        activeArtworkTitle={selectedArtwork?.title || saveTitle || (activeSeries.length > 0 ? activeSeries[0].title : "Œuvre d'Atelier")}
        theme={theme}
      />

      {/* Modal Sélecteur de Langues Officielles (14 langues) */}
      <LanguageSelectorModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        theme={theme}
      />

      {/* Modal Compte Multi-Appareils & Cloud Sync (PC, Tablette, Smartphone) */}
      <UserAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        theme={theme}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        profile={profile}
        setProfile={handleUpdateProfile}
        customArtworks={customArtworks}
        setCustomArtworks={setCustomArtworks}
        history={historyList}
        setHistory={setHistoryList}
        onSyncAllToCloud={handleSyncAllToCloud}
        onPullFromCloud={handlePullFromCloud}
        isSyncing={isSyncing}
      />

      {/* 2. Module Gestion des Événements & Partenaires Locaux (RSVP, Traiteurs, Snacks) */}
      {isEventRsvpPartnersOpen && (
        <EventRsvpPartnersModal
          isOpen={true}
          onClose={() => setIsEventRsvpPartnersOpen(false)}
          theme={theme}
          artistName={profile.name}
          artworksCount={getExhibitionArtworks().length}
        />
      )}

      {/* 3. Parcours Urbain & Scénographie Géolocalisée */}
      {isUrbanCircuitOpen && (
        <UrbanArtCircuitModal
          isOpen={true}
          onClose={() => setIsUrbanCircuitOpen(false)}
          theme={theme}
          artistName={profile.name}
        />
      )}

      {/* 4. Portail Modulaire & Centralisation (Embed Web, Iframe, API) */}
      {isModularPortalOpen && (
        <ModularPortalModal
          isOpen={true}
          onClose={() => setIsModularPortalOpen(false)}
          theme={theme}
          currentMode={appExperienceMode}
          onSwitchMode={(mode) => setAppExperienceMode(mode)}
        />
      )}

    </div>
  );
}
