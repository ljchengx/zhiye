"use client";

import { Instance, Instances } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BackSide, Color, type Group } from "three";

import type { SpatialCompletionEffect } from "@/lib/kids/spatial-blocks";

const cloudPuffs = [
  [-15, -3.5, -12, 4.6, 1.3, 2.7], [-10, -3.1, -15, 3.8, 1.1, 2.4],
  [-4, -4, -17, 5.2, 1.5, 3], [4, -3.6, -16, 4.4, 1.2, 2.6],
  [11, -3.8, -13, 5.6, 1.4, 3.2], [16, -3.2, -7, 3.6, 1, 2.2],
  [-17, -3.9, 2, 4.8, 1.2, 2.8], [16, -4.1, 6, 5.1, 1.4, 2.9],
  [-13, -4.4, 13, 5.5, 1.4, 3.1], [-5, -3.8, 16, 4.2, 1.1, 2.5],
  [5, -4.2, 17, 5.4, 1.5, 3], [13, -3.4, 13, 4.3, 1.2, 2.5],
] as const;

const distantPeaks = [
  [-22, -7.8, -20, 3.5, 6], [-12, -7.2, -25, 2.8, 5], [1, -8.4, -27, 4.2, 7],
  [15, -7.6, -24, 3.4, 5.8], [24, -7.4, -16, 2.8, 5], [-25, -7.5, 8, 3.2, 5.6],
  [24, -8.2, 11, 3.8, 6.4], [8, -7.2, 26, 3, 5.2], [-11, -7.9, 24, 3.7, 6.2],
] as const;

const floatingRocks = [
  [-7, -1.8, -5, 0.32], [-5.2, -2.4, 4.8, 0.22], [6.5, -1.6, -3.6, 0.3],
  [8, -2.8, 4.4, 0.18], [-9.5, -3, 2, 0.16], [3.2, -3.1, 8, 0.2],
] as const;

function CloudSea({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!group.current || reducedMotion || document.hidden) return;
    group.current.position.x = Math.sin(clock.elapsedTime * 0.045) * 1.4;
  });

  return (
    <group ref={group} position={[0, -1.1, 0]}>
      <Instances limit={cloudPuffs.length * 3} frustumCulled={false}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial color="#F7FCF8" roughness={1} transparent opacity={0.88} depthWrite={false} />
        {cloudPuffs.flatMap(([x, y, z, sx, sy, sz], index) => [
          <Instance key={`${index}-left`} position={[x - sx * 0.24, y, z]} scale={[sx * 0.34, sy * 0.52, sz * 0.4]} />,
          <Instance key={`${index}-center`} position={[x, y + sy * 0.12, z]} scale={[sx * 0.4, sy * 0.62, sz * 0.46]} />,
          <Instance key={`${index}-right`} position={[x + sx * 0.27, y - sy * 0.04, z]} scale={[sx * 0.31, sy * 0.46, sz * 0.37]} />,
        ])}
      </Instances>
    </group>
  );
}

function DistantWorld() {
  return (
    <group>
      <Instances limit={distantPeaks.length} frustumCulled={false}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#76958D" roughness={1} transparent opacity={0.48} depthWrite={false} />
        {distantPeaks.map(([x, y, z, radius, height], index) => (
          <Instance key={index} position={[x, y + height * 0.45, z]} scale={[radius, height * 0.24, radius * 0.72]} rotation={[0, index * 0.7, index * 0.08]} />
        ))}
      </Instances>
      <Instances limit={floatingRocks.length}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#687B76" roughness={0.96} />
        {floatingRocks.map(([x, y, z, scale], index) => (
          <Instance key={index} position={[x, y, z]} scale={scale} rotation={[index * 0.2, index, index * 0.1]} />
        ))}
      </Instances>
    </group>
  );
}

const skyUniforms = {
  horizonColor: { value: new Color("#EAF3EC") },
  zenithColor: { value: new Color("#91C9D8") },
};

