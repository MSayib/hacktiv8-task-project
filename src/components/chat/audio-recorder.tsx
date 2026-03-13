"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Pause, Play, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { blobToAttachment } from "@/lib/attachments";
import type { Attachment } from "@/types/chat";

interface AudioRecorderProps {
  onRecordingComplete: (attachment: Attachment) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function AudioRecorder({
  onRecordingComplete,
  onCancel,
  disabled,
}: AudioRecorderProps) {
  const t = useTranslations("chat");
  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    discardRecording,
    error,
  } = useAudioRecorder();

  // Auto-start recording when component mounts
  useEffect(() => {
    startRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(t("micPermissionDenied"));
      onCancel();
    }
  }, [error, t, onCancel]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    try {
      const ext = audioBlob.type.includes("webm") ? "webm" : "ogg";
      const attachment = await blobToAttachment(
        audioBlob,
        `recording-${Date.now()}.${ext}`
      );
      onRecordingComplete(attachment);
    } catch {
      toast.error(t("fileError"));
    }
  };

  const handleDiscard = () => {
    discardRecording();
    onCancel();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="flex items-center gap-3 rounded-2xl border bg-background p-3 shadow-sm"
      >
        {/* Recording indicator */}
        {isRecording && (
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="h-3 w-3 shrink-0 rounded-full bg-red-500"
          />
        )}

        {/* Stopped indicator */}
        {!isRecording && audioBlob && (
          <Mic className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        {/* Duration */}
        <span className="font-mono text-sm text-muted-foreground min-w-[48px]">
          {formatDuration(duration)}
        </span>

        {/* Status text */}
        {isRecording && (
          <span className="text-xs text-muted-foreground">
            {isPaused ? t("recordingPaused") : t("recording")}
          </span>
        )}

        {/* Audio preview (after stop) */}
        {audioUrl && !isRecording && (
          <audio src={audioUrl} controls className="h-8 flex-1 max-w-[200px]" />
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Controls */}
        <div className="flex items-center gap-1">
          {isRecording && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={isPaused ? resumeRecording : pauseRecording}
                title={isPaused ? t("resumeRecording") : t("pauseRecording")}
              >
                {isPaused ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={stopRecording}
                title={t("stopRecording")}
              >
                <Square className="h-4 w-4" />
              </Button>
            </>
          )}
          {audioBlob && !isRecording && (
            <Button
              size="icon"
              className="h-9 w-9 gradient-primary text-white rounded-xl hover:opacity-90"
              onClick={handleSend}
              disabled={disabled}
              title={t("sendRecording")}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={handleDiscard}
            title={t("discardRecording")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
