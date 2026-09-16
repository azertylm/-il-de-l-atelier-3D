/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  X, 
  User, 
  Cloud, 
  CloudCheck, 
  Smartphone, 
  Monitor, 
  Tablet, 
  LogOut, 
  Sparkles, 
  Check, 
  ArrowRight,
  Shield,
  Palette,
  Building2,
  Eye,
  RefreshCw,
  Info
} from "lucide-react";
import { UserAccount, UserRole, ArtistProfile, CustomArtwork, HistoryItem } from "../types";
import { signInWithGooglePopup, logoutFirebaseUser, saveCloudUserProfile } from "../lib/firebase";

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: "dark-gold" | "light";
  currentUser: UserAccount | null;
  setCurrentUser: (user: UserAccount | null) => void;
  profile: ArtistProfile;
  setProfile: (profile: ArtistProfile) => void;
  customArtworks: CustomArtwork[];
  setCustomArtworks: (artworks: CustomArtwork[]) => void;
  history: HistoryItem[];
  setHistory: (history: HistoryItem[]) => void;
  onSyncAllToCloud: () => Promise<void>;
  onPullFromCloud: () => Promise<void>;
  isSyncing: boolean;
}

export default function UserAccountModal({
  isOpen,
  onClose,
  theme,
  currentUser,
  setCurrentUser,
  profile,
  setProfile,
  customArtworks,
  setCustomArtworks,
  history,
  setHistory,
  onSyncAllToCloud,
  onPullFromCloud,
  isSyncing,
}: UserAccountModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentUser?.role || "artist");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isDark = theme === "dark-gold";

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setLoginError(null);
      const firebaseUser = await signInWithGooglePopup();
      
      const newAccount: UserAccount = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || "Utilisateur",
        photoURL: firebaseUser.photoURL || undefined,
        role: selectedRole,
        profile: {
          ...profile,
          name: profile.name || firebaseUser.displayName || "",
          contactEmail: profile.contactEmail || firebaseUser.email || "",
        },
      };

      setCurrentUser(newAccount);
      // Auto save user profile to cloud
      await saveCloudUserProfile(firebaseUser, newAccount.profile, selectedRole);
      setSyncSuccessMsg("Connexion réussie ! Vos données sont désormais synchronisées.");
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("Login failed:", err);
      setLoginError(err?.message || "Échec de la connexion Google. Veuillez réessayer.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRoleChange = async (role: UserRole) => {
    setSelectedRole(role);
    if (currentUser) {
      const updated = { ...currentUser, role };
      setCurrentUser(updated);
      try {
        await saveCloudUserProfile(
          { uid: currentUser.uid, email: currentUser.email, displayName: currentUser.displayName } as any,
          currentUser.profile,
          role
        );
      } catch (e) {
        console.error("Failed to update role in cloud:", e);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutFirebaseUser();
      setCurrentUser(null);
      setSyncSuccessMsg("Déconnexion réussie. Vos données restent conservées sur ce navigateur.");
      setTimeout(() => setSyncSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error("Logout error:", err);
    }
  };

  const handleManualSync = async () => {
    try {
      setSyncSuccessMsg(null);
      await onSyncAllToCloud();
      setSyncSuccessMsg("Toutes vos œuvres et analyses ont été synchronisées sur le Cloud !");
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      setLoginError("Erreur lors de la synchronisation : " + (err?.message || "Inconnue"));
    }
  };

  const handleManualPull = async () => {
    try {
      setSyncSuccessMsg(null);
      await onPullFromCloud();
      setSyncSuccessMsg("Données récupérées avec succès depuis votre Cloud !");
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      setLoginError("Erreur lors du téléchargement : " + (err?.message || "Inconnue"));
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 shadow-2xl rounded-none p-5 sm:p-7 flex flex-col ${
          isDark 
            ? "bg-[#0d0c0a] border-[#c9a84c] text-neutral-200" 
            : "bg-white border-stone-800 text-stone-900"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b pb-4 border-[#c9a84c]/30">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 border flex items-center justify-center ${
              isDark ? "bg-[#c9a84c]/20 border-[#c9a84c] text-[#c9a84c]" : "bg-amber-100 border-[#c9a84c] text-amber-900"
            }`}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a84c] font-bold">
                COMPTE MULTI-APPAREILS · CLOUD SYNC
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-black uppercase tracking-wide">
                {currentUser ? "Mon Espace Cloud" : "Créer un Compte ou Se Connecter"}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 border transition-colors cursor-pointer ${
              isDark ? "border-neutral-700 hover:border-[#c9a84c] text-neutral-400 hover:text-white" : "border-stone-300 hover:border-black text-stone-600 hover:text-black"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications / Feedback */}
        {syncSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-500 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{syncSuccessMsg}</span>
          </div>
        )}

        {loginError && (
          <div className="mt-4 p-3 bg-red-950/40 border border-red-500 text-red-400 text-xs font-mono">
            {loginError}
          </div>
        )}

        {/* Multi-Device Banner */}
        <div className={`mt-4 p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isDark ? "bg-[#14120a] border-[#c9a84c]/40" : "bg-amber-50/70 border-[#c9a84c]/60"
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[#c9a84c]">
              <Monitor className="w-4 h-4" />
              <Tablet className="w-4 h-4" />
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#c9a84c]">
                Accédez à vos données sur PC, Tablette & Smartphone
              </h4>
              <p className="text-[11px] opacity-80 mt-0.5">
                Enregistrez vos analyses, cartels d'exposition et certificats pour les retrouver partout instantanément.
              </p>
            </div>
          </div>
        </div>

        {/* Profile / Status Section */}
        {currentUser ? (
          <div className="mt-5 space-y-5">
            {/* Connected User Banner */}
            <div className={`p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isDark ? "bg-black/50 border-white/10" : "bg-stone-50 border-stone-200"
            }`}>
              <div className="flex items-center gap-3.5">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName} 
                    className="w-12 h-12 rounded-full border border-[#c9a84c]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#c9a84c] text-black font-black flex items-center justify-center text-lg">
                    {currentUser.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-base sm:text-lg">{currentUser.displayName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 uppercase bg-emerald-950 text-emerald-400 border border-emerald-500 font-bold">
                      Connecté
                    </span>
                  </div>
                  <p className="text-xs font-mono opacity-70">{currentUser.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider border border-red-500/50 text-red-400 hover:bg-red-950 hover:border-red-400 flex items-center gap-1.5 self-start sm:self-center transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Se déconnecter</span>
              </button>
            </div>

            {/* Role Switcher */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#c9a84c] mb-2">
                Type de Profil :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleChange("artist")}
                  className={`p-3 border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    currentUser.role === "artist"
                      ? "border-[#c9a84c] bg-[#c9a84c]/15 text-[#c9a84c] font-bold"
                      : isDark ? "border-neutral-800 hover:border-neutral-600 bg-neutral-900/40" : "border-stone-200 hover:border-stone-400 bg-stone-50"
                  }`}
                >
                  <Palette className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-serif font-bold block">Artiste Créateur</span>
                    <span className="text-[10px] font-sans opacity-70 leading-tight">Atelier, cartels & certificats</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange("gallerist")}
                  className={`p-3 border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    currentUser.role === "gallerist"
                      ? "border-[#c9a84c] bg-[#c9a84c]/15 text-[#c9a84c] font-bold"
                      : isDark ? "border-neutral-800 hover:border-neutral-600 bg-neutral-900/40" : "border-stone-200 hover:border-stone-400 bg-stone-50"
                  }`}
                >
                  <Building2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-serif font-bold block">Galeriste / Curateur</span>
                    <span className="text-[10px] font-sans opacity-70 leading-tight">Candidatures & expositions</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange("visitor_collector")}
                  className={`p-3 border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    currentUser.role === "visitor_collector"
                      ? "border-[#c9a84c] bg-[#c9a84c]/15 text-[#c9a84c] font-bold"
                      : isDark ? "border-neutral-800 hover:border-neutral-600 bg-neutral-900/40" : "border-stone-200 hover:border-stone-400 bg-stone-50"
                  }`}
                >
                  <Eye className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-serif font-bold block">Visiteur / Collectionneur</span>
                    <span className="text-[10px] font-sans opacity-70 leading-tight">Coups de cœur & achats</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Cloud Sync Status & Actions */}
            <div className={`p-4 border ${isDark ? "bg-[#14120a] border-[#c9a84c]/30" : "bg-amber-50/50 border-stone-200"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-[#c9a84c]" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#c9a84c]">
                    État de Synchronisation Cloud
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-0.5 bg-black/40 border border-[#c9a84c]/40 text-[#c9a84c]">
                    {customArtworks.length} œuvre{customArtworks.length > 1 ? "s" : ""}
                  </span>
                  <span className="px-2 py-0.5 bg-black/40 border border-[#c9a84c]/40 text-[#c9a84c]">
                    {history.length} analyse{history.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <p className="text-xs font-sans opacity-80 mb-4 leading-relaxed">
                Vos modifications sont automatiquement enregistrées. Vous pouvez aussi forcer un envoi vers le Cloud ou télécharger vos données sur un nouvel appareil :
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="flex-1 py-2.5 px-4 bg-[#c9a84c] text-black hover:bg-white font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "Synchronisation en cours..." : "Sauvegarder tout sur le Cloud"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleManualPull}
                  disabled={isSyncing}
                  className={`flex-1 py-2.5 px-4 border font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isDark ? "border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c] hover:text-black" : "border-stone-800 text-stone-900 hover:bg-stone-900 hover:text-white"
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Récupérer les données du Cloud</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Sign-In / Sign-Up Presentation */
          <div className="mt-5 space-y-6">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#c9a84c] mb-2">
                1. Choisissez votre profil :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole("artist")}
                  className={`p-3 border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    selectedRole === "artist"
                      ? "border-[#c9a84c] bg-[#c9a84c]/20 text-[#c9a84c] font-bold"
                      : isDark ? "border-neutral-800 hover:border-neutral-600 bg-neutral-900/40" : "border-stone-200 hover:border-stone-400 bg-stone-50"
                  }`}
                >
                  <Palette className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-serif font-bold block">Artiste Créateur</span>
                    <span className="text-[10px] font-sans opacity-70 leading-tight">Atelier, cartels & certificats</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("gallerist")}
                  className={`p-3 border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    selectedRole === "gallerist"
                      ? "border-[#c9a84c] bg-[#c9a84c]/20 text-[#c9a84c] font-bold"
                      : isDark ? "border-neutral-800 hover:border-neutral-600 bg-neutral-900/40" : "border-stone-200 hover:border-stone-400 bg-stone-50"
                  }`}
                >
                  <Building2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-serif font-bold block">Galeriste / Curateur</span>
                    <span className="text-[10px] font-sans opacity-70 leading-tight">Candidatures & expositions</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("visitor_collector")}
                  className={`p-3 border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    selectedRole === "visitor_collector"
                      ? "border-[#c9a84c] bg-[#c9a84c]/20 text-[#c9a84c] font-bold"
                      : isDark ? "border-neutral-800 hover:border-neutral-600 bg-neutral-900/40" : "border-stone-200 hover:border-stone-400 bg-stone-50"
                  }`}
                >
                  <Eye className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-serif font-bold block">Visiteur / Collectionneur</span>
                    <span className="text-[10px] font-sans opacity-70 leading-tight">Coups de cœur & achats</span>
                  </div>
                </button>
              </div>
            </div>

            <div className={`p-5 border text-center space-y-4 ${
              isDark ? "bg-[#111] border-[#c9a84c]/40" : "bg-stone-50 border-[#c9a84c]/60"
            }`}>
              <h4 className="font-serif font-bold text-base sm:text-lg">
                Connexion sécurisée en 1 clic
              </h4>
              <p className="text-xs font-sans opacity-80 max-w-md mx-auto leading-relaxed">
                Connectez-vous avec votre compte Google pour synchroniser automatiquement vos créations et y accéder depuis votre téléphone, votre tablette ou votre ordinateur.
              </p>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full max-w-sm mx-auto py-3 px-6 bg-white hover:bg-neutral-100 text-stone-900 border-2 border-stone-300 font-sans font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{isLoggingIn ? "Connexion..." : "Continuer avec Google"}</span>
              </button>
            </div>

            {/* Features Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Sauvegarde automatique de vos toiles et analyses d'atelier</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Accessible sur mobile lors de vos vernissages et foires d'art</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Conservation de vos cartels muraux et certificats d'authenticité</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Données privées chiffrées selon les normes de sécurité Cloud</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-[#c9a84c]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] opacity-70 font-mono">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#c9a84c]" />
            <span>Sécurité ABAC Firestore · Chiffrement Google Cloud</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hover:underline text-[#c9a84c] cursor-pointer"
          >
            Fermer la fenêtre
          </button>
        </div>
      </div>
    </div>
  );
}
