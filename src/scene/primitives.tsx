import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import * as THREE from 'three';
import { getBackdropTexture, getRoughnessTexture } from './materials';

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const smoothstep = (edge0: number, edge1: number, value: number) => {
  const x = clamp01((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
};

export const easeOutCubic = (value: number) => 1 - Math.pow(1 - clamp01(value), 3);

export function makeRadialTexture(inner = 'rgba(255,255,255,0.55)', outer = 'rgba(255,255,255,0)') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(256, 256, 10, 256, 256, 250);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(0.45, inner);
    gradient.addColorStop(1, outer);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const screenVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const screenFragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uProgress;
  uniform float uSeed;
  uniform float uIntensity;
  uniform vec3 uAccent;

  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  void main() {
    vec2 uv = vUv;

    float t = uTime * 0.1;
    float gridX = smoothstep(0.492, 0.5, abs(fract(uv.x * 40.0 + uSeed) - 0.5));
    float gridY = smoothstep(0.494, 0.5, abs(fract(uv.y * 26.0) - 0.5));
    float grid = (gridX + gridY) * 0.028;

    float scan = smoothstep(0.007, 0.0, abs(uv.y - fract(t * 0.55 + uSeed * 0.17))) * 0.026;
    float scan2 = smoothstep(0.022, 0.0, abs(uv.y - fract(t * 0.31 + 0.4))) * 0.01;

    float ticks = step(0.988, fract(uv.x * 84.0)) * step(uv.y, 0.04) * 0.045;
    float horizonY = 0.5 + sin(t * 0.4 + uSeed) * 0.004;
    float horizon = smoothstep(0.0012, 0.0, abs(uv.y - horizonY)) * 0.04;
    float wash = smoothstep(0.62, 0.0, length((uv - vec2(0.5, 0.42)) * vec2(1.05, 1.55))) * 0.03;

    vec3 base = vec3(0.0042, 0.006, 0.0072);
    vec3 col = base;
    col += uAccent * (grid + scan + scan2 + ticks + horizon + wash);
    col *= uIntensity;

    float vignette = smoothstep(1.12, 0.2, length((uv - 0.5) * vec2(1.15, 1.0)));
    col *= mix(0.14, 1.0, vignette);
    col *= smoothstep(0.0, 0.012, uv.x) * smoothstep(1.0, 0.988, uv.x)
         * smoothstep(0.0, 0.02, uv.y) * smoothstep(1.0, 0.98, uv.y);
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface ScreenProps {
  accent: string;
  progress: React.MutableRefObject<number>;
  position?: [number, number, number];
  size?: [number, number];
  seed?: number;
  intensity?: number;
}

export function StageScreen({
  accent,
  progress,
  position = [0, 3.2, -4.15],
  size = [14.2, 5.6],
  seed = 0,
  intensity = 1,
}: ScreenProps) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uSeed: { value: seed },
      uAccent: { value: new THREE.Color(accent) },
      uIntensity: { value: intensity },
    }),
    [accent, seed, intensity],
  );

  useFrame((state) => {
    if (!material.current) return;
    material.current.uniforms.uTime.value = state.clock.elapsedTime;
    material.current.uniforms.uProgress.value = progress.current;
  });

  return (
    <group position={position}>
      <mesh>
        <planeGeometry args={size} />
        <shaderMaterial
          ref={material}
          vertexShader={screenVertexShader}
          fragmentShader={screenFragmentShader}
          uniforms={uniforms}
          toneMapped={false}
        />
      </mesh>
      {[
        { p: [0, size[1] / 2 + 0.06, -0.07] as [number, number, number], s: [size[0] + 0.24, 0.12, 0.12] as [number, number, number] },
        { p: [0, -size[1] / 2 - 0.06, -0.07] as [number, number, number], s: [size[0] + 0.24, 0.12, 0.12] as [number, number, number] },
        { p: [-size[0] / 2 - 0.06, 0, -0.07] as [number, number, number], s: [0.12, size[1] + 0.24, 0.12] as [number, number, number] },
        { p: [size[0] / 2 + 0.06, 0, -0.07] as [number, number, number], s: [0.12, size[1] + 0.24, 0.12] as [number, number, number] },
      ].map((bar, index) => (
        <mesh key={index} position={bar.p}>
          <boxGeometry args={bar.s} />
          <meshStandardMaterial color="#090b0c" metalness={0.7} roughness={0.44} />
        </mesh>
      ))}
      <mesh position={[0, 0, -0.14]}>
        <boxGeometry args={[size[0], size[1], 0.02]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  );
}

interface StageHouseProps {
  accent: string;
}

interface StageBaseProps {
  accent: string;
  progress: React.MutableRefObject<number>;
}

