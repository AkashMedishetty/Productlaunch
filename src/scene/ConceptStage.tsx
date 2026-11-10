import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Concept } from '../data/concepts';
import { Callout } from './Annotations';
import { getRoughnessTexture } from './materials';
import { FogSheet, HazeRing, makeRadialTexture, ProductCore, ScissorLift, smoothstep, StageBase, StageBeam, StageScreen, Truss } from './primitives';

interface ModelProps {
  concept: Concept;
  progress: React.MutableRefObject<number>;
}

const LIFT_START = -2.2;
const TAU = Math.PI * 2;

export function ConceptStage({ concept, progress }: ModelProps) {
  const screenIntensity =
    concept.scene === 'laser'
      ? 0.24
      : concept.scene === 'phantom'
        ? 0.34
        : concept.scene === 'unseen'
          ? 0.5
          : 1;

  return (
    <>
      <StageBase accent={concept.accent} progress={progress} />
      <StageScreen
        accent={concept.accent}
        progress={progress}
        seed={Number(concept.index) * 1.37}
        intensity={screenIntensity}
      />
      {concept.scene === 'unseen' && <Unseen concept={concept} progress={progress} />}
      {concept.scene === 'pulse' && <Pulse concept={concept} progress={progress} />}
      {concept.scene === 'cargo' && <Cargo concept={concept} progress={progress} />}
      {concept.scene === 'ascension' && <Ascension concept={concept} progress={progress} />}
      {concept.scene === 'veil' && <Veil concept={concept} progress={progress} />}
      {concept.scene === 'sculpture' && <Sculpture concept={concept} progress={progress} />}
      {concept.scene === 'drop' && <Drop concept={concept} progress={progress} />}
      {concept.scene === 'phantom' && <Phantom concept={concept} progress={progress} />}
      {concept.scene === 'stageproduct' && <StageProduct concept={concept} progress={progress} />}
      {concept.scene === 'laser' && <LaserDraw concept={concept} progress={progress} />}
      {concept.scene === 'colour' && <ColourRelease concept={concept} progress={progress} />}
      {concept.scene === 'ignition' && <Ignition concept={concept} progress={progress} />}
      {concept.scene === 'kabuki' && <Kabuki concept={concept} progress={progress} />}
      {concept.scene === 'flybar' && <FlyBar concept={concept} progress={progress} />}
      {concept.scene === 'traveler' && <Traveler concept={concept} progress={progress} />}
      {concept.scene === 'revolve' && <Revolve concept={concept} progress={progress} />}
      {concept.scene === 'trilogy' && <Trilogy concept={concept} progress={progress} />}
      {concept.scene === 'house' && <HouseScene concept={concept} progress={progress} />}
    </>
  );
}

function Unseen({ concept, progress }: ModelProps) {
  const panels = useRef<Array<THREE.Group | null>>([]);
  const seams = useRef<Array<THREE.Mesh | null>>([]);
  const glow = useMemo(() => makeRadialTexture('rgba(255,255,255,0.8)', 'rgba(255,255,255,0)'), []);
  const bays = [
    { x: -4.3, width: 2.5, height: 2.8, depth: 1.5, size: 1.12, open: [0.2, 0.38] as [number, number] },
    { x: 0, width: 3.4, height: 3.7, depth: 1.7, size: 1.85, open: [0.5, 0.68] as [number, number] },
    { x: 4.4, width: 4.5, height: 4.8, depth: 2, size: 2.75, open: [0.79, 0.96] as [number, number] },
  ];

  useFrame(() => {
    bays.forEach((bay, index) => {
      const open = smoothstep(bay.open[0], bay.open[1], progress.current);
      const left = panels.current[index * 2];
      const right = panels.current[index * 2 + 1];
      if (left) left.rotation.y = -open * 1.72;
      if (right) right.rotation.y = open * 1.72;
      if (seams.current[index]) {
        (seams.current[index]!.material as THREE.MeshBasicMaterial).opacity = 0.8 - open * 0.8;
      }
    });
  });

  return (
    <group>
      {bays.map((bay, index) => (
        <group key={index} position={[bay.x, 0, -1.15]}>
          <mesh position={[0, bay.height / 2, -bay.depth / 2]}>
            <boxGeometry args={[bay.width, bay.height, 0.08]} />
            <meshStandardMaterial color="#050707" emissive={concept.accent} emissiveIntensity={0.03} roughness={0.82} metalness={0.12} />
          </mesh>
          <mesh position={[0, bay.height / 2, -bay.depth / 2 + 0.05]}>
            <planeGeometry args={[bay.width * 1.15, bay.height * 1.05]} />
            <meshBasicMaterial
              map={glow}
              color={concept.accent}
              transparent
              opacity={0.16}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          <mesh position={[-bay.width / 2, bay.height / 2, 0]}>
            <boxGeometry args={[0.12, bay.height, bay.depth]} />
            <meshStandardMaterial color="#0a0b0c" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[bay.width / 2, bay.height / 2, 0]}>
            <boxGeometry args={[0.12, bay.height, bay.depth]} />
            <meshStandardMaterial color="#0a0b0c" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0, bay.height + 0.05, 0]}>
            <boxGeometry args={[bay.width + 0.24, 0.14, bay.depth]} />
            <meshStandardMaterial color="#0a0b0c" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[bay.width + 0.24, 0.12, bay.depth]} />
            <meshStandardMaterial color="#090a0b" metalness={0.7} roughness={0.4} />
          </mesh>

          <ProductCore size={bay.size} accent={concept.accent} position={[0, 0.06, 0.1]} />

          <group ref={(node) => { panels.current[index * 2] = node; }} position={[-bay.width / 2, 0, 0.68]}>
            <mesh position={[bay.width / 4, bay.height / 2, 0]} castShadow>
              <boxGeometry args={[bay.width / 2, bay.height, 0.1]} />
              <meshStandardMaterial color="#08090a" metalness={0.14} roughness={0.82} />
            </mesh>
            <mesh position={[bay.width / 2 - 0.02, bay.height / 2, 0.056]}>
              <boxGeometry args={[0.012, bay.height * 0.92, 0.012]} />
              <meshBasicMaterial color={concept.accent} transparent opacity={0.3} toneMapped={false} />
            </mesh>
            <mesh position={[0, bay.height / 2, 0]}>
              <cylinderGeometry args={[0.045, 0.045, bay.height * 0.96, 10]} />
              <meshStandardMaterial color="#26241f" metalness={0.85} roughness={0.32} />
            </mesh>
          </group>
          <group ref={(node) => { panels.current[index * 2 + 1] = node; }} position={[bay.width / 2, 0, 0.68]}>
            <mesh position={[-bay.width / 4, bay.height / 2, 0]} castShadow>
              <boxGeometry args={[bay.width / 2, bay.height, 0.1]} />
              <meshStandardMaterial color="#08090a" metalness={0.14} roughness={0.82} />
            </mesh>
            <mesh position={[-bay.width / 2 + 0.02, bay.height / 2, 0.056]}>
              <boxGeometry args={[0.012, bay.height * 0.92, 0.012]} />
              <meshBasicMaterial color={concept.accent} transparent opacity={0.3} toneMapped={false} />
            </mesh>
            <mesh position={[0, bay.height / 2, 0]}>
              <cylinderGeometry args={[0.045, 0.045, bay.height * 0.96, 10]} />
              <meshStandardMaterial color="#26241f" metalness={0.85} roughness={0.32} />
            </mesh>
          </group>

          <mesh ref={(node) => { seams.current[index] = node; }} position={[0, bay.height / 2, 0.77]}>
            <boxGeometry args={[0.018, bay.height * 0.92, 0.014]} />
            <meshBasicMaterial color={concept.accent} toneMapped={false} transparent opacity={0.8} />
          </mesh>
          {index === 2 && <StageBeam accent={concept.accent} progress={progress} position={[0, 3.4, 0.2]} radius={1.2} opacity={0.02} />}
        </group>
      ))}
      <Callout position={[-2.4, 3.2, 1.5]} label="POWERED PANELS / 2 PER BAY" at={0.1} until={0.52} side="left" />
      <Callout position={[1.4, 2.55, 1.7]} label="SEALED BAY / LIGHT SEAM" at={0.3} until={0.72} />
      <Callout position={[4.35, 3.9, 1.6]} label="BAY 03 / 6×6 FT" at={0.8} />
    </group>
  );
}

function makePath(points: [number, number, number][]) {
  return new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
}

