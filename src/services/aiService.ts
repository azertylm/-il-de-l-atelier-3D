/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALPHABETTE SASU - Client-Side AI Service & Sovereignty Telemetry
 * Éditeur : ALPHABETTE SASU (fondé par Valentin RICHAUD à La Grande-Motte)
 * Hébergement : Serveurs souverains OVH (alphabette.fr / alphabette.eu)
 * 
 * Couche d'abstraction unifiée pour l'appel au moteur d'inférence.
 * Découple l'interface utilisateur des fournisseurs sous-jacents (Gemini / Local Ollama / Mistral Cloud).
 */

export type AIProviderId = "gemini" | "hybrid_mistral" | "local_only" | "mistral_cloud";

export interface SovereigntyTelemetry {
  providerUsed: "gemini" | "local_ollama" | "mistral_cloud";
  modelUsed: string;
  latencyMs: number;
  isFallback: boolean;
  fallbackReason?: string;
  sovereignty: {
    isLocal: boolean;
    isEuropean: boolean;
    host: string;
    label: string;
    flag: string;
    compliance: string;
  };
}

export interface AIStatusReport {
  activeProvider: AIProviderId;
  configuredProvider: AIProviderId;
  providers: {
    gemini: { configured: boolean; model: string };
    local_ollama: { configured: boolean; reachable: boolean; url: string; model: string };
    mistral_cloud: { configured: boolean; model: string };
  };
  ecosystem: {
    publisher: string;
    founder: string;
    domains: string[];
    hosting: string;
    privacy: string;
    charter: string;
  };
}

export interface AskAIOptions {
  toolId: string;
  image?: string;
  images?: string[];
  mimeType?: string;
  artistProfile?: any;
  language?: string;
  providerOverride?: AIProviderId;
  customApiKey?: string;
}

// Global observable store for latest AI telemetry
let lastTelemetry: SovereigntyTelemetry | null = null;
const listeners = new Set<(telemetry: SovereigntyTelemetry | null) => void>();

export function subscribeToTelemetry(cb: (telemetry: SovereigntyTelemetry | null) => void): () => void {
  listeners.add(cb);
  cb(lastTelemetry);
  return () => {
    listeners.delete(cb);
  };
}

export function getLastTelemetry(): SovereigntyTelemetry | null {
  return lastTelemetry;
}

export function setLastTelemetry(telemetry: SovereigntyTelemetry | null) {
  lastTelemetry = telemetry;
  listeners.forEach((cb) => cb(lastTelemetry));
}

// User preference storage in localStorage
const STORAGE_KEY_PROVIDER = "alphabette_ai_provider_preference";

export function getPreferredProvider(): AIProviderId {
  if (typeof window === "undefined") return "gemini";
  const stored = localStorage.getItem(STORAGE_KEY_PROVIDER);
  if (stored === "hybrid_mistral" || stored === "local_only" || stored === "mistral_cloud" || stored === "gemini") {
    return stored;
  }
  return "gemini";
}

export function setPreferredProvider(provider: AIProviderId) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_PROVIDER, provider);
}

/**
 * Fonction unifiée askAI
 * Point d'entrée unique pour toute requête d'analyse ou de génération
 */
export async function askAI(options: AskAIOptions): Promise<any> {
  const provider = options.providerOverride || getPreferredProvider();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (provider) {
    headers["x-ai-provider"] = provider;
  }

  if (options.customApiKey) {
    headers["x-gemini-api-key"] = options.customApiKey;
  }

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers,
    body: JSON.stringify({
      toolId: options.toolId,
      image: options.image,
      images: options.images,
      mimeType: options.mimeType,
      artistProfile: options.artistProfile,
      language: options.language,
      providerOverride: provider,
    }),
  });

  if (!response.ok) {
    let errorData: any = null;
    try {
      errorData = await response.json();
    } catch {
      // ignore
    }
    const msg = errorData?.error?.message || `Erreur serveur (${response.status} ${response.statusText})`;
    const error = new Error(msg);
    (error as any).status = response.status;
    (error as any).code = errorData?.error?.code;
    throw error;
  }

  const data = await response.json();

  if (data._aiMeta) {
    setLastTelemetry(data._aiMeta);
  }

  return data;
}

/**
 * Récupère le statut et l'état de santé du routeur souverain ALPHABETTE
 */
export async function fetchAIStatus(): Promise<AIStatusReport> {
  const res = await fetch("/api/ai-status");
  if (!res.ok) {
    throw new Error(`Erreur lors de la récupération du statut IA (${res.status})`);
  }
  return res.json();
}