function Fixture({ accent, warm = false }: { accent: string; warm?: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.1, 0.12, 0.1]} />
        <meshStandardMaterial color="#1a1c1c" metalness={0.9} roughness={0.35} />
      </mesh>
      {[-0.09, 0.09].map((z) => (
        <mesh key={z} position={[0, -0.08, z]}>
          <boxGeometry args={[0.022, 0.22, 0.022]} />
          <meshStandardMaterial color="#222524" metalness={0.9} roughness={0.34} />
        </mesh>
      ))}
      <mesh position={[0, -0.23, 0]}>
        <cylinderGeometry args={[0.1, 0.078, 0.34, 14]} />
        <meshStandardMaterial color="#101313" metalness={0.86} roughness={0.36} />
      </mesh>
      <mesh position={[0, -0.41, 0.02]} rotation={[Math.PI / 2 - 0.55, 0, 0]}>
        <circleGeometry args={[0.068, 18]} />
        <meshBasicMaterial color={warm ? '#ffe2b4' : accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.43, 0.03]} rotation={[Math.PI / 2 - 0.55, 0, 0]}>
        <circleGeometry args={[0.13, 18]} />
        <meshBasicMaterial
          color={warm ? '#ffe2b4' : accent}
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function TrussSpan({ accent, y, z, width = 17.4 }: { accent: string; y: number; z: number; width?: number }) {
  const braces = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = 22;

  useEffect(() => {
    if (!braces.current) return;
    const step = width / count;
    for (let i = 0; i < count; i += 1) {
      dummy.position.set(-width / 2 + step * (i + 0.5), y - 0.22, z);
      dummy.rotation.set(0, 0, i % 2 === 0 ? 0.62 : -0.62);
      dummy.scale.set(0.026, 1, 0.026);
      dummy.updateMatrix();
      braces.current.setMatrixAt(i, dummy.matrix);
    }
    braces.current.instanceMatrix.needsUpdate = true;
  }, [count, dummy, width, y, z]);

  return (
    <group>
      {[-0.2, 0.2].map((offset) => (
        <mesh key={offset} position={[0, y, z + offset]}>
          <boxGeometry args={[width, 0.065, 0.065]} />
          <meshStandardMaterial color="#70797c" metalness={0.55} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, y - 0.44, z]}>
        <boxGeometry args={[width, 0.055, 0.055]} />
        <meshStandardMaterial color="#70797c" metalness={0.55} roughness={0.4} />
      </mesh>
      <mesh position={[0, y - 0.02, z + 0.24]}>
        <boxGeometry args={[width - 0.5, 0.03, 0.03]} />
        <meshBasicMaterial color={accent} transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <instancedMesh ref={braces} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[1, 1, 0.52, 5]} />
        <meshStandardMaterial color="#70797c" metalness={0.55} roughness={0.4} />
      </instancedMesh>
      {[-width / 2 + 0.4, width / 2 - 0.4].map((x) => (
        <group key={x} position={[x, y + 0.16, z]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.1, 0.1, 0.2, 14]} />
            <meshStandardMaterial color="#26282a" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.02, 14]} />
            <meshBasicMaterial color={accent} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function StageHouse({ accent }: StageHouseProps) {
  const cases = [
    { x: -7.0, z: 2.1, rot: 0.2 },
    { x: 6.9, z: 2.0, rot: -0.16 },
  ];
  const booms = [
    { x: -9.1, z: 1.1 },
    { x: 9.1, z: 1.1 },
  ];

  return (
    <group>
      {[-10.3, 10.3].map((x) => (
        <group key={x} position={[x, 0, 2.4]}>
          <mesh position={[0, 4.4, 0]}>
            <boxGeometry args={[0.5, 8.8, 1.2]} />
            <meshStandardMaterial color="#1b2226" metalness={0.3} roughness={0.62} />
          </mesh>
          <mesh position={[x < 0 ? 0.26 : -0.26, 4.2, 0.58]}>
            <boxGeometry args={[0.06, 8.1, 0.06]} />
            <meshBasicMaterial color={accent} transparent opacity={0.75} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <boxGeometry args={[0.62, 0.28, 1.3]} />
            <meshStandardMaterial color="#0b0d0e" metalness={0.4} roughness={0.5} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 8.7, 2.4]}>
        <boxGeometry args={[21, 0.7, 1.2]} />
        <meshStandardMaterial color="#1b2226" metalness={0.3} roughness={0.62} />
      </mesh>
      <mesh position={[0, 8.33, 3.02]}>
        <boxGeometry args={[20.3, 0.028, 0.028]} />
        <meshBasicMaterial color={accent} transparent opacity={0.42} toneMapped={false} />
      </mesh>
      <mesh position={[0, 10.2, 2.3]}>
        <planeGeometry args={[21, 3.4]} />
        <meshStandardMaterial color="#080b0c" roughness={0.97} metalness={0.04} />
      </mesh>
      {[-9.4, -6.3, -3.1, 0, 3.1, 6.3, 9.4].map((x) => (
        <mesh key={x} position={[x, 10.2, 2.36]}>
          <boxGeometry args={[0.035, 3.4, 0.02]} />
          <meshStandardMaterial color="#151b1e" metalness={0.4} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 11.86, 2.34]}>
        <boxGeometry args={[21.2, 0.05, 0.05]} />
        <meshBasicMaterial color={accent} transparent opacity={0.3} toneMapped={false} />
      </mesh>

      {[
        { x: -9.8, z: 1.9 },
        { x: 9.8, z: 1.9 },
        { x: -9.8, z: -3.3 },
        { x: 9.8, z: -3.3 },
      ].map((leg) => (
        <mesh key={`${leg.x}-${leg.z}`} position={[leg.x, 4.2, leg.z]}>
          <planeGeometry args={[1.5, 8.4]} />
          <meshStandardMaterial color="#12171a" roughness={0.94} metalness={0.04} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {[1.9, -3.3].map((z) => (
        <mesh key={z} position={[0, 8.02, z]}>
          <planeGeometry args={[20.4, 0.9]} />
          <meshStandardMaterial color="#12171a" roughness={0.94} metalness={0.04} side={THREE.DoubleSide} />
        </mesh>
      ))}

      <TrussSpan accent={accent} y={7.45} z={-2.5} width={20.4} />
      <TrussSpan accent={accent} y={7.05} z={0.55} width={20.4} />

      {[-7.8, -5.4, -3.2, -1.0, 1.2, 3.4, 5.6, 7.8].map((x) => (
        <group key={x} position={[x, 6.5, 0.55]}>
          <Fixture accent={accent} warm={x < 0} />
        </group>
      ))}

      {booms.map((boom) => (
        <group key={boom.x} position={[boom.x, 0, boom.z]}>
          <mesh position={[0, 1.9, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 3.8, 10]} />
            <meshStandardMaterial color="#191c1d" metalness={0.9} roughness={0.32} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[0.5, 0.1, 0.5]} />
            <meshStandardMaterial color="#0e1112" metalness={0.7} roughness={0.4} />
          </mesh>
          <group position={[0, 2.3, 0]}>
            <Fixture accent={accent} warm={false} />
          </group>
        </group>
      ))}

      <group position={[-5.4, 0, 3.15]}>
        <mesh position={[0, 0.09, 0]}>
          <boxGeometry args={[2.5, 0.18, 1.25]} />
          <meshStandardMaterial color="#0b0e0f" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[-0.3, 0.55, 0]}>
          <boxGeometry args={[1.55, 0.72, 0.72]} />
          <meshStandardMaterial color="#0f1213" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[-0.3, 0.95, 0.06]} rotation={[-0.22, 0, 0]}>
          <boxGeometry args={[1.5, 0.06, 0.7]} />
          <meshStandardMaterial color="#151a1a" metalness={0.7} roughness={0.34} />
        </mesh>
        {[-0.6, -0.42, -0.24, -0.06, 0.12, 0.3].map((x) => (
          <mesh key={x} position={[x - 0.3, 1.0, 0.1]} rotation={[-0.22, 0, 0]}>
            <boxGeometry args={[0.035, 0.03, 0.14]} />
            <meshBasicMaterial color={accent} transparent opacity={0.55} toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0.62, 0.86, 0]} rotation={[0, -0.3, 0]}>
          <boxGeometry args={[0.62, 0.42, 0.04]} />
          <meshStandardMaterial color="#080b0c" metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh position={[0.62, 0.86, 0.024]} rotation={[0, -0.3, 0]}>
          <planeGeometry args={[0.56, 0.36]} />
          <meshBasicMaterial color={accent} transparent opacity={0.16} toneMapped={false} />
        </mesh>
      </group>

      <group position={[-8.05, 0, 1.9]}>
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[0.72, 1.5, 0.66]} />
          <meshStandardMaterial color="#0d1011" metalness={0.62} roughness={0.42} />
        </mesh>
        {[0.42, 0.52, 0.62].map((y) => (
          <mesh key={y} position={[0, y + 0.34, 0.335]}>
            <boxGeometry args={[0.5, 0.012, 0.012]} />
            <meshBasicMaterial color={accent} transparent opacity={0.4} toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0, 1.56, 0]}>
          <boxGeometry args={[0.74, 0.04, 0.68]} />
          <meshStandardMaterial color="#202322" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>

      {cases.map((item) => (
        <group key={item.x} position={[item.x, 0, item.z]} rotation={[0, item.rot, 0]}>
          <mesh position={[0, 0.34, 0]} castShadow>
            <boxGeometry args={[0.95, 0.68, 0.62]} />
            <meshStandardMaterial color="#0a0c0d" metalness={0.35} roughness={0.56} />
          </mesh>
          <mesh position={[0, 0.69, 0]}>
            <boxGeometry args={[0.97, 0.03, 0.64]} />
            <meshStandardMaterial color="#1c1e1c" metalness={0.8} roughness={0.36} />
          </mesh>
          {[-0.42, 0.42].map((x) => (
            <mesh key={x} position={[x, 0.34, 0.315]}>
              <boxGeometry args={[0.045, 0.6, 0.012]} />
              <meshBasicMaterial color="#8f7548" toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}

      {[-3.6, 3.6].map((x) => (
        <group key={x} position={[x, 0.11, 3.05]} rotation={[0, x < 0 ? 0.24 : -0.24, 0]}>
          <mesh rotation={[0.42, 0, 0]}>
            <boxGeometry args={[0.52, 0.32, 0.34]} />
            <meshStandardMaterial color="#0c0f10" metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.05, 0.15]} rotation={[0.42, 0, 0]}>
            <planeGeometry args={[0.42, 0.24]} />
            <meshStandardMaterial color="#050708" metalness={0.4} roughness={0.6} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 0.035, 2.95]}>
        <boxGeometry args={[9.2, 0.07, 0.42]} />
        <meshStandardMaterial color="#141617" metalness={0.4} roughness={0.62} />
      </mesh>
      {[-3.6, -1.8, 0, 1.8, 3.6].map((x) => (
        <mesh key={x} position={[x, 0.073, 2.95]}>
          <boxGeometry args={[0.6, 0.004, 0.34]} />
          <meshBasicMaterial color="#8f7548" transparent opacity={0.45} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export function StageBase({ accent }: StageBaseProps) {
  const haze = useMemo(() => makeRadialTexture('rgba(120,220,210,0.24)', 'rgba(120,220,210,0)'), []);
  const haze2 = useMemo(() => makeRadialTexture('rgba(230,200,150,0.12)', 'rgba(230,200,150,0)'), []);
  const sheen = useMemo(() => makeRadialTexture('rgba(255,236,205,0.16)', 'rgba(255,236,205,0)'), []);
  const contact = useMemo(() => makeRadialTexture('rgba(0,0,0,0.5)', 'rgba(0,0,0,0)'), []);
  const grain = useMemo(() => getRoughnessTexture(), []);
  const backdrop = useMemo(() => getBackdropTexture(), []);
  const hazeRef = useRef<THREE.Mesh>(null);
  const haze2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (hazeRef.current) {
      hazeRef.current.rotation.z = state.clock.elapsedTime * 0.025;
    }
    if (haze2Ref.current) {
      haze2Ref.current.rotation.z = -state.clock.elapsedTime * 0.015;
    }
  });

  return (
    <group>
      <RoundedBox args={[18, 0.5, 9]} radius={0.05} smoothness={3} position={[0, -0.25, 0]} receiveShadow>
        <meshStandardMaterial color="#070a0b" metalness={0.62} roughness={0.34} roughnessMap={grain} envMapIntensity={0.7} />
      </RoundedBox>

      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[17.8, 8.8]} />
        <meshStandardMaterial color="#080b0c" metalness={0.72} roughness={0.26} roughnessMap={grain} envMapIntensity={0.85} />
      </mesh>

      <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7.2, 5.2]} />
        <meshBasicMaterial map={contact} transparent opacity={0.75} depthWrite={false} />
      </mesh>

      <mesh position={[0, -0.5, 7]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[46, 26]} />
        <meshStandardMaterial color="#040607" metalness={0.3} roughness={0.62} />
      </mesh>

      <mesh position={[0, -0.49, 8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[34, 24]} />
        <meshBasicMaterial map={haze2} color={accent} transparent opacity={0.04} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[0, 7.1, -4.48]}>
        <planeGeometry args={[20, 6.4]} />
        <meshBasicMaterial map={haze} color={accent} transparent opacity={0.05} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      <StageHouse accent={accent} />

      <mesh position={[0, 0.024, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16.8, 8]} />
        <meshBasicMaterial map={haze} transparent opacity={0.26} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.026, 1.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 6.4]} />
        <meshBasicMaterial map={sheen} transparent opacity={0.26} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={hazeRef} position={[1.4, 0.03, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 7]} />
        <meshBasicMaterial map={haze} transparent opacity={0.14} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={haze2Ref} position={[-2, 0.032, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 6]} />
        <meshBasicMaterial map={haze2} transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <mesh position={[0, 0.026, 4.48]}>
        <boxGeometry args={[18, 0.025, 0.035]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      <mesh position={[-8.98, 0.026, 0]}>
        <boxGeometry args={[0.035, 0.025, 8.8]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      <mesh position={[8.98, 0.026, 0]}>
        <boxGeometry args={[0.035, 0.025, 8.8]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>

      <mesh position={[0, 4.5, -4.55]} receiveShadow>
        <boxGeometry args={[18.2, 9.2, 0.25]} />
        <meshStandardMaterial color="#050708" roughness={0.86} metalness={0.14} />
      </mesh>
      <mesh position={[0, 4.55, -4.41]}>
        <planeGeometry args={[18.1, 9.1]} />
        <meshBasicMaterial map={backdrop ?? undefined} transparent opacity={0.95} depthWrite={false} />
      </mesh>
      <mesh position={[-9.05, 4.2, -0.5]}>
        <boxGeometry args={[0.25, 8.4, 8.4]} />
        <meshStandardMaterial color="#050708" roughness={0.86} metalness={0.1} />
      </mesh>
      <mesh position={[9.05, 4.2, -0.5]}>
        <boxGeometry args={[0.25, 8.4, 8.4]} />
        <meshStandardMaterial color="#050708" roughness={0.86} metalness={0.1} />
      </mesh>
    </group>
  );
}

interface StageBeamProps {
  accent: string;
  progress: React.MutableRefObject<number>;
  position: [number, number, number];
  radius?: number;
  opacity?: number;
}

const beamVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const beamFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float fall = smoothstep(0.02, 0.92, vUv.y);
    float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vView)));
    float alpha = uOpacity * fall * mix(1.0, 0.12, rim * rim);
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export function StageBeam({ accent, progress, position, radius = 1, opacity = 0.04 }: StageBeamProps) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(accent) },
      uOpacity: { value: opacity },
    }),
    [accent, opacity],
  );

  useFrame((state) => {
    if (!material.current) return;
    material.current.uniforms.uOpacity.value =
      opacity * (0.7 + Math.sin(state.clock.elapsedTime * 0.8) * 0.2) * (0.4 + progress.current * 0.6);
  });

  return (
    <mesh position={position}>
      <coneGeometry args={[radius, 8.4, 48, 1, true]} />
      <shaderMaterial
        ref={material}
        vertexShader={beamVertexShader}
        fragmentShader={beamFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

interface ProductCoreProps {
  size: number;
  accent: string;
  position?: [number, number, number];
  scale?: number;
  hidden?: boolean;
}

export function ProductCore({ size, accent, position = [0, 0, 0], scale = 1, hidden = false }: ProductCoreProps) {
  const height = size * 0.78;
  const grain = useMemo(() => getRoughnessTexture(), []);
  return (
    <group position={position} scale={scale} visible={!hidden}>
      <RoundedBox args={[size * 1.22, 0.12, size * 1.22]} radius={0.025} smoothness={2} position={[0, 0.06, 0]} receiveShadow>
        <meshStandardMaterial color="#0b0e10" metalness={0.8} roughness={0.3} roughnessMap={grain} envMapIntensity={1} />
      </RoundedBox>
      <mesh position={[0, 0.125, 0]}>
        <boxGeometry args={[size * 1.18, 0.006, size * 1.18]} />
        <meshBasicMaterial color={accent} transparent opacity={0.28} toneMapped={false} />
      </mesh>
      <RoundedBox
        args={[size, height, size]}
        radius={0.035}
        smoothness={3}
        position={[0, 0.12 + height / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color="#111a1d"
          metalness={0.9}
          roughness={0.22}
          clearcoat={0.6}
          clearcoatRoughness={0.2}
          roughnessMap={grain}
          envMapIntensity={1.15}
        />
      </RoundedBox>

      <mesh position={[0, 0.12 + height * 0.52, size / 2 + 0.004]}>
        <planeGeometry args={[size * 0.74, height * 0.44]} />
        <meshPhysicalMaterial
          color="#081013"
          metalness={0.55}
          roughness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.06}
          emissive={accent}
          emissiveIntensity={0.045}
        />
      </mesh>
      <mesh position={[0, 0.12 + height * 0.3, size / 2 + 0.005]}>
        <boxGeometry args={[size * 0.74, 0.006, 0.004]} />
        <meshBasicMaterial color={accent} transparent opacity={0.5} toneMapped={false} />
      </mesh>

      <mesh position={[0, 0.12 + height * 0.52, size / 2 + 0.006]}>
        <boxGeometry args={[0.018, height * 0.68, 0.012]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.12 + height * 0.18, size / 2 + 0.006]}>
        <boxGeometry args={[size * 0.58, 0.012, 0.012]} />
        <meshBasicMaterial color={accent} toneMapped={false} opacity={0.6} transparent />
      </mesh>
      <mesh position={[0, 0.12 + height + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size * 0.94, size * 0.94]} />
        <meshStandardMaterial color="#0c1214" metalness={0.92} roughness={0.18} roughnessMap={grain} envMapIntensity={1.2} />
      </mesh>
      <mesh position={[0, 0.135 + height, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[size * 0.24, 48]} />
        <meshBasicMaterial color={accent} toneMapped={false} transparent opacity={0.5} />
      </mesh>

      <Footprint size={size * 1.3} accent={accent} />
    </group>
  );
}

export function Footprint({ size, accent }: { size: number; accent: string }) {
  const s = size / 2;
  return (
    <group position={[0, 0.019, 0]}>
      {[
        { pos: [0, 0, s] as [number, number, number], rot: [0, 0, 0] as [number, number, number], len: size },
        { pos: [0, 0, -s] as [number, number, number], rot: [0, 0, 0] as [number, number, number], len: size },
        { pos: [s, 0, 0] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number], len: size },
        { pos: [-s, 0, 0] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number], len: size },
      ].map((line, index) => (
        <mesh key={index} position={line.pos} rotation={line.rot}>
          <boxGeometry args={[line.len, 0.012, 0.018]} />
          <meshBasicMaterial color={accent} transparent opacity={0.32} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

interface LineBeamProps {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  radius?: number;
  opacity?: number;
}

export function LineBeam({ from, to, color, radius = 0.012, opacity = 0.8 }: LineBeamProps) {
  const start = useMemo(() => new THREE.Vector3(...from), [from]);
  const end = useMemo(() => new THREE.Vector3(...to), [to]);
  const mid = useMemo(() => start.clone().add(end).multiplyScalar(0.5), [start, end]);
  const length = useMemo(() => start.distanceTo(end), [start, end]);
  const quaternion = useMemo(() => {
    const direction = end.clone().sub(start).normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  }, [start, end]);

  return (
    <mesh position={mid} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, length, 6]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

export function HazeRing({ accent, progress, radius = 2.2 }: { accent: string; progress: React.MutableRefObject<number>; radius?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const material = ref.current.material as THREE.MeshBasicMaterial;
    material.opacity = 0.12 + Math.sin(state.clock.elapsedTime * 0.7) * 0.04 + progress.current * 0.06;
  });
  return (
    <mesh ref={ref} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.72, radius, 64]} />
      <meshBasicMaterial color={accent} transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

export function FogSheet({ accent, position, scale, opacity = 0.14 }: { accent: string; position: [number, number, number]; scale: [number, number]; opacity?: number }) {
  const texture = useMemo(() => makeRadialTexture('rgba(210,235,230,0.5)', 'rgba(210,235,230,0)'), []);
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[scale[0], scale[1]]} />
      <meshBasicMaterial
        map={texture}
        color={accent}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

const STEEL = { color: '#1b1e1f', metalness: 0.92, roughness: 0.34 } as const;

function Lattice({ count, spacing, length, axis, y, radius = 0.022 }: {
  count: number;
  spacing: number;
  length: number;
  axis: 'x' | 'z';
  y: number;
  radius?: number;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!mesh.current) return;
    let index = 0;
    for (let i = 0; i <= count; i += 1) {
      const offset = -length / 2 + i * spacing;
      dummy.position.set(axis === 'x' ? offset : 0, y, axis === 'z' ? offset : 0);
      dummy.rotation.set(axis === 'x' ? 0 : Math.PI / 2, 0, axis === 'x' ? Math.PI / 2 : 0);
      dummy.scale.set(radius, i % 2 === 0 ? 0.56 : 0.7, radius);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(index, dummy.matrix);
      index += 1;
    }
    mesh.current.count = index;
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [axis, count, dummy, length, radius, spacing, y]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count + 1]}>
      <cylinderGeometry args={[1, 1, 1, 5]} />
      <meshStandardMaterial {...STEEL} />
    </instancedMesh>
  );
}

function Tube({ from, to, radius = 0.038 }: { from: [number, number, number]; to: [number, number, number]; radius?: number }) {
  const { mid, length, quaternion } = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const direction = end.clone().sub(start);
    return {
      mid: start.clone().add(end).multiplyScalar(0.5),
      length: direction.length(),
      quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()),
    };
  }, [from, to]);

  return (
    <mesh position={mid} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, length, 8]} />
      <meshStandardMaterial {...STEEL} />
    </mesh>
  );
}

export function Truss({
  accent,
  width = 12,
  height = 8.4,
  position = [0, 0, 0],
  depth = 0.62,
  winches = [],
}: {
  accent: string;
  width?: number;
  height?: number;
  position?: [number, number, number];
  depth?: number;
  winches?: number[];
}) {
  const half = width / 2;
  const leg = depth / 2;
  const rungs = Math.max(6, Math.round(height / 0.62));

  return (
    <group position={position}>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * half, 0, 0]}>
          <mesh position={[0, 0.03, 0]} receiveShadow>
            <boxGeometry args={[0.94, 0.06, 0.94]} />
            <meshStandardMaterial color="#101314" metalness={0.8} roughness={0.38} />
          </mesh>
          {[[-leg, -leg], [-leg, leg], [leg, -leg], [leg, leg]].map(([x, z], index) => (
            <Tube key={index} from={[x, 0.06, z]} to={[x, height, z]} radius={0.032} />
          ))}
          <Lattice count={rungs} spacing={height / rungs} length={height} axis="z" y={height / 2} radius={0.022} />
          <Lattice count={rungs} spacing={height / rungs} length={height} axis="x" y={height / 2} radius={0.022} />
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[0.72, 0.03, 0.72]} />
            <meshBasicMaterial color={accent} transparent opacity={0.5} toneMapped={false} />
          </mesh>
          <mesh position={[0, height - 0.02, 0]}>
            <boxGeometry args={[0.78, 0.05, 0.78]} />
            <meshStandardMaterial color="#2a2b28" metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {[-leg, leg].map((z) => (
        <Tube key={`top-${z}`} from={[-half, height, z]} to={[half, height, z]} radius={0.034} />
      ))}
      <Tube from={[-half, height - 0.3, 0]} to={[half, height - 0.3, 0]} radius={0.03} />
      <Lattice count={Math.round(width / 0.7)} spacing={0.7} length={width} axis="x" y={height - 0.16} radius={0.02} />

      {winches.map((x) => (
        <group key={x} position={[x, height - 0.36, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.13, 0.13, 0.24, 16]} />
            <meshStandardMaterial color="#232422" metalness={0.86} roughness={0.34} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0.14]}>
            <cylinderGeometry args={[0.09, 0.09, 0.02, 16]} />
            <meshBasicMaterial color={accent} toneMapped={false} />
          </mesh>
          <mesh position={[0, -0.12, 0]}>
            <boxGeometry args={[0.22, 0.12, 0.16]} />
            <meshStandardMaterial color="#181a19" metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function LiftColumn({
  accent,
  progress,
  range = [0.2, 0.8],
  lift = 2.2,
  base = 0,
  position = [0, 0, 0],
}: {
  accent: string;
  progress: React.MutableRefObject<number>;
  range?: [number, number];
  lift?: number;
  base?: number;
  position?: [number, number, number];
}) {
  const mid = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const collar = useRef<THREE.Group>(null);

  useFrame(() => {
    const p = smoothstep(range[0], range[1], progress.current);
    if (mid.current) mid.current.position.y = base + p * lift * 0.52;
    if (inner.current) inner.current.position.y = base + p * lift;
    if (collar.current) collar.current.rotation.y = p * 0.4;
  });

  const stage = (radius: number, height: number) => (
    <>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, height, 20]} />
        <meshStandardMaterial color="#15181a" metalness={0.94} roughness={0.26} />
      </mesh>
      <mesh position={[0, height - 0.05, 0]}>
        <torusGeometry args={[radius + 0.012, 0.014, 6, 24]} />
        <meshStandardMaterial color="#2d2c26" metalness={0.9} roughness={0.3} />
      </mesh>
    </>
  );

  return (
    <group position={position}>
      <mesh position={[0, base + 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.46, 0.5, 0.06, 32]} />
        <meshStandardMaterial color="#101314" metalness={0.8} roughness={0.36} />
      </mesh>
      <group position={[0, base, 0]}>
        {stage(0.26, 1.7)}
        <group ref={mid}>
          {stage(0.2, 1.7)}
          <group ref={inner}>{stage(0.14, 1.7)}</group>
        </group>
        <mesh position={[0, 0.16, 0]}>
          <boxGeometry args={[0.3, 0.16, 0.12]} />
          <meshStandardMaterial color="#1a1c1b" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0.16, 0.16, 0]}>
          <boxGeometry args={[0.02, 0.08, 0.04]} />
          <meshBasicMaterial color={accent} toneMapped={false} />
        </mesh>
      </group>
      <group ref={collar} position={[0, base + 0.34, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.02, 6, 32]} />
          <meshStandardMaterial color="#c9a86a" metalness={1} roughness={0.28} />
        </mesh>
      </group>
    </group>
  );
}

