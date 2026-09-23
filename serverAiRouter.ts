/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALPHABETTE - Architecture IA Hybride, Résiliente & Souveraine
 * Éditeur : ALPHABETTE (fondé par Valentin RICHAUD)
 * Hébergement : Serveurs souverains OVHcloud (alphabette.fr / alphabette.eu)
 * 
 * Ce module implémente le patron de conception "Strategy / Provider" pour découpler
 * totalement le code métier de l'infrastructure d'inférence :
 *  - Phase 1 (Actuelle) : Google Gemini API (développement, prototypage rapide)
 *  - Phase 2 (Production Cible) : Serveur Local Souverain (Ollama / vLLM, coût nul, données locales)
 *  - Phase 3 (Résilience & Secours) : Bascule automatique transparente vers Mistral AI Cloud (France/Europe)
 */

import { GoogleGenAI } from "@google/genai";

export type AIProviderName = "gemini" | "hybrid_mistral" | "local_only" | "mistral_cloud";

export interface AIImagePart {
  mimeType: string;
  base64Data: string;
}

export interface AIRequestOptions {
  systemPrompt: string;
  userPrompt: string;
  images?: AIImagePart[];
  responseSchema?: any;
  responseMimeType?: string;
  temperature?: number;
  providerOverride?: AIProviderName;
  geminiApiKey?: string;
}

export interface SovereigntyInfo {
  isLocal: boolean;
  isEuropean: boolean;
  host: string;
  label: string;
  flag: string;
  compliance: string;
}

export interface AIResponseResult {
  rawText: string;
  parsedJson?: any;
  providerUsed: "gemini" | "local_ollama" | "mistral_cloud";
  modelUsed: string;
  latencyMs: number;
  isFallback: boolean;
  fallbackReason?: string;
  sovereignty: SovereigntyInfo;
}

export interface EcosystemMetadata {
  publisher: string;
  founder: string;
  location: string;
  domains: string[];
  hosting: string;
  privacy: string;
  charter: string;
  pricingRules: {
    individualAppAnnualPrice: string;
    passAlphabetteAnnualPrice: string;
    billingPolicy: string;
  };
}

export const ALPHABETTE_ECOSYSTEM: EcosystemMetadata = {
  publisher: "ALPHABETTE SASU",
  founder: "Valentin RICHAUD",
  location: "La Grande-Motte, France",
  domains: ["alphabette.fr", "alphabette.eu"],
  hosting: "OVHcloud France (Serveurs Souverains Dédiés)",
  privacy: "Absence totale de revente de données personnelles, aucune régie publicitaire tierce, chiffrement strict",
  charter: "Charte éthique ALPHABETTE SASU : priorité au traitement local, respect absolu de la confidentialité et de la propriété intellectuelle",
  pricingRules: {
    individualAppAnnualPrice: "15 € TTC / an",
    passAlphabetteAnnualPrice: "40 € TTC / an",
    billingPolicy: "Abonnement annuel uniquement (aucun prélèvement mensuel pour éviter les frais bancaires intermédiaires)"
  }
};

// ============================================================================
// 1. FOURNISSEUR GEMINI (Phase 1 - Prototypage & Conception)
// ============================================================================
export class GeminiProvider {
  readonly name = "gemini" as const;

  private modelsToTry = [
    "gemini-3.8-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-3.7-flash"
  ];

  async execute(options: AIRequestOptions): Promise<{ rawText: string; modelUsed: string }> {
    const apiKey = options.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("Clé API Gemini introuvable. Veuillez renseigner GEMINI_API_KEY.");
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "alphabette-atelier-build",
        },
      },
    });

    const parts: any[] = [];

    // Format images for Gemini
    if (options.images && options.images.length > 0) {
      for (const img of options.images) {
        let cleanBase64 = img.base64Data;
        if (cleanBase64.includes(";base64,")) {
          cleanBase64 = cleanBase64.split(";base64,")[1];
        }
        parts.push({
          inlineData: {
            mimeType: img.mimeType || "image/jpeg",
            data: cleanBase64,
          },
        });
      }
    }

    parts.push({ text: options.userPrompt });

    const requestPayload: any = {
      contents: { parts },
      config: {
        systemInstruction: options.systemPrompt,
        temperature: options.temperature ?? 0.8,
      }
    };

    if (options.responseSchema) {
      requestPayload.config.responseMimeType = options.responseMimeType || "application/json";
      requestPayload.config.responseSchema = options.responseSchema;
    }

    let lastError: any = null;

    // Retry across available Gemini models
    for (let attempt = 0; attempt < 2; attempt++) {
      for (const model of this.modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model,
            ...requestPayload,
          });
          if (response && response.text) {
            return {
              rawText: response.text,
              modelUsed: model,
            };
          }
        } catch (err: any) {
          lastError = err;
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }

    throw lastError || new Error("Échec de la génération de contenu Gemini.");
  }
}

