"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { Body, Engine as MatterEngine } from "matter-js";

import { toolDefinitions, type ToolSlug } from "@/lib/tools/registry";

import { ToolIcon } from "./tool-icon";

interface PhysicsScene {
  bodies: Map<ToolSlug, Body>;
  engine: MatterEngine;
}

interface DragState {
  body: Body;
  pointerId: number;
  startX: number;
  startY: number;
  dragged: boolean;
}

interface SceneLayout {
  id: string;
  positions: readonly { x: number; y: number; angle: number; spin: number }[];
}

const SCENE_LAYOUTS: readonly SceneLayout[] = [
  {
    id: "center-stack",
    positions: [
      { x: 0.36, y: 28, angle: -0.05, spin: 0.001 },
      { x: 0.48, y: -44, angle: 0.03, spin: -0.002 },
      { x: 0.59, y: -116, angle: 0.08, spin: 0.003 },
      { x: 0.42, y: -188, angle: -0.04, spin: -0.004 },
      { x: 0.55, y: -260, angle: 0.06, spin: 0.005 },
      { x: 0.68, y: -332, angle: -0.03, spin: -0.003 },
    ],
  },
  {
    id: "twin-towers",
    positions: [
      { x: 0.28, y: -40, angle: -0.08, spin: -0.003 },
      { x: 0.72, y: -20, angle: 0.07, spin: 0.003 },
      { x: 0.31, y: -170, angle: 0.04, spin: 0.002 },
      { x: 0.69, y: -150, angle: -0.05, spin: -0.002 },
      { x: 0.5, y: -310, angle: 0.1, spin: 0.005 },
      { x: 0.5, y: -400, angle: -0.04, spin: -0.004 },
    ],
  },
  {
    id: "cross-fall",
    positions: [
      { x: 0.2, y: -80, angle: 0.14, spin: 0.006 },
      { x: 0.8, y: -80, angle: -0.14, spin: -0.006 },
      { x: 0.38, y: -230, angle: -0.08, spin: -0.003 },
      { x: 0.62, y: -230, angle: 0.08, spin: 0.003 },
      { x: 0.5, y: -390, angle: 0, spin: 0.004 },
      { x: 0.5, y: -490, angle: 0.05, spin: -0.003 },
    ],
  },
  {
    id: "stair-step",
    positions: [
      { x: 0.22, y: 20, angle: -0.04, spin: -0.002 },
      { x: 0.36, y: -85, angle: 0.05, spin: 0.002 },
      { x: 0.5, y: -190, angle: -0.06, spin: -0.003 },
      { x: 0.64, y: -295, angle: 0.07, spin: 0.003 },
      { x: 0.78, y: -400, angle: -0.08, spin: -0.004 },
      { x: 0.88, y: -500, angle: 0.06, spin: 0.003 },
    ],
  },
  {
    id: "wide-scatter",
    positions: [
      { x: 0.16, y: -180, angle: 0.12, spin: 0.006 },
      { x: 0.34, y: -30, angle: -0.1, spin: -0.004 },
      { x: 0.5, y: -300, angle: 0.04, spin: 0.003 },
      { x: 0.67, y: -70, angle: 0.1, spin: 0.004 },
      { x: 0.84, y: -210, angle: -0.12, spin: -0.006 },
      { x: 0.54, y: -420, angle: 0.05, spin: 0.003 },
    ],
  },
] as const;

const STATIC_POSITIONS = [
  { left: "12%", top: "24%", rotate: "-3deg" },
  { left: "48%", top: "18%", rotate: "2deg" },
  { left: "72%", top: "42%", rotate: "-2deg" },
  { left: "28%", top: "58%", rotate: "3deg" },
  { left: "56%", top: "68%", rotate: "-1deg" },
  { left: "82%", top: "28%", rotate: "2deg" },
] as const;