function Pulse({ concept, progress }: ModelProps) {
  const curve = useMemo(
    () =>
      makePath([
        [-2.5, 0.98, 2.15],
        [-2.5, 0.03, 2.15],
        [-1.6, 0.03, 1.55],
        [-0.55, 0.03, 0.72],
        [0.2, 0.03, -0.35],
        [0.2, 1.7, -3.9],
      ]),
    [],
  );
  const tube = useRef<THREE.Mesh>(null);
  const dot = useRef<THREE.Mesh>(null);
  const drape = useRef<THREE.Group>(null);
  const consoleGlow = useRef<THREE.Mesh>(null);
  const cables = useRef<Array<THREE.Mesh | null>>([]);
  const floorPath = useMemo(
    () =>
      makePath([
        [-2.5, 0.03, 2.15],
        [-1.6, 0.03, 1.55],
        [-0.55, 0.03, 0.72],
        [0.2, 0.03, -0.35],
      ]),
    [],
  );

  useFrame((state) => {
    const p = progress.current;
    const travel = smoothstep(0.28, 0.58, p);
    const point = curve.getPointAt(travel);
    if (dot.current) {
      dot.current.position.copy(point);
      dot.current.visible = p > 0.25 && p < 0.68;
      dot.current.scale.setScalar(0.7 + Math.sin(state.clock.elapsedTime * 9) * 0.15);
    }
    if (tube.current) {
      (tube.current.material as THREE.MeshBasicMaterial).opacity = 0.13 + travel * 0.3;
    }
    const drapeLift = smoothstep(0.62, 0.86, p) * 5.1;
    if (drape.current) {
      drape.current.position.y = drapeLift;
    }
    cables.current.forEach((cable) => {
      if (!cable) return;
      const bottom = drapeLift + 3.12;
      cable.position.y = (8.44 + bottom) / 2;
      cable.scale.y = Math.max(0.1, 8.44 - bottom);
    });
    if (consoleGlow.current) {
      const material = consoleGlow.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.32 + Math.sin(state.clock.elapsedTime * 2.4) * 0.1 + smoothstep(0.12, 0.32, p) * 0.3;
    }
  });

  return (
    <group>
      <ProductCore size={concept.productSize} accent={concept.accent} position={[0.2, 0.08, 0.2]} />

      <group ref={drape} position={[0.2, 0, 0.2]}>
        <mesh position={[0, 1.55, 1.15]} castShadow>
          <boxGeometry args={[concept.productSize * 1.45, 3.1, 0.08]} />
          <meshStandardMaterial color="#0e1112" roughness={0.72} metalness={0.2} />
        </mesh>
        {Array.from({ length: 7 }).map((_, index) => (
          <mesh key={index} position={[-concept.productSize * 0.62 + index * (concept.productSize * 0.206), 1.55, 1.21]}>
            <boxGeometry args={[0.018, 3.05, 0.02]} />
            <meshBasicMaterial color="#2a2925" transparent opacity={0.42} />
          </mesh>
        ))}
        <mesh position={[0, 3.12, 1.16]}>
          <boxGeometry args={[concept.productSize * 1.55, 0.06, 0.12]} />
          <meshBasicMaterial color={concept.accent} transparent opacity={0.5} toneMapped={false} />
        </mesh>
      </group>

      <group position={[-2.5, 0, 2.15]}>
        <RoundedBox args={[1.0, 0.98, 0.8]} radius={0.04} smoothness={3} position={[0, 0.49, 0]}>
          <meshStandardMaterial color="#0a0d0e" metalness={0.7} roughness={0.32} />
        </RoundedBox>
        <mesh position={[0, 0.99, 0]} rotation={[-0.18, 0, 0]}>
          <boxGeometry args={[0.92, 0.025, 0.7]} />
          <meshStandardMaterial color="#141719" metalness={0.8} roughness={0.26} />
        </mesh>
        <mesh ref={consoleGlow} position={[0, 1.01, 0.02]} rotation={[-Math.PI / 2 - 0.18, 0, 0]}>
          <ringGeometry args={[0.13, 0.24, 40]} />
          <meshBasicMaterial color={concept.accent} transparent opacity={0.4} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 1.012, 0.02]} rotation={[-Math.PI / 2 - 0.18, 0, 0]}>
          <circleGeometry args={[0.11, 32]} />
          <meshBasicMaterial color="#eef5f1" transparent opacity={0.16} />
        </mesh>
        <mesh position={[0, 0.62, -0.41]}>
          <boxGeometry args={[0.42, 0.3, 0.03]} />
          <meshBasicMaterial color="#04090a" />
        </mesh>
        <mesh position={[0.17, 0.72, -0.427]}>
          <circleGeometry args={[0.018, 16]} />
          <meshBasicMaterial color="#ff4d3d" toneMapped={false} />
        </mesh>
      </group>

      <mesh>
        <tubeGeometry args={[floorPath, 90, 0.075, 8, false]} />
        <meshStandardMaterial color="#0b0e0f" metalness={0.85} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.055, 0]} scale={[1, 1, 1]}>
        <tubeGeometry args={[floorPath, 90, 0.028, 6, false]} />
        <meshBasicMaterial color={concept.accent} transparent opacity={0.32} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={tube}>
        <tubeGeometry args={[curve, 120, 0.026, 6, false]} />
        <meshBasicMaterial color={concept.accent} transparent opacity={0.2} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={dot}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial color="#f6fffb" toneMapped={false} />
      </mesh>

      <StageBeam accent={concept.accent} progress={progress} position={[0.2, 3, 0.3]} radius={1} opacity={0.025} />
      <Truss accent={concept.accent} width={9.6} height={8.5} position={[0, 0, 1.2]} />
      {[-1.9, 2.3].map((x, index) => (
        <mesh key={x} ref={(node) => { cables.current[index] = node; }} position={[x, 6, 1.35]}>
          <cylinderGeometry args={[0.012, 0.012, 1, 6]} />
          <meshBasicMaterial color="#b3a78c" transparent opacity={0.62} />
        </mesh>
      ))}
      <Callout position={[-2.5, 1.5, 2.6]} label="PALM SENSOR / LIVE FEED" at={0.04} until={0.42} side="left" />
      <Callout position={[-1.3, 0.42, 1.35]} label="LED CHASE / 7 M" at={0.2} until={0.58} side="left" />
      <Callout position={[2.6, 4.5, 1.5]} label="DROP LINE / 5.1 M" at={0.5} until={0.86} />
      <Callout position={[0.2, 1.1, 1.1]} label="PRODUCT" at={0.74} />
    </group>
  );
}

function Cargo({ concept, progress }: ModelProps) {
  const walls = useRef<Array<THREE.Group | null>>([]);
  const locks = useRef<Array<THREE.Mesh | null>>([]);
  const fog = useRef<THREE.Group>(null);
  const width = 3.6;
  const height = 2.6;
  const depth = 3;

  useFrame(() => {
    const p = progress.current;
    const openAmount = smoothstep(0.52, 0.82, p);
    if (walls.current[0]) walls.current[0].rotation.x = openAmount * 1.36;
    if (walls.current[1]) walls.current[1].rotation.x = -openAmount * 1.36;
    if (walls.current[2]) walls.current[2].rotation.z = openAmount * 1.36;
    if (walls.current[3]) walls.current[3].rotation.z = -openAmount * 1.36;
    locks.current.forEach((lock) => {
      if (!lock) return;
      const material = lock.material as THREE.MeshBasicMaterial;
      material.opacity = 0.9 - openAmount * 0.8;
    });
    fog.current?.children.forEach((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const material = child.material as THREE.MeshBasicMaterial;
      material.opacity = openAmount * 0.3;
    });
  });

  return (
    <group>
      <group position={[0, 0.06, 0]}>
        <ProductCore size={2.2} accent={concept.accent} position={[0, 0.05, 0]} />
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[width - 0.2, 0.06, depth - 0.2]} />
          <meshStandardMaterial color="#0b0d0e" metalness={0.65} roughness={0.4} />
        </mesh>

        <group ref={(node) => { walls.current[0] = node; }} position={[0, 0.06, depth / 2]}>
          <mesh position={[0, height / 2, 0]} castShadow>
            <boxGeometry args={[width, height, 0.13]} />
            <meshStandardMaterial color="#0b0c0d" metalness={0.52} roughness={0.44} />
          </mesh>
          <mesh position={[0, height * 0.78, 0.075]}>
            <boxGeometry args={[width * 0.86, 0.06, 0.02]} />
            <meshBasicMaterial color="#3b3326" />
          </mesh>
        </group>
        <group ref={(node) => { walls.current[1] = node; }} position={[0, 0.06, -depth / 2]}>
          <mesh position={[0, height / 2, 0]} castShadow>
            <boxGeometry args={[width, height, 0.13]} />
            <meshStandardMaterial color="#0b0c0d" metalness={0.52} roughness={0.44} />
          </mesh>
        </group>
        <group ref={(node) => { walls.current[2] = node; }} position={[-width / 2, 0.06, 0]}>
          <mesh position={[0, height / 2, 0]} castShadow>
            <boxGeometry args={[0.13, height, depth]} />
            <meshStandardMaterial color="#0c0d0e" metalness={0.5} roughness={0.46} />
          </mesh>
        </group>
        <group ref={(node) => { walls.current[3] = node; }} position={[width / 2, 0.06, 0]}>
          <mesh position={[0, height / 2, 0]} castShadow>
            <boxGeometry args={[0.13, height, depth]} />
            <meshStandardMaterial color="#0c0d0e" metalness={0.5} roughness={0.46} />
          </mesh>
        </group>

        {[
          [-width / 2, 0, -depth / 2],
          [width / 2, 0, -depth / 2],
          [-width / 2, 0, depth / 2],
          [width / 2, 0, depth / 2],
        ].map(([x, , z], index) => (
          <mesh key={index} position={[x, height / 2, z]}>
            <boxGeometry args={[0.16, height + 0.14, 0.16]} />
            <meshStandardMaterial color="#171512" metalness={0.78} roughness={0.28} />
          </mesh>
        ))}

        <mesh position={[0, height + 0.08, 0]}>
          <boxGeometry args={[width + 0.16, 0.16, depth + 0.16]} />
          <meshStandardMaterial color="#12100e" metalness={0.7} roughness={0.32} />
        </mesh>
        <mesh position={[0, height - 0.12, 0]}>
          <boxGeometry args={[width * 0.74, 0.05, depth * 0.74]} />
          <meshBasicMaterial color={concept.accent} transparent opacity={0.16} toneMapped={false} />
        </mesh>

        {Array.from({ length: 4 }).map((_, index) => (
          <mesh
            key={index}
            ref={(node) => { locks.current[index] = node; }}
            position={[-width * 0.32 + index * width * 0.21, height * 0.58, depth / 2 + 0.09]}
          >
            <boxGeometry args={[0.12, 0.05, 0.04]} />
            <meshBasicMaterial color={concept.accent} transparent opacity={0.9} toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0, height * 0.42, depth / 2 + 0.1]}>
          <boxGeometry args={[0.5, 0.08, 0.05]} />
          <meshStandardMaterial color="#4b3c26" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      {[
        [-width / 2 + 0.35, 0.2, depth / 2 - 0.04, 0],
        [width / 2 - 0.35, 0.2, depth / 2 - 0.04, 0],
        [-width / 2 + 0.35, 0.2, -depth / 2 + 0.04, 0],
        [width / 2 - 0.35, 0.2, -depth / 2 + 0.04, 0],
      ].map(([x, y, z], index) => (
        <mesh key={`hinge-${index}`} position={[x, y, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.5, 12]} />
          <meshStandardMaterial color="#c9a86a" metalness={1} roughness={0.3} />
        </mesh>
      ))}
      <group ref={fog}>
        <FogSheet accent={concept.accent} position={[0, 0.05, 1.6]} scale={[7, 4]} opacity={0} />
        <FogSheet accent={concept.accent} position={[0, 0.06, -1.2]} scale={[6, 4]} opacity={0} />
      </group>
      <StageBeam accent={concept.accent} progress={progress} position={[0, 3.3, 0]} radius={1.3} opacity={0.025} />
      <Callout position={[1.9, 0.55, 1.5]} label="BRAKE HINGE / 4×" at={0.04} until={0.44} />
      <Callout position={[-1.55, 1.5, 1.35]} label="GAS STRUT BRAKE" at={0.2} until={0.6} side="left" />
      <Callout position={[0.1, 1.1, 1.15]} label="PRODUCT BAY" at={0.7} />
    </group>
  );
}

