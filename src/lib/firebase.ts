/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  getDocFromServer,
  serverTimestamp 
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { ArtistProfile, CustomArtwork, HistoryItem, UserAccount, UserRole } from "../types";

// 1. Initialize Firebase App & Firestore with Database ID (Critical per specification)
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 2. Validate Connection to Firestore on Boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Client is currently offline or Firestore is initializing.");
    }
  }
}
testConnection();

// 3. Structured Firestore Error Handling conforming to FirestoreErrorInfo
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 4. Authentication Methods
export async function signInWithGooglePopup(): Promise<FirebaseUser> {
  try {
    googleProvider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
}

export async function logoutFirebaseUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign-out error:", error);
    throw error;
  }
}

// 5. User Profile Synchronization
export async function fetchCloudUserProfile(uid: string): Promise<UserAccount | null> {
  const userDocRef = doc(db, "users", uid);
  try {
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    return {
      uid,
      email: data.email || "",
      displayName: data.displayName || "",
      role: (data.role as UserRole) || "artist",
      profile: {
        name: data.displayName || "",
        instagram: data.instagram || "",
        web: data.website || "",
        style: data.style || "",
        desc: data.bio || "",
        bio: data.bio || "",
        contactEmail: data.contactEmail || data.email || "",
        mediums: data.mediums || "",
        achievements: data.achievements || "",
        philosophy: data.philosophy || "",
        phone: data.phone || "",
      },
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
}

export async function saveCloudUserProfile(
  user: FirebaseUser,
  profile: ArtistProfile,
  role: UserRole
): Promise<void> {
  const userDocRef = doc(db, "users", user.uid);
  const now = new Date().toISOString();
  
  const payload = {
    id: user.uid,
    email: user.email || "",
    displayName: profile.name || user.displayName || "Artiste",
    role: role,
    bio: profile.bio || profile.desc || "",
    website: profile.web || "",
    instagram: profile.instagram || "",
    phone: profile.phone || "",
    style: profile.style || "",
    philosophy: profile.philosophy || "",
    achievements: profile.achievements || "",
    contactEmail: profile.contactEmail || user.email || "",
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(userDocRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
}

// 6. User Artworks Cloud Synchronization
export async function fetchCloudArtworks(uid: string): Promise<CustomArtwork[]> {
  const artworksRef = collection(db, "users", uid, "artworks");
  try {
    const snap = await getDocs(artworksRef);
    const artworks: CustomArtwork[] = [];
    snap.forEach((d) => {
      const data = d.data();
      artworks.push({
        id: d.id,
        title: data.title || "Sans titre",
        artist: data.artist || "",
        medium: data.medium || "",
        year: data.year || "",
        imageSrc: data.thumbnailUrl || "",
        isPreset: false,
      });
    });
    return artworks;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${uid}/artworks`);
  }
}

export async function saveCloudArtwork(uid: string, artwork: CustomArtwork): Promise<void> {
  // Sanitize ID
  const sanitizedId = String(artwork.id).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
  const artworkRef = doc(db, "users", uid, "artworks", sanitizedId);
  const now = new Date().toISOString();

  // Compress thumbnail if needed to stay well within limits
  const thumbnailUrl = (artwork.imageSrc || "").slice(0, 75000);

  const payload = {
    id: sanitizedId,
    userId: uid,
    title: (artwork.title || "Sans titre").slice(0, 240),
    artist: (artwork.artist || "Artiste").slice(0, 140),
    medium: (artwork.medium || "").slice(0, 190),
    year: (artwork.year || "").slice(0, 45),
    dimensions: "",
    estimatedPrice: "",
    thumbnailUrl,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(artworkRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/artworks/${sanitizedId}`);
  }
}

export async function deleteCloudArtwork(uid: string, artworkId: string): Promise<void> {
  const sanitizedId = String(artworkId).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
  const artworkRef = doc(db, "users", uid, "artworks", sanitizedId);
  try {
    await deleteDoc(artworkRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}/artworks/${sanitizedId}`);
  }
}

// 7. Analysis History Cloud Synchronization (Carnet de Bord)
export async function fetchCloudHistory(uid: string): Promise<HistoryItem[]> {
  const historyRef = collection(db, "users", uid, "history");
  try {
    const snap = await getDocs(historyRef);
    const items: HistoryItem[] = [];
    snap.forEach((d) => {
      const data = d.data();
      let parsedResult: any = data.result;
      try {
        parsedResult = JSON.parse(data.result);
      } catch {
        // Keep string if not json
      }

      items.push({
        id: Number(d.id.replace(/\D/g, "")) || Date.now(),
        date: data.createdAt ? new Date(data.createdAt).toLocaleDateString("fr-FR") : "",
        filename: data.filename || "Œuvre",
        toolId: data.toolId || "expertise",
        toolLabel: data.toolLabel || "Analyse",
        summary: data.summary || "",
        result: parsedResult,
        imageSrc: "", // Image preview
      });
    });
    // Sort recent first
    return items.sort((a, b) => b.id - a.id);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${uid}/history`);
  }
}

export async function saveCloudHistoryItem(uid: string, item: HistoryItem): Promise<void> {
  const sanitizedId = `hist_${item.id}`;
  const historyRef = doc(db, "users", uid, "history", sanitizedId);
  const now = new Date().toISOString();

  let serializedResult = "";
  if (typeof item.result === "string") {
    serializedResult = item.result.slice(0, 48000);
  } else {
    try {
      serializedResult = JSON.stringify(item.result).slice(0, 48000);
    } catch {
      serializedResult = String(item.result).slice(0, 48000);
    }
  }

  const payload = {
    id: sanitizedId,
    userId: uid,
    toolId: (item.toolId || "tool").slice(0, 75),
    toolLabel: (item.toolLabel || "Analyse").slice(0, 110),
    filename: (item.filename || "Oeuvre").slice(0, 190),
    summary: (item.summary || "").slice(0, 480),
    result: serializedResult,
    createdAt: now,
  };

  try {
    await setDoc(historyRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/history/${sanitizedId}`);
  }
}

export async function deleteCloudHistoryItem(uid: string, itemId: number | string): Promise<void> {
  const sanitizedId = `hist_${itemId}`;
  const historyRef = doc(db, "users", uid, "history", sanitizedId);
  try {
    await deleteDoc(historyRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}/history/${sanitizedId}`);
  }
}
