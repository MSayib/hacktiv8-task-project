export interface SearchSource {
  title: string;
  url: string;
}

export interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  thinking?: string;
  isStreaming?: boolean;
  isThinking?: boolean;
  isSearching?: boolean;
  searchSources?: SearchSource[];
  liked?: boolean | null;
  attachments?: Attachment[];
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: "image" | "document" | "audio";
  mimeType: string;
  size: number;
  data: string; // base64
  previewUrl?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: string;
  updatedAt: string;
}