export function HomePhysicsLab({ placement = "section" }: { placement?: "hero" | "section" }) {
  const reducedMotion = useReducedMotion() ?? false;
  const stageRef = useRef<HTMLDivElement>(null);
  const entityRefs = useRef(new Map<ToolSlug, HTMLAnchorElement>());
  const sceneRef = useRef<PhysicsScene | null>(null);
  const matterRef = useRef<typeof import("matter-js") | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef<ToolSlug | null>(null);
  const visibleRef = useRef(false);
  const documentVisibleRef = useRef(true);
  const animationFrameRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const layoutIndexRef = useRef(0);
  const [sceneVersion, setSceneVersion] = useState(0);
  const [physicsReady, setPhysicsReady] = useState(false);

  const buildScene = useCallback(() => {
    const Matter = matterRef.current;
    const stage = stageRef.current;
    if (!Matter || !stage || reducedMotion) {
      return;
    }

    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (width === 0 || height === 0) {
      return;
    }

    const compact = width < 680;
    const entityWidth = compact ? 132 : 184;
    const entityHeight = compact ? 56 : 66;
    const wallSize = 80;
    const layout = SCENE_LAYOUTS[layoutIndexRef.current];
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: compact ? 0.62 : 0.78, scale: 0.001 },
      enableSleeping: true,
    });
    const bodies = new Map<ToolSlug, Body>();

    toolDefinitions.forEach((tool, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const placement = layout.positions[index];
      const x = compact
        ? width * Math.max(0.24, Math.min(0.76, placement.x))
        : width * placement.x;
      const y = compact ? placement.y * 0.58 + row * 18 : placement.y;
      const body = Matter.Bodies.rectangle(x, y, entityWidth, entityHeight, {
        angle: placement.angle,
        chamfer: { radius: 6 },
        density: 0.0014,
        friction: 0.42,
        frictionAir: 0.018,
        restitution: 0.28,
        sleepThreshold: 80,
        label: tool.slug,
      });
      Matter.Body.setAngularVelocity(body, placement.spin);
      bodies.set(tool.slug, body);
    });

    const boundaries = [
      Matter.Bodies.rectangle(width / 2, height + wallSize / 2 - 4, width + wallSize * 2, wallSize, { isStatic: true }),
      Matter.Bodies.rectangle(-wallSize / 2 + 4, height / 2, wallSize, height * 2, { isStatic: true }),
      Matter.Bodies.rectangle(width + wallSize / 2 - 4, height / 2, wallSize, height * 2, { isStatic: true }),
    ];

    Matter.Composite.add(engine.world, [...bodies.values(), ...boundaries]);
    sceneRef.current = { bodies, engine };
    setPhysicsReady(true);
  }, [reducedMotion]);

  const resetScene = useCallback(() => {
    const Matter = matterRef.current;
    if (sceneRef.current && Matter) {
      Matter.Engine.clear(sceneRef.current.engine);
      Matter.Composite.clear(sceneRef.current.engine.world, false, true);
    }
    sceneRef.current = null;
    dragRef.current = null;
    suppressClickRef.current = null;
    setPhysicsReady(false);
    buildScene();
    setSceneVersion((version) => version + 1);
  }, [buildScene]);

  const randomizeScene = useCallback(() => {
    const current = layoutIndexRef.current;
    const candidate = Math.floor(Math.random() * (SCENE_LAYOUTS.length - 1));
    layoutIndexRef.current = candidate >= current ? candidate + 1 : candidate;
    resetScene();
  }, [resetScene]);

  useEffect(() => {
    if (reducedMotion) {
      setPhysicsReady(false);
      return;
    }

    let cancelled = false;
    import("matter-js").then((Matter) => {
      if (cancelled) {
        return;
      }
      matterRef.current = Matter;
      buildScene();
    });

    return () => {
      cancelled = true;
      const Matter = matterRef.current;
      if (sceneRef.current && Matter) {
        Matter.Engine.clear(sceneRef.current.engine);
        Matter.Composite.clear(sceneRef.current.engine.world, false, true);
      }
      sceneRef.current = null;
      matterRef.current = null;
    };
  }, [buildScene, reducedMotion]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || reducedMotion) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      previousTimeRef.current = null;
    }, { threshold: 0.08 });
    observer.observe(stage);

    const handleVisibility = () => {
      documentVisibleRef.current = document.visibilityState === "visible";
      previousTimeRef.current = null;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const animate = (time: number) => {
      const Matter = matterRef.current;
      const scene = sceneRef.current;
      if (Matter && scene && visibleRef.current && documentVisibleRef.current) {
        const previous = previousTimeRef.current ?? time - 1000 / 60;
        const delta = Math.min(time - previous, 1000 / 30);
        Matter.Engine.update(scene.engine, delta);

        scene.bodies.forEach((body, slug) => {
          const element = entityRefs.current.get(slug);
          if (element) {
            element.style.transform = `translate3d(${body.position.x}px, ${body.position.y}px, 0) translate(-50%, -50%) rotate(${body.angle}rad)`;
          }
        });
        previousTimeRef.current = time;
      }
      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [reducedMotion, sceneVersion]);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    let resizeTimer: number | null = null;
    const observer = new ResizeObserver(() => {
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      resizeTimer = window.setTimeout(resetScene, 180);
    });
    observer.observe(stage);

    return () => {
      observer.disconnect();
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
    };
  }, [reducedMotion, resetScene]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLAnchorElement>, slug: ToolSlug) => {
    const Matter = matterRef.current;
    const body = sceneRef.current?.bodies.get(slug);
    if (!Matter || !body || reducedMotion) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    Matter.Sleeping.set(body, false);
    Matter.Body.setVelocity(body, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(body, 0);
    Matter.Body.setStatic(body, true);
    dragRef.current = {
      body,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dragged: false,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    const Matter = matterRef.current;
    const stage = stageRef.current;
    const drag = dragRef.current;
    if (!Matter || !stage || !drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const bounds = stage.getBoundingClientRect();
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    drag.dragged ||= distance > 6;
    Matter.Body.setPosition(drag.body, {
      x: Math.max(32, Math.min(bounds.width - 32, event.clientX - bounds.left)),
      y: Math.max(28, Math.min(bounds.height - 28, event.clientY - bounds.top)),
    });
  };

  const releaseBody = (event: ReactPointerEvent<HTMLAnchorElement>, slug: ToolSlug) => {
    const Matter = matterRef.current;
    const drag = dragRef.current;
    if (!Matter || !drag || drag.pointerId !== event.pointerId) {
      return;
    }

    Matter.Body.setStatic(drag.body, false);
    Matter.Sleeping.set(drag.body, false);
    if (drag.dragged) {
      suppressClickRef.current = slug;
    }
    dragRef.current = null;
  };

  return (
    <section className={`zhiye-physics-lab zhiye-physics-lab--${placement}`} aria-labelledby="physics-lab-title">
      {placement === "section" ? (
        <header className="zhiye-physics-lab__header">
          <div>
            <p>知页实验台</p>
            <h2 id="physics-lab-title">让零散任务，找到自己的位置。</h2>
          </div>
          {!reducedMotion ? (
            <button type="button" onClick={randomizeScene} aria-label="重置实验台" title="重置实验台">
              <RotateCcw aria-hidden="true" size={18} strokeWidth={1.7} />
            </button>
          ) : null}
        </header>
      ) : (
        <h2 className="sr-only" id="physics-lab-title">知页工具实验台</h2>
      )}

      <div
        ref={stageRef}
        className={`zhiye-physics-lab__stage ${physicsReady ? "is-ready" : "is-static"}`}
        aria-label="可拖拽的知页工具"
        data-layout={SCENE_LAYOUTS[layoutIndexRef.current].id}
      >
        {placement === "hero" && !reducedMotion ? (
          <button className="zhiye-physics-lab__reset" type="button" onClick={randomizeScene} aria-label="重置实验台" title="重置实验台">
            <RotateCcw aria-hidden="true" size={17} strokeWidth={1.7} />
          </button>
        ) : null}
        <div className="zhiye-physics-lab__baseline" aria-hidden="true" />
        {toolDefinitions.map((tool, index) => {
          const staticPosition = STATIC_POSITIONS[index];
          const style = {
            "--static-left": staticPosition.left,
            "--static-top": staticPosition.top,
            "--static-rotate": staticPosition.rotate,
          } as CSSProperties;

          return (
            <Link
              key={tool.slug}
              ref={(element) => {
                if (element) {
                  entityRefs.current.set(tool.slug, element);
                } else {
                  entityRefs.current.delete(tool.slug);
                }
              }}
              href={`/${tool.path}`}
              className={`zhiye-physics-entity zhiye-physics-entity--${tool.accent}`}
              style={style}
              draggable={false}
              aria-label={`打开${tool.title}`}
              onPointerDown={(event) => handlePointerDown(event, tool.slug)}
              onPointerMove={handlePointerMove}
              onPointerUp={(event) => releaseBody(event, tool.slug)}
              onPointerCancel={(event) => releaseBody(event, tool.slug)}
              onClick={(event) => {
                if (suppressClickRef.current === tool.slug) {
                  event.preventDefault();
                  suppressClickRef.current = null;
                }
              }}
            >
              <span><ToolIcon name={tool.icon} size={20} strokeWidth={1.55} /></span>
              <strong>{tool.shortTitle}</strong>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
