import multer from "multer";
import { NextRequest } from "next/server";
import { Readable } from "stream";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max
});

export interface ParsedFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface MulterResult {
  files: ParsedFile[];
  fields: Record<string, string>;
}

/**
 * Parse a multipart/form-data NextRequest using multer.
 * Creates a Readable stream that mimics an Express request object.
 */
export async function parseMultipartRequest(
  req: NextRequest
): Promise<MulterResult> {
  const arrayBuffer = await req.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Create a Readable stream from the buffer and attach request-like properties
  const fakeReq = Object.assign(Readable.from(buffer), {
    headers: Object.fromEntries(req.headers.entries()),
    method: req.method,
    url: req.url,
  });

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fakeRes: any = {
      end: () => {},
      setHeader: () => {},
      status: () => fakeRes,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upload.array("files", 10)(fakeReq as any, fakeRes, (err: unknown) => {
      if (err) {
        reject(err);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const multerFiles = ((fakeReq as any).files || []) as ParsedFile[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = (fakeReq as any).body || {};

      const fields: Record<string, string> = {};
      for (const [key, value] of Object.entries(body)) {
        fields[key] = String(value);
      }

      resolve({ files: multerFiles, fields });
    });
  });
}