function Ascension({ concept, progress }: ModelProps) {
  const ring = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const p = progress.current;
    const rise = smoothstep(0.4, 0.84, p);
    if (ring.current) {
      const material = ring.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.24 + Math.sin(state.clock.elapsedTime * 1.2) * 0.06 + rise * 0.34;
    }
    if (halo.current) halo.current.position.y = rise * 2.3 + 0.2;
  });

  return (
    <group>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 2.56, 72]} />
        <meshBasicMaterial color={concept.accent} transparent opacity={0.12} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring} position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.62, 2.74, 72]} />
        <meshBasicMaterial color={concept.accent} transparent opacity={0.3} side={THREE.DoubleSide} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>

      <ScissorLift accent={concept.accent} progress={progress} height={2.3} range={[0.4, 0.84]}>
        <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.18, 1.12, 0.12, 64]} />
          <meshStandardMaterial color="#0c0f10" metalness={0.84} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.125, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.12, 1.19, 64]} />
          <meshBasicMaterial color={concept.accent} transparent opacity={0.4} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
        <ProductCore size={concept.productSize * 0.82} accent={concept.accent} position={[0, 0.12, 0]} />
        <HazeRing accent={concept.accent} progress={progress} radius={1.2} />
      </ScissorLift>

      <mesh ref={halo} position={[0, 0.2, 0]}>
        <torusGeometry args={[1.6, 0.012, 6, 64]} />
        <meshBasicMaterial color={concept.accent} transparent opacity={0.34} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>

      <FogSheet accent={concept.accent} position={[0, 0.06, 0]} scale={[8, 6]} opacity={0.16} />
      <StageBeam accent={concept.accent} progress={progress} position={[0, 4.3, 0]} radius={1.7} opacity={0.03} />
      <Callout position={[1.7, 0.7, 1.1]} label="SCISSOR STACK / 2.3 M" at={0.06} until={0.55} />
      <Callout position={[-1.25, 1.5, 0.9]} label="HYDRAULIC RAM" at={0.22} until={0.62} side="left" />
      <Callout position={[0.1, 2.4, 0.9]} label="PRODUCT PLINTH" at={0.7} />
    </group>
  );
}

function Veil({ concept, progress }: ModelProps) {
  const rig = useRef<THREE.Group>(null);
  const scrim = useRef<THREE.Group>(null);
  const fabric = useRef<THREE.MeshStandardMaterial>(null);
  const contours = useRef<THREE.Group>(null);
  const roll = useRef<THREE.Mesh>(null);
  const cables = useRef<Array<THREE.Mesh | null>>([]);
  const pool = useRef<THREE.Mesh>(null);
  const grain = useMemo(() => getRoughnessTexture(), []);
  const falloff = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, 256);
      gradient.addColorStop(0, '#242424');
      gradient.addColorStop(0.3, '#b4b4b4');
      gradient.addColorStop(0.72, '#ffffff');
      gradient.addColorStop(1, '#2c2c2c');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 8, 256);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);
  const tempStart = useMemo(() => new THREE.Vector3(), []);
  const tempEnd = useMemo(() => new THREE.Vector3(), []);
  const tempDir = useMemo(() => new THREE.Vector3(), []);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  const R = 2.34;
  const H = 3.8;
  const REST = 4.06;
  const LIFT = 5.26;
  const CABLE_TOP = 6.2;

  useFrame((state) => {
    const p = progress.current;
    const lift = smoothstep(0.5, 0.86, p);
    const gather = smoothstep(0.55, 0.93, p);
    const hoopY = REST + lift * (LIFT - REST);

    if (rig.current) rig.current.position.y = hoopY;
    if (scrim.current) {
      scrim.current.scale.set(1, THREE.MathUtils.lerp(1, 0.03, gather), 1);
      scrim.current.visible = gather < 0.985;
    }
    if (roll.current) {
      roll.current.scale.set(1, 1 + gather * 2.2, 1);
    }
    if (fabric.current) {
      fabric.current.opacity = 0.94 - lift * 0.08;
      fabric.current.emissiveIntensity =
        (0.16 + smoothstep(0.02, 0.32, p) * 0.42 + Math.sin(state.clock.elapsedTime * 1.6) * 0.04) * (1 - lift * 0.62);
    }
    if (contours.current) {
      contours.current.rotation.y = state.clock.elapsedTime * 0.07;
      contours.current.children.forEach((child, index) => {
        if (!(child instanceof THREE.Mesh)) return;
        const material = child.material as THREE.MeshBasicMaterial;
        material.opacity =
          (0.5 - lift * 0.34) * (0.76 + Math.sin(state.clock.elapsedTime * (1 + index * 0.09) + index) * 0.24);
      });
    }
    if (pool.current) {
      (pool.current.material as THREE.MeshBasicMaterial).opacity = 0.2 - lift * 0.14;
    }

    cables.current.forEach((cable, index) => {
      if (!cable) return;
      const x = index % 2 === 0 ? -1.62 : 1.62;
      const z = index < 2 ? -1.62 : 1.62;
      tempStart.set(x, CABLE_TOP, -0.1);
      tempEnd.set(x, hoopY + 0.02, z);
      tempDir.copy(tempEnd).sub(tempStart);
      const length = tempDir.length();
      cable.position.copy(tempStart).add(tempEnd).multiplyScalar(0.5);
      tempQuat.setFromUnitVectors(up, tempDir.normalize());
      cable.quaternion.copy(tempQuat);
      cable.scale.set(1, length, 1);
    });
  });

  return (
    <group>
      <Truss accent={concept.accent} width={6.8} height={6.6} position={[0, 0, -0.1]} winches={[-1.64, 1.64]} />

      {[-1.64, 1.64].map((x) => (
        <group key={`sheave-${x}`} position={[x, CABLE_TOP, -0.1]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.1, 0.1, 0.12, 14]} />
            <meshStandardMaterial color="#26282a" metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {[0, 1, 2, 3].map((index) => (
        <mesh key={index} ref={(node) => { cables.current[index] = node; }} position={[0, 6, 0]}>
          <cylinderGeometry args={[0.011, 0.011, 1, 6]} />
          <meshBasicMaterial color="#c3b696" transparent opacity={0.75} />
        </mesh>
      ))}

      <group ref={rig} position={[0, REST, 0]}>
        <mesh position={[0, 0.005, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[R + 0.06, 0.055, 10, 96]} />
          <meshStandardMaterial color="#2b2d2c" metalness={0.94} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[R + 0.06, 0.011, 6, 96]} />
          <meshBasicMaterial color={concept.accent} transparent opacity={0.4} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.015, 0]} castShadow>
          <boxGeometry args={[R * 2 + 0.08, 0.05, 0.08]} />
          <meshStandardMaterial color="#262827" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.055, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[R * 2 + 0.08, 0.05, 0.08]} />
          <meshStandardMaterial color="#262827" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.065, 0]}>
          <cylinderGeometry args={[0.11, 0.13, 0.07, 16]} />
          <meshStandardMaterial color="#3a352b" metalness={0.95} roughness={0.26} />
        </mesh>

        <mesh ref={roll} position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[R + 0.055, 0.09, 10, 96]} />
          <meshStandardMaterial
            color="#0d2825"
            emissive={concept.accent}
            emissiveIntensity={0.09}
            roughness={0.55}
            metalness={0.14}
          />
        </mesh>
        <mesh position={[0, -0.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[R + 0.055, 0.01, 5, 96]} />
          <meshBasicMaterial color={concept.accent} transparent opacity={0.28} toneMapped={false} />
        </mesh>

        <group ref={scrim}>
          <mesh position={[0, -H / 2, 0]} castShadow>
            <cylinderGeometry args={[R, R, H, 72, 1, true]} />
            <meshStandardMaterial
              ref={fabric}
              color="#0b2624"
              emissive={concept.accent}
              emissiveMap={falloff}
              emissiveIntensity={0.45}
              transparent
              opacity={0.96}
              roughness={0.68}
              metalness={0.06}
              roughnessMap={grain}
              side={THREE.DoubleSide}
              depthWrite
            />
          </mesh>
          {Array.from({ length: 24 }).map((_, index) => {
            const angle = (index / 24) * TAU;
            return (
              <mesh
                key={`pleat-${index}`}
                position={[Math.cos(angle) * (R + 0.002), -H / 2, Math.sin(angle) * (R + 0.002)]}
              >
                <boxGeometry args={[0.016, H * 0.99, 0.016]} />
                <meshBasicMaterial color="#04100f" transparent opacity={0.32} />
              </mesh>
            );
          })}
          <mesh position={[0, -H + 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[R, 0.02, 6, 72]} />
            <meshStandardMaterial color="#2a2c2b" metalness={0.85} roughness={0.34} />
          </mesh>
          <group ref={contours}>
            {[0.5, 1.15, 1.8, 2.45, 3.1, 3.75].map((offset) => (
              <mesh key={offset} position={[0, -offset, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={6}>
                <torusGeometry args={[R + 0.01, 0.012, 5, 72]} />
                <meshBasicMaterial
                  color={concept.accent}
                  transparent
                  opacity={0.34}
                  toneMapped={false}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            ))}
            {Array.from({ length: 10 }).map((_, index) => {
              const angle = (index / 10) * TAU;
              return (
                <mesh
                  key={`meridian-${index}`}
                  position={[Math.cos(angle) * (R + 0.012), -H / 2, Math.sin(angle) * (R + 0.012)]}
                  renderOrder={6}
                >
                  <boxGeometry args={[0.012, H * 0.98, 0.012]} />
                  <meshBasicMaterial
                    color={concept.accent}
                    transparent
                    opacity={0.26}
                    toneMapped={false}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                  />
                </mesh>
              );
            })}
          </group>
        </group>
      </group>

      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[1.98, 2.06, 0.1, 72]} />
        <meshStandardMaterial color="#0c0f10" metalness={0.86} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.9, 1.97, 72]} />
        <meshBasicMaterial color={concept.accent} transparent opacity={0.4} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <ProductCore size={concept.productSize * 0.72} accent={concept.accent} position={[0, 0.1, 0]} />

      <mesh ref={pool} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.42, 2.62, 80]} />
        <meshBasicMaterial
          color={concept.accent}
          transparent
          opacity={0.2}
          toneMapped={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <group position={[-2.85, 0, 2.25]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.24, 0.8, 0.24]} />
          <meshStandardMaterial color="#0d1011" metalness={0.72} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.82, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.28, 0.022, 8, 40]} />
          <meshBasicMaterial color={concept.accent} toneMapped={false} transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, 0.815, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.2, 32]} />
          <meshBasicMaterial color="#07110f" transparent opacity={0.8} />
        </mesh>
      </group>

      {[-2.6, 2.6].map((x) => (
        <group key={`projector-${x}`} position={[x, 0, -3.95]}>
          <mesh position={[0, 0.36, 0]} rotation={[-0.32, 0, 0]}>
            <boxGeometry args={[0.52, 0.3, 0.64]} />
            <meshStandardMaterial color="#0c0f10" metalness={0.7} roughness={0.34} />
          </mesh>
          <mesh position={[0, 0.44, 0.33]} rotation={[-0.32, 0, 0]}>
            <circleGeometry args={[0.1, 24]} />
            <meshBasicMaterial color={concept.accent} transparent opacity={0.4} toneMapped={false} />
          </mesh>
        </group>
      ))}

      <FogSheet accent={concept.accent} position={[0, 0.05, 0]} scale={[7, 6]} opacity={0.13} />
      <StageBeam accent={concept.accent} progress={progress} position={[0, 3.1, 0]} radius={1.15} opacity={0.018} />
      <Callout position={[-2.85, 1.15, 2.3]} label="TOUCH RING / GUEST" at={0.04} until={0.4} side="left" />
      <Callout position={[1.6, 2.7, 1.6]} label="PROJECTION SLEEVE / 3.8 M" at={0.14} until={0.52} />
      <Callout position={[1.95, 4.15, 1.2]} label="STEEL HOOP / 4-POINT FLY" at={0.3} until={0.66} />
      <Callout position={[1.35, 5.15, 1.3]} label="GATHER TAPES" at={0.72} until={0.96} />
      <Callout position={[0.15, 1.3, 2.35]} label="PRODUCT / 4×4 FT" at={0.74} />
    </group>
  );
}