function SkyDome() {
  return (
    <mesh scale={75} renderOrder={-10}>
      <sphereGeometry args={[1, 32, 18]} />
      <shaderMaterial
        side={BackSide}
        depthWrite={false}
        toneMapped={false}
        uniforms={skyUniforms}
        vertexShader={`
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 horizonColor;
          uniform vec3 zenithColor;
          varying vec3 vWorldPosition;
          void main() {
            float height = normalize(vWorldPosition - cameraPosition).y * 0.5 + 0.5;
            float blend = smoothstep(0.18, 0.82, height);
            gl_FragColor = vec4(mix(horizonColor, zenithColor, blend), 1.0);
          }
        `}
      />
    </mesh>
  );
}

function BirdFlock({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!group.current || reducedMotion || document.hidden) return;
    const progress = (clock.elapsedTime * 0.16) % 1;
    group.current.position.x = -16 + progress * 32;
    group.current.position.y = 7.2 + Math.sin(progress * Math.PI * 2) * 0.35;
  });

  return (
    <group ref={group} position={[-13, 7.2, -12]}>
      {[[0, 0, 0], [-1.2, -0.35, 0.4], [-2.1, 0.15, -0.5]].map((position, index) => (
        <group key={index} position={position as [number, number, number]} scale={0.22}>
          <mesh rotation={[0, 0, 0.55]} position={[-0.35, 0, 0]}>
            <coneGeometry args={[0.18, 0.9, 3]} />
            <meshBasicMaterial color="#49635C" />
          </mesh>
          <mesh rotation={[0, 0, -0.55]} position={[0.35, 0, 0]}>
            <coneGeometry args={[0.18, 0.9, 3]} />
            <meshBasicMaterial color="#49635C" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function WorldEnvironment({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <SkyDome />
      <CloudSea reducedMotion={reducedMotion} />
      <DistantWorld />
      <BirdFlock reducedMotion={reducedMotion} />
    </>
  );
}

export function IslandBase({
  position = [0, -0.08, 0],
  scale = 1,
  alive = true,
}: {
  position?: readonly [number, number, number];
  scale?: number;
  alive?: boolean;
}) {
  return (
    <group position={[position[0], position[1], position[2]]} scale={scale}>
      <mesh castShadow receiveShadow position={[0, -0.72, 0]} rotation={[0, 0.18, 0]}>
        <cylinderGeometry args={[3.05, 2.12, 1.45, 9]} />
        <meshStandardMaterial color={alive ? "#667873" : "#85918D"} roughness={0.98} />
      </mesh>
      <mesh castShadow position={[0, -1.72, 0]} rotation={[0, 0.12, 0]}>
        <coneGeometry args={[2.1, 1.35, 8]} />
        <meshStandardMaterial color={alive ? "#536762" : "#77837F"} roughness={1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -0.04, 0]} rotation={[0, -0.08, 0]}>
        <cylinderGeometry args={[3.08, 3.02, 0.2, 9]} />
        <meshStandardMaterial color={alive ? "#896C4F" : "#8A938E"} roughness={0.95} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.08, 0]} rotation={[0, -0.08, 0]}>
        <cylinderGeometry args={[3.04, 3.04, 0.12, 9]} />
        <meshStandardMaterial color={alive ? "#72B96B" : "#9AA49D"} roughness={0.9} />
      </mesh>
    </group>
  );
}

export function Tree({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: readonly [number, number, number];
  scale?: number;
}) {
  return (
    <group position={[position[0], position[1], position[2]]} scale={scale}>
      <mesh castShadow position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.1, 0.16, 1.1, 7]} />
        <meshStandardMaterial color="#806348" roughness={1} />
      </mesh>
      <mesh castShadow position={[-0.18, 1.28, 0.02]}>
        <icosahedronGeometry args={[0.56, 1]} />
        <meshStandardMaterial color="#39735A" roughness={0.94} flatShading />
      </mesh>
      <mesh castShadow position={[0.3, 1.22, -0.08]} scale={0.82}>
        <icosahedronGeometry args={[0.52, 1]} />
        <meshStandardMaterial color="#4D8B62" roughness={0.94} flatShading />
      </mesh>
    </group>
  );
}

