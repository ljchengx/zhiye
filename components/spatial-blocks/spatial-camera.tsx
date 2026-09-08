"use client";
import type { SpatialChallengeDefinition } from "@/lib/kids/spatial-blocks";
import type { SpatialViewAxis } from "@/lib/kids/spatial-journey";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { PerspectiveCamera, Vector3 } from "three";

export function SpatialCamera({ view, challenge, viewAxis, resetToken, reducedMotion, bookExpanded, onObservedAxis }: {
  view: string; challenge?: SpatialChallengeDefinition; viewAxis?: SpatialViewAxis; resetToken: number; reducedMotion: boolean;
  bookExpanded: boolean; onObservedAxis: (axis: SpatialViewAxis) => void;
}) {
  const { camera, size, controls } = useThree();
  const destination = useRef(new Vector3());
  const moving = useRef(false);
  const reported = useRef<SpatialViewAxis | undefined>(undefined);
  const narrow = size.width < 600;
  useEffect(() => {
    const scale = narrow ? view === "map" ? 1.5 : bookExpanded ? 1.3 : 1.12 : 1;
    const vectors = { front: [0, 1.5, 12], side: [-12, 1.5, 0], top: [0, 14, .01] };
    const position = challenge && viewAxis ? vectors[viewAxis] : view === "map" ? [11, 9, 14] : [9, 8, 9];
    destination.current.set(position[0] * scale, position[1] * scale, position[2] * scale);
    if (camera instanceof PerspectiveCamera) camera.fov = narrow ? 46 : 42;
    camera.updateProjectionMatrix();
    moving.current = true; reported.current = undefined;
  }, [camera, view, challenge, viewAxis, resetToken, narrow, bookExpanded]);
  useEffect(() => {
    const stop = () => { moving.current = false; };
    controls?.addEventListener("start" as never, stop);
    return () => controls?.removeEventListener("start" as never, stop);
  }, [controls]);
  useFrame((_, dt) => {
    if (document.hidden) return;
    if (moving.current) {
      camera.position.lerp(destination.current, reducedMotion ? 1 : 1 - Math.exp(-dt * 8));
      if (camera.position.distanceTo(destination.current) < .025) { camera.position.copy(destination.current); moving.current = false; }
      camera.lookAt(0, challenge ? 1.2 : view === "map" ? 0 : 1, 0);
    }
    if (!challenge || moving.current) return;
    const d = camera.position.clone().sub(new Vector3(0, 1.2, 0)).normalize();
    const axis: SpatialViewAxis | undefined = d.y > .94 ? "top" : d.x < -.92 ? "side" : d.z > .92 ? "front" : undefined;
    if (axis && reported.current !== axis) { reported.current = axis; onObservedAxis(axis); }
  });
  return null;
}
