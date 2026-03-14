import { GoogleGenAI } from "@google/genai";

interface DiscoveredModel {
  id: string;
  name: string;
  description: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedActions: string[];
  features: string[];
}

// Models that are not useful for a text/markdown chat interface
const BLOCKED_MODEL_PATTERNS = [
  /nano/i,         // Gemini Nano — on-device, not useful server-side
  /\btts\b/i,      // Text-to-Speech models
  /\basr\b/i,      // Automatic Speech Recognition models
  /image.*gen/i,   // Image generation models (Imagen, etc.)
  /imagen/i,       // Imagen models
  /embedding/i,    // Embedding models
  /\bveo\b/i,      // Video generation models
  /\blive\b/i,     // Live/realtime streaming models
  /-tuned-/i,      // Fine-tuned variants (user-specific)
];

function isModelBlocked(id: string, displayName: string): boolean {
  const combined = `${id} ${displayName}`;
  return BLOCKED_MODEL_PATTERNS.some((pattern) => pattern.test(combined));
}

function inferFeatures(id: string, description: string): string[] {
  const features: string[] = [];
  const lower = id.toLowerCase();

  // Per official docs (2025-03): all Gemini 2.5 and 3.x series support thinking
  const is25 = /gemini-2\.5/.test(lower);
  const is3x = /gemini-3/.test(lower);
  const is20 = /gemini-2\.0/.test(lower);
  const is15 = /gemini-1\.5/.test(lower);

  // Thinking: all 2.5 and 3.x series
  if (is25 || is3x) {
    // 3.x Pro = deep_think, others = thinking
    if (is3x && lower.includes("pro")) {
      features.push("deep_think");
    } else {
      features.push("thinking");
    }
  }

  // Code: all gemini models are capable, but highlight for 2.0+
  if (is20 || is25 || is3x) {
    features.push("code");
  }

  // Multimodal (image, audio, document input): all gemini 1.5+ support it
  // (except lite variants which may have reduced multimodal)
  if (is15 || is20 || is25 || is3x) {
    features.push("multimodal");
  }

  // Google Search grounding: 2.0+, 2.5, 3.x series
  if (is20 || is25 || is3x) {
    features.push("search");
  }

  // Fallback: check description for additional hints
  const combined = `${id} ${description}`.toLowerCase();
  if (!features.includes("thinking") && !features.includes("deep_think")) {
    if (combined.includes("thinking") || combined.includes("reason")) {
      features.push("thinking");
    }
  }
  if (!features.includes("search")) {
    if (combined.includes("search") || combined.includes("grounding")) {
      features.push("search");
    }
  }

  return features;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { apiKey: string };
    const { apiKey } = body;

    if (!apiKey) {
      return Response.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    return await validateGeminiKey(apiKey);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

async function validateGeminiKey(apiKey: string): Promise<Response> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const pager = await ai.models.list({ config: { pageSize: 100 } });
    const models: DiscoveredModel[] = [];

    for await (const model of pager) {
      // Only include generateContent-capable models
      const actions = model.supportedActions ?? [];
      if (!actions.includes("generateContent")) continue;

      // Filter to gemini models only
      const id = model.name?.replace("models/", "") ?? "";
      if (!id.startsWith("gemini")) continue;

      const displayName = model.displayName ?? id;

      // Filter out non-text/non-chat models
      if (isModelBlocked(id, displayName)) continue;

      const description = model.description ?? "";
      const features = inferFeatures(id, description);

      models.push({
        id,
        name: displayName,
        description,
        inputTokenLimit: model.inputTokenLimit,
        outputTokenLimit: model.outputTokenLimit,
        supportedActions: actions,
        features,
      });
    }

    // Sort: newer/larger models first (by input token limit desc, then name)
    models.sort((a, b) => {
      const aTokens = a.inputTokenLimit ?? 0;
      const bTokens = b.inputTokenLimit ?? 0;
      if (bTokens !== aTokens) return bTokens - aTokens;
      return a.name.localeCompare(b.name);
    });

    return Response.json({
      valid: true,
      models,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid API key";
    const isAuthError =
      message.includes("API_KEY_INVALID") ||
      message.includes("401") ||
      message.includes("403") ||
      message.includes("PERMISSION_DENIED");

    return Response.json(
      {
        valid: false,
        error: isAuthError
          ? "API key tidak valid atau tidak memiliki akses."
          : message,
        models: [],
      },
      { status: isAuthError ? 401 : 500 }
    );
  }
}