function FrameOutline({ accent, size, opacity = 0.8 }: { accent: string; size: [number, number]; opacity?: number }) {
  const [w, h] = size;
  const bars = [
    { pos: [0, h / 2, 0] as [number, number, number], args: [w, 0.03, 0.03] as [number, number, number] },
    { pos: [0, -h / 2, 0] as [number, number, number], args: [w, 0.03, 0.03] as [number, number, number] },
    { pos: [-w / 2, 0, 0] as [number, number, number], args: [0.03, h, 0.03] as [number, number, number] },
    { pos: [w / 2, 0, 0] as [number, number, number], args: [0.03, h, 0.03] as [number, number, number] },
  ];
  return (
    <group>
      {bars.map((bar, index) => (
        <mesh key={index} position={bar.pos}>
          <boxGeometry args={bar.args} />
          <meshBasicMaterial color={accent} transparent opacity={opacity} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Sculpture({ concept, progress }: ModelProps) {
  const frames = useRef<Array<THREE.Group | null>>([]);
  const cover = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const p = progress.current;
    const open = smoothstep(0.55, 0.8, p);
    frames.current.forEach((frame, index) => {
      if (!frame) return;
      const dir = index === 0 ? 0 : index % 2 === 0 ? 1 : -1;
      frame.position.x = open * dir * (1.3 + index * 0.32);
      frame.position.y = 1.6 + open * dir * 0.18;
      frame.rotation.y = state.clock.elapsedTime * (0.06 + index * 0.015) + open * dir * 0.55;
      frame.rotation.z = open * dir * 0.22;
    });
    if (cover.current) {
      const openCover = smoothstep(0.58, 0.78, p);
      cover.current.position.y = 1.7 + openCover * 4.6;
    }
  });

  return (
    <group>
      <ProductCore size={concept.productSize * 0.78} accent={concept.accent} position={[0, 0.06, 0]} />
      <mesh ref={cover} position={[0, 1.7, 1.05]}>
        <boxGeometry args={[concept.productSize * 1.34, concept.productSize * 1.55, 0.08]} />
        <meshStandardMaterial color="#0b0e0f" roughness={0.6} metalness={0.3} />
      </mesh>
      {[
        { pos: [0, 1.7, 0.1] as [number, number, number], size: [3.1, 2.9] as [number, number], rot: [0, 0, 0] as [number, number, number] },
        { pos: [0, 1.7, -0.2] as [number, number, number], size: [3.7, 2.4] as [number, number], rot: [0, 0.5, 0] as [number, number, number] },
        { pos: [0, 1.85, 0.4] as [number, number, number], size: [2.5, 3.5] as [number, number], rot: [0, -0.45, 0] as [number, number, number] },
        { pos: [0, 1.5, -0.4] as [number, number, number], size: [4.1, 2.1] as [number, number], rot: [0, 0.8, 0] as [number, number, number] },
      ].map((frame, index) => (
        <group
          key={index}
          ref={(node) => { frames.current[index] = node; }}
          position={frame.pos}
          rotation={frame.rot}
        >
          <FrameOutline accent={concept.accent} size={frame.size} opacity={0.75 - index * 0.1} />
        </group>
      ))}
      <FogSheet accent={concept.accent} position={[0, 0.05, 0]} scale={[6, 5]} opacity={0.12} />
      <Callout position={[1.5, 3.15, 0.9]} label="TUBE FRAME / 4 LAYERS" at={0.1} until={0.58} />
      <Callout position={[-1.5, 4.5, 1.1]} label="STEEL COVER / HOISTED 2.4 M" at={0.42} until={0.8} side="left" />
      <Callout position={[0.15, 1.35, 1.35]} label="PRODUCT / 4×4 FT" at={0.78} />
    </group>
  );
}

function Drop({ concept, progress }: ModelProps) {
  const module = useRef<THREE.Group>(null);
  const cableRefs = useRef<Array<THREE.Mesh | null>>([]);
  const doors = useRef<Array<THREE.Group | null>>([]);
  const landing = useRef<THREE.Mesh>(null);
  const moduleY = useRef(7.2);

  useFrame((state) => {
    const p = progress.current;
    const descend = smoothstep(0.1, 0.48, p);
    moduleY.current = 7.2 - descend * 6.02;
    if (module.current) module.current.position.y = moduleY.current;
    const top = moduleY.current + 1.18;
    cableRefs.current.forEach((cable) => {
      if (!cable) return;
      cable.position.y = (8.24 + top) / 2 - moduleY.current;
      cable.scale.y = Math.max(0.04, 8.24 - top);
    });
    const open = smoothstep(0.53, 0.78, p);
    if (doors.current[0]) doors.current[0].rotation.y = -open * (Math.PI / 2);
    if (doors.current[1]) doors.current[1].rotation.y = open * (Math.PI / 2);
    if (landing.current) {
      const material = landing.current.material as THREE.MeshBasicMaterial;
      material.opacity = smoothstep(0.42, 0.55, p) * (0.32 + Math.sin(state.clock.elapsedTime * 2.2) * 0.05);
    }
  });

  return (
    <group>
      <Truss accent={concept.accent} width={9.6} height={8.7} position={[0, 0, -0.1]} />

      <group position={[0, 8.12, -0.1]}>
        {[-1.32, 1.32].map((z) => (
          <mesh key={z} position={[0, 0, z]}>
            <boxGeometry args={[3.7, 0.16, 0.16]} />
            <meshStandardMaterial color="#1a1c1b" metalness={0.9} roughness={0.3} />
          </mesh>
        ))}
        {[-1.25, 1.25].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <boxGeometry args={[0.16, 0.16, 2.8]} />
            <meshStandardMaterial color="#1a1c1b" metalness={0.9} roughness={0.3} />
          </mesh>
        ))}
        {[-1.25, 1.25].map((x) => [-1.32, 1.32].map((z) => (
          <group key={`${x}-${z}`} position={[x, -0.16, z]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.11, 0.11, 0.22, 14]} />
              <meshStandardMaterial color="#232524" metalness={0.88} roughness={0.32} />
            </mesh>
            <mesh position={[0, -0.12, 0]}>
              <boxGeometry args={[0.18, 0.1, 0.14]} />
              <meshStandardMaterial color="#151716" metalness={0.7} roughness={0.42} />
            </mesh>
          </group>
        )))}
      </group>

      <group ref={module} position={[0, 7.2, 0]}>
        <mesh position={[0, 0, -1.44]} castShadow>
          <boxGeometry args={[3.3, 2.3, 0.09]} />
          <meshStandardMaterial color="#0a0c0d" metalness={0.58} roughness={0.4} />
        </mesh>
        {[-1.6, 1.6].map((x) => (
          <mesh key={x} position={[x, 0, -0.1]} castShadow>
            <boxGeometry args={[0.09, 2.3, 2.8]} />
            <meshStandardMaterial color="#0b0d0e" metalness={0.56} roughness={0.42} />
          </mesh>
        ))}
        {[-1.25, 1.25].map((x) => [-1.32, 1.32].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, -1.24, z]}>
            <cylinderGeometry args={[0.1, 0.12, 0.14, 12]} />
            <meshStandardMaterial color="#24221d" metalness={0.7} roughness={0.44} />
          </mesh>
        )))}
        <mesh position={[0, 1.1, -0.1]}>
          <boxGeometry args={[3.4, 0.16, 3.0]} />
          <meshStandardMaterial color="#16130f" metalness={0.74} roughness={0.3} />
        </mesh>
        <mesh position={[0, -1.1, -0.1]}>
          <boxGeometry args={[3.4, 0.16, 3.0]} />
          <meshStandardMaterial color="#16130f" metalness={0.74} roughness={0.3} />
        </mesh>
        <ProductCore size={2.05} accent={concept.accent} position={[0, -1.0, 0]} />
        <group ref={(node) => { doors.current[0] = node; }} position={[-1.62, 0, 1.35]}>
          <mesh position={[0.8, 0, 0]}>
            <boxGeometry args={[1.56, 2.15, 0.1]} />
            <meshStandardMaterial color="#0d0e0f" metalness={0.5} roughness={0.44} />
          </mesh>
        </group>
        <group ref={(node) => { doors.current[1] = node; }} position={[1.62, 0, 1.35]}>
          <mesh position={[-0.8, 0, 0]}>
            <boxGeometry args={[1.56, 2.15, 0.1]} />
            <meshStandardMaterial color="#0d0e0f" metalness={0.5} roughness={0.44} />
          </mesh>
        </group>
        <mesh position={[0, 0, 1.42]}>
          <boxGeometry args={[0.06, 0.1, 0.04]} />
          <meshBasicMaterial color={concept.accent} toneMapped={false} />
        </mesh>
        {[
          [-1.25, 1.32],
          [1.25, 1.32],
          [-1.25, -1.32],
          [1.25, -1.32],
        ].map(([x, z], index) => (
          <mesh
            key={index}
            ref={(node) => { cableRefs.current[index] = node; }}
            position={[x, 5, z]}
          >
            <cylinderGeometry args={[0.012, 0.012, 1, 6]} />
            <meshBasicMaterial color="#b3a78c" transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
      <mesh ref={landing} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 2.15, 64]} />
        <meshBasicMaterial color={concept.accent} transparent opacity={0.3} side={THREE.DoubleSide} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <FogSheet accent={concept.accent} position={[0, 0.05, 0]} scale={[7, 5]} opacity={0.14} />
      <StageBeam accent={concept.accent} progress={progress} position={[0, 4.2, 0]} radius={1.3} opacity={0.022} />
      <Callout position={[2.1, 8.05, 0.4]} label="4-POINT WINCH / 2.0 T" at={0.04} until={0.5} />
      <Callout position={[-1.95, 2.3, 1.1]} label="CARGO SHELL / 2.35 M" at={0.2} until={0.64} side="left" />
      <Callout position={[0.2, 1.05, 1.5]} label="PRODUCT CHAMBER" at={0.68} />
    </group>
  );
}

