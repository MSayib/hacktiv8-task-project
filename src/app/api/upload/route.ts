import { NextRequest } from "next/server";
import { parseMultipartRequest } from "@/lib/multer-helper";

export async function POST(req: NextRequest) {
  try {
    const { files } = await parseMultipartRequest(req);

    if (!files || files.length === 0) {
      return Response.json(
        { error: "No files uploaded" },
        { status: 400 }
      );
    }

    const results = files.map((file) => ({
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      data: file.buffer.toString("base64"),
    }));

    return Response.json({ files: results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return Response.json({ error: message }, { status: 500 });
  }
}