"use client";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/60" />
        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/60" />
        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/60" />
      </div>
    </div>
  );
}
