import type { Conversation } from "@/types/chat";

function conversationToMarkdown(conversation: Conversation): string {
  const lines: string[] = [];
  lines.push(`# ${conversation.title}`);
  lines.push(`Model: ${conversation.model}`);
  lines.push(`Date: ${new Date(conversation.createdAt).toLocaleString()}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const msg of conversation.messages) {
    const role = msg.role === "user" ? "User" : "KodingBuddy";
    lines.push(`## ${role}`);
    lines.push("");
    if (msg.thinking) {
      lines.push("<details>");
      lines.push("<summary>Thinking...</summary>");
      lines.push("");
      lines.push(msg.thinking);
      lines.push("");
      lines.push("</details>");
      lines.push("");
    }
    lines.push(msg.content);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

function sanitizeFilename(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s\-_]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 50);
}

export function exportAsMarkdown(conversation: Conversation) {
  const md = conversationToMarkdown(conversation);
  const filename = `${sanitizeFilename(conversation.title)}.md`;
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportAllAsZip(conversations: Conversation[]) {
  const JSZip = (await import("jszip")).default;
  const { saveAs } = await import("file-saver");

  const zip = new JSZip();

  for (const conv of conversations) {
    const md = conversationToMarkdown(conv);
    const filename = `${sanitizeFilename(conv.title)}.md`;
    zip.file(filename, md);
  }

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "kodingbuddy-conversations.zip");
}
