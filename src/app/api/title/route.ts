import { createGoogleClient, getApiKey } from "@/lib/ai-providers";

interface TitleRequestBody {
  userMessage: string;
  assistantMessage: string;
  customApiKey?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TitleRequestBody;
    const { userMessage, assistantMessage, customApiKey } = body;

    if (!userMessage) {
      return Response.json({ error: "userMessage is required" }, { status: 400 });
    }

    const apiKey = getApiKey(customApiKey);
    if (!apiKey) {
      return Response.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const ai = createGoogleClient(apiKey);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Buatkan judul percakapan singkat (maksimal 6 kata) dalam bahasa yang sama dengan pesan user. Judul harus menggambarkan topik utama percakapan. Jawab HANYA dengan judul, tanpa tanda kutip, tanpa penjelasan.

Pesan user: ${userMessage.slice(0, 500)}
${assistantMessage ? `Respons assistant: ${assistantMessage.slice(0, 300)}` : ""}`,
            },
          ],
        },
      ],
      config: {
        temperature: 0.3,
        maxOutputTokens: 30,
      },
    });

    const title = response.text?.trim().replace(/^["']|["']$/g, "") || "";

    return Response.json({ title });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate title";
    return Response.json({ error: message }, { status: 500 });
  }
}
