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
  ],
} as const;

export const ALL_ACCEPTED_MIME_TYPES = [
  ...ACCEPTED_MIME_TYPES.image,
  ...ACCEPTED_MIME_TYPES.document,
  ...ACCEPTED_MIME_TYPES.audio,
];

export const IMAGE_MIME_TYPES = ACCEPTED_MIME_TYPES.image.join(",");
export const DOCUMENT_MIME_TYPES = ACCEPTED_MIME_TYPES.document.join(",");
export const AUDIO_MIME_TYPES = ".mp3,.mpeg,.wav,.ogg,.webm,.aac,.flac,.m4a";

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

async function uploadViaMulter(
  file: File | Blob,
  name: string
): Promise<{ mimeType: string; size: number; data: string }> {
  const formData = new FormData();
  const fileObj = file instanceof File ? file : new File([file], name, { type: file.type });
  formData.append("files", fileObj);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || `Upload failed (${res.status})`);
  }

  const result = await res.json();
  if (!result.files || result.files.length === 0) {
    throw new Error("No file returned from upload");
  }

  return result.files[0];
}

export async function fileToAttachment(file: File): Promise<Attachment> {
  const type = classifyAttachmentType(file.type);
  const limit = FILE_SIZE_LIMITS[type];
  if (file.size > limit) {
    throw new Error(
      `File "${file.name}" exceeds ${formatFileSize(limit)} limit for ${type} files`
    );
  }

  const uploaded = await uploadViaMulter(file, file.name);

  return {
    id: crypto.randomUUID(),
    name: file.name,
    type,
    mimeType: uploaded.mimeType,
    size: uploaded.size,
    data: uploaded.data,
    previewUrl: type === "image" ? URL.createObjectURL(file) : undefined,
  };
}

export async function blobToAttachment(
  blob: Blob,
  name: string
): Promise<Attachment> {
  const uploaded = await uploadViaMulter(blob, name);

  return {
    id: crypto.randomUUID(),
    name,
    type: "audio",
    mimeType: uploaded.mimeType || blob.type || "audio/webm",
    size: uploaded.size,
    data: uploaded.data,
  };
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
