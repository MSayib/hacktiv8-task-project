"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Square, Pause, Play, Trash2, Send, Mic } from "lucide-react";
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
  const playbackRafRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isSending, setIsSending] = useState(false);

  // Derived states for clarity
  const isActivelyRecording = isRecording && !isPaused;
  const isStopped = !isRecording && !!audioBlob;
  const showPlayback = (isPaused && !!audioUrl) || isStopped;

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
    if (!analyserNode || !isActivelyRecording) {
      if (!isActivelyRecording) setBars(new Array(BAR_COUNT).fill(4));
      return;
    }

    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);

    const animate = () => {
      analyserNode.getByteFrequencyData(dataArray);
      const step = Math.floor(dataArray.length / BAR_COUNT);
      const newBars: number[] = [];
      for (let i = 0; i < BAR_COUNT; i++) {
        const value = dataArray[i * step] ?? 0;
        newBars.push(Math.max(4, (value / 255) * 32));
      }
      setBars(newBars);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [analyserNode, isActivelyRecording]);

  // Audio element setup for playback (both paused preview and stopped)
  useEffect(() => {
    if (!audioUrl || !showPlayback) return;

    const audio = new Audio();
    audioRef.current = audio;

    const onDurationResolved = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setAudioDuration(audio.duration);
      }
    };

    audio.addEventListener("loadedmetadata", () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setAudioDuration(audio.duration);
      } else {
        // Webm blobs often report Infinity duration initially
        setAudioDuration(duration);
        audio.currentTime = 1e10;
      }
    });

    audio.addEventListener("durationchange", onDurationResolved);

    audio.addEventListener("seeked", () => {
      if (audio.currentTime > 1e9) {
        onDurationResolved();
        audio.currentTime = 0;
      }
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setPlaybackTime(0);
      cancelAnimationFrame(playbackRafRef.current);
    });

    audio.src = audioUrl;
    audio.load();

    return () => {
      cancelAnimationFrame(playbackRafRef.current);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
      setIsPlaying(false);
      setPlaybackTime(0);
    };
  }, [audioUrl, showPlayback, duration]);

  // Smooth playback tracking via requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(playbackRafRef.current);
      return;
    }

    const tick = () => {
      const audio = audioRef.current;
      if (audio && audio.currentTime < 1e9) {
        setPlaybackTime(audio.currentTime);
      }
      playbackRafRef.current = requestAnimationFrame(tick);
    };

    playbackRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(playbackRafRef.current);
  }, [isPlaying]);

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

  const handleResume = useCallback(() => {
    // Stop playback before resuming recording
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setPlaybackTime(0);
    }
    resumeRecording();
  }, [resumeRecording]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = Math.floor(secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleSend = async () => {
    if (!audioBlob || isSending) return;
    setIsSending(true);
    try {
      // If still in recording state (paused), stop first
      if (isRecording) {
        stopRecording();
        // Wait a bit for the final blob to be built
        await new Promise((r) => setTimeout(r, 200));
      }
      const ext = audioBlob.type.includes("webm") ? "webm" : "ogg";
      const attachment = await blobToAttachment(
        audioBlob,
        `recording-${Date.now()}.${ext}`
      );
      onRecordingComplete(attachment);
    } catch {
      toast.error(t("fileError"));
    } finally {
      setIsSending(false);
    }
  };

  const handleDiscard = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
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
          {/* Active recording indicator (pulsing red dot) */}
          {isActivelyRecording && (
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="h-3 w-3 shrink-0 rounded-full bg-red-500"
            />
          )}

          {/* Play/Pause button for playback (paused or stopped) */}
          {showPlayback && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={togglePlayback}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Waveform bars (during active recording) */}
          {isActivelyRecording && (
            <div className="flex flex-1 items-center justify-center gap-[2px] h-10">
              {bars.map((height, i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full bg-red-500/80"
                  animate={{ height }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              ))}
            </div>
          )}

          {/* Playback progress bar (paused or stopped) */}
          {showPlayback && (
            <div className="flex flex-1 items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground min-w-[36px]">
                {formatTime(playbackTime)}
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
                {formatTime(audioDuration || duration)}
              </span>
            </div>
          )}

          {/* Duration counter (during active recording) */}
          {isActivelyRecording && (
            <span className="font-mono text-sm text-muted-foreground min-w-[48px] shrink-0">
              {formatTime(duration)}
            </span>
          )}
        </div>

        {/* Status + Controls */}
        <div className="flex items-center justify-between">
          {/* Status text */}
          <div className="text-xs text-muted-foreground">
            {isActivelyRecording && <span>{t("recording")}</span>}
            {isPaused && <span>{t("recordingPaused")}</span>}
            {isStopped && (
              <span className="text-muted-foreground/70">
                {formatTime(audioDuration || duration)}
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Active recording: Pause + Stop */}
            {isActivelyRecording && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={pauseRecording}
                  title={t("pauseRecording")}
                >
                  <Pause className="h-4 w-4" />
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

            {/* Paused: Resume + Stop + Send */}
            {isPaused && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleResume}
                  title={t("resumeRecording")}
                >
                  <Mic className="h-4 w-4" />
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
                {audioBlob && (
                  <Button
                    size="icon"
                    className="h-9 w-9 gradient-primary text-white rounded-xl hover:opacity-90"
                    onClick={handleSend}
                    disabled={disabled || isSending}
                    title={t("sendRecording")}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}

            {/* Stopped: Send */}
            {isStopped && (
              <Button
                size="icon"
                className="h-9 w-9 gradient-primary text-white rounded-xl hover:opacity-90"
                onClick={handleSend}
                disabled={disabled || isSending}
                title={t("sendRecording")}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}

            {/* Always show discard */}
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
