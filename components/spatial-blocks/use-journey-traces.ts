"use client";
import { useKidsExplorationRepository } from "@/components/kids-exploration-provider";
import { clearKidsExploration, createEmptyKidsExploration, recordKidsExploration } from "@/lib/kids/exploration";
import { SPATIAL_BLOCKS_ACTIVITY_ID } from "@/lib/kids/spatial-blocks";
import { useCallback, useEffect, useRef, useState } from "react";

export function useJourneyTraces(childId: string | undefined, loading: boolean) {
  const repository = useKidsExplorationRepository();
  const [exploration, setExploration] = useState(createEmptyKidsExploration);
  const [explorationReady, setReady] = useState(false);
  const [storageMessage, setStorageMessage] = useState("");
  const identity = useRef(childId);
  identity.current = childId;
  const queue = useRef(Promise.resolve());
  useEffect(() => {
    setReady(false); setExploration(createEmptyKidsExploration()); setStorageMessage("");
    if (loading) return;
    if (!childId) { setReady(true); return; }
    let active = true;
    repository.load(childId).then((value) => { if (active) setExploration(value); })
      .catch(() => { if (active) setStorageMessage("当前浏览器无法保存探索足迹，本次仍可继续探究。"); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [childId, loading, repository]);
  const saveEvent = useCallback((challengeId: string, status: "started" | "completed") => {
    if (!childId) return Promise.resolve();
    const event = { childId, activityId: SPATIAL_BLOCKS_ACTIVITY_ID, challengeId, status, updatedAt: new Date().toISOString() };
    // Session state remains usable when storage fails; persistence failure stays visible.
    setExploration((value) => recordKidsExploration(value, event));
    queue.current = queue.current.then(async () => {
      try { await repository.record(event); if (identity.current === childId) setStorageMessage(""); }
      catch { if (identity.current === childId) setStorageMessage("当前浏览器无法保存探索足迹，本次仍可继续探究。"); }
    });
    return queue.current;
  }, [childId, repository]);
  const clearTraces = useCallback(async () => {
    if (!childId) return;
    await queue.current;
    await repository.clear(childId, SPATIAL_BLOCKS_ACTIVITY_ID);
    if (identity.current === childId) { setExploration((value) => clearKidsExploration(value, childId, SPATIAL_BLOCKS_ACTIVITY_ID)); setStorageMessage(""); }
  }, [childId, repository]);
  return { exploration, explorationReady, storageMessage, setStorageMessage, saveEvent, clearTraces };
}