export function ScissorLift({
  accent,
  progress,
  range = [0.4, 0.84],
  height = 2.3,
  position = [0, 0, 0],
  children,
}: {
  accent: string;
  progress: React.MutableRefObject<number>;
  range?: [number, number];
  height?: number;
  position?: [number, number, number];
  children?: ReactNode;
}) {
  const top = useRef<THREE.Group>(null);
  const bars = useRef<Array<THREE.Mesh | null>>([]);
  const ram = useRef<THREE.Mesh>(null);
  const L = 2.95;
  const rest = 0.16;

  useFrame(() => {
    const h = rest + smoothstep(range[0], range[1], progress.current) * (height - rest);
    const spread = Math.sqrt(Math.max(0.2, L * L - h * h)) / 2;
    const angle = Math.atan2(spread * 2, h);
    if (top.current) top.current.position.y = h + 0.08;
    bars.current.forEach((bar, index) => {
      if (!bar) return;
      bar.position.y = h / 2 + 0.06;
      bar.rotation.z = (index % 2 === 0 ? 1 : -1) * angle;
    });
    if (ram.current) {
      ram.current.position.y = h * 0.22 + 0.1;
      ram.current.scale.y = 0.55 + (h / height) * 0.5;
    }
  });

  const frame = (y: number) => (
    <>
      <mesh position={[0, y, 0]}>
        <boxGeometry args={[2.3, 0.1, 1.5]} />
        <meshStandardMaterial color="#0f1213" metalness={0.86} roughness={0.32} />
      </mesh>
      <mesh position={[0, y + 0.06, 0]}>
        <boxGeometry args={[2.24, 0.02, 1.44]} />
        <meshStandardMaterial color="#1b1d1c" metalness={0.9} roughness={0.28} />
      </mesh>
    </>
  );

  return (
    <group position={position}>
      {frame(0.05)}
      {[-0.62, 0.62].map((z) =>
        [0, 1].map((index) => (
          <mesh
            key={`${z}-${index}`}
            ref={(node) => { bars.current[index + (z > 0 ? 2 : 0)] = node; }}
            position={[0, 0.2, z]}
            castShadow
          >
            <boxGeometry args={[0.075, L, 0.075]} />
            <meshStandardMaterial color="#202322" metalness={0.92} roughness={0.3} />
          </mesh>
        )),
      )}
      <mesh ref={ram} position={[0, 0.2, 0.74]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.055, 0.055, 1.1, 12]} />
        <meshStandardMaterial color="#2a2d2c" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.2, 0.76]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.024, 0.024, 0.4, 8]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[2.5, 0.03, 1.7]} />
        <meshBasicMaterial color={accent} transparent opacity={0.22} toneMapped={false} />
      </mesh>
      <group ref={top} position={[0, rest + 0.08, 0]}>
        {frame(0)}
        {children}
      </group>
    </group>
  );
}

