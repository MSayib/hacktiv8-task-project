"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  analyserNode: AnalyserNode | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  discardRecording: () => void;
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mimeTypeRef = useRef<string>("audio/webm");

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
  }, [clearTimer]);

  const cleanupAudioContext = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    setAnalyserNode(null);
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const revokeUrl = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  // Build a playable blob from all collected chunks
  const buildBlobFromChunks = useCallback(() => {
    if (chunksRef.current.length === 0) return null;
    return new Blob(chunksRef.current, { type: mimeTypeRef.current });
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up Web Audio API for waveform visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      analyserRef.current = analyser;
      setAnalyserNode(analyser);

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
          ? "audio/ogg;codecs=opus"
          : "audio/webm";

      mimeTypeRef.current = mimeType;

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      setAudioBlob(null);
      setAudioUrl(null);
      setError(null);

      startTimer();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Microphone access denied"
      );
    }
  }, [startTimer]);

  const stopRecording = useCallback(() => {
    clearTimer();
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setIsRecording(false);
      setIsPaused(false);
      return;
    }

    // Replace onstop to build the final blob
    recorder.onstop = () => {
      const blob = buildBlobFromChunks();
      if (blob && blob.size > 0) {
        setAudioBlob(blob);
        setAudioUrl((prev) => {
          revokeUrl(prev);
          return URL.createObjectURL(blob);
        });
      }
      stopStream();
      cleanupAudioContext();
    };

    recorder.stop();
    setIsRecording(false);
    setIsPaused(false);
  }, [clearTimer, buildBlobFromChunks, stopStream, cleanupAudioContext, revokeUrl]);

  const pauseRecording = useCallback(() => {
    clearTimer();
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;

    // Request current data to flush chunks, then pause
    recorder.requestData();
    recorder.pause();
    setIsPaused(true);

    // Build temp blob for playback after a short delay for ondataavailable to fire
    setTimeout(() => {
      const blob = buildBlobFromChunks();
      if (blob && blob.size > 0) {
        setAudioBlob(blob);
        setAudioUrl((prev) => {
          revokeUrl(prev);
          return URL.createObjectURL(blob);
        });
      }
    }, 150);
  }, [clearTimer, buildBlobFromChunks, revokeUrl]);

  const resumeRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "paused") return;

    // Clear the preview blob/url so UI switches back to recording view
    setAudioBlob(null);
    setAudioUrl((prev) => {
      revokeUrl(prev);
      return null;
    });

    recorder.resume();
    setIsPaused(false);
    startTimer();
  }, [startTimer, revokeUrl]);

  const discardRecording = useCallback(() => {
    clearTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder) {
      // Prevent onstop from creating a blob
      recorder.onstop = null;
      recorder.ondataavailable = null;
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    stopStream();
    cleanupAudioContext();
    setAudioUrl((prev) => {
      revokeUrl(prev);
      return null;
    });
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    setAudioBlob(null);
  }, [clearTimer, cleanupAudioContext, stopStream, revokeUrl]);

  useEffect(() => {
    return () => {
      clearTimer();
      stopStream();
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [clearTimer, stopStream]);

  return {
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
  };
}