function Phantom({ concept, progress }: ModelProps) {
  const holo = useRef<THREE.Group>(null);
  const cover = useRef<THREE.Mesh>(null);
  const glass = useRef<THREE.MeshPhysicalMaterial>(null);

  useFrame((state) => {
    const p = progress.current;
    const dissolve = smoothstep(0.52, 0.7, p);
    if (holo.current) {
      holo.current.rotation.y = state.clock.elapsedTime * 0.45;
      holo.current.scale.setScalar(1 - dissolve * 0.95);
      holo.current.position.y = 2.05 + Math.sin(state.clock.elapsedTime * 0.9) * 0.04 + dissolve * 0.3;
    }
    if (cover.current) {
      const open = smoothstep(0.62, 0.82, p);
      cover.current.position.y = 1.4 - open * 3.2;
    }
    if (glass.current) {
      glass.current.opacity = 0.14 - dissolve * 0.07;
    }
  });

  return (
    <group>
      <group position={[0, 0, 0]}>
        <mesh position={[0, 2.05, -1.35]}>
          <boxGeometry args={[3.4, 4.1, 0.12]} />
          <meshStandardMaterial color="#050708" roughness={0.78} metalness={0.24} />
        </mesh>
        <mesh position={[-1.65, 2.05, -0.25]}>
          <boxGeometry args={[0.12, 4.1, 2.3]} />
          <meshStandardMaterial color="#080a0b" roughness={0.7} metalness={0.3} />
        </mesh>
        <mesh position={[1.65, 2.05, -0.25]}>
          <boxGeometry args={[0.12, 4.1, 2.3]} />
          <meshStandardMaterial color="#080a0b" roughness={0.7} metalness={0.3} />
        </mesh>
        <mesh position={[0, 4.12, -0.25]}>
          <boxGeometry args={[3.4, 0.12, 2.3]} />
          <meshStandardMaterial color="#080a0b" roughness={0.7} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.04, -0.25]}>
          <boxGeometry args={[3.4, 0.1, 2.3]} />
          <meshStandardMaterial color="#080a0b" roughness={0.7} metalness={0.3} />
        </mesh>

        <ProductCore size={1.85} accent={concept.accent} position={[0, 0.06, -1.05]} />
        <mesh ref={cover} position={[0, 1.4, -0.52]}>
          <boxGeometry args={[2.7, 2.85, 0.08]} />
          <meshStandardMaterial color="#07090a" metalness={0.35} roughness={0.58} />
        </mesh>

        <mesh position={[0, 1.9, 0.52]} rotation={[-Math.PI / 4, 0, 0]}>
          <planeGeometry args={[2.9, 2.9]} />
          <meshPhysicalMaterial
            ref={glass}
            color="#c9e6e0"
            transparent
            opacity={0.14}
            roughness={0.06}
            metalness={0.05}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0, 0.25, 0.75]}>
          <boxGeometry args={[0.6, 0.22, 0.45]} />
          <meshStandardMaterial color="#0d1011" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.4, 0.75]}>
          <boxGeometry args={[0.12, 0.02, 0.12]} />
          <meshBasicMaterial color={concept.accent} toneMapped={false} />
        </mesh>
        <mesh position={[0, 1.35, 0.62]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[1.25, 2.7, 32, 1, true]} />
          <meshBasicMaterial color={concept.accent} transparent opacity={0.035} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      <group ref={holo} position={[0, 2.05, 0.55]}>
        <mesh>
          <icosahedronGeometry args={[0.62, 1]} />
          <meshBasicMaterial color={concept.accent} wireframe transparent opacity={0.7} toneMapped={false} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[0.38, 0]} />
          <meshBasicMaterial color="#e9fff9" transparent opacity={0.24} toneMapped={false} />
        </mesh>
        {[0.8, 1.05].map((radius, index) => (
          <mesh key={radius} rotation={[Math.PI / 2 + index * 0.4, index * 0.5, 0]}>
            <torusGeometry args={[radius, 0.008, 6, 48]} />
            <meshBasicMaterial color={concept.accent} transparent opacity={0.38} toneMapped={false} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
      </group>
      <FogSheet accent={concept.accent} position={[0, 0.05, 0]} scale={[5, 4]} opacity={0.08} />
      <Callout position={[1.35, 3.1, 0.95]} label="MIRROR FACE / LIGHT TRAP" at={0.1} until={0.56} />
      <Callout position={[-1.15, 2.35, 1.0]} label="LIVE PROJECTION / 1:1" at={0.26} until={0.62} side="left" />
      <Callout position={[0.15, 1.15, 0.9]} label="PRODUCT CHAMBER" at={0.72} />
    </group>
  );
}

function StageProduct({ concept, progress }: ModelProps) {
  const doors = useRef<Array<THREE.Group | null>>([]);
  const arch = useRef<THREE.Group>(null);

  useFrame((state) => {
    const p = progress.current;
    const open = smoothstep(0.55, 0.8, p);
    doors.current.forEach((door, index) => {
      if (!door) return;
      door.position.x = (index === 0 ? -1 : 1) * open * 1.45;
    });
    if (arch.current) {
      arch.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.18) * 0.012;
    }
  });

  return (
    <group>
      <group ref={arch}>
        <mesh position={[0, 3.1, -3.5]}>
          <boxGeometry args={[12.6, 6.2, 0.25]} />
          <meshStandardMaterial color="#07090a" metalness={0.45} roughness={0.52} />
        </mesh>
        <mesh position={[-5.9, 3.1, -1.8]}>
          <boxGeometry args={[0.45, 6.2, 3.4]} />
          <meshStandardMaterial color="#0b0c0d" metalness={0.6} roughness={0.36} />
        </mesh>
        <mesh position={[5.9, 3.1, -1.8]}>
          <boxGeometry args={[0.45, 6.2, 3.4]} />
          <meshStandardMaterial color="#0b0c0d" metalness={0.6} roughness={0.36} />
        </mesh>
        <mesh position={[0, 6.22, -1.8]}>
          <boxGeometry args={[12.2, 0.45, 3.4]} />
          <meshStandardMaterial color="#0b0c0d" metalness={0.6} roughness={0.36} />
        </mesh>
        {[-4.3, -2.1, 2.1, 4.3].map((x) => (
          <mesh key={x} position={[x, 3.1, -1.55]}>
            <boxGeometry args={[0.035, 5.7, 0.035]} />
            <meshBasicMaterial color={concept.accent} transparent opacity={0.5} toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0, 5.85, -1.52]}>
          <boxGeometry args={[10.5, 0.025, 0.025]} />
          <meshBasicMaterial color={concept.accent} transparent opacity={0.55} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.08, -0.7]}>
          <boxGeometry args={[4.6, 0.2, 3.2]} />
          <meshStandardMaterial color="#0a0d0e" metalness={0.7} roughness={0.3} />
        </mesh>
        <ProductCore size={2.2} accent={concept.accent} position={[0, 0.12, -0.55]} />
      </group>

      <group ref={(node) => { doors.current[0] = node; }} position={[-0.9, 0, 0.65]}>
        <mesh>
          <boxGeometry args={[1.85, 3.5, 0.12]} />
          <meshStandardMaterial color="#090b0c" metalness={0.4} roughness={0.5} />
        </mesh>
      </group>
      <group ref={(node) => { doors.current[1] = node; }} position={[0.9, 0, 0.65]}>
        <mesh>
          <boxGeometry args={[1.85, 3.5, 0.12]} />
          <meshStandardMaterial color="#090b0c" metalness={0.4} roughness={0.5} />
        </mesh>
      </group>
      <StageBeam accent={concept.accent} progress={progress} position={[0, 3.4, 0.8]} radius={1.5} opacity={0.02} />
      <Callout position={[-3.6, 5.4, -0.4]} label="SCENIC ARCH / 12.6 M" at={0.1} until={0.56} side="left" />
      <Callout position={[1.55, 2.35, 1.25]} label="SLIDING FACES / 2" at={0.36} until={0.74} />
      <Callout position={[0.15, 1.35, 1.25]} label="PRODUCT / 4×4 FT" at={0.78} />
    </group>
  );
}

