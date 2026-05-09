"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Synchronizes a master audio element with an optional secondary video element.
 * The audio element is always the timing source of truth.
 * The video element is muted and kept aligned with audio currentTime.
 */
export function useAudioSync(
  audioRef: React.RefObject<HTMLAudioElement>,
  videoRef?: React.RefObject<HTMLVideoElement>
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [duration, setDuration] = useState(0);
  const rafRef = useRef<number | null>(null);
  const DRIFT_THRESHOLD_SEC = 0.15;

  const syncVideo = useCallback(() => {
    const audio = audioRef.current;
    const video = videoRef?.current;
    if (!audio || !video) return;
    const drift = Math.abs(audio.currentTime - video.currentTime);
    if (drift > DRIFT_THRESHOLD_SEC) {
      video.currentTime = audio.currentTime;
    }
  }, [audioRef, videoRef]);

  const tick = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentMs(Math.round(audio.currentTime * 1000));
    syncVideo();
    rafRef.current = requestAnimationFrame(tick);
  }, [audioRef, syncVideo]);

  const startTick = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stopTick = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => { setIsPlaying(true); startTick(); videoRef?.current?.play().catch(() => {}); };
    const onPause = () => { setIsPlaying(false); stopTick(); videoRef?.current?.pause(); };
    const onEnded = () => { setIsPlaying(false); stopTick(); };
    const onLoaded = () => setDuration(Math.round(audio.duration * 1000));
    const onSeeked = () => setCurrentMs(Math.round(audio.currentTime * 1000));

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("seeked", onSeeked);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("seeked", onSeeked);
      stopTick();
    };
  }, [audioRef, videoRef, startTick, stopTick]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [audioRef]);

  const seek = useCallback((ms: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const clampedSec = Math.max(0, Math.min(ms / 1000, audio.duration || 0));
    audio.currentTime = clampedSec;
    if (videoRef?.current) videoRef.current.currentTime = clampedSec;
    setCurrentMs(Math.round(clampedSec * 1000));
  }, [audioRef, videoRef]);

  return { isPlaying, currentMs, duration, toggle, seek };
}