// ============================================================================
// 2. FOURNISSEUR LOCAL SOUVERAIN (Phase 2 - Ollama / vLLM Dédié Haute Performance)
// ============================================================================
export class LocalOllamaProvider {
  readonly name = "local_ollama" as const;
  private readonly defaultTimeoutMs = 3500; // 3.5 secondes max avant déclenchement du secours

  private getBaseUrl(): string {
    return (process.env.LOCAL_AI_URL || "http://localhost:11434").replace(/\/+$/, "");
  }

  private getModel(): string {
    return process.env.LOCAL_AI_MODEL || "mistral-nemo";
  }

  async isAvailable(): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);
    try {
      const res = await fetch(`${this.getBaseUrl()}/api/tags`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      clearTimeout(timeout);
      return false;
    }
  }

  async execute(options: AIRequestOptions): Promise<{ rawText: string; modelUsed: string }> {
    const baseUrl = this.getBaseUrl();
    const model = this.getModel();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.defaultTimeoutMs);

    try {
      // Prepare images for Ollama (pure base64 array without mime prefix)
      const images: string[] = [];
      if (options.images && options.images.length > 0) {
        for (const img of options.images) {
          let b64 = img.base64Data;
          if (b64.includes(";base64,")) {
            b64 = b64.split(";base64,")[1];
          }
          images.push(b64);
        }
      }

      // Instruct model to respond with pure JSON if schema is requested
      let enrichedPrompt = options.userPrompt;
      if (options.responseSchema) {
        enrichedPrompt += `\n\n[CONSIGNE TECHNIQUE OBLIGATOIRE] : Tu dois impérativement et exclusivement répondre sous la forme d'un objet JSON valide, sans aucun texte introductif ni balise superflue. Schéma attendu : ${JSON.stringify(options.responseSchema)}`;
      }

      const payload: any = {
        model,
        prompt: enrichedPrompt,
        system: options.systemPrompt,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
        },
      };

      if (images.length > 0) {
        payload.images = images;
      }

      if (options.responseSchema) {
        payload.format = "json";
      }

      const res = await fetch(`${baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Serveur local Ollama code HTTP ${res.status} (${res.statusText})`);
      }

      const data = await res.json() as { response?: string };
      if (!data.response) {
        throw new Error("Réponse vide du serveur IA local.");
      }

      return {
        rawText: data.response,
        modelUsed: `local-${model}`,
      };
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        throw new Error(`Délai d'attente dépassé (> ${this.defaultTimeoutMs}ms) sur le serveur IA local`);
      }
      throw err;
    }
  }
}

// ============================================================================
// 3. FOURNISSEUR CLOUD EUROPÉEN MISTRAL AI (Phase 3 - Secours Résilient France)
// ============================================================================
export class MistralCloudProvider {
  readonly name = "mistral_cloud" as const;
  private readonly endpoint = "https://api.mistral.ai/v1/chat/completions";

  private getModel(): string {
    return process.env.MISTRAL_MODEL || "pixtral-12b-2409";
  }

  async isAvailable(): Promise<boolean> {
    const key = process.env.MISTRAL_API_KEY;
    return Boolean(key && key.trim().length > 10);
  }

  async execute(options: AIRequestOptions): Promise<{ rawText: string; modelUsed: string }> {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error("Clé API Mistral introuvable. Veuillez renseigner MISTRAL_API_KEY.");
    }

    const model = this.getModel();

    // Prepare multi-modal content for Mistral (Pixtral handles image_url data URIs)
    const contentParts: any[] = [];

