"use client";

import { ArrowRight, Compass } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { KIDS_EXPLORATION_STORAGE_KEY, createEmptyKidsExploration, type KidsExplorationV1 } from "@/lib/kids/exploration";
import { SPATIAL_BLOCKS_ACTIVITY_ID } from "@/lib/kids/spatial-blocks";
import {
  getSpatialJourneyIsland,
  getSpatialJourneyResumePoint,
  getSpatialJourneyScene,
  getSpatialJourneyCompletedIslandIds,
  parseSpatialJourneySceneKey,
} from "@/lib/kids/spatial-journey";

import { useKidsAuth } from "./kids-auth-provider";
import { useKidsExplorationRepository } from "./kids-exploration-provider";
import styles from "./kids-exploration-summary.module.css";

function formatRecentTime(timestamp: string): string {
  const value = new Date(timestamp);
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(value);
}

export function KidsExplorationSummary() {
  const { child, status } = useKidsAuth();
  const repository = useKidsExplorationRepository();
  const [exploration, setExploration] = useState<KidsExplorationV1>(createEmptyKidsExploration);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!child) {
      setExploration(createEmptyKidsExploration());
      setUnavailable(false);
      return;
    }
    let active = true;
    const load = () => repository.load(child.id)
      .then((next) => { if (active) { setExploration(next); setUnavailable(false); } })
      .catch(() => { if (active) setUnavailable(true); });
    void load();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === KIDS_EXPLORATION_STORAGE_KEY || event.key === null) void load();
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      active = false;
      window.removeEventListener("storage", handleStorage);
    };
  }, [child, repository]);

  const traces = useMemo(() => exploration.traces
    .filter((trace) => trace.activityId === SPATIAL_BLOCKS_ACTIVITY_ID)
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)), [exploration]);
  const completed = getSpatialJourneyCompletedIslandIds(traces).length;
  const recent = traces[0];

  if (status === "loading" || !child) return null;
  if (unavailable) {
    return <p className={styles.unavailable} role="status">当前浏览器无法读取探索足迹。</p>;
  }
  if (!recent) return null;

  const parsed = parseSpatialJourneySceneKey(recent.challengeId);
  const recentScene = parsed ? getSpatialJourneyScene(parsed.islandId, parsed.sceneId) : undefined;
  const recentIsland = parsed ? getSpatialJourneyIsland(parsed.islandId) : undefined;
  const resume = getSpatialJourneyResumePoint(traces);
  const resumeScene = resume ? getSpatialJourneyScene(resume.islandId, resume.sceneId) : undefined;
  const title = recentScene ? `${recentIsland?.title ?? "自然岛"} · ${recentScene.title}` : "自然岛屿探究";
  const continueHref = resume ? `/kids/spatial-blocks?challenge=${encodeURIComponent(resume.islandId)}&scene=${encodeURIComponent(resume.sceneId)}` : "/kids/spatial-blocks";

  return (
    <section className={styles.summary} aria-labelledby="kids-exploration-summary-title">
      <div className={styles.heading}>
        <span><Compass aria-hidden="true" size={18} />橙子的探索足迹</span>
        <h2 id="kids-exploration-summary-title">最近到过 {title}</h2>
      </div>
      <dl>
        <div><dt>已点亮</dt><dd>{completed} 座岛</dd></div>
        <div><dt>最近一次</dt><dd>{formatRecentTime(recent.updatedAt)}</dd></div>
      </dl>
      <Link href={continueHref}>{resumeScene ? `继续${resumeScene.title}` : "回到群岛"}<ArrowRight aria-hidden="true" size={17} /></Link>
    </section>
  );
}
