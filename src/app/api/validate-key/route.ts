import { GoogleGenAI } from "@google/genai";

interface DiscoveredModel {
  id: string;
  name: string;
  description: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedActions: string[];
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
    const pager = await ai.models.list({ config: { pageSize: 50 } });
    const models: DiscoveredModel[] = [];

    for await (const model of pager) {
      // Only include generateContent-capable models
      const actions = model.supportedActions ?? [];
      if (!actions.includes("generateContent")) continue;

      // Filter to gemini models only
      const id = model.name?.replace("models/", "") ?? "";
      if (!id.startsWith("gemini")) continue;

      models.push({
        id,
        name: model.displayName ?? id,
        description: model.description ?? "",
        inputTokenLimit: model.inputTokenLimit,
        outputTokenLimit: model.outputTokenLimit,
        supportedActions: actions,
      });
    }

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
