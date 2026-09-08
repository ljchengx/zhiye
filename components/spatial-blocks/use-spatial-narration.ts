"use client";
import type { SpatialNarrationDefinition } from "@/lib/kids/spatial-journey";
import { useCallback, useEffect, useRef, useState } from "react";

export function useSpatialNarration(clip: SpatialNarrationDefinition | undefined, enabled: boolean) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [soundEnabled, setSound] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [replay, setReplay] = useState(0);
  useEffect(() => { try { setSound(localStorage.getItem("yicheng-kids:spatial-sound:v1") !== "off"); } catch { /* Subtitles remain available. */ } }, []);
  useEffect(() => {
    const audio = audioRef.current;
    setPlaying(false);
    if (!audio || !clip || !enabled || !soundEnabled) { audio?.pause(); return; }
    const onPlay = () => setPlaying(true);
    const onStop = () => setPlaying(false);
    audio.addEventListener("playing", onPlay);
    audio.addEventListener("ended", onStop);
    audio.addEventListener("error", onStop);
    audio.addEventListener("pause", onStop);
    const visibility = () => { if (document.hidden) audio.pause(); };
    document.addEventListener("visibilitychange", visibility);
    audio.currentTime = 0;
    void audio.play().catch(onStop);
    return () => {
      audio.pause();
      audio.removeEventListener("playing", onPlay); audio.removeEventListener("ended", onStop);
      audio.removeEventListener("error", onStop); audio.removeEventListener("pause", onStop);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [clip?.audioSrc, enabled, soundEnabled, replay]);
  const toggleSound = useCallback(() => setSound((old) => {
    const value = !old;
    try { localStorage.setItem("yicheng-kids:spatial-sound:v1", value ? "on" : "off"); } catch { /* Device preference is optional. */ }
    return value;
  }), []);
  return { audioRef, soundEnabled, toggleSound, playing, replay: () => setReplay((n) => n + 1) };
}

export function useSpatialIdleHint(active: boolean, paused: boolean, onHint: () => void, sceneKey?: string, activityKey?: string) {
  const callback = useRef(onHint);
  callback.current = onHint;
  const pauseRef = useRef(paused);
  pauseRef.current = paused;
  useEffect(() => {
    if (!active) return;
    let elapsed = 0;
    let notified = false;
    let previous = performance.now();
    const visibility = () => { previous = performance.now(); };
    document.addEventListener("visibilitychange", visibility);
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = now - previous;
      previous = now;
      if (document.hidden || pauseRef.current || notified) return;
      elapsed += delta;
      if (elapsed >= 45000) { notified = true; callback.current(); }
    }, 1000);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", visibility); };
  }, [active, sceneKey, activityKey]);
}