export function GrassCluster({ position }: { position: readonly [number, number, number] }) {
  return (
    <group position={[position[0], position[1], position[2]]}>
      {[-0.16, 0, 0.15].map((offset, index) => (
        <mesh key={offset} position={[offset, 0.2, index === 1 ? -0.06 : 0]} rotation={[0, 0, offset * 1.8]}>
          <coneGeometry args={[0.07, 0.42 + index * 0.04, 4]} />
          <meshStandardMaterial color={index === 1 ? "#39735A" : "#5A9B61"} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

export function FlowerPatch({ position }: { position: readonly [number, number, number] }) {
  return (
    <group position={[position[0], position[1], position[2]]}>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.018, 0.025, 0.34, 5]} />
        <meshStandardMaterial color="#39735A" />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <octahedronGeometry args={[0.09, 0]} />
        <meshStandardMaterial color="#F2C75C" roughness={0.8} />
      </mesh>
    </group>
  );
}

export function Waterfall({ position }: { position: readonly [number, number, number] }) {
  return (
    <group position={[position[0], position[1], position[2]]}>
      <mesh position={[0, -1.1, 0]}>
        <boxGeometry args={[0.48, 2.3, 0.045]} />
        <meshStandardMaterial color="#A8E0E2" transparent opacity={0.72} roughness={0.25} depthWrite={false} />
      </mesh>
      <mesh position={[0, -2.35, 0]} scale={[1.8, 0.32, 1]}>
        <sphereGeometry args={[0.35, 12, 8]} />
        <meshStandardMaterial color="#F5FCFA" transparent opacity={0.78} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function Flag({
  visible = true,
  reducedMotion = false,
  position = [1.8, 0.14, -0.6],
}: {
  visible?: boolean;
  reducedMotion?: boolean;
  position?: readonly [number, number, number];
}) {
  const flag = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!flag.current || reducedMotion || document.hidden) return;
    flag.current.rotation.y = Math.sin(clock.elapsedTime * 1.6) * 0.08;
  });
  if (!visible) return null;
  return (
    <group ref={flag} position={[position[0], position[1], position[2]]}>
      <mesh castShadow position={[0, 1, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 2, 8]} />
        <meshStandardMaterial color="#F4F1E8" />
      </mesh>
      <mesh castShadow position={[0.32, 1.6, 0]}>
        <boxGeometry args={[0.64, 0.4, 0.04]} />
        <meshStandardMaterial color="#EE8354" roughness={0.76} />
      </mesh>
    </group>
  );
}

function Lighthouse({ lit }: { lit: boolean }) {
  return (
    <group position={[0, 0.12, 0]}>
      <mesh castShadow position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.48, 0.7, 2.5, 8]} />
        <meshStandardMaterial color="#F3EEE1" roughness={0.82} />
      </mesh>
      <mesh castShadow position={[0, 2.6, 0]}>
        <cylinderGeometry args={[0.58, 0.58, 0.35, 8]} />
        <meshStandardMaterial color="#EE8354" roughness={0.72} />
      </mesh>
      <mesh position={[0, 2.66, 0]}>
        <sphereGeometry args={[0.25, 16, 12]} />
        <meshStandardMaterial color="#F2C75C" emissive="#F2C75C" emissiveIntensity={lit ? 2.4 : 0.15} />
        {lit ? <pointLight color="#F2C75C" intensity={8} distance={7} /> : null}
      </mesh>
    </group>
  );
}

function BeaconCap({ lit, position = [0, 4.18, 0] }: { lit: boolean; position?: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.62, 0.62, 0.24, 8]} />
        <meshStandardMaterial color="#EE8354" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.25, 16, 12]} />
        <meshStandardMaterial color="#F2C75C" emissive="#F2C75C" emissiveIntensity={lit ? 2.4 : 0.15} />
        {lit ? <pointLight color="#F2C75C" intensity={8} distance={7} /> : null}
      </mesh>
    </group>
  );
}

