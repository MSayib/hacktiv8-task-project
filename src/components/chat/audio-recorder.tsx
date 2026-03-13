"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

const BAR_COUNT = 24;

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
    analyserNode,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    discardRecording,
    error,
  } = useAudioRecorder();

  const [bars, setBars] = useState<number[]>(new Array(BAR_COUNT).fill(4));
  const animFrameRef = useRef<number>(0);

  // Audio playback state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

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

  // Waveform animation via AnalyserNode
  useEffect(() => {
    if (!analyserNode || !isRecording) {
      if (!isRecording) setBars(new Array(BAR_COUNT).fill(4));
      return;
    }

    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);

    const animate = () => {
      analyserNode.getByteFrequencyData(dataArray);
      // Sample evenly across the frequency range
      const step = Math.floor(dataArray.length / BAR_COUNT);
      const newBars: number[] = [];
      for (let i = 0; i < BAR_COUNT; i++) {
        const value = dataArray[i * step] ?? 0;
        // Map 0-255 to 4-32 (min height to max height in px)
        newBars.push(Math.max(4, (value / 255) * 32));
      }
      setBars(newBars);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [analyserNode, isRecording]);

  // Pause waveform: freeze the bars when paused
  useEffect(() => {
    if (isPaused) {
      cancelAnimationFrame(animFrameRef.current);
    }
  }, [isPaused]);

  // Audio element setup for playback
  useEffect(() => {
    if (audioUrl && !isRecording) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.addEventListener("loadedmetadata", () => {
        // Handle infinity duration (common with webm blobs)
        if (isFinite(audio.duration)) {
          setAudioDuration(audio.duration);
        } else {
          setAudioDuration(duration);
        }
      });

      audio.addEventListener("timeupdate", () => {
        setPlaybackTime(audio.currentTime);
      });

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setPlaybackTime(0);
      });

      // For webm blobs that report Infinity duration, try to resolve
      audio.addEventListener("durationchange", () => {
        if (isFinite(audio.duration)) {
          setAudioDuration(audio.duration);
        }
      });

      return () => {
        audio.pause();
        audio.src = "";
        audioRef.current = null;
      };
    }
  }, [audioUrl, isRecording, duration]);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isPlaying]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setPlaybackTime(time);
  }, []);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(secs % 60)
      .toString()
      .padStart(2, "0");
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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    discardRecording();
    onCancel();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="flex flex-col gap-3 rounded-2xl border bg-background p-3 shadow-sm"
      >
        {/* Waveform / Playback area */}
        <div className="flex items-center gap-3">
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={togglePlayback}
              title={isPlaying ? t("pauseRecording") : t("resumeRecording")}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Waveform bars (during recording) */}
          {isRecording && (
            <div className="flex flex-1 items-center justify-center gap-[2px] h-10">
              {bars.map((height, i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full bg-red-500/80"
                  animate={{ height: isPaused ? 4 : height }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              ))}
            </div>
          )}

          {/* Playback progress (after stop) */}
          {!isRecording && audioBlob && (
            <div className="flex flex-1 items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground min-w-[36px]">
                {formatDuration(playbackTime)}
              </span>
              <input
                type="range"
                min={0}
                max={audioDuration || duration || 1}
                step={0.1}
                value={playbackTime}
                onChange={handleSeek}
                className="audio-seek-bar flex-1 h-1.5 appearance-none rounded-full bg-muted cursor-pointer accent-primary"
              />
              <span className="font-mono text-xs text-muted-foreground min-w-[36px]">
                {formatDuration(audioDuration || duration)}
              </span>
            </div>
          )}

          {/* Duration (during recording) */}
          {isRecording && (
            <span className="font-mono text-sm text-muted-foreground min-w-[48px] shrink-0">
              {formatDuration(duration)}
            </span>
          )}
        </div>

        {/* Status + Controls */}
        <div className="flex items-center justify-between">
          {/* Status text */}
          <div className="text-xs text-muted-foreground">
            {isRecording && (
              <span>{isPaused ? t("recordingPaused") : t("recording")}</span>
            )}
            {!isRecording && audioBlob && (
              <span className="text-muted-foreground/70">
                {formatDuration(audioDuration || duration)}
              </span>
            )}
          </div>

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
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
