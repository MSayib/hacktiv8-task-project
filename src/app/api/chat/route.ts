import { createGoogleClient, getApiKey } from "@/lib/ai-providers";
import { SYSTEM_INSTRUCTION, AVAILABLE_MODELS } from "@/lib/constants";

interface ChatAttachment {
  name: string;
  mimeType: string;
  data: string;
}

interface ChatRequestBody {
  messages: {
    role: "user" | "model";
    content: string;
    attachments?: ChatAttachment[];
  }[];
  model?: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  customApiKey?: string;
  features?: {
    thinking?: boolean;
    search?: boolean;
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const {
      messages,
      model: modelId = "gemini-2.5-flash",
      temperature,
      topK,
      topP,
      customApiKey,
      features,
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "Messages array is required and must not be empty" },
        { status: 400 }
      );
    }

    const modelDef = AVAILABLE_MODELS.find((m) => m.id === modelId);
    // Allow custom models when using a custom API key, but block non-chat models
    if (!modelDef && !customApiKey) {
      return Response.json(
        { error: `Model "${modelId}" not found` },
        { status: 400 }
      );
    }

    // Anti-hijack: block models that are not suitable for text chat
    const BLOCKED_MODEL_PATTERNS = [
      /nano/i, /\btts\b/i, /\basr\b/i, /image.*gen/i, /imagen/i,
      /embedding/i, /\bveo\b/i, /\blive\b/i, /-tuned-/i,
    ];
    if (customApiKey && BLOCKED_MODEL_PATTERNS.some((p) => p.test(modelId))) {
      return Response.json(
        { error: `Model "${modelId}" tidak didukung untuk chat.` },
        { status: 400 }
      );
    }

    const apiKey = getApiKey(customApiKey);
    if (!apiKey) {
      return Response.json(
        { error: "API key not configured. Set GEMINI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const ai = createGoogleClient(apiKey);

    // Determine features: use explicit client toggles if provided, else auto from model definition
    const supportsThinking = features?.thinking ??
      (modelDef?.features.includes("thinking") || modelDef?.features.includes("deep_think") || false);
    const supportsSearch = features?.search ??
      (modelDef?.features.includes("search") || false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: Record<string, any> = {
      systemInstruction: SYSTEM_INSTRUCTION,
    };

    if (temperature !== undefined) config.temperature = temperature;
    if (topK !== undefined) config.topK = topK;
    if (topP !== undefined) config.topP = topP;

    if (supportsThinking) {
      config.thinkingConfig = { thinkingBudget: 8192 };
    }

    if (supportsSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const contents = messages.map((m) => {
      const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [];

      if (m.content) {
        parts.push({ text: m.content });
      }

      if (m.attachments) {
        for (const att of m.attachments) {
          // Normalize mimeType: strip codec params (e.g. "audio/webm;codecs=opus" -> "audio/webm")
          const mimeType = att.mimeType.split(";")[0].trim();
          parts.push({
            inlineData: {
              mimeType,
              data: att.data,
            },
          });
        }
      }

      if (parts.length === 0) {
        parts.push({ text: "" });
      }

      return { role: m.role, parts };
    });

    const response = await ai.models.generateContentStream({
      model: modelId,
      contents,
      config,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Signal that search is active for search-capable models
          if (supportsSearch) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ searching: true })}\n\n`
              )
            );
          }

          let searchSignalSent = false;

          for await (const chunk of response) {
            if (chunk.candidates?.[0]?.content?.parts) {
              for (const part of chunk.candidates[0].content.parts) {
                // Once we get actual content, search phase is over
                if (!searchSignalSent && supportsSearch) {
                  searchSignalSent = true;
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ searching: false })}\n\n`
                    )
                  );
                }

                if (part.thought) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ text: part.text, thinking: true })}\n\n`
                    )
                  );
                } else if (part.text) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ text: part.text, thinking: false })}\n\n`
                    )
                  );
                }
              }
            }

            // Parse grounding metadata (search sources)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const groundingMetadata = (chunk as any).candidates?.[0]?.groundingMetadata;
            if (groundingMetadata?.groundingChunks) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const sources = groundingMetadata.groundingChunks
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((gc: any) => gc.web)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((gc: any) => ({
                  title: gc.web.title || gc.web.uri,
                  url: gc.web.uri,
                }));

              if (sources.length > 0) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ searchSources: sources })}\n\n`
                  )
                );
              }
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Stream error";

          const isRateLimit =
            message.includes("RESOURCE_EXHAUSTED") ||
            message.includes("429") ||
            message.includes("rate");

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: true,
                message: isRateLimit
                  ? "Rate limit tercapai. Coba model lain atau tunggu sebentar."
                  : message,
                isRateLimit,
              })}\n\n`
            )
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
