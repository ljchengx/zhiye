"use client";
import type { GridPosition } from "@/lib/kids/spatial-blocks";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

export function JourneyBird({ target, active, walking, reducedMotion }: { target?: GridPosition; active: boolean; walking?: boolean; reducedMotion: boolean }) {
  const body = useRef<Group>(null);
  const head = useRef<Group>(null);
  const wings = useRef<Group>(null);
  const elapsed = useRef(0);
  useFrame((_, dt) => {
    if (!body.current || document.hidden || reducedMotion || !active) return;
    elapsed.current += dt;
    const t = elapsed.current;
    if (walking) { body.current.position.x = -2 + Math.min(4, t * .65); body.current.position.y = 2.2 + Math.abs(Math.sin(t * 9)) * .07; }
    else {
      const x = target ? target.x - 1.7 : -2.5;
      const y = target ? target.y + 1.5 : 1.4;
      body.current.position.x += (x - body.current.position.x) * Math.min(1, dt * 3);
      body.current.position.y += (y - body.current.position.y) * Math.min(1, dt * 3);
      body.current.rotation.y = target ? .75 : .2;
      if (wings.current) wings.current.rotation.z = Math.abs(y - body.current.position.y) > .12 ? Math.sin(t * 24) * .28 : -.15;
    }
    if (head.current) head.current.rotation.y = Math.sin(t * 1.5) * .22;
  });
  if (!active) return null;
  return <group ref={body} position={walking ? [reducedMotion ? 2 : -2, 2.2, 0] : [target ? target.x - (reducedMotion ? 1.7 : 2.1) : -2.5, target ? target.y + (reducedMotion ? 1.5 : 3.2) : 1.4, target?.z ?? .7]} scale={.7}>
    <mesh scale={[.48, .6, .4]} castShadow><sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color="#596C66" roughness={.9} /></mesh>
    <mesh position={[0, -.04, .29]} scale={[.34, .43, .2]}><sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color="#EE8354" /></mesh>
    <group ref={head} position={[0, .52, .12]}>
      <mesh scale={[.36, .34, .34]}><sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color="#354941" /></mesh>
      {[-1, 1].map((s) => <group key={s}><mesh position={[s * .23, -.02, .19]} scale={[.13, .17, .12]}><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color="#F6F6E8" /></mesh><mesh position={[s * .2, .05, .32]}><sphereGeometry args={[.04, 8, 8]} /><meshBasicMaterial color="#182B23" /></mesh></group>)}
      <mesh position={[0, -.04, .46]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[.1, .27, 5]} /><meshStandardMaterial color="#F2C75C" /></mesh>
    </group>
    <group ref={wings}><mesh position={[.42, .02, -.08]} rotation={[0, 0, active ? -.3 : 0]} scale={[.12, .4, .3]}><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color="#39735A" /></mesh></group>
    <mesh position={[-.42, .02, -.08]} scale={[.12, .4, .3]}><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color="#39735A" /></mesh>
    <mesh position={[0, -.15, -.46]} rotation={[-.5, 0, 0]} scale={[.16, .12, .4]}><boxGeometry /><meshStandardMaterial color="#354941" /></mesh>
  </group>;
}
