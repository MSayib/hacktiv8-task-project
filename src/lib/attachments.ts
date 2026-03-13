import type { Attachment } from "@/types/chat";

export const ACCEPTED_MIME_TYPES = {
  image: [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
  ],
  document: [
    "application/pdf",
    "text/plain",
    "text/csv",
    "text/html",
    "text/css",
    "text/javascript",
    "application/json",
  ],
  audio: [
    "audio/mp3",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/webm",
    "audio/aac",
    "audio/flac",
    "audio/m4a",
    "audio/x-m4a",
    "audio/mp4",
  ],
} as const;

export const ALL_ACCEPTED_MIME_TYPES = [
  ...ACCEPTED_MIME_TYPES.image,
  ...ACCEPTED_MIME_TYPES.document,
  ...ACCEPTED_MIME_TYPES.audio,
];

export const IMAGE_MIME_TYPES = ACCEPTED_MIME_TYPES.image.join(",");
export const DOCUMENT_MIME_TYPES = ACCEPTED_MIME_TYPES.document.join(",");
export const AUDIO_MIME_TYPES = ACCEPTED_MIME_TYPES.audio.join(",");

export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024,    // 10MB - Gemini inline data limit
  document: 15 * 1024 * 1024, // 15MB
  audio: 10 * 1024 * 1024,    // 10MB
} as const;

export const MAX_ATTACHMENTS = 10;

export function classifyAttachmentType(
  mimeType: string
): "image" | "document" | "audio" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  return "document";
}

export function fileToAttachment(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const type = classifyAttachmentType(file.type);
    const limit = FILE_SIZE_LIMITS[type];
    if (file.size > limit) {
      reject(
        new Error(
          `File "${file.name}" exceeds ${formatFileSize(limit)} limit for ${type} files`
        )
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      resolve({
        id: crypto.randomUUID(),
        name: file.name,
        type,
        mimeType: file.type,
        size: file.size,
        data: base64,
        previewUrl: type === "image" ? URL.createObjectURL(file) : undefined,
      });
    };
    reader.onerror = () => reject(new Error(`Failed to read "${file.name}"`));
    reader.readAsDataURL(file);
  });
}

export async function blobToAttachment(
  blob: Blob,
  name: string
): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      resolve({
        id: crypto.randomUUID(),
        name,
        type: "audio",
        mimeType: blob.type || "audio/webm",
        size: blob.size,
        data: base64,
      });
    };
    reader.onerror = () => reject(new Error("Failed to process recording"));
    reader.readAsDataURL(blob);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function isMimeTypeAccepted(mimeType: string): boolean {
  return ALL_ACCEPTED_MIME_TYPES.includes(
    mimeType as (typeof ALL_ACCEPTED_MIME_TYPES)[number]
  );
}