export function ChallengeTerrain({
  challengeId,
  completed,
  bridgeZ = 0,
  beaconPosition,
}: {
  challengeId: string;
  completed: boolean;
  bridgeZ?: number;
  beaconPosition?: [number, number, number];
}) {
  if (challengeId === "little-bridge") {
    return (
      <group>
        <IslandBase position={[-2.55, -0.12, 0]} scale={0.78} />
        <IslandBase position={[2.55, -0.12, 0]} scale={0.78} />
        <Waterfall position={[-2.9, 0, 1.25]} />
        <Tree position={[-3.25, 0.02, -0.75]} scale={0.72} />
        <Tree position={[3.15, 0.02, 0.7]} scale={0.76} />
        {completed ? <mesh position={[0, 2.01, bridgeZ]}><boxGeometry args={[5.5, 0.06, 1.18]} /><meshStandardMaterial color="#F2C75C" emissive="#F2C75C" emissiveIntensity={0.22} /></mesh> : null}
      </group>
    );
  }
  if (challengeId === "light-tower") {
    return (
      <group>
        <IslandBase scale={1.05} />
        <BeaconCap lit={completed} position={beaconPosition} />
        <Tree position={[-2.1, 0.04, 0.9]} scale={0.78} />
        <GrassCluster position={[1.8, 0.12, 1.1]} />
      </group>
    );
  }
  if (challengeId === "lookout-garden") {
    return (
      <group>
        <IslandBase scale={1.18} />
        <mesh position={[0, 0.13, 0]} receiveShadow>
          <cylinderGeometry args={[2.45, 2.45, 0.16, 9]} />
          <meshStandardMaterial color="#82C27A" roughness={0.92} />
        </mesh>
        <GrassCluster position={[-2.25, 0.23, 0.3]} />
        <GrassCluster position={[2.1, 0.23, -0.6]} />
        {completed ? <><Tree position={[-2, 0.2, 0.8]} /><Tree position={[2.05, 0.2, -0.7]} /><FlowerPatch position={[0.4, 0.23, 2]} /></> : null}
      </group>
    );
  }
  return (
    <group>
      <IslandBase scale={1.08} />
      {[
        [-2.35, 0.12, 1.75, 0.5], [-1.75, 0.13, 1.25, 0.42], [-1.2, 0.14, 0.82, 0.34],
      ].map(([x, y, z, scale], index) => (
        <mesh key={index} position={[x, y, z]} scale={[scale, 0.1, scale * 0.72]} receiveShadow>
          <cylinderGeometry args={[1, 1, 0.5, 7]} />
          <meshStandardMaterial color="#87918D" roughness={0.96} />
        </mesh>
      ))}
      <Tree position={[-2.2, 0.04, 0.75]} scale={0.85} />
      <GrassCluster position={[2.2, 0.12, 0.9]} />
      <FlowerPatch position={[-1.75, 0.12, -1.6]} />
      <FlowerPatch position={[2.1, 0.12, -1.1]} />
    </group>
  );
}

export function MapLandmark({ challengeId, completed, reducedMotion }: { challengeId: string; completed: boolean; reducedMotion: boolean }) {
  if (challengeId === "little-bridge") {
    return <mesh position={[0, 0.32, 0]}><boxGeometry args={[2.8, 0.16, 0.5]} /><meshStandardMaterial color={completed ? "#F2C75C" : "#B99A6A"} roughness={0.9} /></mesh>;
  }
  if (challengeId === "light-tower") return <group scale={0.56}><Lighthouse lit={completed} /></group>;
  if (challengeId === "lookout-garden") return <><Tree position={[-0.7, 0.08, 0.2]} scale={0.56} />{completed ? <Tree position={[0.65, 0.08, -0.25]} scale={0.48} /> : null}</>;
  return <Flag visible={completed} reducedMotion={reducedMotion} position={[0.7, 0.08, -0.2]} />;
}

export function CompletionDetail({
  effect,
  completed,
  reducedMotion,
}: {
  effect: SpatialCompletionEffect;
  completed: boolean;
  reducedMotion: boolean;
}) {
  const group = useRef<Group>(null);
  useFrame((_, delta) => {
    if (!group.current || reducedMotion || document.hidden) return;
    const next = Math.min(1, group.current.scale.x + delta * 3.8);
    group.current.scale.setScalar(next);
  });
  if (!completed || effect === "bridge" || effect === "light" || effect === "garden") return null;
  return <group ref={group} scale={reducedMotion ? 1 : 0.01}><Flag reducedMotion={reducedMotion} /></group>;
}

export function useFreeBuildCells() {
  return useMemo(() => {
    const result: { x: number; y: number; z: number }[] = [];
    for (let x = -4;x < 4;x += 1) {
      for (let z = -4;z < 4;z += 1) result.push({ x, y: 0, z });
    }
    return result;
  }, []);
}
