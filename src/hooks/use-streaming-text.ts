"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Progressive text reveal for streaming messages.
 * Reveals characters at a speed proportional to content length:
 * - Short (<200 chars): ~30ms/char (slower, 70% speed)
 * - Long (>500 chars): ~12ms/char (faster, 90% speed)
 * - Medium: interpolated between the two
 * When streaming ends, immediately shows all remaining content.
 */
export function useStreamingText(
  fullContent: string,
  isStreaming: boolean
): string {
  const [displayedLength, setDisplayedLength] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevContentRef = useRef("");

  useEffect(() => {
    // If not streaming, show everything immediately
    if (!isStreaming) {
      setDisplayedLength(fullContent.length);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Content was reset (new message), reset display
    if (fullContent.length < prevContentRef.current.length) {
      setDisplayedLength(0);
    }
    prevContentRef.current = fullContent;

    // Already caught up
    if (displayedLength >= fullContent.length) return;

    // Calculate speed based on total content so far
    const len = fullContent.length;
    let msPerChar: number;
    if (len < 200) {
      msPerChar = 30; // slow for short outputs
    } else if (len > 500) {
      msPerChar = 12; // fast for long outputs
    } else {
      // Interpolate: 200->30ms, 500->12ms
      const t = (len - 200) / 300;
      msPerChar = 30 - t * 18;
    }

    // Reveal multiple chars per tick if we're far behind
    const charsRemaining = fullContent.length - displayedLength;
    const charsPerTick = charsRemaining > 50 ? Math.ceil(charsRemaining * 0.15) : 1;

    timerRef.current = setTimeout(() => {
      setDisplayedLength((prev) => Math.min(prev + charsPerTick, fullContent.length));
    }, msPerChar);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [fullContent, isStreaming, displayedLength]);

  // Return the progressively revealed text
  return fullContent.slice(0, displayedLength);
}
