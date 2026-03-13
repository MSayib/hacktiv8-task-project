import { createGoogleClient, getApiKey } from "@/lib/ai-providers";
import { SYSTEM_INSTRUCTION, AVAILABLE_MODELS } from "@/lib/constants";

interface ChatRequestBody {
  messages: { role: "user" | "model"; content: string }[];
  model?: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  customApiKey?: string;
  provider?: "google" | "openrouter" | "openai" | "anthropic";
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
      provider = "google",
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "Messages array is required and must not be empty" },
        { status: 400 }
      );
    }

    const modelDef = AVAILABLE_MODELS.find((m) => m.id === modelId);
    if (!modelDef) {
      return Response.json(
        { error: `Model "${modelId}" not found` },
        { status: 400 }
      );
    }

    const apiKey = getApiKey(provider, customApiKey);
    if (!apiKey) {
      return Response.json(
        { error: "API key not configured. Set GEMINI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const ai = createGoogleClient(apiKey);

    const supportsThinking = modelDef.features.includes("thinking") || modelDef.features.includes("deep_think");

    const config: Record<string, unknown> = {
      systemInstruction: SYSTEM_INSTRUCTION,
    };

    if (temperature !== undefined) config.temperature = temperature;
    if (topK !== undefined) config.topK = topK;
    if (topP !== undefined) config.topP = topP;

    if (supportsThinking) {
      config.thinkingConfig = { thinkingBudget: 8192 };
    }

    const contents = messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContentStream({
      model: modelId,
      contents,
      config,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            if (chunk.candidates?.[0]?.content?.parts) {
              for (const part of chunk.candidates[0].content.parts) {
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