function LaserSegment({
  from,
  to,
  color,
  delay,
  progress,
}: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  delay: number;
  progress: React.MutableRefObject<number>;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const start = useMemo(() => new THREE.Vector3(...from), [from]);
  const end = useMemo(() => new THREE.Vector3(...to), [to]);
  const mid = useMemo(() => start.clone().add(end).multiplyScalar(0.5), [start, end]);
  const length = useMemo(() => start.distanceTo(end), [start, end]);
  const quaternion = useMemo(() => {
    const direction = end.clone().sub(start).normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  }, [start, end]);

  useFrame(() => {
    if (!mesh.current) return;
    const material = mesh.current.material as THREE.MeshBasicMaterial;
    const p = progress.current;
    material.opacity = p > delay && p < 0.61 ? 0.85 : p >= 0.61 ? 0.14 : 0;
  });

  return (
    <mesh ref={mesh} position={mid} quaternion={quaternion}>
      <cylinderGeometry args={[0.014, 0.014, length, 6]} />
      <meshBasicMaterial color={color} transparent opacity={0.85} toneMapped={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

function LaserDraw({ concept, progress }: ModelProps) {
  const panels = useRef<Array<THREE.Group | null>>([]);
  const sensorBeam = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const p = progress.current;
    const open = smoothstep(0.66, 0.88, p);
    if (panels.current[0]) panels.current[0].position.x = -open * 1.7;
    if (panels.current[1]) panels.current[1].position.x = open * 1.7;
    if (sensorBeam.current) {
      const material = sensorBeam.current.material as THREE.MeshBasicMaterial;
      material.opacity = p < 0.5 ? 0.65 : 0;
    }
  });

  const lines: Array<{ from: [number, number, number]; to: [number, number, number]; delay: number }> = [
    { from: [-1.7, 0.2, 0.1], to: [-1.7, 3.3, 0.1], delay: 0.1 },
    { from: [1.7, 0.2, 0.1], to: [1.7, 3.3, 0.1], delay: 0.14 },
    { from: [-1.7, 3.3, 0.1], to: [1.7, 3.3, 0.1], delay: 0.2 },
    { from: [-1.7, 0.2, 0.1], to: [1.7, 0.2, 0.1], delay: 0.24 },
    { from: [-1.95, 0.45, -0.5], to: [1.95, 0.45, -0.5], delay: 0.3 },
    { from: [-1.95, 0.45, -0.5], to: [-1.95, 3.05, -0.5], delay: 0.34 },
    { from: [1.95, 0.45, -0.5], to: [1.95, 3.05, -0.5], delay: 0.38 },
    { from: [-1.95, 3.05, -0.5], to: [1.95, 3.05, -0.5], delay: 0.42 },
    { from: [-1.7, 0.2, 0.1], to: [-1.95, 0.45, -0.5], delay: 0.46 },
    { from: [1.7, 0.2, 0.1], to: [1.95, 0.45, -0.5], delay: 0.5 },
    { from: [-1.7, 3.3, 0.1], to: [-1.95, 3.05, -0.5], delay: 0.54 },
    { from: [1.7, 3.3, 0.1], to: [1.95, 3.05, -0.5], delay: 0.57 },
  ];

  return (
    <group>
      <ProductCore size={concept.productSize * 0.75} accent={concept.accent} position={[0, 0.06, -0.3]} />
      {lines.map((line, index) => (
        <LaserSegment key={index} {...line} color={concept.accent} progress={progress} />
      ))}
      <group ref={(node) => { panels.current[0] = node; }} position={[-0.9, 0, 0.6]}>
        <mesh>
          <boxGeometry args={[1.8, 3.4, 0.12]} />
          <meshStandardMaterial color="#07090a" metalness={0.38} roughness={0.55} />
        </mesh>
      </group>
      <group ref={(node) => { panels.current[1] = node; }} position={[0.9, 0, 0.6]}>
        <mesh>
          <boxGeometry args={[1.8, 3.4, 0.12]} />
          <meshStandardMaterial color="#07090a" metalness={0.38} roughness={0.55} />
        </mesh>
      </group>

      <group position={[-4.2, 0, 2.1]}>
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[0.18, 1.1, 0.18]} />
          <meshStandardMaterial color="#0d1011" metalness={0.65} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.15, 0]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshBasicMaterial color={concept.accent} toneMapped={false} />
        </mesh>
        <mesh position={[0.1, 1.15, 0]}>
          <boxGeometry args={[0.14, 0.01, 0.01]} />
          <meshBasicMaterial color={concept.accent} toneMapped={false} />
        </mesh>
      </group>
      <mesh ref={sensorBeam} position={[-3.1, 1.15, 2.1]}>
        <boxGeometry args={[2.1, 0.012, 0.012]} />
        <meshBasicMaterial color={concept.accent} transparent opacity={0.65} toneMapped={false} />
      </mesh>
      <FogSheet accent={concept.accent} position={[0, 0.05, 0]} scale={[9, 7]} opacity={0.2} />
      <Callout position={[-3.35, 1.75, 2.4]} label="LASER HEAD / 14 W" at={0.06} until={0.46} side="left" />
      <Callout position={[1.9, 3.45, 1.1]} label="DRAWN FRAME / 3.3 M" at={0.28} until={0.68} />
      <Callout position={[0.2, 1.3, 1.45]} label="PRODUCT / 6×6 FT" at={0.76} />
    </group>
  );
}

function ColourRelease({ concept, progress }: ModelProps) {
  const drape = useRef<THREE.Group>(null);
  const confetti = useRef<THREE.InstancedMesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const pieces = useMemo(
    () =>
      Array.from({ length: 150 }).map((_, index) => ({
        offset: new THREE.Vector3((Math.random() - 0.5) * 10, Math.random() * 6, (Math.random() - 0.5) * 7),
        speed: 0.5 + Math.random() * 1.1,
        spin: Math.random() * Math.PI,
        color: ['#E8D9B8', '#6FE7D8', '#C9A86A', '#D97757', '#F3EFE6'][index % 5],
      })),
    [],
  );

  useEffect(() => {
    if (!confetti.current) return;
    pieces.forEach((piece, index) => {
      confetti.current!.setColorAt(index, new THREE.Color(piece.color));
    });
    if (confetti.current.instanceColor) confetti.current.instanceColor.needsUpdate = true;
  }, [pieces]);

  useFrame((state) => {
    const p = progress.current;
    const open = smoothstep(0.55, 0.72, p);
    const time = state.clock.elapsedTime;
    if (drape.current) {
      drape.current.position.y = open * 5.2;
    }
    if (light.current) {
      light.current.intensity = open * 18;
    }
    if (confetti.current) {
      pieces.forEach((piece, index) => {
        const burst = Math.max(0, p - 0.6);
        const fall = burst * 5.8 * piece.speed;
        dummy.position.set(
          piece.offset.x + Math.sin(time * 0.9 + piece.spin) * burst * 1.1,
          piece.offset.y + burst * 4.2 - fall * 0.52,
          piece.offset.z + Math.cos(time * 0.7 + piece.spin) * burst * 0.7,
        );
        dummy.rotation.set(time * piece.speed + piece.spin, time * 0.4, piece.spin);
        dummy.scale.setScalar(burst > 0 ? 1 : 0.001);
        dummy.updateMatrix();
        confetti.current!.setMatrixAt(index, dummy.matrix);
      });
      confetti.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <ProductCore size={concept.productSize * 0.8} accent={concept.accent} position={[0, 0.06, 0]} />
      <group ref={drape} position={[0, 0, 0.85]}>
        <mesh position={[0, 1.65, 0]} castShadow>
          <boxGeometry args={[3.5, 3.3, 0.06]} />
          <meshStandardMaterial color="#d8d4c8" roughness={0.9} metalness={0.02} />
        </mesh>
        {Array.from({ length: 10 }).map((_, index) => (
          <mesh key={index} position={[-1.58 + index * 0.35, 1.65, 0.04]}>
            <boxGeometry args={[0.02, 3.28, 0.012]} />
            <meshBasicMaterial color="#8e8b81" transparent opacity={0.32} />
          </mesh>
        ))}
      </group>

      <group position={[-3.8, 0, 2.25]}>
        <mesh position={[0, 0.48, 0]}>
          <boxGeometry args={[0.85, 0.96, 0.65]} />
          <meshStandardMaterial color="#0a0d0e" metalness={0.62} roughness={0.34} />
        </mesh>
        <mesh position={[0, 0.98, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.2, 32]} />
          <meshBasicMaterial color="#E8D9B8" toneMapped={false} />
        </mesh>
      </group>

      <pointLight ref={light} position={[0, 2.5, 2]} color="#E8D9B8" intensity={0} distance={10} />

      <mesh position={[0, 5.62, 0.85]}>
        <boxGeometry args={[5.4, 0.16, 0.16]} />
        <meshStandardMaterial color="#1a1c1d" metalness={0.9} roughness={0.32} />
      </mesh>
      {[-2.2, 2.2].map((x) => (
        <mesh key={x} position={[x, 7.0, 0.85]}>
          <cylinderGeometry args={[0.012, 0.012, 2.8, 6]} />
          <meshStandardMaterial color="#2a2c2b" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}

      <instancedMesh ref={confetti} args={[undefined, undefined, 150]}>
        <planeGeometry args={[0.08, 0.035]} />
        <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} />
      </instancedMesh>

      <Callout position={[-1.35, 4.35, 1.2]} label="FLOWN DRAPE / 5.2 M" at={0.1} until={0.52} side="left" />
      <Callout position={[-3.8, 1.5, 2.45]} label="AIR CANNON / 6-WAY" at={0.4} until={0.8} side="left" />
      <Callout position={[0.15, 1.3, 1.45]} label="PRODUCT / 4×4 FT" at={0.78} />
    </group>
  );
}

function Ignition({ concept, progress }: ModelProps) {
  const curve = useMemo(
    () =>
      makePath([
        [-3.55, 1.15, 2.45],
        [-3.55, 0.04, 2.45],
        [-2.4, 0.04, 1.8],
        [-0.7, 0.04, 0.9],
        [0.1, 0.04, -0.3],
        [0.1, 1.7, -3.9],
      ]),
    [],
  );
  const lift = useRef<THREE.Group>(null);
  const dot = useRef<THREE.Mesh>(null);
  const cube = useRef<THREE.Group>(null);
  const cubeGlow = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const p = progress.current;
    const travel = smoothstep(0.26, 0.55, p);
    const point = curve.getPointAt(travel);
    if (dot.current) {
      dot.current.position.copy(point);
      dot.current.visible = p > 0.23 && p < 0.64;
    }
    if (lift.current) {
      const rise = smoothstep(0.62, 0.9, p);
      lift.current.position.y = LIFT_START + rise * 2.28;
    }
    if (cube.current) {
      cube.current.rotation.y = 0.35 + Math.sin(state.clock.elapsedTime * 0.6) * 0.12;
    }
    if (cubeGlow.current) {
      cubeGlow.current.opacity = 0.22 + Math.sin(state.clock.elapsedTime * 2.1) * 0.06 + smoothstep(0.1, 0.3, p) * 0.25;
    }
  });

  return (
    <group>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.72, 1.95, 64]} />
        <meshBasicMaterial color={concept.accent} transparent opacity={0.34} side={THREE.DoubleSide} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <group ref={lift} position={[0, LIFT_START, 0]}>
        <mesh position={[0, -0.14, 0]}>
          <cylinderGeometry args={[1.66, 1.66, 0.26, 48]} />
          <meshStandardMaterial color="#0a0d0e" metalness={0.68} roughness={0.32} />
        </mesh>
        <ProductCore size={concept.productSize * 0.78} accent={concept.accent} position={[0, 0.04, 0]} />
      </group>

      <group ref={cube} position={[-3.55, 0, 2.45]}>
        <mesh position={[0, 0.48, 0]}>
          <boxGeometry args={[0.62, 0.9, 0.62]} />
          <meshPhysicalMaterial color="#0b1818" metalness={0.3} roughness={0.18} transparent opacity={0.7} />
        </mesh>
        <mesh position={[0, 0.48, 0]}>
          <boxGeometry args={[0.34, 0.58, 0.34]} />
          <meshBasicMaterial ref={cubeGlow} color={concept.accent} transparent opacity={0.3} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.96, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.17, 0.25, 40]} />
          <meshBasicMaterial color={concept.accent} transparent opacity={0.55} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>

      <mesh>
        <tubeGeometry args={[curve, 120, 0.022, 6, false]} />
        <meshBasicMaterial color={concept.accent} transparent opacity={0.18} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={dot}>
        <sphereGeometry args={[0.085, 16, 16]} />
        <meshBasicMaterial color="#f7fffb" toneMapped={false} />
      </mesh>

      <FogSheet accent={concept.accent} position={[0, 0.055, 0]} scale={[7, 5]} opacity={0.18} />
      <StageBeam accent={concept.accent} progress={progress} position={[0, 3.2, 0]} radius={1.1} opacity={0.03} />
      <Callout position={[-3.55, 1.35, 2.6]} label="CHARGE CUBE / GUEST" at={0.06} until={0.42} side="left" />
      <Callout position={[-1.95, 0.55, 1.55]} label="CONDUIT / 5.2 M" at={0.24} until={0.62} />
      <Callout position={[1.7, 1.95, 1.1]} label="HERO LIFT / 2.28 M" at={0.58} until={0.92} />
      <Callout position={[0.15, 1.2, 1.4]} label="PRODUCT / 6×6 FT" at={0.9} />
    </group>
  );
}