    if (options.images && options.images.length > 0) {
      for (const img of options.images) {
        let b64 = img.base64Data;
        if (!b64.startsWith("data:")) {
          b64 = `data:${img.mimeType || "image/jpeg"};base64,${b64}`;
        }
        contentParts.push({
          type: "image_url",
          image_url: b64,
        });
      }
    }

    let userText = options.userPrompt;
    if (options.responseSchema) {
      userText += `\n\n[RÉPONSE EN JSON STRICT] : Retourne un objet JSON valide correspondant au format suivant, sans fioritures : ${JSON.stringify(options.responseSchema)}`;
    }

    contentParts.push({
      type: "text",
      text: userText,
    });

    const messages = [
      {
        role: "system",
        content: options.systemPrompt,
      },
      {
        role: "user",
        content: contentParts,
      },
    ];

    const bodyPayload: any = {
      model,
      messages,
      temperature: options.temperature ?? 0.7,
    };

    if (options.responseSchema) {
      bodyPayload.response_format = { type: "json_object" };
    }

    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Erreur API Mistral Cloud HTTP ${res.status} : ${errText || res.statusText}`);
    }

    const data = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error("Réponse vide de l'API Mistral Cloud.");
    }

    return {
      rawText: text,
      modelUsed: model,
    };
  }
}

// ============================================================================
// 4. STRATÉGIE HYBRIDE RÉSILIENTE (Local Prioritaire -> Fallback Mistral Cloud)
// ============================================================================
export class HybridMistralStrategy {
  private localProvider = new LocalOllamaProvider();
  private mistralProvider = new MistralCloudProvider();
  private geminiProvider = new GeminiProvider();

  async execute(options: AIRequestOptions): Promise<{
    rawText: string;
    modelUsed: string;
    providerUsed: "local_ollama" | "mistral_cloud" | "gemini";
    isFallback: boolean;
    fallbackReason?: string;
  }> {
    // Étape 1 : Tentative sur le serveur local souverain (Machine dédiée Alphabette)
    try {
      const localResult = await this.localProvider.execute(options);
      return {
        rawText: localResult.rawText,
        modelUsed: localResult.modelUsed,
        providerUsed: "local_ollama",
        isFallback: false,
      };
    } catch (localErr: any) {
      const reason = localErr?.message || "Délai d'attente ou indisponibilité réseau";
      console.warn(`[ALPHABETTE AI ROUTER] Moteur local non joignable (${reason}). Bascule automatique vers le secours souverain Mistral Cloud...`);

      // Étape 2 : Secours Cloud Européen Mistral AI (France)
      try {
        const mistralResult = await this.mistralProvider.execute(options);
        return {
          rawText: mistralResult.rawText,
          modelUsed: mistralResult.modelUsed,
          providerUsed: "mistral_cloud",
          isFallback: true,
          fallbackReason: `Secours activé : Serveur local temporairement indisponible (${reason}). Bascule transparente vers Mistral AI Cloud (France).`,
        };
      } catch (mistralErr: any) {
        console.warn(`[ALPHABETTE AI ROUTER] Échec du secours Mistral (${mistralErr?.message}). Bascule ultime vers Gemini...`);

        // Étape 3 (Filet de sécurité ultime développement) : Gemini
        const geminiResult = await this.geminiProvider.execute(options);
        return {
          rawText: geminiResult.rawText,
          modelUsed: geminiResult.modelUsed,
          providerUsed: "gemini",
          isFallback: true,
          fallbackReason: `Secours ultime activé : Moteur local et Mistral Cloud indisponibles. Traitement assuré par Google Gemini.`,
        };
      }
    }
  }
}

// ============================================================================
// 5. FONCTION CENTRALE askAI (Point d'Entrée Unique Découplé)
// ============================================================================
const geminiProviderInstance = new GeminiProvider();
const localOllamaInstance = new LocalOllamaProvider();
const mistralCloudInstance = new MistralCloudProvider();
const hybridMistralInstance = new HybridMistralStrategy();

export async function askAI(options: AIRequestOptions): Promise<AIResponseResult> {
  const startTime = Date.now();
  const configuredProvider = (process.env.AI_PROVIDER as AIProviderName) || "gemini";
  const activeProvider = options.providerOverride || configuredProvider;

  let rawText = "";
  let modelUsed = "";
  let providerUsed: "gemini" | "local_ollama" | "mistral_cloud" = "gemini";
  let isFallback = false;
  let fallbackReason: string | undefined;

  switch (activeProvider) {
    case "hybrid_mistral": {
      const res = await hybridMistralInstance.execute(options);
      rawText = res.rawText;
      modelUsed = res.modelUsed;
      providerUsed = res.providerUsed as any;
      isFallback = res.isFallback;
      fallbackReason = res.fallbackReason;
      break;
    }

    case "local_only": {
      const res = await localOllamaInstance.execute(options);
      rawText = res.rawText;
      modelUsed = res.modelUsed;
      providerUsed = "local_ollama";
      break;
    }

    case "mistral_cloud": {
      const res = await mistralCloudInstance.execute(options);
      rawText = res.rawText;
      modelUsed = res.modelUsed;
      providerUsed = "mistral_cloud";
      break;
    }

    case "gemini":
    default: {
      const res = await geminiProviderInstance.execute(options);
      rawText = res.rawText;
      modelUsed = res.modelUsed;
      providerUsed = "gemini";
      break;
    }
  }

  const latencyMs = Date.now() - startTime;

  // Extraction et nettoyage JSON
  let parsedJson: any = undefined;
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  try {
    parsedJson = JSON.parse(cleaned.trim());
  } catch {
    // Si la réponse n'est pas du JSON brut mais du texte, parsedJson reste undefined
  }

  // Informations de souveraineté pour la traçabilité et l'UI
  let sovereignty: SovereigntyInfo;
  if (providerUsed === "local_ollama") {
    sovereignty = {
      isLocal: true,
      isEuropean: true,
      host: "Serveur Dédié Haute Performance (ALPHABETTE Local)",
      label: "Moteur Local Souverain",
      flag: "🏠",
      compliance: "Données 100% locales en atelier, coût d'inférence nul, confidentialité absolue",
    };
  } else if (providerUsed === "mistral_cloud") {
    sovereignty = {
      isLocal: false,
      isEuropean: true,
      host: "Mistral AI SAS (Paris, France - Cloud Souverain UE)",
      label: "Cloud Secours Européen",
      flag: "🇫🇷",
      compliance: "Modèle français hébergé en Europe, conforme RGPD et secret des affaires",
    };
  } else {
    sovereignty = {
      isLocal: false,
      isEuropean: false,
      host: "Google AI Cloud (Infrastructure Prototypage)",
      label: "Google Gemini Prototypage",
      flag: "⚡",
      compliance: "Environnement de conception et validation des fonctionnalités en phase 1",
    };
  }

  return {
    rawText,
    parsedJson,
    providerUsed,
    modelUsed,
    latencyMs,
    isFallback,
    fallbackReason,
    sovereignty,
  };
}

// ============================================================================
// 6. INSPECTION DE SANTÉ & TÉLÉMÉTRIE (GET /api/ai-status)
// ============================================================================
export async function getAIStatus(): Promise<{
  activeProvider: AIProviderName;
  configuredProvider: AIProviderName;
  providers: {
    gemini: { configured: boolean; model: string };
    local_ollama: { configured: boolean; reachable: boolean; url: string; model: string };
    mistral_cloud: { configured: boolean; model: string };
  };
  ecosystem: EcosystemMetadata;
}> {
  const configuredProvider = (process.env.AI_PROVIDER as AIProviderName) || "gemini";
  const localProvider = new LocalOllamaProvider();
  const localReachable = await localProvider.isAvailable();

  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY");
  const mistralConfigured = Boolean(process.env.MISTRAL_API_KEY && process.env.MISTRAL_API_KEY.length > 5);

  return {
    activeProvider: configuredProvider,
    configuredProvider,
    providers: {
      gemini: {
        configured: geminiConfigured,
        model: "gemini-3.8-flash (Multi-modèles Cascade)",
      },
      local_ollama: {
        configured: Boolean(process.env.LOCAL_AI_URL || true),
        reachable: localReachable,
        url: process.env.LOCAL_AI_URL || "http://localhost:11434",
        model: process.env.LOCAL_AI_MODEL || "mistral-nemo",
      },
      mistral_cloud: {
        configured: mistralConfigured,
        model: process.env.MISTRAL_MODEL || "pixtral-12b-2409",
      },
    },
    ecosystem: ALPHABETTE_ECOSYSTEM,
  };
}