export function Rail({
  accent,
  length = 9,
  gauge = 3,
  position = [0, 0, 0],
  rotation = 0,
}: {
  accent: string;
  length?: number;
  gauge?: number;
  position?: [number, number, number];
  rotation?: number;
}) {
  const sleepers = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = Math.floor(length / 0.55);

  useEffect(() => {
    if (!sleepers.current) return;
    for (let i = 0; i < count; i += 1) {
      dummy.position.set(-length / 2 + 0.3 + i * 0.55, 0.012, 0);
      dummy.updateMatrix();
      sleepers.current.setMatrixAt(i, dummy.matrix);
    }
    sleepers.current.instanceMatrix.needsUpdate = true;
  }, [count, dummy, length]);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[-gauge / 2, gauge / 2].map((x) => (
        <mesh key={x} position={[x, 0.022, 0]}>
          <boxGeometry args={[length, 0.028, 0.055]} />
          <meshStandardMaterial color="#23262a" metalness={0.95} roughness={0.28} />
        </mesh>
      ))}
      <instancedMesh ref={sleepers} args={[undefined, undefined, count]} receiveShadow>
        <boxGeometry args={[0.16, 0.022, 0.5]} />
        <meshStandardMaterial color="#0f1112" metalness={0.5} roughness={0.6} />
      </instancedMesh>
      {[-length / 2 + 0.1, length / 2 - 0.1].map((x) => (
        <mesh key={x} position={[x, 0.09, 0]}>
          <boxGeometry args={[0.08, 0.18, gauge + 0.2]} />
          <meshStandardMaterial color="#1a1c1d" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[length / 2 - 0.1, 0.19, gauge / 2]}>
        <boxGeometry args={[0.05, 0.04, 0.05]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function useLoop(callback: (time: number) => void) {
  useFrame((state) => callback(state.clock.elapsedTime));
}

export function useDisposeOnUnmount<T extends THREE.Object3D>(ref: React.RefObject<T | null>) {
  useEffect(() => {
    return () => {
      if (!ref.current) return;
      ref.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          const material = child.material;
          if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
          else material?.dispose();
        }
      });
    };
  }, [ref]);
}