function Trilogy({ concept, progress }: ModelProps) {
  const products = [
    { x: -4.2, size: 1.4, label: '2×2' },
    { x: 0, size: 2.2, label: '4×4' },
    { x: 4.4, size: 3.2, label: '6×6' },
  ];
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.01;
  });

  return (
    <group ref={group}>
      {products.map((product) => (
        <group key={product.label} position={[product.x, 0, 0]}>
          <ProductCore size={product.size} accent={concept.accent} position={[0, 0.06, 0]} />
          <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[product.size * 0.95, product.size * 1.15, 64]} />
            <meshBasicMaterial color={concept.accent} transparent opacity={0.3} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
          <StageBeam
            accent={concept.accent}
            progress={progress}
            position={[0, 2.8, 0]}
            radius={product.size * 0.42}
            opacity={0.012}
          />
        </group>
      ))}
      <Callout position={[-4.2, 1.85, 1.1]} label="2×2 FT / ACT I" at={0.12} until={0.5} side="left" />
      <Callout position={[0, 2.45, 1.1]} label="4×4 FT / ACT II" at={0.34} until={0.72} />
      <Callout position={[4.4, 3.3, 1.1]} label="6×6 FT / ACT III" at={0.56} side="right" />
    </group>
  );
}

function makePleatTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createLinearGradient(0, 0, 512, 0);
    for (let i = 0; i <= 48; i += 1) {
      const t = i / 48;
      const fold = 0.62 + Math.sin(t * Math.PI * 2 * 9) * 0.26 + Math.sin(t * Math.PI * 2 * 3) * 0.08;
      const value = Math.round(Math.min(1, Math.max(0, fold)) * 255);
      gradient.addColorStop(t, `rgb(${value},${value},${value})`);
    }
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 32);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function Kabuki({ concept, progress }: ModelProps) {
  const cloth = useRef<THREE.Group>(null);
  const pile = useRef<THREE.Mesh>(null);
  const pleat = useMemo(() => makePleatTexture(), []);
  const grain = useMemo(() => getRoughnessTexture(), []);

  useFrame(() => {
    const p = progress.current;
    const drop = smoothstep(0.5, 0.63, p);
    if (cloth.current) {
      cloth.current.position.y = THREE.MathUtils.lerp(3.0, 0.2, drop);
      cloth.current.position.x = Math.sin(drop * Math.PI) * 0.08;
      cloth.current.scale.y = THREE.MathUtils.lerp(1, 0.06, drop);
      cloth.current.rotation.z = Math.sin(drop * Math.PI) * 0.015;
      cloth.current.visible = drop < 0.999;
    }
    if (pile.current) {
      const material = pile.current.material as THREE.MeshStandardMaterial;
      material.opacity = smoothstep(0.55, 0.68, p) * 0.7;
      pile.current.visible = p > 0.53;
    }
  });

  const headerY = 6.05;

  return (
    <group>
      <group position={[0, headerY, 1.0]}>
        <mesh>
          <boxGeometry args={[8.1, 0.18, 0.18]} />
          <meshStandardMaterial color="#1c1e1d" metalness={0.9} roughness={0.32} />
        </mesh>
        {[-3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5].map((x) => (
          <group key={x} position={[x, -0.14, 0]}>
            <mesh>
              <boxGeometry args={[0.1, 0.2, 0.16]} />
              <meshStandardMaterial color="#26282a" metalness={0.86} roughness={0.3} />
            </mesh>
            <mesh position={[0, -0.06, 0.06]}>
              <boxGeometry args={[0.03, 0.03, 0.03]} />
              <meshBasicMaterial color={concept.accent} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>

      {[-4.32, 4.32].map((x) => (
        <group key={x} position={[x, 0, 1.0]}>
          <mesh position={[0, 0.03, 0]}>
            <boxGeometry args={[0.72, 0.06, 0.72]} />
            <meshStandardMaterial color="#101314" metalness={0.8} roughness={0.38} />
          </mesh>
          <mesh position={[0, 3.2, 0]}>
            <boxGeometry args={[0.16, 6.4, 0.16]} />
            <meshStandardMaterial color="#1a1d1e" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[0, 6.44, 0]}>
            <boxGeometry args={[0.3, 0.1, 0.3]} />
            <meshStandardMaterial color="#2a2c2b" metalness={0.9} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.24, 0]}>
            <boxGeometry args={[0.18, 0.04, 0.18]} />
            <meshBasicMaterial color={concept.accent} transparent opacity={0.5} toneMapped={false} />
          </mesh>
        </group>
      ))}

      <group ref={cloth} position={[0, 3.0, 0.94]}>
        <mesh castShadow>
          <planeGeometry args={[7.4, 5.9]} />
          <meshStandardMaterial
            color="#e2dbc9"
            map={pleat}
            roughnessMap={grain}
            roughness={0.94}
            metalness={0.02}
            side={THREE.DoubleSide}
            envMapIntensity={0.5}
          />
        </mesh>
        <mesh position={[0, -2.9, 0.01]}>
          <boxGeometry args={[7.4, 0.07, 0.05]} />
          <meshStandardMaterial color="#8e8877" metalness={0.4} roughness={0.6} />
        </mesh>
      </group>

      <mesh ref={pile} position={[0, 0.05, 1.5]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <planeGeometry args={[4.6, 1.05]} />
        <meshStandardMaterial color="#8d8779" roughness={1} metalness={0.02} transparent opacity={0} />
      </mesh>

      <ProductCore size={concept.productSize * 0.82} accent={concept.accent} position={[0, 0.06, -0.1]} />
      <HazeRing accent={concept.accent} progress={progress} radius={2.7} />
      <StageBeam accent={concept.accent} progress={progress} position={[0, 3.4, 0.1]} radius={1.35} opacity={0.018} />

      <Callout position={[-2.2, 3.5, 1.3]} label="KABUKI DROP / 7.4 × 5.9 M" at={0.08} until={0.52} side="left" />
      <Callout position={[2.1, 5.75, 1.15]} label="QUICK-RELEASE / 8 SOLENOIDS" at={0.24} until={0.6} />
      <Callout position={[2.4, 2.2, 1.35]} label="RELEASE TO FLOOR / 0.8 S" at={0.46} until={0.72} />
      <Callout position={[0.15, 1.3, 1.5]} label="PRODUCT / 6×6 FT" at={0.78} />
    </group>
  );
}

function FlyBar({ concept, progress }: ModelProps) {
  const header = useRef<THREE.Group>(null);
  const chainL = useRef<THREE.Mesh>(null);
  const chainR = useRef<THREE.Mesh>(null);
  const pleat = useMemo(() => makePleatTexture(), []);
  const grain = useMemo(() => getRoughnessTexture(), []);

  const top = 6.85;
  const lowY = 3.45;
  const highY = 6.05;

  useFrame(() => {
    const p = progress.current;
    const lift = smoothstep(0.4, 0.86, p);
    const y = THREE.MathUtils.lerp(lowY, highY, lift);
    if (header.current) header.current.position.y = y;
    [chainL, chainR].forEach((ref) => {
      const mesh = ref.current;
      if (!mesh) return;
      const length = Math.max(0.04, top - y);
      mesh.position.y = (top + y) / 2;
      mesh.scale.y = length;
    });
  });

  return (
    <group>
      {[-3.9, 3.9].map((x) => (
        <group key={x} position={[x, 0, 0.95]}>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[0.86, 0.08, 0.86]} />
            <meshStandardMaterial color="#101314" metalness={0.8} roughness={0.38} />
          </mesh>
          <mesh position={[0, 3.45, 0]}>
            <boxGeometry args={[0.19, 6.9, 0.19]} />
            <meshStandardMaterial color="#1b1e1f" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[0, 6.6, 0]}>
            <boxGeometry args={[0.34, 0.3, 0.34]} />
            <meshStandardMaterial color="#26282a" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[0.19, 6.6, 0]}>
            <boxGeometry args={[0.03, 0.12, 0.12]} />
            <meshBasicMaterial color={concept.accent} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.22, 0.04, 0.22]} />
            <meshBasicMaterial color={concept.accent} transparent opacity={0.45} toneMapped={false} />
          </mesh>
        </group>
      ))}

      <mesh ref={chainL} position={[-3.9, (top + lowY) / 2, 0.95]}>
        <cylinderGeometry args={[0.018, 0.018, 1, 6]} />
        <meshStandardMaterial color="#3a3d3c" metalness={0.95} roughness={0.4} />
      </mesh>
      <mesh ref={chainR} position={[3.9, (top + lowY) / 2, 0.95]}>
        <cylinderGeometry args={[0.018, 0.018, 1, 6]} />
        <meshStandardMaterial color="#3a3d3c" metalness={0.95} roughness={0.4} />
      </mesh>

      <group ref={header} position={[0, lowY, 0.95]}>
        <mesh castShadow>
          <boxGeometry args={[7.7, 0.2, 0.2]} />
          <meshStandardMaterial color="#1c1e1d" metalness={0.9} roughness={0.32} />
        </mesh>
        <mesh position={[0, -1.7, 0]}>
          <planeGeometry args={[7.5, 3.4]} />
          <meshStandardMaterial
            color="#ded7c6"
            map={pleat}
            roughnessMap={grain}
            roughness={0.94}
            metalness={0.02}
            side={THREE.DoubleSide}
            envMapIntensity={0.5}
          />
        </mesh>
        <mesh position={[0, -3.39, 0.01]}>
          <boxGeometry args={[7.5, 0.07, 0.06]} />
          <meshStandardMaterial color="#8b8574" metalness={0.4} roughness={0.6} />
        </mesh>
      </group>

      <ProductCore size={concept.productSize * 0.8} accent={concept.accent} position={[0, 0.06, -0.1]} />
      <HazeRing accent={concept.accent} progress={progress} radius={2.5} />
      <StageBeam accent={concept.accent} progress={progress} position={[0, 3.3, 0]} radius={1.3} opacity={0.016} />

      <Callout position={[-3.9, 4.55, 1.25]} label="GUIDED MAST / 6.9 M" at={0.08} until={0.52} side="left" />
      <Callout position={[3.9, 5.95, 1.2]} label="CHAIN HOIST / 1 T" at={0.22} until={0.58} />
      <Callout position={[2.0, 2.85, 1.3]} label="HEM CLEARS 2.65 M" at={0.62} until={0.92} />
      <Callout position={[0.15, 1.3, 1.45]} label="PRODUCT / 6×6 FT" at={0.86} />
    </group>
  );
}

