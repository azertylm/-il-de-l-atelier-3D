import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { PROMPTS_CONFIG } from "./serverPrompts.js";
import { askAI, getAIStatus, AIProviderName } from "./serverAiRouter.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set high limits for file uploads as base64 images can be quite large
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API endpoint for Sovereign & Hybrid AI Status (ALPHABETTE Architecture)
  app.get("/api/ai-status", async (_req, res) => {
    try {
      const status = await getAIStatus();
      return res.json(status);
    } catch (err: any) {
      return res.status(500).json({
        error: { message: err?.message || "Erreur lors de la vérification du statut IA" }
      });
    }
  });

  // API endpoint for artwork analysis (Decoupled Strategy Pattern)
  app.post("/api/analyze", async (req, res) => {
    try {
      const { image, images, mimeType, toolId, artistProfile, language, providerOverride } = req.body;

      if (!image && (!images || images.length === 0)) {
        return res.status(400).json({ error: { message: "Aucune image fournie." } });
      }

      if (!toolId) {
        return res.status(400).json({ error: { message: "Identifiant d'outil (toolId) manquant." } });
      }

      const config = PROMPTS_CONFIG[toolId];
      if (!config) {
        return res.status(400).json({ error: { message: `Outil non supporté : ${toolId}` } });
      }

      // Format image data
      const imageParts: Array<{ mimeType: string; base64Data: string }> = [];
      const hasMultipleImages = images && Array.isArray(images) && images.length > 0;

      if (hasMultipleImages) {
        // Cap series sample to a maximum of 8 images to prevent payload overflow
        const selectedImages = images.slice(0, 8);
        selectedImages.forEach((img: string) => {
          imageParts.push({
            mimeType: mimeType || "image/jpeg",
            base64Data: img,
          });
        });
      } else if (image) {
        imageParts.push({
          mimeType: mimeType || "image/jpeg",
          base64Data: image,
        });
      }

      // Construct hyper-personalized context prompt based on the Artist Profile
      let contextText = `Analyse cette œuvre d'art et retourne la réponse au format JSON strict, conforme au schéma de réponse attendu.`;
      
      if (hasMultipleImages) {
        contextText = `Analyse cette série de ${images.length} œuvres d'art dans son ensemble et retourne la réponse au format JSON strict, conforme au schéma de réponse attendu.\n\n`;
        contextText += `=== CONTEXTE DE SÉRIE D'ŒUVRES (VERNISSAGE / DIALOGUE DE SÉRIE) ===\n`;
        contextText += `Tu as reçu plusieurs images représentant une série d'œuvres d'art complémentaires d'un même artiste ou conçues pour être exposées ensemble.\n`;
        contextText += `L'analyse doit impérativement porter sur la cohérence de la série dans sa globalité. Repère le fil conducteur visuel, thématique ou émotionnel. Évalue la continuité chromatique et stylistique, et comment ces œuvres se répondent mutuellement. Adapte tes descriptions, critiques, palettes de couleurs et conseils pour englober la série complète d'œuvres d'art plutôt qu'une seule création.\n\n`;
      }
      
      if (artistProfile) {
        const { name, instagram, web, style, desc } = artistProfile;
        contextText += `\n=== PROFIL ET INTENTION DE L'ARTISTE ===`;
        if (name) contextText += `\n- Nom de l'artiste : ${name}`;
        if (instagram) contextText += `\n- Instagram / Réseau : ${instagram}`;
        if (web) contextText += `\n- Site internet / Portfolio : ${web}`;
        if (style) contextText += `\n- Style artistique affirmé : ${style}`;
        if (desc) contextText += `\n- Note d'intention / Thèmes / Médium : ${desc}`;
        
        contextText += `\n\nCONSIGNE DE PERSONNALISATION ABSOLUE : Intègre de façon fluide, naturelle et élégante ces données de profil dans ta réponse. Rédige comme si tu parlais de cet artiste en particulier (ex: cite son nom dans la critique, mentionne ses objectifs dans l'Artist Statement, adapte les hashtags et publications de réseaux sociaux à son portfolio, etc.). Évite absolument les formules impersonnelles.`;
      }

      // Multilingual Official Translation Directive
      const LANGUAGE_PROMPT_MAP: Record<string, string> = {
        fr: "French (Français)",
        en: "English",
        it: "Italian (Italiano)",
        de: "German (Deutsch)",
        es: "Spanish (Español)",
        pt: "European Portuguese (Português de Portugal)",
        "pt-BR": "Brazilian Portuguese (Português do Brasil)",
        zh: "Simplified Chinese (简体中文)",
        ar: "Modern Standard Arabic (العربية الفصحى)",
        ja: "Japanese (日本語)",
        ko: "Korean (한국어)",
        nl: "Dutch (Nederlands)",
        ru: "Russian (Русский)",
        sv: "Swedish (Svenska)"
      };

      if (language && LANGUAGE_PROMPT_MAP[language]) {
        const targetLang = LANGUAGE_PROMPT_MAP[language];
        contextText += `\n\n=== EXIGENCE LINGUISTIQUE OFFICIELLE : TOUTE LA RÉPONSE EN ${targetLang.toUpperCase()} ===\n`;
        contextText += `IMPORTANT : L'utilisateur a sélectionné la langue "${targetLang}". Tu dois OBLIGATOIREMENT rédiger TOUTES les parties de ta réponse (titres, critiques d'art, analyses plastiques, démarches d'atelier, conseils, descriptions de cartels, poésies, etc.) en ${targetLang}.`;
      }

      // Header or body provider override for testing / hybrid switching
      const requestedProvider = (req.headers["x-ai-provider"] as AIProviderName) || providerOverride;
      const geminiApiKey = (req.headers["x-gemini-api-key"] as string) || process.env.GEMINI_API_KEY;

      // Execute unified AI request via the Sovereign AI Router (Strategy Pattern)
      const aiResult = await askAI({
        systemPrompt: config.prompt,
        userPrompt: contextText,
        images: imageParts,
        responseSchema: config.schema,
        responseMimeType: "application/json",
        temperature: 0.8,
        providerOverride: requestedProvider,
        geminiApiKey,
      });

      // Parse JSON from raw text if not already parsed
      let finalJson = aiResult.parsedJson;
      if (!finalJson) {
        let raw = aiResult.rawText.trim();
        if (raw.startsWith("```json")) {
          raw = raw.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (raw.startsWith("```")) {
          raw = raw.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }
        finalJson = JSON.parse(raw.trim());
      }

      // Attach sovereign AI metadata for telemetry & UI indicators
      return res.json({
        ...finalJson,
        _aiMeta: {
          providerUsed: aiResult.providerUsed,
          modelUsed: aiResult.modelUsed,
          latencyMs: aiResult.latencyMs,
          isFallback: aiResult.isFallback,
          fallbackReason: aiResult.fallbackReason,
          sovereignty: aiResult.sovereignty,
        }
      });

    } catch (error: any) {
      console.error("AI Router Execution Error:", error);
      const errMsg = error?.message || "";
      const isQuota = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("Quota");
      const isDemand = errMsg.includes("503") || errMsg.includes("UNAVAILABLE");

      return res.status(isQuota ? 429 : isDemand ? 503 : 500).json({
        error: {
          code: isQuota ? 429 : isDemand ? 503 : 500,
          message: isQuota 
            ? "Le quota de requêtes de l'IA est temporairement atteint. Veuillez patienter quelques secondes."
            : isDemand
              ? "Serveurs d'inférence en forte affluence. Veuillez relancer l'analyse dans un instant."
              : (error.message || "Une erreur s'est produite lors de l'analyse de l'œuvre.")
        }
      });
    }
  });

  // Dedicated API error handler to guarantee JSON responses for /api routes
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith("/api")) {
      const status = err.status || err.statusCode || 500;
      return res.status(status).json({
        error: {
          code: status,
          message: err.type === "entity.too.large"
            ? "Le volume des images transmises dépasse la taille maximale autorisée (50 Mo). Veuillez réduire la taille ou le nombre d'images."
            : (err.message || "Erreur lors du traitement de la requête.")
        }
      });
    }
    next(err);
  });

  // Serve static client assets using Vite or Express
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