function Traveler({ concept, progress }: ModelProps) {
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const pleat = useMemo(() => makePleatTexture(), []);
  const grain = useMemo(() => getRoughnessTexture(), []);

  useFrame(() => {
    const p = progress.current;
    const open = smoothstep(0.34, 0.8, p);
    const travel = THREE.MathUtils.lerp(2.55, 6.7, open);
    const gather = THREE.MathUtils.lerp(1, 0.42, open);
    if (left.current) {
      left.current.position.x = -travel;
      left.current.scale.x = gather;
    }
    if (right.current) {
      right.current.position.x = travel;
      right.current.scale.x = gather;
    }
  });

  const panel = (
    <group>
      <mesh castShadow>
        <planeGeometry args={[5.4, 5.6]} />
        <meshStandardMaterial
          color="#123835"
          map={pleat}
          roughnessMap={grain}
          roughness={0.88}
          metalness={0.06}
          side={THREE.DoubleSide}
          envMapIntensity={0.7}
        />
      </mesh>
      <mesh position={[0, 2.78, 0.02]}>
        <boxGeometry args={[5.4, 0.1, 0.1]} />
        <meshStandardMaterial color="#1b1e1f" metalness={0.85} roughness={0.34} />
      </mesh>
      {[-1.8, -0.6, 0.6, 1.8].map((x) => (
        <mesh key={x} position={[x, 2.94, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.14, 10]} />
          <meshStandardMaterial color="#232526" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );

  return (
    <group>
      <mesh position={[0, 5.72, 1.15]}>
        <boxGeometry args={[15.8, 0.13, 0.13]} />
        <meshStandardMaterial color="#1c1e1f" metalness={0.9} roughness={0.3} />
      </mesh>
      {[-7.9, 7.9].map((x) => (
        <group key={x} position={[x, 0, 1.15]}>
          <mesh position={[0, 2.86, 0]}>
            <boxGeometry args={[0.17, 5.72, 0.17]} />
            <meshStandardMaterial color="#191c1d" metalness={0.88} roughness={0.32} />
          </mesh>
          <mesh position={[0, 5.95, 0]}>
            <boxGeometry args={[0.29, 0.34, 0.29]} />
            <meshStandardMaterial color="#242626" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[0.8, 0.06, 0.8]} />
            <meshStandardMaterial color="#0f1213" metalness={0.8} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.18, 0.03, 0.18]} />
            <meshBasicMaterial color={concept.accent} transparent opacity={0.5} toneMapped={false} />
          </mesh>
        </group>
      ))}

      <group ref={left} position={[-2.55, 0, 1.15]}>
        {panel}
      </group>
      <group ref={right} position={[2.55, 0, 1.15]}>
        {panel}
      </group>

      <ProductCore size={concept.productSize * 0.82} accent={concept.accent} position={[0, 0.06, -0.6]} />
      <HazeRing accent={concept.accent} progress={progress} radius={2.6} />
      <StageBeam accent={concept.accent} progress={progress} position={[0, 3.4, -0.2]} radius={1.35} opacity={0.018} />

      <Callout position={[-1.7, 6.05, 1.35]} label="TRAVELER TRACK / 15.8 M" at={0.06} until={0.46} side="left" />
      <Callout position={[0.9, 3.3, 1.3]} label="CENTRE OVERLAP / 300 MM" at={0.2} until={0.54} />
      <Callout position={[4.1, 1.75, 1.3]} label="GATHER / 2.4×" at={0.56} until={0.86} />
      <Callout position={[0.1, 1.35, 1.45]} label="PRODUCT / 6×6 FT" at={0.86} />
    </group>
  );
}

function Revolve({ concept, progress }: ModelProps) {
  const drum = useRef<THREE.Group>(null);
  const gap = 0.86;
  const radius = 3.1;

  useFrame(() => {
    const p = progress.current;
    const turn = smoothstep(0.34, 0.86, p);
    if (drum.current) drum.current.rotation.y = Math.PI * (1 + turn);
  });

  return (
    <group>
      <group ref={drum} rotation={[0, Math.PI, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[radius, radius, 4.6, 96, 1, true, gap / 2, Math.PI * 2 - gap]} />
          <meshStandardMaterial color="#07090a" metalness={0.42} roughness={0.52} side={THREE.DoubleSide} envMapIntensity={0.7} />
        </mesh>
        <mesh position={[0, 2.31, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, 0.06, 8, 96]} />
          <meshStandardMaterial color="#22241f" metalness={0.92} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius + 0.02, 0.055, 8, 96]} />
          <meshStandardMaterial color="#1d1f1c" metalness={0.9} roughness={0.34} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[radius + 0.04, radius + 0.08, 0.22, 96, 1, true]} />
          <meshStandardMaterial color="#0a0c0d" metalness={0.72} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>

        <mesh position={[Math.sin(gap / 2) * (radius - 0.01), 2.3, Math.cos(gap / 2) * (radius - 0.01)]}>
          <boxGeometry args={[0.05, 4.42, 0.05]} />
          <meshBasicMaterial color={concept.accent} toneMapped={false} />
        </mesh>
        <mesh position={[-Math.sin(gap / 2) * (radius - 0.01), 2.3, Math.cos(gap / 2) * (radius - 0.01)]}>
          <boxGeometry args={[0.05, 4.42, 0.05]} />
          <meshBasicMaterial color={concept.accent} toneMapped={false} />
        </mesh>

        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[2.5, 2.5, 0.16, 64]} />
          <meshStandardMaterial color="#0d1011" metalness={0.7} roughness={0.34} />
        </mesh>
        {Array.from({ length: 24 }).map((_, index) => {
          const angle = (index / 24) * Math.PI * 2;
          return (
            <mesh key={index} position={[Math.sin(angle) * 2.24, 0.245, Math.cos(angle) * 2.24]} rotation={[0, angle, 0]}>
              <boxGeometry args={[0.36, 0.008, 0.016]} />
              <meshBasicMaterial color={concept.accent} transparent opacity={0.42} toneMapped={false} />
            </mesh>
          );
        })}
        <mesh position={[0, 4.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.5, 48]} />
          <meshBasicMaterial color={concept.accent} transparent opacity={0.06} toneMapped={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>

        <ProductCore size={concept.productSize * 0.8} accent={concept.accent} position={[0, 0.24, 0]} />
      </group>

      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.24, 3.72, 96]} />
        <meshBasicMaterial color={concept.accent} transparent opacity={0.14} toneMapped={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <FogSheet accent={concept.accent} position={[0, 0.04, 0]} scale={[8, 6]} opacity={0.1} />

      <Callout position={[-3.1, 3.95, 2.55]} label="ROTATING SHELL / 6.2 M Ø" at={0.08} until={0.5} side="left" />
      <Callout position={[2.85, 2.6, 2.5]} label="APERTURE / 2.6 M" at={0.22} until={0.6} />
      <Callout position={[0.0, 0.6, 3.3]} label="TURNTABLE / 180°" at={0.52} until={0.82} />
      <Callout position={[0.15, 1.5, 3.1]} label="PRODUCT / 6×6 FT" at={0.88} />
    </group>
  );
}

function HouseScene({ concept }: ModelProps) {
  const pool = useMemo(() => makeRadialTexture('rgba(255,236,205,0.32)', 'rgba(255,236,205,0)'), []);

  return (
    <group>
      <pointLight position={[0, 5.6, 7.4]} intensity={48} distance={28} decay={1.6} color="#ffe7c6" />
      <pointLight position={[-7.4, 3.4, 4.6]} intensity={24} distance={20} decay={1.7} color="#9fd8d2" />
      <ambientLight intensity={1.7} color="#b6c9c6" />
      <hemisphereLight intensity={0.65} color="#8fa8a5" groundColor="#080a0a" />
      <pointLight position={[0, 8.4, 5.6]} intensity={80} distance={26} decay={1.5} color="#ffe7c6" />
      <pointLight position={[-9.2, 3.2, 4.4]} intensity={44} distance={18} decay={1.6} color="#c9a86a" />
      <pointLight position={[9.2, 3.2, 4.4]} intensity={32} distance={18} decay={1.6} color="#9fd8d2" />
      <mesh position={[0, 0.028, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7.4, 6]} />
        <meshBasicMaterial map={pool} transparent opacity={0.42} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <group position={[0, 0, 0.4]}>
        <mesh position={[0, 0.11, 0]}>
          <boxGeometry args={[3.6, 0.22, 3.6]} />
          <meshStandardMaterial color="#0a0d0e" metalness={0.74} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.226, 0]}>
          <boxGeometry args={[3.5, 0.008, 3.5]} />
          <meshBasicMaterial color={concept.accent} transparent opacity={0.2} toneMapped={false} />
        </mesh>
        <ProductCore size={3.0} accent={concept.accent} position={[0, 0.22, 0]} />
      </group>

      <Callout position={[4.0, 0.32, 3.4]} label="DECK / 18 × 9 M" at={0.06} side="right" scale={1.3} />
      <Callout position={[4.9, 6.85, 0.55]} label="RIGGING / 2 SPANS" at={0.2} side="left" scale={1.15} />
      <Callout position={[-4.8, 1.35, 3.15]} label="CONTROL DESK" at={0.42} side="left" scale={1.15} />
      <Callout position={[-4.4, 3.05, -4.28]} label="LED WALL / 14.2 M" at={0.6} side="right" scale={1.15} />
      <Callout position={[0.4, 1.55, 2.1]} label="PRODUCT / 4×4 FT" at={0.8} side="right" scale={1.15} />
    </group>
  );
}
